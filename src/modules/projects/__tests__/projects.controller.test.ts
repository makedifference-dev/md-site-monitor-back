import { Request, Response } from 'express';
import { ProjectsController } from '@/modules/projects/projects.controller';
import { ProjectsService } from '@/modules/projects/projects.service';
import { ErrorService } from '@/modules/error/error.service';

jest.mock('../../modules/projects/projects.service');
jest.mock('../../modules/error/error.service');

describe('ProjectsController', () => {
  let projectsController: ProjectsController;
  let mockProjectsService: jest.Mocked<ProjectsService>;
  let mockErrorService: jest.Mocked<ErrorService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockProjectsService = {
      createProject: jest.fn(),
      getUserProjects: jest.fn(),
      getProjectById: jest.fn(),
      updateProjectName: jest.fn(),
      deactivateProject: jest.fn(),
    } as any;

    mockErrorService = {
      createValidationError: jest.fn(),
      createNotFoundError: jest.fn(),
      handleUnknownError: jest.fn(),
    } as any;

    projectsController = new ProjectsController(
      mockProjectsService,
      mockErrorService
    );

    mockRequest = {
      user: {
        id: 'user123',
        email: 'test@example.com',
        role: 'USER' as const,
        isActive: true,
        fullName: 'Test User',
        phone: '+1234567890',
        telegramId: null,
        telegramUsername: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      body: {},
      params: {},
    } as any;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const projectData = {
        name: 'Test Project',
        websiteUrl: 'https://example.com',
      };

      const createdProject = {
        id: 'project123',
        name: projectData.name,
        websiteUrl: projectData.websiteUrl,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRequest.body = projectData;
      mockProjectsService.createProject.mockResolvedValue(createdProject);

      await projectsController.createProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockProjectsService.createProject).toHaveBeenCalledWith(
        'user123',
        projectData
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Project created successfully',
        data: createdProject,
      });
    });

    it('should handle missing name and websiteUrl', async () => {
      const projectData = {};

      const validationError = {
        error: 'VALIDATION_ERROR' as const,
        message: 'Name and website URL are required',
        statusCode: 400,
      };

      mockRequest.body = projectData;
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await projectsController.createProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Name and website URL are required'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });

    it('should handle missing name', async () => {
      const projectData = {
        websiteUrl: 'https://example.com',
      };

      const validationError = {
        error: 'VALIDATION_ERROR' as const,
        message: 'Name and website URL are required',
        statusCode: 400,
      };

      mockRequest.body = projectData;
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await projectsController.createProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Name and website URL are required'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });

    it('should handle missing websiteUrl', async () => {
      const projectData = {
        name: 'Test Project',
      };

      const validationError = {
        error: 'VALIDATION_ERROR' as const,
        message: 'Name and website URL are required',
        statusCode: 400,
      };

      mockRequest.body = projectData;
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await projectsController.createProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Name and website URL are required'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });

    it('should handle invalid name length (too short)', async () => {
      const projectData = {
        name: '', // Too short
        websiteUrl: 'https://example.com',
      };

      const validationError = {
        error: 'VALIDATION_ERROR' as const,
        message: 'Name and website URL are required',
        statusCode: 400,
      };

      mockRequest.body = projectData;
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await projectsController.createProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Name and website URL are required'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });

    it('should handle invalid name length (too long)', async () => {
      const projectData = {
        name: 'A'.repeat(101), // Too long
        websiteUrl: 'https://example.com',
      };

      const validationError = {
        error: 'VALIDATION_ERROR' as const,
        message: 'Project name must be between 1 and 100 characters',
        statusCode: 400,
      };

      mockRequest.body = projectData;
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await projectsController.createProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Project name must be between 1 and 100 characters'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });

    it('should handle service error', async () => {
      const projectData = {
        name: 'Test Project',
        websiteUrl: 'https://example.com',
      };

      const error = new Error('Service error');
      mockRequest.body = projectData;
      mockProjectsService.createProject.mockRejectedValue(error);

      await expect(
        projectsController.createProject(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Service error');
    });
  });

  describe('getUserProjects', () => {
    it('should return user projects successfully', async () => {
      const projects = {
        projects: [
          {
            id: 'project1',
            name: 'Project 1',
            websiteUrl: 'https://example1.com',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'project2',
            name: 'Project 2',
            websiteUrl: 'https://example2.com',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 2,
      };

      mockProjectsService.getUserProjects.mockResolvedValue(projects);

      await projectsController.getUserProjects(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockProjectsService.getUserProjects).toHaveBeenCalledWith(
        'user123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User projects',
        data: projects,
      });
    });

    it('should handle service error', async () => {
      const error = new Error('Service error');
      mockProjectsService.getUserProjects.mockRejectedValue(error);

      await expect(
        projectsController.getUserProjects(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Service error');
    });
  });

  describe('getProjectById', () => {
    it('should return project by ID successfully', async () => {
      const projectId = 'project123';
      const project = {
        id: projectId,
        name: 'Test Project',
        websiteUrl: 'https://example.com',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRequest.params = { projectId };
      mockProjectsService.getProjectById.mockResolvedValue(project);

      await projectsController.getProjectById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockProjectsService.getProjectById).toHaveBeenCalledWith(
        'user123',
        projectId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Project details',
        data: project,
      });
    });

    it('should handle missing project ID', async () => {
      const validationError = {
        error: 'VALIDATION_ERROR' as const,
        message: 'Project ID is required',
        statusCode: 400,
      };

      mockRequest.params = {};
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await projectsController.getProjectById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Project ID is required'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });

    it('should handle service error', async () => {
      const projectId = 'project123';
      const error = new Error('Service error');

      mockRequest.params = { projectId };
      mockProjectsService.getProjectById.mockRejectedValue(error);

      await expect(
        projectsController.getProjectById(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Service error');
    });
  });

  describe('updateProjectName', () => {
    it('should update project name successfully', async () => {
      const projectId = 'project123';
      const updateData = { name: 'Updated Project Name' };
      const updatedProject = {
        id: projectId,
        name: updateData.name,
        websiteUrl: 'https://example.com',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      mockRequest.params = { projectId };
      mockRequest.body = updateData;
      mockProjectsService.updateProjectName.mockResolvedValue(updatedProject);

      await projectsController.updateProjectName(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockProjectsService.updateProjectName).toHaveBeenCalledWith(
        'user123',
        projectId,
        updateData.name
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Project name updated successfully',
        data: updatedProject,
      });
    });

    it('should handle missing project ID', async () => {
      const updateData = { name: 'Updated Project Name' };
      const validationError = {
        error: 'VALIDATION_ERROR' as const,
        message: 'Project ID is required',
        statusCode: 400,
      };

      mockRequest.params = {};
      mockRequest.body = updateData;
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await projectsController.updateProjectName(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Project ID is required'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });

    it('should handle missing name', async () => {
      const projectId = 'project123';
      const updateData = {};
      const validationError = {
        error: 'VALIDATION_ERROR' as const,
        message: 'Project name is required',
        statusCode: 400,
      };

      mockRequest.params = { projectId };
      mockRequest.body = updateData;
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await projectsController.updateProjectName(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Project name is required'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });

    it('should handle invalid name length (too short)', async () => {
      const projectId = 'project123';
      const updateData = { name: '' }; // Too short
      const validationError = {
        error: 'VALIDATION_ERROR' as const,
        message: 'Project name is required',
        statusCode: 400,
      };

      mockRequest.params = { projectId };
      mockRequest.body = updateData;
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await projectsController.updateProjectName(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Project name is required'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });

    it('should handle invalid name length (too long)', async () => {
      const projectId = 'project123';
      const updateData = { name: 'A'.repeat(101) }; // Too long
      const validationError = {
        error: 'VALIDATION_ERROR' as const,
        message: 'Project name must be between 1 and 100 characters',
        statusCode: 400,
      };

      mockRequest.params = { projectId };
      mockRequest.body = updateData;
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await projectsController.updateProjectName(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Project name must be between 1 and 100 characters'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });

    it('should handle service error', async () => {
      const projectId = 'project123';
      const updateData = { name: 'Updated Project Name' };
      const error = new Error('Service error');

      mockRequest.params = { projectId };
      mockRequest.body = updateData;
      mockProjectsService.updateProjectName.mockRejectedValue(error);

      await expect(
        projectsController.updateProjectName(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Service error');
    });
  });

  describe('deactivateProject', () => {
    it('should deactivate project successfully', async () => {
      const projectId = 'project123';

      mockRequest.params = { projectId };
      mockProjectsService.deactivateProject.mockResolvedValue(undefined);

      await projectsController.deactivateProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockProjectsService.deactivateProject).toHaveBeenCalledWith(
        'user123',
        projectId
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Project deactivated successfully',
      });
    });

    it('should handle missing project ID', async () => {
      const validationError = {
        error: 'VALIDATION_ERROR' as const,
        message: 'Project ID is required',
        statusCode: 400,
      };

      mockRequest.params = {};
      mockErrorService.createValidationError.mockReturnValue(validationError);

      await projectsController.deactivateProject(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockErrorService.createValidationError).toHaveBeenCalledWith(
        'Project ID is required'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(validationError);
    });

    it('should handle service error', async () => {
      const projectId = 'project123';
      const error = new Error('Service error');

      mockRequest.params = { projectId };
      mockProjectsService.deactivateProject.mockRejectedValue(error);

      await expect(
        projectsController.deactivateProject(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Service error');
    });
  });
});
