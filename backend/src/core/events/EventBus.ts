import EventEmitter from 'events';
import { logger } from '../logger';

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(50);
  }

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public emit(event: string, ...args: unknown[]): boolean {
    logger.debug(`[EventBus] emit: ${event}`);
    return super.emit(event, ...args);
  }

  public subscribe(event: string, listener: (...args: unknown[]) => void): void {
    this.on(event, listener);
    logger.debug(`[EventBus] subscribe: ${event}`);
  }

  public unsubscribe(event: string, listener: (...args: unknown[]) => void): void {
    this.off(event, listener);
  }
}

export const eventBus = EventBus.getInstance();

export const AppEvents = {
  // Auth Events
  USER_REGISTERED: 'user:registered',
  USER_LOGIN: 'user:login',
  OTP_REQUESTED: 'user:otp_requested',

  // Request Events
  REQUEST_CREATED: 'request:created',
  REQUEST_ACCEPTED: 'request:accepted',
  REQUEST_STARTED: 'request:started',
  REQUEST_COMPLETED: 'request:completed',
  REQUEST_CANCELLED: 'request:cancelled',

  // Proposal Events
  PROPOSAL_SUBMITTED: 'proposal:submitted',
  PROPOSAL_ACCEPTED: 'proposal:accepted',
  PROPOSAL_REJECTED: 'proposal:rejected',

  // Payment Events
  PAYMENT_COMPLETED: 'payment:completed',
  WITHDRAWAL_REQUESTED: 'withdrawal:requested',
  WITHDRAWAL_APPROVED: 'withdrawal:approved',

  // Chat Events
  MESSAGE_SENT: 'message:sent',

  // Technician Events
  TECHNICIAN_LOCATION_UPDATED: 'technician:location_updated',
  TECHNICIAN_APPROVED: 'technician:approved',
  TECHNICIAN_REJECTED: 'technician:rejected',

  // Review Events
  REVIEW_SUBMITTED: 'review:submitted',
} as const;
