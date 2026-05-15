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
import { CreateRoomFlatDto, ListRoomsFlatQueryDto } from './dto/room-flat.dto';
import { UpdateRoomDto } from './dto/room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types';

/**
 * Task-style flat REST surface (`GET/POST/PATCH /v1/rooms`).
 * Canonical hotel-scoped routes under `/v1/hotels/:hotelId/...` remain supported.
 */
@Controller({ path: 'rooms', version: '1' })
export class RoomsResourceController {
  constructor(private readonly rooms: RoomsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Query(new ZodValidationPipe(ListRoomsFlatQueryDto)) query: InstanceType<typeof ListRoomsFlatQueryDto>,
    @Req() req: Request & { user?: AuthUser },
  ) {
    return this.rooms.listRooms(query.hotelId, req.user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  @HttpCode(201)
  create(
    @Body(new ZodValidationPipe(CreateRoomFlatDto))
    dto: InstanceType<typeof CreateRoomFlatDto>,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.rooms.createRoomFromFlatBody(dto, actor);
  }

  @Patch(':roomId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.MANAGER)
  update(
    @Param('roomId', new ParseUUIDPipe()) roomId: string,
    @Body(new ZodValidationPipe(UpdateRoomDto)) dto: InstanceType<typeof UpdateRoomDto>,
    @CurrentUser() actor: AuthUser,
  ) {
    return this.rooms.updateRoomByRoomId(roomId, dto, actor);
  }
}
