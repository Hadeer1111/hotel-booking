"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
/**
 * Extracts the JwtStrategy.validate() return value from the request.
 * Usage: `@CurrentUser() user: AuthUser`
 */
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    if (!req.user)
        throw new Error('CurrentUser used outside an authenticated route');
    return req.user;
});
//# sourceMappingURL=current-user.decorator.js.map