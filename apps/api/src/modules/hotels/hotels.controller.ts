import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role } from '@prisma/client';
import { HotelsService } from './hotels.service';
import { ZodValidationPipe } from '../../common/zod/zod-validation.pipe';
import {
  CreateHotelDto,
  ListHotelsDto,
  UpdateHotelDto,
} from './dto/hotel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types';

@Controller({ path: 'hotels', version: '1' })
export class HotelsController {
  constructor(private readonly hotels: HotelsService) {}

  // Public catalogue: ACTIVE by default; `includeInactive=true` only widens for staff JWT.
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Query(new ZodValidationPipe(ListHotelsDto)) query: InstanceType<typeof ListHotelsDto>,
    @Req() req: Request & { user?: AuthUser },
  ) {
    return this.hotels.list(query, req.user);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() req: Request & { user?: AuthUser },
  ) {
    return this.hotels.findOne(id, req.user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(201)
  create(@Body(new ZodValidationPipe(CreateHotelDto)) dto: InstanceType<typeof CreateHotelDto>) {
    return this.hotels.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(UpdateHotelDto)) dto: InstanceType<typeof UpdateHotelDto>,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.hotels.update(id, dto, actor);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(204)
  async remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.hotels.remove(id);
  }
}
