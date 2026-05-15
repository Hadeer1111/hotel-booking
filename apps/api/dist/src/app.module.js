"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const throttler_1 = require("@nestjs/throttler");
const nestjs_pino_1 = require("nestjs-pino");
const app_config_module_1 = require("./config/app-config.module");
const app_config_service_1 = require("./config/app-config.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const hotels_module_1 = require("./modules/hotels/hotels.module");
const rooms_module_1 = require("./modules/rooms/rooms.module");
const payments_module_1 = require("./modules/payments/payments.module");
const bookings_module_1 = require("./modules/bookings/bookings.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const health_controller_1 = require("./common/health/health.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            app_config_module_1.AppConfigModule,
            nestjs_pino_1.LoggerModule.forRootAsync({
                imports: [app_config_module_1.AppConfigModule],
                inject: [app_config_service_1.AppConfigService],
                useFactory: (config) => ({
                    pinoHttp: {
                        level: config.get('LOG_LEVEL'),
                        redact: ['req.headers.authorization', 'req.headers.cookie'],
                        transport: config.isProd
                            ? undefined
                            : { target: 'pino-pretty', options: { singleLine: true, colorize: true } },
                    },
                }),
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [app_config_module_1.AppConfigModule],
                inject: [app_config_service_1.AppConfigService],
                useFactory: (config) => ({
                    throttlers: [
                        {
                            name: 'default',
                            ttl: config.throttle.ttl * 1000,
                            limit: config.throttle.limit,
                        },
                    ],
                }),
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            hotels_module_1.HotelsModule,
            rooms_module_1.RoomsModule,
            payments_module_1.PaymentsModule,
            bookings_module_1.BookingsModule,
            dashboard_module_1.DashboardModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [{ provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map