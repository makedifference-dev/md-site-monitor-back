import {
  generateSchemaFromInterface,
  generateEndpointDoc,
} from '../docs/swagger.utils';
import {
  monitoringStatsExample,
  projectCheckHistoryExample,
  siteCheckResultExample,
} from './monitoring.types';

export const monitoringDocs = {
  '/monitoring/stats': generateEndpointDoc(
    '/monitoring/stats',
    'get',
    'Get monitoring statistics (Admin only)',
    'Monitoring'
  ),

  '/monitoring/projects/{projectId}/history': generateEndpointDoc(
    '/monitoring/projects/{projectId}/history',
    'get',
    'Get project check history',
    'Monitoring'
  ),

  '/monitoring/projects/{projectId}/check': generateEndpointDoc(
    '/monitoring/projects/{projectId}/check',
    'post',
    'Manually check a site',
    'Monitoring'
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
