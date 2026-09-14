import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { TerminusModule } from '@nestjs/terminus';

// Infrastructure
import { DatabaseModule } from './infrastructure/database/database.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { RabbitmqModule } from './infrastructure/rabbitmq/rabbitmq.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { QueueModule } from './infrastructure/queue/queue.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { ClientsModule } from './modules/clients/clients.module';
import { OccurrencesModule } from './modules/occurrences/occurrences.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { PricingModule } from './modules/pricing/pricing.module';
import { FinancialModule } from './modules/financial/financial.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AiAssistantModule } from './modules/ai-assistant/ai-assistant.module';
import { MapsModule } from './modules/maps/maps.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    // Config global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Cron jobs
    ScheduleModule.forRoot(),

    // Health check
    TerminusModule,

    // Infrastructure
    DatabaseModule,
    RedisModule,
    RabbitmqModule,
    StorageModule,
    QueueModule,

    // Feature modules
    AuthModule,
    UsersModule,
    TenantsModule,
    DriversModule,
    VehiclesModule,
    ClientsModule,
    OccurrencesModule,
    DispatchModule,
    TrackingModule,
    PricingModule,
    FinancialModule,
    NotificationsModule,
    ReportsModule,
    AiAssistantModule,
    MapsModule,
    AuditModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
