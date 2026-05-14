import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { ZodValidationPipe } from '../../common/zod/zod-validation.pipe';
import {
  CreateBookingDto,
  ListBookingsDto,
  UpdateBookingStatusDto,
} from './dto/booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types';

@Controller({ path: 'bookings', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Post()
  @Roles(Role.CUSTOMER, Role.ADMIN)
  @HttpCode(201)
  create(
    @Body(new ZodValidationPipe(CreateBookingDto)) dto: InstanceType<typeof CreateBookingDto>,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.bookings.create(dto, actor);
  }

  @Get()
  list(
    @Query(new ZodValidationPipe(ListBookingsDto)) query: InstanceType<typeof ListBookingsDto>,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.bookings.list(query, actor);
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string, @CurrentUser() actor: AuthUser) {
    return this.bookings.findOne(id, actor);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(UpdateBookingStatusDto))
    dto: InstanceType<typeof UpdateBookingStatusDto>,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.bookings.updateStatus(id, dto, actor);
  }
}
