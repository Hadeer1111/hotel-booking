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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
/**
 * Type-safe wrapper around ConfigService.
 * Use this everywhere instead of process.env or raw ConfigService so consumers
 * get a fully-typed view of the validated environment.
 */
let AppConfigService = class AppConfigService {
    constructor(config) {
        this.config = config;
    }
    get(key) {
        return this.config.get(key, { infer: true });
    }
    get nodeEnv() {
        return this.get('NODE_ENV');
    }
    get isProd() {
        return this.nodeEnv === 'production';
    }
    get isTest() {
        return this.nodeEnv === 'test';
    }
    get jwt() {
        return {
            accessSecret: this.get('JWT_ACCESS_SECRET'),
            accessTtl: this.get('JWT_ACCESS_TTL'),
            refreshSecret: this.get('JWT_REFRESH_SECRET'),
            refreshTtl: this.get('JWT_REFRESH_TTL'),
        };
    }
    get payments() {
        return {
            provider: this.get('PAYMENTS_PROVIDER'),
            stripeSecretKey: this.get('STRIPE_SECRET_KEY'),
            stripeWebhookSecret: this.get('STRIPE_WEBHOOK_SECRET'),
            currency: this.get('STRIPE_CURRENCY'),
        };
    }
    get throttle() {
        return { ttl: this.get('THROTTLE_TTL'), limit: this.get('THROTTLE_LIMIT') };
    }
};
exports.AppConfigService = AppConfigService;
exports.AppConfigService = AppConfigService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(config_1.ConfigService)),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AppConfigService);
//# sourceMappingURL=app-config.service.js.map