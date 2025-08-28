import swaggerJsdoc from 'swagger-jsdoc';
import { authDocs, authSchemas } from '../auth/auth.docs';
import { apiInfoDocs, apiInfoSchemas } from '../api-info/api-info.docs';
import { errorDocs } from '../error/error.docs';
import { projectsDocs, projectsSchemas } from '../projects/projects.docs';
import {
  monitoringDocs,
  monitoringSchemas,
} from '../monitoring/monitoring.docs';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MD Site Monitor API',
      version: '1.0.0',
      description:
        'Backend API для системы авторизации и управления пользователями',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authorization',
        },
      },
      schemas: {
        ...errorDocs.components.schemas,
        ...authSchemas,
        ...projectsSchemas,
        ...monitoringSchemas,
        ...apiInfoSchemas,
      },
    },
    paths: {
      ...apiInfoDocs,
      ...authDocs,
      ...projectsDocs,
      ...monitoringDocs,
    },
  },
  apis: ['./src/**/*.ts'],
};

export const specs = swaggerJsdoc(options);
