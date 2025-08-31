// Автоматически сгенерированная документация для проектов
import {
  buildEndpoint,
  makeParam,
  ref,
  generateSchemaFromInterface,
} from '../docs/swagger.utils';
import {
  createProjectRequestExample,
  projectResponseExample,
  projectsListResponseExample,
} from './projects.contract';

// Генерация схем для Swagger (не используются, оставлены для будущего использования)
// const createProjectRequestSchema = generateSchemaFromInterface(
//   createProjectRequestExample,
//   ['name', 'websiteUrl']
// );
// const projectResponseSchema = generateSchemaFromInterface(
//   projectResponseExample
// );
// const projectsListResponseSchema = generateSchemaFromInterface(
//   projectsListResponseExample
// );

// Документация эндпоинтов
export const projectsDocs = {
  '/projects': {
    ...buildEndpoint('/projects', 'post', 'Create a new project', {
      tag: 'Projects',
      security: [{ bearerAuth: [] }],
      requestBody: { schema: ref('CreateProjectRequest'), required: true },
      responses: { '200': { schema: ref('ProjectResponse') } },
    }),
    ...buildEndpoint('/projects', 'get', 'Get user projects list', {
      tag: 'Projects',
      security: [{ bearerAuth: [] }],
      responses: { '200': { schema: ref('ProjectsListResponse') } },
    }),
  },

  '/projects/{projectId}': {
    ...buildEndpoint('/projects/{projectId}', 'get', 'Get project by ID', {
      tag: 'Projects',
      security: [{ bearerAuth: [] }],
      parameters: [makeParam('projectId', 'path', { type: 'string' }, true)],
      responses: { '200': { schema: ref('ProjectResponse') } },
    }),
    ...buildEndpoint('/projects/{projectId}', 'put', 'Update project name', {
      tag: 'Projects',
      security: [{ bearerAuth: [] }],
      parameters: [makeParam('projectId', 'path', { type: 'string' }, true)],
      requestBody: {
        required: true,
        schema: {
          type: 'object',
          required: ['name'],
          properties: { name: { type: 'string' } },
        },
      },
      responses: { '200': { schema: ref('ProjectResponse') } },
    }),
    ...buildEndpoint('/projects/{projectId}', 'delete', 'Deactivate project', {
      tag: 'Projects',
      security: [{ bearerAuth: [] }],
      parameters: [makeParam('projectId', 'path', { type: 'string' }, true)],
      responses: {
        '200': {
          schema: {
            type: 'object',
            properties: { message: { type: 'string' } },
          },
        },
      },
    }),
  },
};

// Схемы для Swagger
export const projectsSchemas = {
  CreateProjectRequest: generateSchemaFromInterface(
    createProjectRequestExample
  ),
  ProjectResponse: generateSchemaFromInterface(projectResponseExample),
  ProjectsListResponse: generateSchemaFromInterface(
    projectsListResponseExample
  ),
};
