"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppConfigModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const env_schema_1 = require("./env.schema");
const app_config_service_1 = require("./app-config.service");
/**
 * Global config module. Loads .env, validates against the Zod schema,
 * and exposes AppConfigService as the only allowed env accessor.
 */
let AppConfigModule = class AppConfigModule {
};
exports.AppConfigModule = AppConfigModule;
exports.AppConfigModule = AppConfigModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                cache: true,
                validate: (raw) => {
                    const parsed = env_schema_1.envSchema.safeParse(raw);
                    if (!parsed.success) {
                        const message = parsed.error.errors
                            .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
                            .join('\n');
                        throw new Error(`Invalid environment configuration:\n${message}`);
                    }
                    return parsed.data;
                },
            }),
        ],
        providers: [app_config_service_1.AppConfigService],
        exports: [app_config_service_1.AppConfigService],
    })
], AppConfigModule);
//# sourceMappingURL=app-config.module.js.map