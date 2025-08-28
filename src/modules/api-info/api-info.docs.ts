// Автоматически сгенерированная документация для API Info
import {
  generateSchemaFromInterface,
  generateEndpointDoc,
} from '../docs/swagger.utils';
import { rootInfoResponseExample } from './api-info.types';

// Документация эндпоинтов
export const apiInfoDocs = {
  '/': generateEndpointDoc('/', 'get', 'Get API information', 'API Info'),
};

// Схемы для Swagger
export const apiInfoSchemas = {
  RootInfoResponse: generateSchemaFromInterface(rootInfoResponseExample),
};
