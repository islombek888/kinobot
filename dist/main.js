"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        app.enableCors();
        app.enableShutdownHooks();
        const port = process.env.PORT || 3000;
        await app.listen(port, '0.0.0.0');
        logger.log(`🚀 Application is running on: http://0.0.0.0:${port}`);
        logger.log(`🤖 Bot is starting...`);
    }
    catch (error) {
        logger.error(`❌ Application failed to start: ${error.message}`);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map