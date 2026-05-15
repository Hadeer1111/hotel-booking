"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const app_config_service_1 = require("../../config/app-config.service");
const auth_module_1 = require("../auth/auth.module");
const payments_service_1 = require("./payments.service");
const payments_webhook_controller_1 = require("./payments-webhook.controller");
const payments_provider_interface_1 = require("./payments-provider.interface");
const mock_provider_1 = require("./providers/mock.provider");
const stripe_provider_1 = require("./providers/stripe.provider");
let PaymentsModule = class PaymentsModule {
};
exports.PaymentsModule = PaymentsModule;
exports.PaymentsModule = PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule],
        controllers: [payments_webhook_controller_1.PaymentsWebhookController],
        providers: [
            payments_service_1.PaymentsService,
            mock_provider_1.MockPaymentsProvider,
            {
                provide: stripe_provider_1.StripePaymentsProvider,
                inject: [app_config_service_1.AppConfigService],
                useFactory: (config) => config.payments.provider === 'stripe' ? new stripe_provider_1.StripePaymentsProvider(config) : null,
            },
            {
                provide: payments_provider_interface_1.PAYMENTS_PROVIDER,
                inject: [app_config_service_1.AppConfigService, mock_provider_1.MockPaymentsProvider, stripe_provider_1.StripePaymentsProvider],
                useFactory: (config, mock, stripe) => {
                    if (config.payments.provider === 'stripe') {
                        if (!stripe)
                            throw new Error('Stripe provider not initialised');
                        return stripe;
                    }
                    return mock;
                },
            },
        ],
        exports: [payments_service_1.PaymentsService, payments_provider_interface_1.PAYMENTS_PROVIDER],
    })
], PaymentsModule);
//# sourceMappingURL=payments.module.js.map