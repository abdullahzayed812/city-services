export enum UserRole {
  CUSTOMER = 'customer',
  TECHNICIAN = 'technician',
  ADMIN = 'admin',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification',
}

export enum TechnicianStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

export enum TechnicianAvailability {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
}

export enum ServiceRequestStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum RequestType {
  INSTANT = 'instant',
  SCHEDULED = 'scheduled',
  EMERGENCY = 'emergency',
}

export enum ProposalStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  PAYMENT = 'payment',
  REFUND = 'refund',
  COMMISSION = 'commission',
  EARNING = 'earning',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
}

export enum PaymentMethod {
  WALLET = 'wallet',
  CASH = 'cash',
  CARD = 'card',
  INSTAPAY = 'instapay',
}

export enum NotificationType {
  REQUEST_CREATED = 'request_created',
  PROPOSAL_RECEIVED = 'proposal_received',
  PROPOSAL_ACCEPTED = 'proposal_accepted',
  REQUEST_ACCEPTED = 'request_accepted',
  TECHNICIAN_ARRIVED = 'technician_arrived',
  SERVICE_STARTED = 'service_started',
  SERVICE_COMPLETED = 'service_completed',
  REQUEST_CANCELLED = 'request_cancelled',
  PAYMENT_RECEIVED = 'payment_received',
  WITHDRAWAL_APPROVED = 'withdrawal_approved',
  NEW_MESSAGE = 'new_message',
  REVIEW_RECEIVED = 'review_received',
  ACCOUNT_VERIFIED = 'account_verified',
  ACCOUNT_SUSPENDED = 'account_suspended',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VOICE = 'voice',
  LOCATION = 'location',
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  meta?: Record<string, unknown>;
}
