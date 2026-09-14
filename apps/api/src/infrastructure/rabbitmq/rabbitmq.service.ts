import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqplib from 'amqplib';

export type MessageHandler = (msg: amqplib.ConsumeMessage | null) => Promise<void>;

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  private connection: amqplib.Connection;
  private channel: amqplib.Channel;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('RABBITMQ_URL', 'amqp://localhost');
    this.connection = await amqplib.connect(url);
    this.channel = await this.connection.createChannel();
    this.logger.log('✅ RabbitMQ conectado');
  }

  async assertQueue(queue: string, durable = true): Promise<void> {
    await this.channel.assertQueue(queue, { durable });
  }

  async publish(queue: string, payload: Record<string, unknown>): Promise<void> {
    await this.assertQueue(queue);
    this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now(),
    });
  }

  async consume(queue: string, handler: MessageHandler): Promise<void> {
    await this.assertQueue(queue);
    await this.channel.consume(queue, async (msg) => {
      try {
        await handler(msg);
        if (msg) this.channel.ack(msg);
      } catch (err) {
        this.logger.error(`Erro ao processar mensagem de ${queue}:`, err);
        if (msg) this.channel.nack(msg, false, false);
      }
    });
  }

  parseMessage<T>(msg: amqplib.ConsumeMessage): T {
    return JSON.parse(msg.content.toString()) as T;
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
