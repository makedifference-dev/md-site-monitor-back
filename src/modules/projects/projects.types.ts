// Типы для модуля проектов
import type { Project } from '@prisma/client';

export interface CreateProjectRequest {
  name: string;
  websiteUrl: string;
}

export type ProjectResponse = Omit<
  Project,
  'userId' | 'createdAt' | 'updatedAt'
> & {
  createdAt: string;
  updatedAt: string;
};

export interface ProjectsListResponse {
  projects: ProjectResponse[];
  total: number;
}

// Reuse shared ApiResponse

// Примеры данных для Swagger документации
export const createProjectRequestExample: CreateProjectRequest = {
  name: 'My Website',
  websiteUrl: 'https://example.com',
};

export const projectResponseExample: ProjectResponse = {
  id: 'clx1234567890abcdef',
  name: 'My Website',
  websiteUrl: 'https://example.com',
  isActive: true,
  createdAt: '2025-08-24T18:16:06.000Z',
  updatedAt: '2025-08-24T18:16:06.000Z',
};

export const projectsListResponseExample: ProjectsListResponse = {
  projects: [projectResponseExample],
  total: 1,
};
