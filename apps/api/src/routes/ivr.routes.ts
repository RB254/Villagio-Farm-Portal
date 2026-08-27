import { Router, Request, Response } from 'express';
import { db } from '../db/database';
import { formatPhoneKE, generateSubmissionId, getKgPerSack, auditLog } from '../db/helpers';
import { notifyProduceSubmitted } from '../services/notification.service';

const router = Router();

// ============================================================
// IVR PROVIDER INTERFACE (inactive — needs Africa's Talking credentials)
// ============================================================
// interface IVRProvider {
//   parseRequest(body: any): IVRRequest;
//   formatResponse(actions: IVRAction[]): string;
// }

// ============================================================
// IVR SESSION STATE MACHINE
// ============================================================

interface IVRSession {
  session_id: string;
  phone_number: string;
  language: string;
  state: string;
  data: Record<string, any>;
}

function getIVRSession(sessionId: string, phoneNumber: string): IVRSession {
  let session = db.prepare('SELECT * FROM ivr_sessions WHERE session_id = ?').get(sessionId) as any;
  if (!session) {
    db.prepare(`
      INSERT INTO ivr_sessions (session_id, phone_number, language, state, data)
      VALUES (?, ?, 'en', 'WELCOME', '{}')
    `).run(sessionId, phoneNumber);
    session = db.prepare('SELECT * FROM ivr_sessions WHERE session_id = ?').get(sessionId) as any;
  }
  return { ...session, data: JSON.parse(session.data || '{}') };
}

function updateIVRSession(sessionId: string, state: string, language: string, data: object): void {
  db.prepare(`
    UPDATE ivr_sessions SET state = ?, language = ?, data = ?, updated_at = datetime('now')
    WHERE session_id = ?
  `).run(state, language, JSON.stringify(data), sessionId);
}

function endIVRSession(sessionId: string): void {
  db.prepare('DELETE FROM ivr_sessions WHERE session_id = ?').run(sessionId);
}

// ============================================================
// IVR PROMPTS (bilingual)
// ============================================================

const prompts = {
  en: {
    welcome: 'Karibu Villagio. Welcome to Villagio. Please listen carefully to the following options.',
    selectLanguage: 'For Kiswahili, press 1. For English, press 2.',
    mainMenu: 'To sell your produce, press 1. To check your produce, press 2. To check payments, press 3. For help, press 5. To speak to Villagio support, press 6.',
    selectProduct: 'Select your produce. Press 1 for Potatoes. Press 2 for Onions. Press 3 for Tomatoes. Press 4 for Beans. Press 5 for Maize. Press 6 for other produce.',
    selectQuantity: 'Enter the number of sacks using your keypad, then press hash.',
    selectAvailability: 'When will your produce be ready? Press 1 for today. Press 2 for tomorrow. Press 3 for within 3 days. Press 4 for within one week.',
    confirmPrompt: (product: string, qty: number, date: string) =>
      `You are submitting ${qty} sacks of ${product}, available on ${date}. Press 1 to confirm. Press 2 to cancel.`,
    submitted: (id: string) => `Your produce has been registered successfully. Your submission ID is ${id}. We will contact you when collection is scheduled. Thank you for using Villagio. Goodbye.`,
    cancelled: 'Your submission has been cancelled. Goodbye.',
    error: 'An error occurred. Please try again or call Villagio support. Goodbye.',
    notRegistered: 'You are not registered on Villagio. Please register on our website or call Villagio support. Goodbye.',
  },
  sw: {
    welcome: 'Karibu Villagio. Tafadhali sikiliza chaguzi zifuatazo.',
    selectLanguage: 'Kwa Kiswahili bonyeza 1. For English press 2.',
    mainMenu: 'Kuuza mazao bonyeza 1. Kuangalia mazao bonyeza 2. Kuangalia malipo bonyeza 3. Msaada bonyeza 5. Kuongea na Villagio bonyeza 6.',
    selectProduct: 'Chagua zao lako. Bonyeza 1 kwa Viazi. Bonyeza 2 kwa Vitunguu. Bonyeza 3 kwa Nyanya. Bonyeza 4 kwa Maharagwe. Bonyeza 5 kwa Mahindi. Bonyeza 6 kwa zao lingine.',
    selectQuantity: 'Ingiza idadi ya magunia ukitumia vitufe vya simu, kisha bonyeza heshi.',
    selectAvailability: 'Lini mazao yako yatakuwa tayari? Bonyeza 1 kwa leo. Bonyeza 2 kwa kesho. Bonyeza 3 kwa siku tatu. Bonyeza 4 kwa wiki moja.',
    confirmPrompt: (product: string, qty: number, date: string) =>
      `Unatuma magunia ${qty} ya ${product}, tayari tarehe ${date}. Bonyeza 1 kuthibitisha. Bonyeza 2 kubatilisha.`,
    submitted: (id: string) => `Mazao yamepokiwa. ID yako ni ${id}. Tutawasiliana nawe kuhusu ukusanyaji. Asante kwa kutumia Villagio. Kwaheri.`,
    cancelled: 'Umetelekezea. Kwaheri.',
    error: 'Hitilafu imetokea. Tafadhali jaribu tena. Kwaheri.',
    notRegistered: 'Hujasajiliwa kwenye Villagio. Tafadhali sajili kwenye tovuti au piga simu Villagio. Kwaheri.',
  },
};

