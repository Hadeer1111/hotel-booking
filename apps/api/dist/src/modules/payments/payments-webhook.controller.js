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
var PaymentsWebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsWebhookController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const payments_service_1 = require("./payments.service");
/**
 * Webhook receiver for the configured PaymentsProvider.
 * Mounted at /v1/payments/webhook. Signature verification + idempotency
 * are delegated to the provider strategy.
 *
 * NOTE: bodyParser is configured in main.ts to expose req.rawBody for
 * this route so Stripe.constructEvent receives the exact bytes Stripe
 * signed.
 */
let PaymentsWebhookController = PaymentsWebhookController_1 = class PaymentsWebhookController {
    constructor(payments) {
        this.payments = payments;
        this.logger = new common_1.Logger(PaymentsWebhookController_1.name);
    }
    async handle(req, stripeSig, mockSig) {
        const signature = stripeSig ?? mockSig;
        if (!signature)
            throw new common_1.BadRequestException('missing signature header');
        if (!req.rawBody)
            throw new common_1.BadRequestException('missing raw body');
        let event;
        try {
            event = await this.payments.verifyAndParseWebhook(req.rawBody, signature);
        }
        catch (err) {
            this.logger.warn(`webhook verification failed: ${err.message}`);
            throw new common_1.BadRequestException('invalid signature');
        }
        if (!event)
            return { received: true, processed: false };
        await this.payments.processEvent(event);
        return { received: true, processed: true };
    }
};
exports.PaymentsWebhookController = PaymentsWebhookController;
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __param(2, (0, common_1.Headers)('x-mock-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsWebhookController.prototype, "handle", null);
exports.PaymentsWebhookController = PaymentsWebhookController = PaymentsWebhookController_1 = __decorate([
    (0, common_1.Controller)({ path: 'payments', version: '1' }),
    (0, throttler_1.SkipThrottle)(),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsWebhookController);
//# sourceMappingURL=payments-webhook.controller.js.map