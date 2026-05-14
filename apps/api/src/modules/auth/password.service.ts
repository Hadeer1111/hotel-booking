import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AppConfigService } from '../../config/app-config.service';

/**
 * Thin wrapper around bcrypt so the rest of the codebase never imports the
 * raw library and the cost factor lives in config (BCRYPT_ROUNDS).
 */
@Injectable()
export class PasswordService {
  private readonly rounds: number;

  constructor(config: AppConfigService) {
    this.rounds = config.get('BCRYPT_ROUNDS');
  }

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
