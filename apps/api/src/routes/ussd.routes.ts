import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { formatPhoneKE, generateSubmissionId, getKgPerSack, auditLog } from '../db/helpers';
import { notifyProduceSubmitted } from '../services/notification.service';

const router = Router();

// ============================================================
// USSD PROVIDER INTERFACE
// Replace with Africa's Talking adapter when credentials available
// ============================================================
// interface USSDProvider {
//   parseRequest(body: any): USSDRequest;
//   formatResponse(text: string, continueSession: boolean): string;
// }

// ============================================================
// SESSION STATE MACHINE
// State is stored in ussd_sessions table
// ============================================================

interface USSDSession {
  session_id: string;
  phone_number: string;
  state: string;
  data: {
    farmer_id?: number;
    product_id?: number;
    product_name?: string;
    quantity?: number;
    availability_date?: string;
    quality_estimate?: string;
    location?: string;
  };
}

function getSession(sessionId: string, phoneNumber: string): USSDSession {
  let session = db.prepare('SELECT * FROM ussd_sessions WHERE session_id = ?').get(sessionId) as any;
  if (!session) {
    db.prepare(`
      INSERT INTO ussd_sessions (session_id, phone_number, state, data)
      VALUES (?, ?, 'MAIN_MENU', '{}')
    `).run(sessionId, phoneNumber);
    session = db.prepare('SELECT * FROM ussd_sessions WHERE session_id = ?').get(sessionId) as any;
  }
  return { ...session, data: JSON.parse(session.data || '{}') };
}

function updateSession(sessionId: string, state: string, data: object): void {
  db.prepare(`
    UPDATE ussd_sessions SET state = ?, data = ?, updated_at = datetime('now')
    WHERE session_id = ?
  `).run(state, JSON.stringify(data), sessionId);
}

function endSession(sessionId: string): void {
  db.prepare('DELETE FROM ussd_sessions WHERE session_id = ?').run(sessionId);
}

// ============================================================
// USSD MENU HANDLER
// ============================================================

