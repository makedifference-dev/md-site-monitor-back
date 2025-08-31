// Автоматически сгенерированная документация для API Info
import {
  buildEndpoint,
  ref,
  generateSchemaFromInterface,
} from '../docs/swagger.utils';
import { rootInfoResponseExample } from './api-info.contract';

// Документация эндпоинтов
export const apiInfoDocs = {
  '/': buildEndpoint('/', 'get', 'Get API information', {
    tag: 'root',
    responses: {
      '200': {
        schema: ref('RootInfoResponse'),
        description: 'Root information',
      },
    },
  }),
};

// Схемы для Swagger
export const apiInfoSchemas = {
  RootInfoResponse: generateSchemaFromInterface(rootInfoResponseExample),
};
