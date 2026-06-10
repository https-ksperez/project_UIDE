export type UserRole = 'estudiante' | 'repartidor' | 'cafeteria' | 'admin';
export type OrderStatus = 'pendiente' | 'preparando' | 'listo_para_entrega' | 'en_camino' | 'entregado' | 'cancelado';
export type LocationStatus = 'pendiente' | 'aprobado' | 'rechazado';
export type RiderApprovalStatus = 'pendiente' | 'aprobado' | 'rechazado';
export type PaymentStatus = 'pendiente' | 'verificado' | 'rechazado';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  cedula: string | null;
  driver_license_url: string | null;
  account_type: string | null;
  bank_name: string | null;
  account_number: string | null;
  rider_approval: RiderApprovalStatus;
  is_available_for_delivery: boolean;
  created_at: string;
}

export interface Cafeteria {
  id: number;
  owner_id: string;
  name: string;
  description: string | null;
  physical_location: string;
  is_active: boolean;
  logo_url: string | null;
  created_at: string;
}

export interface CafeteriaBankAccount {
  id: number;
  cafeteria_id: number;
  bank_name: string;
  account_number: string;
  account_type: string;
  account_holder_name: string;
  is_primary: boolean;
}

export interface ProductCategory {
  id: number;
  cafeteria_id: number;
  name: string;
  sort_order: number;
}

export interface Product {
  id: number;
  cafeteria_id: number;
  category_id: number | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  is_promo: boolean;
  created_at: string;
}

export interface DeliveryLocation {
  id: number;
  name: string;
  description: string | null;
  status: LocationStatus;
  suggested_by: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface Order {
  id: string; // uuid
  student_id: string;
  cafeteria_id: number;
  delivery_rider_id: string | null;
  delivery_location_id: number;
  status: OrderStatus;
  total_amount: number;
  delivery_fee: number;
  payment_proof_path: string | null;
  payment_status: PaymentStatus;
  verified_by_cafeteria: boolean;
  created_at: string;
  updated_at: string;
  
  // Custom join helper properties (optional, for type-safety during joins)
  student?: { full_name: string | null; phone: string | null; avatar_url: string | null };
  cafeteria?: { name: string; logo_url: string | null; physical_location?: string | null };
  rider?: { full_name: string | null; phone: string | null };
  location?: { name: string; description: string | null };
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  order_id: string;
  product_id: number;
  quantity: number;
  unit_price: number;
  product?: { name: string; image_url: string | null };
}

export interface DeliveryOtp {
  order_id: string;
  otp_code: string;
  attempts: number;
  created_at: string;
}

export interface Review {
  id: number;
  order_id: string;
  student_id: string;
  cafeteria_id: number;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface RiderPayment {
  id: number;
  rider_id: string;
  cafeteria_id: number;
  order_id: string;
  amount: number;
  week_start: string;
  week_end: string;
  paid: boolean;
  paid_at: string | null;
  created_at: string;
}

export interface TermsAcceptance {
  id: number;
  user_id: string;
  accepted_terms_version: string;
  accepted_at: string;
}

export interface AllowedEmailDomain {
  id: number;
  domain: string;
}

export interface BankCatalog {
  id: number;
  name: string;
}

// Zustand Cart Type
export interface CartItem {
  product: Product;
  quantity: number;
  cafeteria_id: number;
  cafeteria_name: string;
}

// Complete Database Helper definition
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at'>; Update: Partial<Profile> };
      cafeterias: { Row: Cafeteria; Insert: Omit<Cafeteria, 'id' | 'created_at'>; Update: Partial<Cafeteria> };
      cafeteria_bank_accounts: { Row: CafeteriaBankAccount; Insert: Omit<CafeteriaBankAccount, 'id'>; Update: Partial<CafeteriaBankAccount> };
      product_categories: { Row: ProductCategory; Insert: Omit<ProductCategory, 'id'>; Update: Partial<ProductCategory> };
      products: { Row: Product; Insert: Omit<Product, 'id' | 'created_at'>; Update: Partial<Product> };
      delivery_locations: { Row: DeliveryLocation; Insert: Omit<DeliveryLocation, 'id' | 'created_at'>; Update: Partial<DeliveryLocation> };
      orders: { Row: Order; Insert: Omit<Order, 'created_at' | 'updated_at'>; Update: Partial<Order> };
      order_items: { Row: OrderItem; Insert: Omit<OrderItem, 'id'>; Update: Partial<OrderItem> };
      delivery_otps: { Row: DeliveryOtp; Insert: DeliveryOtp; Update: Partial<DeliveryOtp> };
      reviews: { Row: Review; Insert: Omit<Review, 'id' | 'created_at'>; Update: Partial<Review> };
      rider_payments: { Row: RiderPayment; Insert: Omit<RiderPayment, 'id' | 'created_at'>; Update: Partial<RiderPayment> };
      terms_acceptance: { Row: TermsAcceptance; Insert: Omit<TermsAcceptance, 'id' | 'accepted_at'>; Update: Partial<TermsAcceptance> };
      allowed_email_domains: { Row: AllowedEmailDomain; Insert: Omit<AllowedEmailDomain, 'id'>; Update: Partial<AllowedEmailDomain> };
      bank_catalogs: { Row: BankCatalog; Insert: Omit<BankCatalog, 'id'>; Update: Partial<BankCatalog> };
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      location_status: LocationStatus;
      rider_approval_status: RiderApprovalStatus;
      payment_status: PaymentStatus;
    };
  };
}