function handleUSSD(sessionId: string, phoneNumber: string, text: string): { response: string; continueSession: boolean } {
  const normalizedPhone = formatPhoneKE(phoneNumber);
  const session = getSession(sessionId, normalizedPhone);
  const state = session.state;
  const data = session.data;

  // Find farmer by phone
  const farmer = db.prepare('SELECT * FROM farmers WHERE phone = ?').get(normalizedPhone) as any;

  // Split input path (Africa's Talking concatenates responses with *)
  const inputs = text.split('*').filter(x => x !== '');
  const lastInput = inputs[inputs.length - 1] || '';

  // ─────── MAIN MENU ────────────────────────────────────────
  if (state === 'MAIN_MENU' || text === '') {
    if (!farmer) {
      updateSession(sessionId, 'MAIN_MENU', {});
      return {
        response: `CON KARIBU VILLAGIO 🌱\n\nHujasajiliwa. Tafadhali sajili kwenye tovuti:\nvillagio.farm\n\nAu piga simu: 0800-VILLAGIO`,
        continueSession: false,
      };
    }

    updateSession(sessionId, 'MAIN_MENU', { farmer_id: farmer.id });
    return {
      response: `CON VILLAGIO 🌱\nKaribu, ${farmer.full_name.split(' ')[0]}\n\n1. Uza Mazao\n2. Mazao Yangu\n3. Malipo Yangu\n4. Hali ya Ukusanyaji\n5. Msaada\n6. Pigia Villagio`,
      continueSession: true,
    };
  }

  // ─────── FROM MAIN MENU ───────────────────────────────────
  if (state === 'MAIN_MENU') {
    if (lastInput === '1') {
      updateSession(sessionId, 'SELECT_PRODUCT', { ...data });
      return {
        response: `CON CHAGUA ZAO:\n\n1. Viazi\n2. Vitunguu\n3. Nyanya\n4. Maharagwe\n5. Mahindi\n6. Nyingine`,
        continueSession: true,
      };
    }
    if (lastInput === '2') {
      if (!farmer) { endSession(sessionId); return { response: 'END Tafadhali sajili kwanza.', continueSession: false }; }
      const produce = db.prepare(`
        SELECT fp.quantity, fp.unit, fp.status, fp.availability_date, p.name
        FROM farmer_produce fp JOIN products p ON fp.product_id = p.id
        WHERE fp.farmer_id = ? ORDER BY fp.created_at DESC LIMIT 5
      `).all(farmer.id) as any[];
      if (!produce.length) {
        endSession(sessionId);
        return { response: 'END Hujatuma mazao yoyote bado.', continueSession: false };
      }
      const list = produce.map((p, i) => `${i + 1}. ${p.name}: ${p.quantity} ${p.unit} - ${p.status}`).join('\n');
      endSession(sessionId);
      return { response: `END MAZAO YANGU:\n${list}`, continueSession: false };
    }
    if (lastInput === '3') {
      if (!farmer) { endSession(sessionId); return { response: 'END Tafadhali sajili kwanza.', continueSession: false }; }
      const payments = db.prepare('SELECT amount, status, method FROM payments WHERE farmer_id = ? ORDER BY created_at DESC LIMIT 3').all(farmer.id) as any[];
      if (!payments.length) {
        endSession(sessionId);
        return { response: 'END Hakuna malipo bado.', continueSession: false };
      }
      const list = payments.map((p) => `KES ${p.amount} - ${p.status} - ${p.method}`).join('\n');
      endSession(sessionId);
      return { response: `END MALIPO YANGU:\n${list}`, continueSession: false };
    }
    if (lastInput === '4') {
      if (!farmer) { endSession(sessionId); return { response: 'END Tafadhali sajili kwanza.', continueSession: false }; }
      const collection = db.prepare(`
        SELECT cr.status, cr.scheduled_date, cr.vehicle_id
        FROM collection_requests cr
        WHERE cr.farmer_id = ? ORDER BY cr.created_at DESC LIMIT 1
      `).get(farmer.id) as any;
      endSession(sessionId);
      if (!collection) return { response: 'END Hakuna ukusanyaji ulioidhinishwa bado.', continueSession: false };
      return { response: `END HALI YA UKUSANYAJI:\nHali: ${collection.status}\nTarehe: ${collection.scheduled_date || 'Bado'}${collection.vehicle_id ? '\nGari: ' + collection.vehicle_id : ''}`, continueSession: false };
    }
    if (lastInput === '5') {
      endSession(sessionId);
      return { response: 'END MSAADA:\n• Piga simu: 0800-VILLAGIO\n• SMS: MSAADA hadi XXXX\n• Tovuti: villagio.farm', continueSession: false };
    }
    if (lastInput === '6') {
      endSession(sessionId);
      return { response: 'END Tunapiga simu kwako hivi karibuni. Asante kwa kuwasiliana na Villagio!', continueSession: false };
    }
  }

  // ─────── SELECT PRODUCT ───────────────────────────────────
  if (state === 'SELECT_PRODUCT') {
    const products: Record<string, { en: string; name: string }> = {
      '1': { en: 'Potatoes', name: 'Viazi' },
      '2': { en: 'Onions', name: 'Vitunguu' },
      '3': { en: 'Tomatoes', name: 'Nyanya' },
      '4': { en: 'Beans', name: 'Maharagwe' },
      '5': { en: 'Maize', name: 'Mahindi' },
      '6': { en: 'Other', name: 'Zingine' },
    };

    const selected = products[lastInput];
    if (!selected) {
      return { response: `CON Chaguo batili. Chagua:\n1. Viazi\n2. Vitunguu\n3. Nyanya\n4. Maharagwe\n5. Mahindi\n6. Nyingine`, continueSession: true };
    }

    // Get actual product from DB by name
    const dbProduct = db.prepare('SELECT * FROM products WHERE name = ? OR name LIKE ?').get(selected.en, `%${selected.en}%`) as any;
    const productId = dbProduct ? Number(dbProduct.id) : 1;

    updateSession(sessionId, 'SELECT_QUANTITY', {
      ...data,
      product_id: productId,
      product_name: dbProduct?.name || selected.name,
    });

    return {
      response: `CON IDADI (MAGUNIA):\n\n1. Gunia 1\n2. Magunia 2\n3. Magunia 3\n4. Magunia 4\n5. Magunia 5+\n\nOr andika nambari (mfano: 7)`,
      continueSession: true,
    };
  }

  // ─────── SELECT QUANTITY ──────────────────────────────────
  if (state === 'SELECT_QUANTITY') {
    const quantityMap: Record<string, number> = { '1': 1, '2': 2, '3': 3, '4': 4 };
    let qty: number;

    if (quantityMap[lastInput]) {
      qty = quantityMap[lastInput];
    } else if (lastInput === '5') {
      updateSession(sessionId, 'ENTER_QUANTITY', data);
      return { response: 'CON Andika idadi halisi ya magunia:', continueSession: true };
    } else {
      qty = parseFloat(lastInput);
      if (isNaN(qty) || qty <= 0) {
        return { response: 'CON Idadi si sahihi. Jaribu tena.\n1-9 kwa magunia, au andika nambari:', continueSession: true };
      }
    }

    updateSession(sessionId, 'SELECT_AVAILABILITY', { ...data, quantity: qty });
    return {
      response: `CON LINI TAYARI:\n\n1. Leo\n2. Kesho\n3. Siku 3 zijazo\n4. Wiki moja`,
      continueSession: true,
    };
  }

  // ─────── ENTER CUSTOM QUANTITY ────────────────────────────
  if (state === 'ENTER_QUANTITY') {
    const qty = parseFloat(lastInput);
    if (isNaN(qty) || qty <= 0) {
      return { response: 'CON Idadi si sahihi. Andika nambari halisi:', continueSession: true };
    }
    updateSession(sessionId, 'SELECT_AVAILABILITY', { ...data, quantity: qty });
    return {
      response: `CON LINI TAYARI:\n\n1. Leo\n2. Kesho\n3. Siku 3 zijazo\n4. Wiki moja`,
      continueSession: true,
    };
  }

  // ─────── SELECT AVAILABILITY ─────────────────────────────
  if (state === 'SELECT_AVAILABILITY') {
    const today = new Date();
    const dateMap: Record<string, string> = {
      '1': today.toISOString().split('T')[0],
      '2': new Date(today.getTime() + 86400000).toISOString().split('T')[0],
      '3': new Date(today.getTime() + 3 * 86400000).toISOString().split('T')[0],
      '4': new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0],
    };

    const selectedDate = dateMap[lastInput];
    if (!selectedDate) {
      return { response: 'CON Chaguo batili.\n1. Leo\n2. Kesho\n3. Siku 3\n4. Wiki moja', continueSession: true };
    }

    updateSession(sessionId, 'CONFIRM', { ...data, availability_date: selectedDate, quality_estimate: 'GOOD' });

    return {
      response: `CON THIBITISHA MAZAO:\n\nZao: ${data.product_name}\nIdadi: ${data.quantity} magunia\nTarehe: ${selectedDate}\nEneo: ${farmer?.location || 'Eneo lako'}\n\n1. Thibitisha\n2. Batilisha`,
      continueSession: true,
    };
  }

  // ─────── CONFIRMATION ────────────────────────────────────
  if (state === 'CONFIRM') {
    if (lastInput === '1') {
      if (!farmer) {
        endSession(sessionId);
        return { response: 'END Hitilafu: Akaunti haikupatikana. Piga simu Villagio.', continueSession: false };
      }

      try {
        const submission_id = generateSubmissionId();
        const estimated_kg = (data.quantity || 0) * getKgPerSack(data.product_id || 1);

        db.prepare(`
          INSERT INTO farmer_produce (
            submission_id, farmer_id, product_id, quantity, unit,
            estimated_kg, availability_date, quality_estimate,
            location, source_channel, status
          ) VALUES (?, ?, ?, ?, 'sack', ?, ?, 'GOOD', ?, 'USSD', 'SUBMITTED')
        `).run(
          submission_id,
          Number(farmer.id),
          Number(data.product_id || 1),
          Number(data.quantity || 1),
          Number(estimated_kg),
          String(data.availability_date || new Date().toISOString().split('T')[0]),
          String(farmer.location || 'Limuru')
        );

        auditLog('FARMER', String(farmer.id), 'PRODUCE_SUBMITTED', 'farmer_produce', submission_id, {
          source_channel: 'USSD', product: data.product_name, quantity: data.quantity
        });

        notifyProduceSubmitted(farmer.id, farmer.phone, data.product_name || 'mazao', submission_id);
        endSession(sessionId);

        return {
          response: `END ✅ Mazao yamepokiwa!\n\nZao: ${data.product_name}\nIdadi: ${data.quantity} magunia\nID: ${submission_id}\n\nAsante! Tutawasiliana nawe kuhusu ukusanyaji.`,
          continueSession: false,
        };
      } catch (err) {
        console.error('USSD produce submit error:', err);
        endSession(sessionId);
        return { response: 'END Hitilafu ya mfumo. Jaribu tena baadaye.', continueSession: false };
      }
    }

    if (lastInput === '2') {
      endSession(sessionId);
      return { response: 'END Umebatilisha. Unaweza kuwasiliana nasi tena wakati wowote.', continueSession: false };
    }
  }

  endSession(sessionId);
  return { response: 'END Kikao kimeisha. Asante kwa kutumia Villagio!', continueSession: false };
}

