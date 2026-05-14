import { z } from 'zod';
import { createZodDto } from '../../../common/zod/create-zod-dto';

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export class RefreshDto extends createZodDto(refreshSchema) {}
