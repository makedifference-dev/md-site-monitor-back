import type { OpenAPIV3 } from 'openapi-types';

/**
 * Генерирует JSON Schema из TypeScript интерфейса
 */
export function generateSchemaFromInterface<T>(
  example: T,
  requiredFields: string[] = []
): OpenAPIV3.SchemaObject {
  const schema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {},
    required: requiredFields,
    example,
  };

  // Анализируем пример для определения типов
  if (typeof example === 'object' && example !== null) {
    for (const [key, value] of Object.entries(
      example as Record<string, unknown>
    )) {
      const property = generatePropertySchema(value);
      if (property) {
        if (schema.properties) {
          schema.properties[key] = property;
        }
      }
    }
  }

  return schema;
}

/**
 * Генерирует схему для отдельного свойства
 */
function generatePropertySchema(
  value: unknown
): OpenAPIV3.SchemaObject | undefined {
  if (value === null) {
    return { type: 'string', nullable: true };
  }

  if (value === undefined) {
    return { type: 'string', nullable: true };
  }

  switch (typeof value) {
    case 'string':
      return { type: 'string', example: value };
    case 'number':
      return { type: 'number', example: value };
    case 'boolean':
      return { type: 'boolean', example: value };
    case 'object':
      if (Array.isArray(value)) {
        return {
          type: 'array',
          items:
            value.length > 0
              ? (generatePropertySchema(value[0]) as OpenAPIV3.SchemaObject)
              : { type: 'string' },
          example: value,
        };
      }
      if (value instanceof Date) {
        return {
          type: 'string',
          format: 'date-time',
          example: value.toISOString(),
        };
      }
      {
        // Рекурсивно обрабатываем объекты
        const objectSchema: OpenAPIV3.SchemaObject = {
          type: 'object',
          properties: {},
          example: value,
        };
        for (const [key, val] of Object.entries(value)) {
          const property = generatePropertySchema(val);
          if (property) {
            if (objectSchema.properties) {
              objectSchema.properties[key] = property;
            }
          }
        }
        return objectSchema;
      }
    default:
      return { type: 'string' };
  }
}

/**
 * Создает базовую схему ответа API
 */
export function createApiResponseSchema<_T>(
  dataSchema: OpenAPIV3.SchemaObject,
  description: string = 'Successful response'
): OpenAPIV3.SchemaObject {
  return {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Response message',
        example: 'Operation completed successfully',
      },
      data: {
        ...dataSchema,
        description: 'Response data',
      },
    },
    required: ['message'],
    description,
  };
}

/**
 * Создает схему для ошибки API
 */
export function createErrorSchema(
  errorCode: string,
  description: string = 'Error response'
): OpenAPIV3.SchemaObject {
  return {
    type: 'object',
    properties: {
      error: {
        type: 'string',
        description: 'Error code',
        example: errorCode,
      },
      message: {
        type: 'string',
        description: 'Error message',
        example: 'An error occurred',
      },
      statusCode: {
        type: 'number',
        description: 'HTTP status code',
        example: 400,
      },
      details: {
        type: 'object',
        description: 'Additional error details',
        additionalProperties: true,
      },
    },
    required: ['error', 'message'],
    description,
  };
}

/**
 * Генерирует документацию для эндпоинта
 */
// Reuse exported HttpMethod below

export function generateEndpointDoc(
  path: string,
  method: string,
  summary: string,
  description?: string
): Partial<Record<HttpMethod, OpenAPIV3.OperationObject>> {
  const operation: OpenAPIV3.OperationObject = {
    summary,
    description,
    tags: [path.split('/')[1] ?? 'default'],
    responses: {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
      '400': {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
      '401': {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
      '500': {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
    },
  };

  const httpMethod = (method || 'get').toLowerCase() as HttpMethod;
  return { [httpMethod]: operation };
}

/**
 * Создает схему для пагинированного ответа
 */
export function createPaginatedResponseSchema<_T>(
  itemSchema: OpenAPIV3.SchemaObject,
  description: string = 'Paginated response'
): OpenAPIV3.SchemaObject {
  return {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Response message',
        example: 'Data retrieved successfully',
      },
      data: {
        type: 'array',
        items: itemSchema,
        description: 'Array of items',
      },
      pagination: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Number of items per page',
            example: 10,
          },
          offset: {
            type: 'number',
            description: 'Number of items skipped',
            example: 0,
          },
          hasMore: {
            type: 'boolean',
            description: 'Whether there are more items',
            example: true,
          },
        },
        required: ['limit', 'offset', 'hasMore'],
      },
    },
    required: ['message', 'data'],
    description,
  };
}

// =============== Extended helpers for endpoint docs ===============

export type HttpMethod =
  | 'get'
  | 'post'
  | 'put'
  | 'delete'
  | 'patch'
  | 'options'
  | 'head'
  | 'trace';

export function ref(name: string): OpenAPIV3.ReferenceObject {
  return { $ref: `#/components/schemas/${name}` };
}

export function makeParam(
  name: string,
  where: 'path' | 'query' | 'header' | 'cookie',
  schema: OpenAPIV3.SchemaObject,
  required: boolean,
  description?: string
): OpenAPIV3.ParameterObject {
  return { name, in: where, required, description, schema };
}

export interface EndpointOptions {
  description?: string;
  tag?: string;
  requestBody?: {
    schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
    required?: boolean;
  };
  parameters?: Array<OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject>;
  responses?: Record<
    string,
    {
      description?: string;
      schema?: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
    }
  >;
  security?: OpenAPIV3.SecurityRequirementObject[];
}

export function buildEndpoint(
  path: string,
  method: HttpMethod,
  summary: string,
  options: EndpointOptions = {}
): Partial<Record<HttpMethod, OpenAPIV3.OperationObject>> {
  const operation: OpenAPIV3.OperationObject = {
    summary,
    description: options.description,
    tags: [options.tag ?? path.split('/')[1] ?? 'default'],
    parameters: options.parameters,
    security: options.security,
    responses: {},
  };

  if (options.requestBody) {
    operation.requestBody = {
      required: Boolean(options.requestBody.required),
      content: {
        'application/json': {
          schema: options.requestBody.schema,
        },
      },
    };
  }

  const responses: OpenAPIV3.ResponsesObject = {};
  // Success 200 by default
  responses['200'] = {
    description:
      options.responses?.['200']?.description ?? 'Successful response',
    content: options.responses?.['200']?.schema
      ? {
          'application/json': {
            schema: options.responses['200'].schema,
          },
        }
      : undefined,
  };
  // Merge custom statuses
  for (const [status, meta] of Object.entries(options.responses ?? {})) {
    if (status === '200') {
      continue;
    }
    responses[status] = {
      description: meta.description ?? 'Response',
      content: meta.schema
        ? {
            'application/json': {
              schema: meta.schema,
            },
          }
        : undefined,
    };
  }

  // Add common error responses if absent
  responses['400'] =
    responses['400'] ??
    ({
      description: 'Bad request',
      content: {
        'application/json': { schema: createErrorSchema('BAD_REQUEST') },
      },
    } as OpenAPIV3.ResponseObject);
  responses['401'] =
    responses['401'] ??
    ({
      description: 'Unauthorized',
      content: {
        'application/json': { schema: createErrorSchema('UNAUTHORIZED') },
      },
    } as OpenAPIV3.ResponseObject);
  responses['500'] =
    responses['500'] ??
    ({
      description: 'Internal server error',
      content: {
        'application/json': { schema: createErrorSchema('INTERNAL_ERROR') },
      },
    } as OpenAPIV3.ResponseObject);

  operation.responses = responses;

  return { [method]: operation };
}