// ============================================================
// POST /api/integrations/ussd
// ============================================================
router.post('/', (req: Request, res: Response) => {
  const { sessionId, phoneNumber, text, networkCode, serviceCode } = req.body;

  if (!sessionId || !phoneNumber) {
    res.status(400).json({ success: false, error: 'sessionId and phoneNumber are required' });
    return;
  }

  try {
    const result = handleUSSD(sessionId, phoneNumber, text || '');
    // Africa's Talking format: plain text response starting with CON or END
    res.set('Content-Type', 'text/plain');
    res.send(result.response);
  } catch (err: any) {
    console.error('USSD error:', err);
    res.set('Content-Type', 'text/plain');
    res.send('END Hitilafu ya mfumo. Tafadhali jaribu tena baadaye.');
  }
});

// ============================================================
// POST /api/integrations/ussd/json  (for simulator — returns JSON)
// ============================================================
router.post('/json', (req: Request, res: Response) => {
  const { sessionId, phoneNumber, text } = req.body;

  if (!sessionId || !phoneNumber) {
    res.status(400).json({ success: false, error: 'sessionId and phoneNumber are required' });
    return;
  }

  try {
    const result = handleUSSD(sessionId, phoneNumber, text || '');
    const isContinue = result.response.startsWith('CON ');
    const displayText = result.response.replace(/^(CON |END )/, '');

    res.json({
      success: true,
      data: {
        text: displayText,
        continueSession: isContinue,
        rawResponse: result.response,
      },
    });
  } catch (err: any) {
    console.error('USSD JSON error:', err);
    res.status(500).json({ success: false, error: 'USSD processing failed' });
  }
});

export default router;
