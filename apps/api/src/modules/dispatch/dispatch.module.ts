import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DispatchController } from './dispatch.controller';
import { DispatchService } from './dispatch.service';
import { OccurrencesModule } from '../occurrences/occurrences.module';

@Module({
  imports: [HttpModule, OccurrencesModule],
  controllers: [DispatchController],
  providers: [DispatchService],
  exports: [DispatchService],
})
export class DispatchModule {}
