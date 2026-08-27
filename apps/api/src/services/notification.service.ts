import { db } from '../db/database';
import { sendSMS } from './sms.service';

// ============================================================
// NOTIFICATION SERVICE
// Creates DB notifications and triggers SMS
// ============================================================

interface CreateNotificationParams {
  farmer_id: number;
  type: string;
  title: string;
  message: string;
  channel?: string;
  sendSMSToPhone?: string;
}

export function createNotification(params: CreateNotificationParams): number {
  const stmt = db.prepare(`
    INSERT INTO notifications (farmer_id, type, title, message, channel, read)
    VALUES (?, ?, ?, ?, ?, 0)
  `);
  const result = stmt.run(
    params.farmer_id,
    params.type,
    params.title,
    params.message,
    params.channel || 'WEB'
  );

  // Optionally send SMS
  if (params.sendSMSToPhone) {
    sendSMS(params.sendSMSToPhone, `Villagio: ${params.message}`).catch(console.error);
  }

  return Number(result.lastInsertRowid);
}

export function notifyProduceSubmitted(farmerId: number, phone: string, productName: string, submissionId: string): void {
  createNotification({
    farmer_id: farmerId,
    type: 'PRODUCE_SUBMITTED',
    title: 'Produce Submitted ✅',
    message: `Your ${productName} have been registered. Submission ID: ${submissionId}. Status: Pending collection.`,
    sendSMSToPhone: phone,
  });
}

export function notifyCollectionRequested(farmerId: number, phone: string, productName: string, collectionId: string): void {
  createNotification({
    farmer_id: farmerId,
    type: 'COLLECTION_REQUESTED',
    title: 'Collection Requested 🚚',
    message: `A collection has been requested for your ${productName}. Collection ID: ${collectionId}.`,
    sendSMSToPhone: phone,
  });
}

export function notifyCollectionScheduled(farmerId: number, phone: string, date: string, location: string): void {
  createNotification({
    farmer_id: farmerId,
    type: 'COLLECTION_SCHEDULED',
    title: 'Collection Scheduled 📅',
    message: `Your collection is scheduled for ${date} at ${location}. Please have your produce ready.`,
    sendSMSToPhone: phone,
  });
}

export function notifyProduceCollected(farmerId: number, phone: string, productName: string): void {
  createNotification({
    farmer_id: farmerId,
    type: 'PRODUCE_COLLECTED',
    title: 'Produce Collected ✅',
    message: `Your ${productName} have been collected successfully. Payment will be processed shortly.`,
    sendSMSToPhone: phone,
  });
}

export function notifyPaymentProcessed(farmerId: number, phone: string, amount: number): void {
  createNotification({
    farmer_id: farmerId,
    type: 'PAYMENT_PROCESSED',
    title: 'Payment Processed 💰',
    message: `Your payment of KES ${amount.toLocaleString()} has been processed via M-Pesa.`,
    sendSMSToPhone: phone,
  });
}
