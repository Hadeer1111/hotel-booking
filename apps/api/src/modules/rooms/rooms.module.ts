import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HotelsModule } from '../hotels/hotels.module';
import { RoomsController } from './rooms.controller';
import { RoomsResourceController } from './rooms-resource.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [AuthModule, HotelsModule],
  controllers: [RoomsController, RoomsResourceController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
