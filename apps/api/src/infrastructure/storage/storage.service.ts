import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private storage: Storage;
  private bucketName: string;

  constructor(private config: ConfigService) {
    this.storage = new Storage({
      projectId: config.get('GCS_PROJECT_ID'),
      keyFilename: config.get('GCS_KEY_FILE'),
    });
    this.bucketName = config.get<string>('GCS_BUCKET_NAME', 'resgate-uploads');
  }

  async uploadFile(
    buffer: Buffer,
    originalName: string,
    folder: string,
    mimeType: string,
  ): Promise<{ url: string; fileName: string }> {
    const ext = path.extname(originalName);
    const fileName = `${folder}/${uuidv4()}${ext}`;
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(fileName);

    await file.save(buffer, {
      metadata: { contentType: mimeType },
      public: false,
    });

    const url = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
    this.logger.debug(`Arquivo enviado: ${fileName}`);
    return { url, fileName };
  }

  async getSignedUrl(fileName: string, expiresMinutes = 60): Promise<string> {
    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(fileName)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresMinutes * 60 * 1000,
      });
    return url;
  }

  async deleteFile(fileName: string): Promise<void> {
    await this.storage.bucket(this.bucketName).file(fileName).delete();
  }
}
