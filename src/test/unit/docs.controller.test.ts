import { Request, Response } from 'express';
import { DocsController } from '../../modules/docs/docs.controller';
import { DocsService } from '../../modules/docs/docs.service';

// Mock the DocsService
jest.mock('../../modules/docs/docs.service');

describe('DocsController', () => {
  let docsController: DocsController;
  let mockDocsService: jest.Mocked<DocsService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock service
    mockDocsService = {
      getOpenApiSpec: jest.fn(),
    } as jest.Mocked<DocsService>;

    // Create controller with mocked service
    docsController = new DocsController(mockDocsService);

    // Create mock request and response
    mockRequest = {};
    mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };
  });

  describe('getOpenApiSpec', () => {
    it('should return OpenAPI spec successfully', () => {
      const swaggerSpec = {
        openapi: '3.0.0',
        info: {
          title: 'MD Site Monitor API',
          version: '1.0.0',
        },
        paths: {},
      };

      mockDocsService.getOpenApiSpec.mockReturnValue(swaggerSpec);

      docsController.getOpenApiSpec(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockDocsService.getOpenApiSpec).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/json'
      );
      expect(mockResponse.send).toHaveBeenCalledWith(swaggerSpec);
    });

    it('should handle service errors gracefully', () => {
      const error = new Error('Service error');
      mockDocsService.getOpenApiSpec.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        docsController.getOpenApiSpec(
          mockRequest as Request,
          mockResponse as Response
        );
      }).toThrow('Service error');

      expect(mockDocsService.getOpenApiSpec).toHaveBeenCalled();
    });
  });
});
