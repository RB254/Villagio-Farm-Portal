import { db } from '../db/database';

// ============================================================
// SMS PROVIDER INTERFACE
// ============================================================
// Replace MockSMSProvider with AfricasTalkingSMSProvider
// when credentials are available.

interface SMSProvider {
  send(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

// ============================================================
// MOCK SMS PROVIDER (active — no credentials required)
// ============================================================
class MockSMSProvider implements SMSProvider {
  async send(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const messageId = `MOCK-SMS-${Date.now()}`;
    console.log(`📱 [SMS MOCK] To: ${phoneNumber}`);
    console.log(`📱 [SMS MOCK] Message: ${message}`);
    return { success: true, messageId };
  }
}

// ============================================================
// AFRICA'S TALKING SMS PROVIDER (inactive — needs credentials)
// ============================================================
// class AfricasTalkingSMSProvider implements SMSProvider {
//   private apiKey = process.env.AT_API_KEY!;
//   private username = process.env.AT_USERNAME!;
//   async send(phoneNumber: string, message: string) {
//     // Africa's Talking SMS API integration
//     const AT = require('africastalking')({ apiKey: this.apiKey, username: this.username });
//     return AT.SMS.send({ to: [phoneNumber], message, from: 'VILLAGIO' });
//   }
// }

// Active provider
const smsProvider: SMSProvider = new MockSMSProvider();

// ============================================================
// PUBLIC SMS FUNCTIONS
// ============================================================

export async function sendSMS(phoneNumber: string, message: string): Promise<void> {
  try {
    const result = await smsProvider.send(phoneNumber, message);
    
    // Log to DB regardless of provider
    db.prepare(`
      INSERT INTO sms_log (phone_number, message, status, provider)
      VALUES (?, ?, ?, ?)
    `).run(phoneNumber, message, result.success ? 'SENT' : 'FAILED', 'MOCK');
  } catch (err) {
    console.error('SMS send error:', err);
    db.prepare(`
      INSERT INTO sms_log (phone_number, message, status, provider)
      VALUES (?, ?, ?, ?)
    `).run(phoneNumber, message, 'FAILED', 'MOCK');
  }
}

export async function sendProduceSubmittedSMS(phone: string, productName: string): Promise<void> {
  await sendSMS(phone, `Villagio: Your ${productName} have been registered successfully. We will contact you when collection is scheduled.`);
}

export async function sendCollectionScheduledSMS(phone: string, date: string, location: string): Promise<void> {
  await sendSMS(phone, `Villagio: Your collection is scheduled for ${date} at ${location}. Please have your produce ready.`);
}

export async function sendCollectionReminderSMS(phone: string, date: string): Promise<void> {
  await sendSMS(phone, `Villagio: Reminder — your produce collection is tomorrow, ${date}. Please have it ready.`);
}

export async function sendProduceCollectedSMS(phone: string, productName: string): Promise<void> {
  await sendSMS(phone, `Villagio: Your ${productName} have been collected successfully. Payment will be processed shortly.`);
}

export async function sendPaymentProcessedSMS(phone: string, amount: number): Promise<void> {
  await sendSMS(phone, `Villagio: Your payment of KES ${amount.toLocaleString()} has been processed via M-Pesa.`);
}
