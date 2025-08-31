import {
  generateSchemaFromInterface,
  createApiResponseSchema,
  createErrorSchema,
  generateEndpointDoc,
  createPaginatedResponseSchema,
} from '../swagger.utils';
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

    it('should handle default branch types (e.g., function)', () => {
      const example = {
        handler: function noop() {
          /* empty */
        },
      } as any;

      const schema = generateSchemaFromInterface(example);

      expect(schema.properties!.handler).toEqual({ type: 'string' });
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

      expect(Object.keys(endpointDoc)).toEqual(['post']);
      const op = (endpointDoc as any).post;
      expect(op).toEqual({
        summary: 'Create new user',
        description: 'Creates a new user in the system',
        tags: ['api'],
        responses: expect.any(Object),
      });
    });

    it('should use default tag when path is root', () => {
      const endpointDoc = generateEndpointDoc('/', 'get', 'Health check');
      const op = (endpointDoc as any).get;
      expect(op.tags).toEqual(['']);
    });

    it('should extract tag from path', () => {
      const endpointDoc = generateEndpointDoc(
        '/auth/login',
        'post',
        'User login'
      );
      const op = (endpointDoc as any).post;
      expect(op.tags).toEqual(['auth']);
    });

    it('should use default tag when path is empty', () => {
      const endpointDoc = generateEndpointDoc('', 'get', 'Empty');
      const op = (endpointDoc as any).get;
      expect(op.tags).toEqual(['default']);
    });

    it('should default method to get when empty', () => {
      const endpointDoc = generateEndpointDoc('/status', '' as any, 'Status');
      expect(Object.keys(endpointDoc)).toEqual(['get']);
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

  describe('extended helpers', () => {
    const { ref, makeParam, buildEndpoint } = require('../swagger.utils');

    it('ref should build a component reference', () => {
      expect(ref('MySchema')).toEqual({ $ref: '#/components/schemas/MySchema' });
    });

    it('makeParam should create parameter object', () => {
      const p = makeParam('projectId', 'path', { type: 'string' }, true, 'Project ID');
      expect(p).toEqual({
        name: 'projectId',
        in: 'path',
        required: true,
        description: 'Project ID',
        schema: { type: 'string' },
      });
    });

    it('buildEndpoint should compose an operation with schemas', () => {
      const ep = buildEndpoint('/auth/login', 'post', 'Login', {
        tag: 'Auth',
        requestBody: { schema: { type: 'object' }, required: true },
        parameters: [makeParam('x-trace', 'header', { type: 'string' }, false)],
        responses: {
          '200': { schema: { type: 'object' }, description: 'OK' },
          '422': { schema: { type: 'object' }, description: 'Unprocessable' },
        },
        security: [{ bearerAuth: [] }],
      });

      expect(Object.keys(ep)).toEqual(['post']);
      const op = ep.post;
      expect(op.summary).toBe('Login');
      expect(op.tags).toEqual(['Auth']);
      expect(op.requestBody).toBeDefined();
      expect(op.parameters).toHaveLength(1);
      expect(op.security).toEqual([{ bearerAuth: [] }]);
      expect(op.responses['200']).toBeDefined();
      expect(op.responses['400']).toBeDefined();
      expect(op.responses['401']).toBeDefined();
      expect(op.responses['500']).toBeDefined();
      expect(op.responses['422']).toBeDefined();
    });

    it('buildEndpoint should handle missing body and schema', () => {
      const ep = buildEndpoint('/status', 'get', 'Status');
      const op = ep.get;
      expect(op.requestBody).toBeUndefined();
      // default tag extracted from path
      expect(op.tags).toEqual(['status']);
      // 200 present with no content schema
      expect(op.responses['200']).toBeDefined();
      expect((op.responses['200']).content).toBeUndefined();
      // default errors present
      expect(op.responses['400']).toBeDefined();
      expect(op.responses['401']).toBeDefined();
      expect(op.responses['500']).toBeDefined();
    });

    it('buildEndpoint should fallback default tag when path empty', () => {
      const ep = buildEndpoint('', 'get', 'Empty');
      expect(ep.get.tags).toEqual(['default']);
    });

    it('buildEndpoint should allow response without schema', () => {
      const ep = buildEndpoint('/x', 'get', 'X', {
        responses: { '422': { description: 'Unprocessable' } },
      });
      const r = ep.get.responses['422'];
      expect(r.description).toBe('Unprocessable');
      expect(r.content).toBeUndefined();
    });

    it('buildEndpoint should keep custom 400 response', () => {
      const ep = buildEndpoint('/y', 'get', 'Y', {
        responses: { '400': { description: 'Custom Bad Request' } },
      });
      const r400 = ep.get.responses['400'];
      expect(r400.description).toBe('Custom Bad Request');
    });

    it('buildEndpoint should default description when missing', () => {
      const ep = buildEndpoint('/z', 'get', 'Z', { responses: { '418': {} as any } });
      const r = ep.get.responses['418'];
      expect(r.description).toBe('Response');
    });
  });
});
