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
var MockPaymentsProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockPaymentsProvider = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const app_config_service_1 = require("../../../config/app-config.service");
/**
 * Mock provider used by tests and `PAYMENTS_PROVIDER=mock`.
 * - createIntent returns a deterministic mock_pi_<uuid> + clientSecret null.
 * - Webhook signatures are produced by an HMAC over the body with a shared
 *   secret so we can still exercise the signature-verification code path.
 */
let MockPaymentsProvider = MockPaymentsProvider_1 = class MockPaymentsProvider {
    constructor(config) {
        this.name = 'mock';
        this.logger = new common_1.Logger(MockPaymentsProvider_1.name);
        this.webhookSecret =
            config.get('STRIPE_WEBHOOK_SECRET') ?? 'mock-webhook-secret-change-me';
    }
    async createIntent(input) {
        const id = `mock_pi_${(0, crypto_1.randomUUID)()}`;
        this.logger.debug(`[mock] createIntent booking=${input.bookingId} amount=${input.amount} ${input.currency} -> ${id}`);
        return {
            providerPaymentId: id,
            clientSecret: null,
            status: 'REQUIRES_PAYMENT',
        };
    }
    async handleWebhook(rawBody, signature) {
        const expected = (0, crypto_1.createHmac)('sha256', this.webhookSecret).update(rawBody).digest('hex');
        const provided = signature.replace(/^sha256=/, '');
        if (provided.length !== expected.length ||
            !(0, crypto_1.timingSafeEqual)(Buffer.from(expected), Buffer.from(provided))) {
            throw new Error('invalid mock webhook signature');
        }
        const parsed = JSON.parse(rawBody.toString('utf8'));
        if (!parsed.id || !parsed.type || !parsed.providerPaymentId)
            return null;
        return {
            providerEventId: parsed.id,
            type: parsed.type,
            providerPaymentId: parsed.providerPaymentId,
            rawPayload: parsed,
        };
    }
};
exports.MockPaymentsProvider = MockPaymentsProvider;
exports.MockPaymentsProvider = MockPaymentsProvider = MockPaymentsProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [app_config_service_1.AppConfigService])
], MockPaymentsProvider);
//# sourceMappingURL=mock.provider.js.map