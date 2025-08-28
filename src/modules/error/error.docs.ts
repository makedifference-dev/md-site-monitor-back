// Автоматически сгенерированная документация для Error модуля
import { generateSchemaFromInterface } from '../docs/swagger.utils';
import {
  validationErrorExample,
  authErrorExample,
  notFoundErrorExample,
  internalErrorExample,
  databaseErrorExample,
} from './error.types';

// Генерируем схемы из примеров данных
const validationErrorSchema = generateSchemaFromInterface(
  validationErrorExample
);
const authErrorSchema = generateSchemaFromInterface(authErrorExample);
const notFoundErrorSchema = generateSchemaFromInterface(notFoundErrorExample);
const internalErrorSchema = generateSchemaFromInterface(internalErrorExample);
const databaseErrorSchema = generateSchemaFromInterface(databaseErrorExample);

export const errorDocs = {
  // Схемы ошибок для использования в других модулях
  components: {
    schemas: {
      ValidationError: validationErrorSchema,
      AuthError: authErrorSchema,
      NotFoundError: notFoundErrorSchema,
      InternalError: internalErrorSchema,
      DatabaseError: databaseErrorSchema,
    },
  },
};
