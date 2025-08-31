import {
  generateSchemaFromInterface,
  buildEndpoint,
  ref,
} from '../docs/swagger.utils';

// Примеры для генерации схем
const healthCheckExample = {
  status: 'healthy' as const,
  message: 'OK',
  responseTime: 12,
};

const healthStatusExample = {
  status: 'healthy' as const,
  timestamp: new Date(),
  checks: {
    database: healthCheckExample,
    memory: healthCheckExample,
    disk: healthCheckExample,
  },
  uptime: 123.45,
  version: '1.0.0',
  environment: 'development',
};

const dbHealthExample = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  database: {
    connection: true,
    latencyMs: 5,
  },
};

// Удалены /ping и /version

export const healthDocs = {
  '/health': buildEndpoint('/health', 'get', 'Service health status', {
    tag: 'Health',
    responses: { '200': { schema: ref('HealthStatus') } },
  }),
  '/health/database': buildEndpoint(
    '/health/database',
    'get',
    'Detailed database health',
    {
      tag: 'Health',
      responses: { '200': { schema: ref('DatabaseHealthResponse') } },
    }
  ),
};

export const healthSchemas = {
  HealthCheck: generateSchemaFromInterface(healthCheckExample),
  HealthStatus: generateSchemaFromInterface(healthStatusExample),
  DatabaseHealthResponse: generateSchemaFromInterface(dbHealthExample),
};
