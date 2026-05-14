import { Test } from '@nestjs/testing';
import { PasswordService } from './password.service';
import { AppConfigService } from '../../config/app-config.service';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        PasswordService,
        {
          provide: AppConfigService,
          useValue: { get: (key: string) => (key === 'BCRYPT_ROUNDS' ? 4 : undefined) },
        },
      ],
    }).compile();
    service = mod.get(PasswordService);
  });

  it('hashes a password to a different value', async () => {
    const hash = await service.hash('Password123!');
    expect(hash).not.toBe('Password123!');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('verifies a correct password', async () => {
    const hash = await service.hash('Password123!');
    await expect(service.compare('Password123!', hash)).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await service.hash('Password123!');
    await expect(service.compare('wrong', hash)).resolves.toBe(false);
  });
});
