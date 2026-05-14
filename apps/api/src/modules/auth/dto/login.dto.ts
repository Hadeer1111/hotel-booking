import { z } from 'zod';
import { createZodDto } from '../../../common/zod/create-zod-dto';

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(72),
});

export class LoginDto extends createZodDto(loginSchema) {}
