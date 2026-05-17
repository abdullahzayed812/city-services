import { ProposalsRepository } from '../repositories/proposals.repository';
import { RequestsRepository } from '../../requests/repositories/requests.repository';
import { NotificationService } from '../../notifications/services/notification.service';
import { eventBus, AppEvents } from '../../../core/events/EventBus';
import {
  NotFoundError, ForbiddenError, BadRequestError, ConflictError,
} from '../../../shared/errors/AppError';

export class ProposalsService {
  private readonly repo: ProposalsRepository;
  private readonly requestsRepo: RequestsRepository;
  private readonly notificationService: NotificationService;

  constructor() {
    this.repo = new ProposalsRepository();
    this.requestsRepo = new RequestsRepository();
    this.notificationService = new NotificationService();
  }

  async submitProposal(technicianId: string, data: {
    requestId: string;
    proposedPrice: number;
    estimatedDurationMinutes?: number;
    message?: string;
  }): Promise<object> {
    const request = await this.requestsRepo.findById(data.requestId);
    if (!request) throw new NotFoundError('الطلب');

    if (request.status !== 'pending') {
      throw new BadRequestError('هذا الطلب لم يعد متاحاً للعروض');
    }

    const alreadyProposed = await this.repo.existsByRequestAndTechnician(data.requestId, technicianId);
    if (alreadyProposed) {
      throw new ConflictError('لقد قدمت عرضاً على هذا الطلب مسبقاً');
    }

    const proposalId = await this.repo.create({
      requestId: data.requestId,
      technicianId,
      proposedPrice: data.proposedPrice,
      estimatedDurationMinutes: data.estimatedDurationMinutes,
      message: data.message,
    });

    const proposal = await this.repo.findById(proposalId);

    eventBus.emit(AppEvents.PROPOSAL_SUBMITTED, { proposalId, requestId: data.requestId, technicianId });

    await this.notificationService.sendToUser(request.customer_id, {
      type: 'proposal_received',
      titleAr: 'عرض جديد',
      bodyAr: `${proposal.technician_name} قدّم عرضاً بسعر ${data.proposedPrice} جنيه`,
      data: { requestId: data.requestId, proposalId },
    });

    return proposal;
  }

  async getRequestProposals(requestId: string, customerId: string, role?: string): Promise<object[]> {
    const request = await this.requestsRepo.findById(requestId);
    if (!request) throw new NotFoundError('الطلب');
    if (role !== 'admin' && request.customer_id !== customerId) throw new ForbiddenError();

    return this.repo.findByRequest(requestId);
  }

  async acceptProposal(proposalId: string, customerId: string): Promise<void> {
    const proposal = await this.repo.findById(proposalId);
    if (!proposal) throw new NotFoundError('العرض');

    const request = await this.requestsRepo.findById(proposal.request_id);
    if (!request) throw new NotFoundError('الطلب');
    if (request.customer_id !== customerId) throw new ForbiddenError();
    if (request.status !== 'pending') throw new BadRequestError('الطلب لم يعد في مرحلة القبول');

    await this.requestsRepo.acceptProposal(proposal.request_id, proposalId, proposal.technician_id, proposal.proposed_price);

    eventBus.emit(AppEvents.PROPOSAL_ACCEPTED, {
      proposalId, requestId: proposal.request_id, technicianId: proposal.technician_id,
    });

    await this.notificationService.sendToUser(proposal.technician_id, {
      type: 'proposal_accepted',
      titleAr: 'تم قبول عرضك',
      bodyAr: `تم قبول عرضك على طلب "${request.title}"`,
      data: { requestId: proposal.request_id, proposalId },
    });
  }

  async rejectProposal(proposalId: string, customerId: string): Promise<void> {
    const proposal = await this.repo.findById(proposalId);
    if (!proposal) throw new NotFoundError('العرض');

    const request = await this.requestsRepo.findById(proposal.request_id);
    if (!request) throw new NotFoundError('الطلب');
    if (request.customer_id !== customerId) throw new ForbiddenError();

    await this.repo.updateStatus(proposalId, 'rejected');

    eventBus.emit(AppEvents.PROPOSAL_REJECTED, { proposalId, technicianId: proposal.technician_id });
  }

  async withdrawProposal(proposalId: string, technicianId: string): Promise<void> {
    const proposal = await this.repo.findById(proposalId);
    if (!proposal) throw new NotFoundError('العرض');
    if (proposal.technician_id !== technicianId) throw new ForbiddenError();
    if (proposal.status !== 'pending') throw new BadRequestError('لا يمكن سحب العرض في هذه المرحلة');

    await this.repo.updateStatus(proposalId, 'withdrawn');
  }

  async getTechnicianProposals(technicianId: string, page: number, limit: number) {
    return this.repo.findByTechnician(technicianId, page, limit);
  }
}
