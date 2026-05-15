"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const nestjs_pino_1 = require("nestjs-pino");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const app_config_service_1 = require("./config/app-config.service");
const http_problem_filter_1 = require("./common/errors/http-problem.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
        rawBody: true,
    });
    const config = app.get(app_config_service_1.AppConfigService);
    app.useLogger(app.get(nestjs_pino_1.Logger));
    app.use((0, helmet_1.default)());
    app.enableCors({
        origin: config.get('CORS_ORIGIN').split(',').map((s) => s.trim()),
        credentials: true,
    });
    app.enableVersioning({
        type: common_1.VersioningType.URI,
        defaultVersion: '1',
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new http_problem_filter_1.HttpProblemFilter());
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('Hotel Booking API')
        .setDescription('Internal API surface for the hotel booking management system')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document, {
        swaggerOptions: { persistAuthorization: true },
    });
    const port = config.get('PORT');
    await app.listen(port);
    app.get(nestjs_pino_1.Logger).log(`api listening on http://localhost:${port} (${config.nodeEnv})`);
}
void bootstrap();
//# sourceMappingURL=main.js.map