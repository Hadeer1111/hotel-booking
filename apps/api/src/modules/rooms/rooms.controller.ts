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
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Role } from '@prisma/client';
import { RoomsService } from './rooms.service';
import { ZodValidationPipe } from '../../common/zod/zod-validation.pipe';
import {
  CreateRoomTypeDto,
  UpdateRoomTypeDto,
} from './dto/room-type.dto';
import {
  AvailabilityQueryDto,
  CreateRoomDto,
  UpdateRoomDto,
} from './dto/room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types';

@Controller({ path: 'hotels/:hotelId', version: '1' })
export class RoomsController {
  constructor(private readonly rooms: RoomsService) {}

  // ---- Room types ----------------------------------------------------------

  @Get('room-types')
  @UseGuards(OptionalJwtAuthGuard)
  listTypes(
    @Param('hotelId', new ParseUUIDPipe()) hotelId: string,
    @Req() req: Request & { user?: AuthUser },
  ) {
    return this.rooms.listTypes(hotelId, req.user);
  }

  @Post('room-types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(201)
  createType(
    @Param('hotelId', new ParseUUIDPipe()) hotelId: string,
    @Body(new ZodValidationPipe(CreateRoomTypeDto)) dto: InstanceType<typeof CreateRoomTypeDto>,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.rooms.createType(hotelId, dto, actor);
  }

  @Patch('room-types/:typeId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  updateType(
    @Param('hotelId', new ParseUUIDPipe()) hotelId: string,
    @Param('typeId', new ParseUUIDPipe()) typeId: string,
    @Body(new ZodValidationPipe(UpdateRoomTypeDto)) dto: InstanceType<typeof UpdateRoomTypeDto>,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.rooms.updateType(hotelId, typeId, dto, actor);
  }

  // ---- Physical rooms -------------------------------------------------------

  @Get('rooms')
  @UseGuards(OptionalJwtAuthGuard)
  listRooms(
    @Param('hotelId', new ParseUUIDPipe()) hotelId: string,
    @Req() req: Request & { user?: AuthUser },
  ) {
    return this.rooms.listRooms(hotelId, req.user);
  }

  @Post('rooms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(201)
  createRoom(
    @Param('hotelId', new ParseUUIDPipe()) hotelId: string,
    @Body(new ZodValidationPipe(CreateRoomDto)) dto: InstanceType<typeof CreateRoomDto>,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.rooms.createRoom(hotelId, dto, actor);
  }

  @Patch('rooms/:roomId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  updateRoom(
    @Param('hotelId', new ParseUUIDPipe()) hotelId: string,
    @Param('roomId', new ParseUUIDPipe()) roomId: string,
    @Body(new ZodValidationPipe(UpdateRoomDto)) dto: InstanceType<typeof UpdateRoomDto>,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.rooms.updateRoom(hotelId, roomId, dto, actor);
  }

  // ---- Availability --------------------------------------------------------

  @Get('availability')
  @UseGuards(OptionalJwtAuthGuard)
  availability(
    @Param('hotelId', new ParseUUIDPipe()) hotelId: string,
    @Query(new ZodValidationPipe(AvailabilityQueryDto))
    query: InstanceType<typeof AvailabilityQueryDto>,
    @Req() req: Request & { user?: AuthUser },
  ) {
    return this.rooms.availability(hotelId, query.checkIn, query.checkOut, req.user);
  }
}
