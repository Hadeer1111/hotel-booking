import { Strategy } from 'passport-jwt';
import { AppConfigService } from '../../../config/app-config.service';
import type { AuthUser, JwtAccessPayload } from '../types';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    constructor(config: AppConfigService);
    validate(payload: JwtAccessPayload): AuthUser;
}
export {};
