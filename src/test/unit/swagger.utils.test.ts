/* eslint-disable no-console, no-undef */
import {
  generateSchemaFromInterface,
  createApiResponseSchema,
  createErrorSchema,
  generateEndpointDoc,
  createPaginatedResponseSchema,
} from '../../modules/docs/swagger.utils';
import { OpenAPIV3 } from 'openapi-types';

describe('Swagger Utils', () => {
  describe('generateSchemaFromInterface', () => {
    it('should generate schema for simple object', () => {
      const example = {
        name: 'Test User',
        age: 25,
        isActive: true,
      };

      const schema = generateSchemaFromInterface(example);

      expect(schema).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Test User' },
          age: { type: 'number', example: 25 },
          isActive: { type: 'boolean', example: true },
        },
        required: [],
        example,
      });
    });

    it('should generate schema with required fields', () => {
      const example = {
        name: 'Test User',
        age: 25,
        isActive: true,
      };

      const schema = generateSchemaFromInterface(example, ['name', 'age']);

      expect(schema).toEqual({
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Test User' },
          age: { type: 'number', example: 25 },
          isActive: { type: 'boolean', example: true },
        },
        required: ['name', 'age'],
        example,
      });
    });

    it('should handle null values', () => {
      const example = {
        name: 'Test User',
        description: null,
      };

      const schema = generateSchemaFromInterface(example);

      expect(schema.properties!.description).toEqual({
        type: 'string',
        nullable: true,
      });
    });

    it('should handle undefined values', () => {
      const example = {
        name: 'Test User',
        description: undefined,
      };

      const schema = generateSchemaFromInterface(example);

      expect(schema.properties!.description).toEqual({
        type: 'string',
        nullable: true,
      });
    });

    it('should handle array values', () => {
      const example = {
        name: 'Test User',
        tags: ['tag1', 'tag2'],
      };

      const schema = generateSchemaFromInterface(example);

      expect(schema.properties!.tags).toEqual({
        type: 'array',
        items: { type: 'string', example: 'tag1' },
        example: ['tag1', 'tag2'],
      });
    });

    it('should handle empty arrays', () => {
      const example = {
        name: 'Test User',
        tags: [],
      };

      const schema = generateSchemaFromInterface(example);

      expect(schema.properties!.tags).toEqual({
        type: 'array',
        items: { type: 'string' },
        example: [],
      });
    });

    it('should handle Date objects', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const example = {
        name: 'Test User',
        createdAt: date,
      };

      const schema = generateSchemaFromInterface(example);

      expect(schema.properties!.createdAt).toEqual({
        type: 'string',
        format: 'date-time',
        example: date.toISOString(),
      });
    });

    it('should handle nested objects', () => {
      const example = {
        name: 'Test User',
        address: {
          street: '123 Main St',
          city: 'New York',
        },
      };

      const schema = generateSchemaFromInterface(example);

      expect(schema.properties!.address).toEqual({
        type: 'object',
        properties: {
          street: { type: 'string', example: '123 Main St' },
          city: { type: 'string', example: 'New York' },
        },
        example: {
          street: '123 Main St',
          city: 'New York',
        },
      });
    });

    it('should handle complex nested structures', () => {
      const example = {
        name: 'Test User',
        posts: [
          {
            title: 'Post 1',
            content: 'Content 1',
            tags: ['tag1', 'tag2'],
          },
        ],
      };

      const schema = generateSchemaFromInterface(example);

      expect(schema.properties!.posts).toEqual({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Post 1' },
            content: { type: 'string', example: 'Content 1' },
            tags: {
              type: 'array',
              items: { type: 'string', example: 'tag1' },
              example: ['tag1', 'tag2'],
            },
          },
          example: {
            title: 'Post 1',
            content: 'Content 1',
            tags: ['tag1', 'tag2'],
          },
        },
        example: [
          {
            title: 'Post 1',
            content: 'Content 1',
            tags: ['tag1', 'tag2'],
          },
        ],
      });
    });

    it('should handle non-object values', () => {
      const schema = generateSchemaFromInterface('string value');

      expect(schema).toEqual({
        type: 'object',
        properties: {},
        required: [],
        example: 'string value',
      });
    });
  });

  describe('createApiResponseSchema', () => {
    it('should create API response schema', () => {
      const dataSchema: OpenAPIV3.SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      };

      const responseSchema = createApiResponseSchema(
        dataSchema,
        'User created successfully'
      );

      expect(responseSchema).toEqual({
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
        description: 'User created successfully',
      });
    });

    it('should use default description', () => {
      const dataSchema: OpenAPIV3.SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      };

      const responseSchema = createApiResponseSchema(dataSchema);

      expect(responseSchema.description).toBe('Successful response');
    });
  });

  describe('createErrorSchema', () => {
    it('should create error schema', () => {
      const errorSchema = createErrorSchema(
        'VALIDATION_ERROR',
        'Validation failed'
      );

      expect(errorSchema).toEqual({
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error code',
            example: 'VALIDATION_ERROR',
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
        description: 'Validation failed',
      });
    });

    it('should use default description', () => {
      const errorSchema = createErrorSchema('NOT_FOUND');

      expect(errorSchema.description).toBe('Error response');
    });
  });

  describe('generateEndpointDoc', () => {
    it('should generate endpoint documentation', () => {
      const endpointDoc = generateEndpointDoc(
        '/api/users',
        'post',
        'Create new user',
        'Creates a new user in the system'
      );

      expect(endpointDoc).toEqual({
        summary: 'Create new user',
        description: 'Creates a new user in the system',
        tags: ['api'],
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
      });
    });

    it('should use default tag when path is root', () => {
      const endpointDoc = generateEndpointDoc('/', 'get', 'Health check');

      expect(endpointDoc.tags).toEqual(['']);
    });

    it('should extract tag from path', () => {
      const endpointDoc = generateEndpointDoc(
        '/auth/login',
        'post',
        'User login'
      );

      expect(endpointDoc.tags).toEqual(['auth']);
    });
  });

  describe('createPaginatedResponseSchema', () => {
    it('should create paginated response schema', () => {
      const itemSchema: OpenAPIV3.SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      };

      const paginatedSchema = createPaginatedResponseSchema(
        itemSchema,
        'Users list'
      );

      expect(paginatedSchema).toEqual({
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
        description: 'Users list',
      });
    });

    it('should use default description', () => {
      const itemSchema: OpenAPIV3.SchemaObject = {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
      };

      const paginatedSchema = createPaginatedResponseSchema(itemSchema);

      expect(paginatedSchema.description).toBe('Paginated response');
    });
  });
});
