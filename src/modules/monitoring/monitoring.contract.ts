import type { SiteCheck } from '@prisma/client';
import type { PaginationInfo } from '../core/core.contract';
import { z } from 'zod';
import {
  makeValidator,
  nonEmptyString,
} from '@/modules/core/validation/validate';

export interface SSLCertificateInfo {
  valid: boolean;
  expiry?: Date;
  issuer?: string;
  error?: string;
}

export interface SiteCheckResult {
  projectId: string;
  websiteUrl: string;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  responseTime?: number;
  statusCode?: number;
  error?: string;
  sslValid?: boolean;
  sslExpiry?: Date;
  sslIssuer?: string;
}

export interface MonitoringStats {
  totalProjects: number;
  activeProjects: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  sslStats: {
    totalSSLChecks: number;
    validSSLCertificates: number;
    expiredSSLCertificates: number;
    sslIssues: number;
  };
}

export interface ProjectCheckHistory {
  projectId: string;
  projectName: string;
  websiteUrl: string;
  checks: SiteCheck[];
  totalChecks: number;
  successRate: number;
  averageResponseTime: number;
}

export type SiteCheckResponse = Omit<SiteCheck, 'projectId'>;

export interface ProjectCheckHistoryResponse {
  projectId: string;
  projectName: string;
  websiteUrl: string;
  checks: SiteCheckResponse[];
  totalChecks: number;
  successRate: number;
  averageResponseTime: number;
  pagination?: PaginationInfo;
}

// Примеры данных для Swagger
export const siteCheckResultExample: SiteCheckResult = {
  projectId: 'clx1234567890',
  websiteUrl: 'https://example.com',
  status: 'SUCCESS',
  responseTime: 245,
  statusCode: 200,
  sslValid: true,
  sslExpiry: new Date('2025-12-31'),
  sslIssuer: "Let's Encrypt",
};

export const monitoringStatsExample: MonitoringStats = {
  totalProjects: 10,
  activeProjects: 8,
  successfulChecks: 75,
  failedChecks: 5,
  averageResponseTime: 320,
  sslStats: {
    totalSSLChecks: 80,
    validSSLCertificates: 75,
    expiredSSLCertificates: 3,
    sslIssues: 2,
  },
};

export const projectCheckHistoryExample: ProjectCheckHistoryResponse = {
  projectId: 'clx1234567890',
  projectName: 'Example Project',
  websiteUrl: 'https://example.com',
  checks: [
    {
      id: 'clx1234567891',
      status: 'SUCCESS',
      responseTime: 245,
      statusCode: 200,
      error: null,
      sslValid: true,
      sslExpiry: new Date('2025-12-31'),
      sslIssuer: "Let's Encrypt",
      checkedAt: new Date(),
    },
  ],
  totalChecks: 1,
  successRate: 100,
  averageResponseTime: 245,
};

// =============== Schemas & Validators ===============
export const monitoringProjectIdParamSchema = z.object({
  projectId: nonEmptyString(),
});

export const monitoringPaginationSchema = z.object({
  limit: z.coerce.number().int().min(0).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// Types from schemas
export type MonitoringProjectIdParam = z.infer<
  typeof monitoringProjectIdParamSchema
>;
export type MonitoringPagination = z.infer<typeof monitoringPaginationSchema>;

export const validateMonitoringProjectIdParam = makeValidator(
  monitoringProjectIdParamSchema,
  () => 'Project ID is required'
);
