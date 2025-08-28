// Автоматически сгенерированная документация для проектов
import {
  generateSchemaFromInterface,
  generateEndpointDoc,
} from '../docs/swagger.utils';
import {
  createProjectRequestExample,
  projectResponseExample,
  projectsListResponseExample,
} from './projects.types';

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
    ...generateEndpointDoc(
      '/projects',
      'post',
      'Create a new project',
      'Projects'
    ),
    ...generateEndpointDoc(
      '/projects',
      'get',
      'Get user projects list',
      'Projects'
    ),
  },

  '/projects/{projectId}': {
    ...generateEndpointDoc(
      '/projects/{projectId}',
      'get',
      'Get project by ID',
      'Projects'
    ),
    ...generateEndpointDoc(
      '/projects/{projectId}',
      'put',
      'Update project name',
      'Projects'
    ),
    ...generateEndpointDoc(
      '/projects/{projectId}',
      'delete',
      'Deactivate project',
      'Projects'
    ),
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
