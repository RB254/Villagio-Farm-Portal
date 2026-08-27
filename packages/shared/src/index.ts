// ============================================================
// VILLAGIO SHARED TYPES
// ============================================================

export type FarmerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type PreferredLanguage = 'en' | 'sw';
export type PreferredChannel = 'WEB' | 'USSD' | 'IVR' | 'SMS';
export type SourceChannel = 'WEB' | 'USSD' | 'IVR' | 'SMS';

export type ProduceStatus =
  | 'SUBMITTED'
  | 'AVAILABLE'
  | 'COLLECTION_REQUESTED'
  | 'COLLECTION_SCHEDULED'
  | 'COLLECTED'
  | 'PROCESSING'
  | 'SOLD'
  | 'COMPLETED';

export type QualityEstimate = 'GOOD' | 'AVERAGE' | 'NEEDS_CHECKING';

export type CollectionStatus =
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'VEHICLE_ASSIGNED'
  | 'ROUTE_PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type PaymentMethod = 'MPESA' | 'BANK' | 'CASH';

export type NotificationType =
  | 'PRODUCE_SUBMITTED'
  | 'COLLECTION_REQUESTED'
  | 'COLLECTION_SCHEDULED'
  | 'COLLECTION_REMINDER'
  | 'PRODUCE_COLLECTED'
  | 'PRODUCE_RECEIVED'
  | 'QUALITY_VERIFIED'
  | 'PAYMENT_PROCESSED'
  | 'SYSTEM_MESSAGE'
  | 'SUPPORT_RESPONSE';

export type ExceptionType =
  | 'PAYMENT_FAILURE'
  | 'VEHICLE_FAILURE'
  | 'QUALITY_ISSUE'
  | 'SYSTEM_FAILURE'
  | 'FARMER_SUPPORT'
  | 'DELIVERY_DELAY';

export type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ExceptionStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type UserRole = 'FARMER' | 'ADMIN' | 'LOGISTICS_PARTNER' | 'SYSTEM';

// ============================================================
// ENTITY INTERFACES
// ============================================================

export interface Farmer {
  id: number;
  farmer_id: string;
  full_name: string;
  phone: string;
  pin_hash: string;
  county: string;
  sub_county: string;
  location: string;
  latitude?: number;
  longitude?: number;
  preferred_language: PreferredLanguage;
  preferred_channel: PreferredChannel;
  status: FarmerStatus;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  default_unit: string;
  kg_per_unit: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FarmerProduce {
  id: number;
  submission_id: string;
  farmer_id: number;
  product_id: number;
  quantity: number;
  unit: string;
  estimated_kg: number;
  availability_date: string;
  quality_estimate: QualityEstimate;
  location: string;
  latitude?: number;
  longitude?: number;
  source_channel: SourceChannel;
  status: ProduceStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionRequest {
  id: number;
  collection_id: string;
  farmer_id: number;
  produce_submission_id: number;
  quantity: number;
  pickup_location: string;
  scheduled_date: string;
  time_window: string;
  logistics_partner: string;
  vehicle_id?: string;
  driver_id?: string;
  status: CollectionStatus;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  farmer_id: number;
  type: NotificationType;
  title: string;
  message: string;
  channel: SourceChannel;
  read: boolean;
  created_at: string;
}

export interface Payment {
  id: number;
  farmer_id: number;
  produce_submission_id: number;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transaction_reference?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  actor: UserRole;
  actor_id: string;
  action: string;
  entity: string;
  entity_id: string;
  timestamp: string;
  metadata?: string;
}

export interface Exception {
  id: number;
  exception_id: string;
  type: ExceptionType;
  severity: ExceptionSeverity;
  related_entity: string;
  related_entity_id: string;
  description: string;
  status: ExceptionStatus;
  assigned_person?: string;
  created_at: string;
  resolved_at?: string;
}

export interface LogisticsPartner {
  id: number;
  code: string;
  name: string;
  contact_phone: string;
  active: boolean;
  created_at: string;
}

export interface DemandData {
  id: number;
  product_id: number;
  quantity_sacks: number;
  demand_source: string;
  location: string;
  demand_date: string;
  created_at: string;
}

export interface SupportRequest {
  id: number;
  farmer_id: number;
  issue_type: string;
  description: string;
  status: string;
  created_at: string;
  resolved_at?: string;
}

// ============================================================
// API TYPES
// ============================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthTokenPayload {
  id: number;
  farmer_id: string;
  phone: string;
  role: UserRole;
}

// ============================================================
// USSD / IVR TYPES
// ============================================================

export interface USSDRequest {
  sessionId: string;
  phoneNumber: string;
  text: string;
  networkCode?: string;
  serviceCode?: string;
}

export interface IVRRequest {
  sessionId: string;
  phoneNumber: string;
  dtmfDigits: string;
  callSessionState?: string;
}

// ============================================================
// SOURCING ENGINE TYPES
// ============================================================

export interface SourcingSummary {
  total_sacks: number;
  by_product: {
    product_id: number;
    product_name: string;
    total_sacks: number;
    farmer_count: number;
  }[];
  by_location: {
    location: string;
    total_sacks: number;
  }[];
  by_date: {
    availability_date: string;
    total_sacks: number;
  }[];
}

export interface DemandSummary {
  by_product: {
    product_id: number;
    product_name: string;
    demand_sacks: number;
    supply_sacks: number;
    surplus_or_shortage: number;
  }[];
}
