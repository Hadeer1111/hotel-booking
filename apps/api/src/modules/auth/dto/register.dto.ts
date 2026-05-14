import { z } from 'zod';
import { createZodDto } from '../../../common/zod/create-zod-dto';

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8, 'password must be at least 8 characters')
    .max(72, 'password must be at most 72 characters'),
  name: z.string().min(1).max(100),
  role: z.enum(['CUSTOMER', 'MANAGER']).optional(),
});

export class RegisterDto extends createZodDto(registerSchema) {}
