import { Module } from '@nestjs/common';
import { OccurrencesController } from './occurrences.controller';
import { OccurrencesService } from './occurrences.service';
import { OccurrencesGateway } from './occurrences.gateway';

@Module({
  controllers: [OccurrencesController],
  providers: [OccurrencesService, OccurrencesGateway],
  exports: [OccurrencesService],
})
export class OccurrencesModule {}
