import { Request, Response } from 'express';
import { ApiInfoController } from '../../modules/api-info/api-info.controller';
import { ApiInfoService } from '../../modules/api-info/api-info.service';

// Mock the ApiInfoService
jest.mock('../../modules/api-info/api-info.service');

describe('ApiInfoController', () => {
  let apiInfoController: ApiInfoController;
  let mockApiInfoService: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock service
    mockApiInfoService = {
      getRootInfo: jest.fn(),
    };

    // Create controller with mocked service
    apiInfoController = new ApiInfoController(mockApiInfoService);

    // Create mock request and response
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
    };
  });

  describe('getRoot', () => {
    it('should return root info successfully', () => {
      const apiInfo = {
        message: 'MD Site Monitor Backend API',
        status: 'running',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 3600,
        environment: 'test',
        endpoints: {
          docs: '/api-docs',
          spec: '/api-docs/json',
        },
      };

      mockApiInfoService.getRootInfo.mockReturnValue(apiInfo);

      apiInfoController.getRoot(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockApiInfoService.getRootInfo).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(apiInfo);
    });

    it('should handle service errors gracefully', () => {
      const error = new Error('Service error');
      mockApiInfoService.getRootInfo.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        apiInfoController.getRoot(
          mockRequest as Request,
          mockResponse as Response
        );
      }).toThrow('Service error');

      expect(mockApiInfoService.getRootInfo).toHaveBeenCalled();
    });
  });
});
