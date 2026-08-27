export type PreferredLanguage = 'en' | 'sw';
export type SourceChannel = 'WEB' | 'USSD' | 'IVR' | 'SMS';

export interface Farmer {
  id: number;
  farmer_id: string;
  full_name: string;
  phone: string;
  county: string;
  sub_county: string;
  location: string;
  latitude?: number;
  longitude?: number;
  preferred_language: PreferredLanguage;
  preferred_channel: SourceChannel;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  default_unit: string;
  kg_per_unit: number;
  active: boolean;
}

export interface FarmerProduce {
  id: number;
  submission_id: string;
  farmer_id: number;
  product_id: number;
  product_name?: string;
  category?: string;
  quantity: number;
  unit: string;
  estimated_kg: number;
  availability_date: string;
  quality_estimate: 'GOOD' | 'AVERAGE' | 'NEEDS_CHECKING';
  location: string;
  source_channel: SourceChannel;
  status:
    | 'SUBMITTED'
    | 'AVAILABLE'
    | 'COLLECTION_REQUESTED'
    | 'COLLECTION_SCHEDULED'
    | 'COLLECTED'
    | 'PROCESSING'
    | 'SOLD'
    | 'COMPLETED';
  notes?: string;
  farmer_name?: string;
  farmer_phone?: string;
  created_at: string;
}

export interface CollectionRequest {
  id: number;
  collection_id: string;
  farmer_id: number;
  farmer_name?: string;
  farmer_phone?: string;
  produce_submission_id: number;
  product_name?: string;
  quantity: number;
  pickup_location: string;
  scheduled_date: string;
  time_window: string;
  logistics_partner: string;
  vehicle_id?: string;
  driver_id?: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'VEHICLE_ASSIGNED' | 'ROUTE_PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
}

export interface Notification {
  id: number;
  farmer_id: number;
  type: string;
  title: string;
  message: string;
  channel: SourceChannel;
  read: number | boolean;
  created_at: string;
}

export interface Payment {
  id: number;
  farmer_id: number;
  produce_submission_id?: number;
  product_name?: string;
  quantity?: number;
  unit?: string;
  amount: number;
  currency: string;
  method: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  transaction_reference?: string;
  created_at: string;
}

export interface ExceptionItem {
  id: number;
  exception_id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  related_entity: string;
  related_entity_id: string;
  description: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assigned_person?: string;
  created_at: string;
  resolved_at?: string;
}

export interface SourcingSummary {
  total: {
    farmer_count: number;
    total_sacks: number;
    total_kg: number;
  };
  by_product: {
    product_id: number;
    product_name: string;
    total_sacks: number;
    farmer_count: number;
    avg_quantity_per_farmer: number;
  }[];
  by_location: {
    location: string;
    total_sacks: number;
    submission_count: number;
  }[];
  by_date: {
    availability_date: string;
    total_sacks: number;
    submission_count: number;
  }[];
  by_channel: {
    source_channel: SourceChannel;
    count: number;
    total_sacks: number;
  }[];
  expected_incoming: {
    product_name: string;
    total_sacks: number;
  }[];
}

export interface DemandSummaryItem {
  product_id: number;
  product_name: string;
  supply_sacks: number;
  demand_sacks: number;
  surplus_or_shortage: number;
  status: 'SUFFICIENT' | 'SHORTAGE';
}
