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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var StripePaymentsProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripePaymentsProvider = void 0;
const common_1 = require("@nestjs/common");
const stripe_1 = __importDefault(require("stripe"));
const app_config_service_1 = require("../../../config/app-config.service");
/**
 * Real Stripe provider (test-mode keys). Currency is configured via STRIPE_CURRENCY;
 * we treat Booking.totalPrice as a decimal amount in that currency and convert to
 * minor units (cents) here at the boundary so the rest of the domain never sees
 * cents.
 */
let StripePaymentsProvider = StripePaymentsProvider_1 = class StripePaymentsProvider {
    constructor(config) {
        this.name = 'stripe';
        this.logger = new common_1.Logger(StripePaymentsProvider_1.name);
        const secret = config.payments.stripeSecretKey;
        if (!secret) {
            throw new Error('STRIPE_SECRET_KEY is required when PAYMENTS_PROVIDER=stripe');
        }
        const whSecret = config.payments.stripeWebhookSecret;
        if (!whSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is required when PAYMENTS_PROVIDER=stripe');
        }
        this.stripe = new stripe_1.default(secret, { apiVersion: '2026-04-22.dahlia' });
        this.webhookSecret = whSecret;
        this.currency = config.payments.currency;
    }
    async createIntent(input) {
        const intent = await this.stripe.paymentIntents.create({
            amount: Math.round(input.amount * 100),
            currency: (input.currency ?? this.currency).toLowerCase(),
            automatic_payment_methods: { enabled: true },
            metadata: { bookingId: input.bookingId },
        });
        return {
            providerPaymentId: intent.id,
            clientSecret: intent.client_secret,
            status: 'REQUIRES_PAYMENT',
        };
    }
    async handleWebhook(rawBody, signature) {
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
        }
        catch (err) {
            this.logger.warn(`stripe webhook signature failed: ${err.message}`);
            throw err;
        }
        switch (event.type) {
            case 'payment_intent.succeeded': {
                const pi = event.data.object;
                return {
                    providerEventId: event.id,
                    type: 'payment_succeeded',
                    providerPaymentId: pi.id,
                    rawPayload: { id: event.id, type: event.type, intentId: pi.id },
                };
            }
            case 'payment_intent.payment_failed': {
                const pi = event.data.object;
                return {
                    providerEventId: event.id,
                    type: 'payment_failed',
                    providerPaymentId: pi.id,
                    rawPayload: { id: event.id, type: event.type, intentId: pi.id },
                };
            }
            case 'charge.refunded': {
                const charge = event.data.object;
                const intentId = typeof charge.payment_intent === 'string'
                    ? charge.payment_intent
                    : charge.payment_intent?.id;
                if (!intentId)
                    return null;
                return {
                    providerEventId: event.id,
                    type: 'payment_refunded',
                    providerPaymentId: intentId,
                    rawPayload: { id: event.id, type: event.type, intentId },
                };
            }
            default:
                return null;
        }
    }
};
exports.StripePaymentsProvider = StripePaymentsProvider;
exports.StripePaymentsProvider = StripePaymentsProvider = StripePaymentsProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_config_service_1.AppConfigService])
], StripePaymentsProvider);
//# sourceMappingURL=stripe.provider.js.map