// Типы для модуля health

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  responseTime?: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  checks: {
    database: HealthCheck;
    memory: HealthCheck;
    disk: HealthCheck;
  };
  uptime: number;
  version: string;
  environment: string;
}
