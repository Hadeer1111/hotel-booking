import { AppConfigService } from '../../config/app-config.service';
/**
 * Thin wrapper around bcrypt so the rest of the codebase never imports the
 * raw library and the cost factor lives in config (BCRYPT_ROUNDS).
 */
export declare class PasswordService {
    private readonly rounds;
    constructor(config: AppConfigService);
    hash(plain: string): Promise<string>;
    compare(plain: string, hash: string): Promise<boolean>;
}
