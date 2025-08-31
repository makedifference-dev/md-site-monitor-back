// Типы для модуля проектов
import type { Project } from '@prisma/client';
import { z } from 'zod';
import {
  makeValidator,
  nonEmptyString,
} from '@/modules/core/validation/validate';

// =============== Schemas ===============
export const projectIdParamSchema = z.object({
  projectId: nonEmptyString(),
});

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  websiteUrl: z.string().url(),
});

export const updateProjectNameSchema = z.object({
  name: z.string().min(1).max(100),
});

// =============== Types (from schemas) ===============
export type CreateProjectRequest = z.infer<typeof createProjectSchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
export type UpdateProjectNameRequest = z.infer<typeof updateProjectNameSchema>;

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

// =============== Validators ===============
export const validateProjectIdParam = makeValidator(
  projectIdParamSchema,
  () => 'Project ID is required'
);

export const validateCreateProject = makeValidator(createProjectSchema, err => {
  const nameIssue = err.issues.find(i => i.path[0] === 'name');
  if (nameIssue && nameIssue.code === 'too_big') {
    return 'Project name must be between 1 and 100 characters';
  }
  // For missing or empty fields or invalid url, match tests message
  return 'Name and website URL are required';
});

export const validateUpdateProjectName = makeValidator(
  updateProjectNameSchema,
  err => {
    const nameIssue = err.issues.find(i => i.path[0] === 'name');
    if (nameIssue && nameIssue.code === 'too_big') {
      return 'Project name must be between 1 and 100 characters';
    }
    return 'Project name is required';
  }
);
