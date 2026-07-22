import { Module } from '@nestjs/common';
import { ComplementGroupsController } from './complement-groups.controller';
import { ComplementGroupsService } from './complement-groups.service';

@Module({
  controllers: [ComplementGroupsController],
  providers: [ComplementGroupsService],
  exports: [ComplementGroupsService],
})
export class ComplementGroupsModule {}
