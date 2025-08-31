import {
  buildEndpoint,
  ref,
  generateSchemaFromInterface,
  makeParam,
} from '../docs/swagger.utils';
import {
  monitoringStatsExample,
  projectCheckHistoryExample,
  siteCheckResultExample,
} from './monitoring.contract';

export const monitoringDocs = {
  '/monitoring/stats': buildEndpoint(
    '/monitoring/stats',
    'get',
    'Get monitoring statistics (Admin only)',
    {
      tag: 'Monitoring',
      security: [{ bearerAuth: [] }],
      responses: { '200': { schema: ref('MonitoringStats') } },
    }
  ),

  '/monitoring/projects/{projectId}/history': buildEndpoint(
    '/monitoring/projects/{projectId}/history',
    'get',
    'Get project check history',
    {
      tag: 'Monitoring',
      security: [{ bearerAuth: [] }],
      parameters: [
        makeParam('projectId', 'path', { type: 'string' }, true),
        makeParam('limit', 'query', { type: 'number' }, false),
        makeParam('offset', 'query', { type: 'number' }, false),
      ],
      responses: { '200': { schema: ref('ProjectCheckHistory') } },
    }
  ),

  '/monitoring/projects/{projectId}/check': buildEndpoint(
    '/monitoring/projects/{projectId}/check',
    'post',
    'Manually check a site',
    {
      tag: 'Monitoring',
      security: [{ bearerAuth: [] }],
      parameters: [makeParam('projectId', 'path', { type: 'string' }, true)],
      responses: { '200': { schema: ref('SiteCheckResult') } },
    }
  ),
};

// Схемы для Swagger
export const monitoringSchemas = {
  MonitoringStats: generateSchemaFromInterface(monitoringStatsExample),
  SiteCheckResult: generateSchemaFromInterface(siteCheckResultExample),
  SiteCheck: generateSchemaFromInterface({
    id: 'clx1234567891',
    status: 'SUCCESS',
    responseTime: 245,
    statusCode: 200,
    error: null,
    sslValid: true,
    sslExpiry: new Date('2025-12-31'),
    sslIssuer: "Let's Encrypt",
    checkedAt: new Date(),
  }),
  ProjectCheckHistory: generateSchemaFromInterface(projectCheckHistoryExample),
};