type LangKey = 'en' | 'sw';

// ============================================================
// IVR HANDLER
// ============================================================

interface IVRResult {
  prompt: string;
  continueSession: boolean;
  state: string;
}

function handleIVR(sessionId: string, phoneNumber: string, dtmfDigits: string): IVRResult {
  const normalizedPhone = formatPhoneKE(phoneNumber);
  const session = getIVRSession(sessionId, normalizedPhone);
  const state = session.state;
  const data = session.data;
  let lang = (session.language || 'en') as LangKey;
  const p = prompts[lang];

  const farmer = db.prepare('SELECT * FROM farmers WHERE phone = ?').get(normalizedPhone) as any;

  // ─────── WELCOME ──────────────────────────────────────────
  if (state === 'WELCOME') {
    updateIVRSession(sessionId, 'SELECT_LANGUAGE', lang, data);
    return { prompt: `${prompts.en.welcome} ${prompts.en.selectLanguage}`, continueSession: true, state: 'SELECT_LANGUAGE' };
  }

  // ─────── SELECT LANGUAGE ──────────────────────────────────
  if (state === 'SELECT_LANGUAGE') {
    if (dtmfDigits === '1') lang = 'sw';
    else lang = 'en';
    if (!farmer) {
      endIVRSession(sessionId);
      return { prompt: prompts[lang].notRegistered, continueSession: false, state: 'END' };
    }
    updateIVRSession(sessionId, 'MAIN_MENU', lang, { ...data, farmer_id: farmer.id });
    return { prompt: prompts[lang].mainMenu, continueSession: true, state: 'MAIN_MENU' };
  }

  // ─────── MAIN MENU ────────────────────────────────────────
  if (state === 'MAIN_MENU') {
    if (dtmfDigits === '1') {
      updateIVRSession(sessionId, 'SELECT_PRODUCT', lang, data);
      return { prompt: p.selectProduct, continueSession: true, state: 'SELECT_PRODUCT' };
    }
    if (dtmfDigits === '2') {
      const produce = db.prepare(`
        SELECT fp.quantity, fp.unit, p.name FROM farmer_produce fp
        JOIN products p ON fp.product_id = p.id
        WHERE fp.farmer_id = ? ORDER BY fp.created_at DESC LIMIT 3
      `).all(farmer?.id) as any[];
      endIVRSession(sessionId);
      const list = produce.length
        ? produce.map((x) => `${x.quantity} ${x.unit} of ${x.name}`).join(', ')
        : 'no produce yet';
      return { prompt: `Your recent produce: ${list}. Goodbye.`, continueSession: false, state: 'END' };
    }
    if (dtmfDigits === '3') {
      const payments = db.prepare('SELECT amount, status FROM payments WHERE farmer_id = ? ORDER BY created_at DESC LIMIT 1').get(farmer?.id) as any;
      endIVRSession(sessionId);
      const msg = payments ? `Your latest payment: KES ${payments.amount}, status ${payments.status}.` : 'No payments yet.';
      return { prompt: `${msg} Goodbye.`, continueSession: false, state: 'END' };
    }
    if (dtmfDigits === '5') {
      endIVRSession(sessionId);
      return { prompt: 'For help, visit villagio.farm or call our support line. Goodbye.', continueSession: false, state: 'END' };
    }
    if (dtmfDigits === '6') {
      endIVRSession(sessionId);
      return { prompt: 'We will call you back shortly. Thank you for contacting Villagio. Goodbye.', continueSession: false, state: 'END' };
    }
    return { prompt: p.mainMenu, continueSession: true, state: 'MAIN_MENU' };
  }

  // ─────── SELECT PRODUCT ───────────────────────────────────
  if (state === 'SELECT_PRODUCT') {
    const productMap: Record<string, { en: string; name: string }> = {
      '1': { en: 'Potatoes', name: 'Potatoes' },
      '2': { en: 'Onions', name: 'Onions' },
      '3': { en: 'Tomatoes', name: 'Tomatoes' },
      '4': { en: 'Beans', name: 'Beans' },
      '5': { en: 'Maize', name: 'Maize' },
      '6': { en: 'Other', name: 'Other' },
    };
    const selected = productMap[dtmfDigits];
    if (!selected) return { prompt: p.selectProduct, continueSession: true, state: 'SELECT_PRODUCT' };

    const dbProduct = db.prepare('SELECT * FROM products WHERE name = ? OR name LIKE ?').get(selected.en, `%${selected.en}%`) as any;
    const productId = dbProduct ? Number(dbProduct.id) : 1;

    updateIVRSession(sessionId, 'ENTER_QUANTITY', lang, { ...data, product_id: productId, product_name: dbProduct?.name || selected.name });
    return { prompt: p.selectQuantity, continueSession: true, state: 'ENTER_QUANTITY' };
  }

  // ─────── ENTER QUANTITY ───────────────────────────────────
  if (state === 'ENTER_QUANTITY') {
    // Remove hash if present
    const cleaned = dtmfDigits.replace('#', '').trim();
    const qty = parseFloat(cleaned);
    if (isNaN(qty) || qty <= 0) {
      return { prompt: p.selectQuantity, continueSession: true, state: 'ENTER_QUANTITY' };
    }
    updateIVRSession(sessionId, 'SELECT_AVAILABILITY', lang, { ...data, quantity: qty });
    return { prompt: p.selectAvailability, continueSession: true, state: 'SELECT_AVAILABILITY' };
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
    const selectedDate = dateMap[dtmfDigits];
    if (!selectedDate) return { prompt: p.selectAvailability, continueSession: true, state: 'SELECT_AVAILABILITY' };

    updateIVRSession(sessionId, 'CONFIRM', lang, { ...data, availability_date: selectedDate });
    const confirmPrompt = p.confirmPrompt(data.product_name || 'produce', data.quantity || 0, selectedDate);
    return { prompt: confirmPrompt, continueSession: true, state: 'CONFIRM' };
  }

  // ─────── CONFIRM ─────────────────────────────────────────
  if (state === 'CONFIRM') {
    if (dtmfDigits === '1') {
      if (!farmer) {
        endIVRSession(sessionId);
        return { prompt: p.error, continueSession: false, state: 'END' };
      }
      try {
        const submission_id = generateSubmissionId();
        const estimated_kg = (data.quantity || 0) * getKgPerSack(data.product_id || 1);

        db.prepare(`
          INSERT INTO farmer_produce (
            submission_id, farmer_id, product_id, quantity, unit,
            estimated_kg, availability_date, quality_estimate,
            location, source_channel, status
          ) VALUES (?, ?, ?, ?, 'sack', ?, ?, 'GOOD', ?, 'IVR', 'SUBMITTED')
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
          source_channel: 'IVR', product: data.product_name, quantity: data.quantity
        });

        notifyProduceSubmitted(farmer.id, farmer.phone, data.product_name || 'produce', submission_id);
        endIVRSession(sessionId);

        return { prompt: p.submitted(submission_id), continueSession: false, state: 'END' };
      } catch (err) {
        console.error('IVR produce submit error:', err);
        endIVRSession(sessionId);
        return { prompt: p.error, continueSession: false, state: 'END' };
      }
    }
    if (dtmfDigits === '2') {
      endIVRSession(sessionId);
      return { prompt: p.cancelled, continueSession: false, state: 'END' };
    }
    const confirmPrompt = p.confirmPrompt(data.product_name || 'produce', data.quantity || 0, data.availability_date || '');
    return { prompt: confirmPrompt, continueSession: true, state: 'CONFIRM' };
  }

  endIVRSession(sessionId);
  return { prompt: 'Thank you for calling Villagio. Goodbye.', continueSession: false, state: 'END' };
}

// ============================================================
// POST /api/integrations/ivr
// ============================================================
router.post('/', (req: Request, res: Response) => {
  const { sessionId, phoneNumber, dtmfDigits = '', callSessionState } = req.body;

  if (!sessionId || !phoneNumber) {
    res.status(400).json({ success: false, error: 'sessionId and phoneNumber are required' });
    return;
  }

  try {
    const result = handleIVR(sessionId, phoneNumber, dtmfDigits);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('IVR error:', err);
    res.json({
      success: false,
      data: { prompt: 'An error occurred. Please try again. Goodbye.', continueSession: false, state: 'END' },
    });
  }
});

export default router;
