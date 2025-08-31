import type { RootInfoResponse } from './api-info.contract';
import { ConfigService } from '../core/config.service';

export class ApiInfoService {
  private startTime: number;
  private configService: ConfigService;

  constructor() {
    this.startTime = Date.now();
    this.configService = ConfigService.getInstance();
  }

  getRootInfo(): RootInfoResponse {
    return {
      message: 'MD Site Monitor Backend API',
      status: 'running',
      timestamp: new Date().toISOString(),
      uptime: (Date.now() - this.startTime) / 1000,
      environment: this.configService.nodeEnv,
      'doc-links': {
        docs: '/api-docs',
        spec: '/api-docs/json',
      },
    };
  }
}
