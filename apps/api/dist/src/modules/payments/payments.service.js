"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const app_config_service_1 = require("../../config/app-config.service");
const payments_provider_interface_1 = require("./payments-provider.interface");
/**
 * Orchestrates the provider abstraction. Booking flows call createForBooking
 * to mint a Payment row and matching provider intent; webhooks call
 * processEvent to apply the event idempotently via PaymentEvent.providerEventId.
 */
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(prisma, config, provider) {
        this.prisma = prisma;
        this.config = config;
        this.provider = provider;
        this.logger = new common_1.Logger(PaymentsService_1.name);
    }
    /**
     * Used by the bookings module right after the booking row is inserted.
     *
     * CRITICAL: when the caller is already inside a `prisma.$transaction`,
     * it MUST pass the transaction client (`tx`) through. The Booking row is
     * still uncommitted at this point, so a default `this.prisma.payment.create`
     * call would run on a different pooled connection that cannot see the
     * booking yet, and Postgres would reject the insert with a
     * `Payment_bookingId_fkey` foreign-key violation.
     */
    async createForBooking(input, tx) {
        const currency = input.currency ?? this.config.payments.currency;
        const intent = await this.provider.createIntent({
            bookingId: input.bookingId,
            amount: input.amount,
            currency,
        });
        const db = tx ?? this.prisma;
        const payment = await db.payment.create({
            data: {
                bookingId: input.bookingId,
                provider: this.provider.name,
                providerPaymentId: intent.providerPaymentId,
                amount: input.amount,
                currency,
                status: intent.status,
            },
        });
        return { payment, intent };
    }
    async verifyAndParseWebhook(rawBody, signature) {
        return this.provider.handleWebhook(rawBody, signature);
    }
    /** Idempotently apply a verified provider event. */
    async processEvent(event) {
        return this.prisma.$transaction(async (tx) => {
            const existing = await tx.paymentEvent.findUnique({
                where: { providerEventId: event.providerEventId },
                select: { id: true },
            });
            if (existing) {
                this.logger.debug(`event ${event.providerEventId} already processed; skipping`);
                return;
            }
            const payment = await tx.payment.findFirst({
                where: { providerPaymentId: event.providerPaymentId },
            });
            if (!payment) {
                throw new common_1.NotFoundException(`no payment found for providerPaymentId=${event.providerPaymentId}`);
            }
            const nextStatus = event.type === 'payment_succeeded'
                ? 'SUCCEEDED'
                : event.type === 'payment_failed'
                    ? 'FAILED'
                    : 'REFUNDED';
            await tx.payment.update({
                where: { id: payment.id },
                data: {
                    status: nextStatus,
                    providerEventLastSeen: event.providerEventId,
                },
            });
            if (event.type === 'payment_succeeded') {
                await tx.booking.update({
                    where: { id: payment.bookingId },
                    data: { status: 'CONFIRMED' },
                });
            }
            else if (event.type === 'payment_refunded') {
                await tx.booking.update({
                    where: { id: payment.bookingId },
                    data: { status: 'CANCELLED' },
                });
            }
            await tx.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    providerEventId: event.providerEventId,
                    type: event.type,
                    payload: event.rawPayload,
                },
            });
        });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(payments_provider_interface_1.PAYMENTS_PROVIDER)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_config_service_1.AppConfigService, Object])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map