import { ProjectsService } from '@/modules/projects/projects.service';
import { CacheService } from '@/modules/core/cache/cache.service';
import { PrismaClient } from '@prisma/client';

// Mock DatabaseService, CacheService
jest.mock('../../modules/core/database/database.service', () => ({
  DatabaseService: {
    getInstance: jest.fn(),
  },
}));

jest.mock('../../modules/core/cache/cache.service', () => ({
  CacheService: {
    getInstance: jest.fn(),
  },
}));

jest.mock('../../modules/error/error.service', () => ({
  ErrorService: jest.fn().mockImplementation(() => ({
    createCustomError: jest.fn().mockImplementation((code, message, status) => {
      const error = new Error(message);
      (error as any).code = code;
      (error as any).status = status;
      return error;
    }),
    createNotFoundError: jest.fn().mockImplementation(message => {
      const error = new Error(message);
      (error as any).code = 'NOT_FOUND';
      return error;
    }),
    createValidationError: jest.fn().mockImplementation(message => {
      const error = new Error(message);
      (error as any).code = 'VALIDATION_ERROR';
      return error;
    }),
    logError: jest.fn(),
  })),
}));

describe('ProjectsService', () => {
  let projectsService: ProjectsService;
  let mockPrisma: any;
  let mockCacheService: any;

  beforeEach(() => {
    mockPrisma = {
      project: {
        count: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    mockCacheService = {
      invalidatePattern: jest.fn(),
    };

    const {
      DatabaseService,
    } = require('../../modules/core/database/database.service');
    const { CacheService } = require('../../modules/core/cache/cache.service');

    DatabaseService.getInstance.mockReturnValue(mockPrisma);
    CacheService.getInstance.mockReturnValue(mockCacheService);

    projectsService = new ProjectsService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const userId = 'user-id';
      const projectData = {
        name: 'Test Project',
        websiteUrl: 'https://example.com',
      };

      const user = {
        id: userId,
        email: 'test@example.com',
        fullName: 'Test User',
      };

      const createdProject = {
        id: 'project-id',
        name: projectData.name,
        websiteUrl: projectData.websiteUrl,
        userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.project.count.mockResolvedValue(2); // Less than 3 active projects
      mockPrisma.project.create.mockResolvedValue(createdProject);

      const result = await projectsService.createProject(userId, projectData);

      expect(result).toEqual({
        id: createdProject.id,
        name: createdProject.name,
        websiteUrl: createdProject.websiteUrl,
        isActive: createdProject.isActive,
        createdAt: createdProject.createdAt.toISOString(),
        updatedAt: createdProject.updatedAt.toISOString(),
      });
      expect(mockCacheService.invalidatePattern).toHaveBeenCalledWith(
        'monitoring_stats'
      );
    });

    it('should throw error if user not found', async () => {
      const userId = 'nonexistent-user';
      const projectData = {
        name: 'Test Project',
        websiteUrl: 'https://example.com',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        projectsService.createProject(userId, projectData)
      ).rejects.toThrow();
    });

    it('should throw error if user has max projects', async () => {
      const userId = 'user-id';
      const projectData = {
        name: 'Test Project',
        websiteUrl: 'https://example.com',
      };

      const user = {
        id: userId,
        email: 'test@example.com',
        fullName: 'Test User',
      };

      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.project.count.mockResolvedValue(3); // Max projects reached

      await expect(
        projectsService.createProject(userId, projectData)
      ).rejects.toThrow('User cannot have more than 3 active projects');
    });

    it('should throw validation error for invalid URL', async () => {
      const userId = 'user-id';
      const projectData = {
        name: 'Test Project',
        websiteUrl: 'not-a-url',
      } as any;

      mockPrisma.project.count.mockResolvedValue(0);

      await expect(
        projectsService.createProject(userId, projectData)
      ).rejects.toThrow('Invalid website URL');
    });
  });

  describe('getUserProjects', () => {
    it('should return user projects', async () => {
      const userId = 'user-id';
      const projects = [
        {
          id: 'project-1',
          name: 'Project 1',
          websiteUrl: 'https://example1.com',
          userId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'project-2',
          name: 'Project 2',
          websiteUrl: 'https://example2.com',
          userId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.project.findMany.mockResolvedValue(projects);

      const result = await projectsService.getUserProjects(userId);

      expect(result.projects).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.projects[0]).toEqual({
        id: projects[0]!.id,
        name: projects[0]!.name,
        websiteUrl: projects[0]!.websiteUrl,
        isActive: projects[0]!.isActive,
        createdAt: projects[0]!.createdAt.toISOString(),
        updatedAt: projects[0]!.updatedAt.toISOString(),
      });
    });
  });

  describe('getProjectById', () => {
    it('should return project by id', async () => {
      const userId = 'user-id';
      const projectId = 'project-id';
      const project = {
        id: projectId,
        name: 'Test Project',
        websiteUrl: 'https://example.com',
        userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findFirst.mockResolvedValue(project);

      const result = await projectsService.getProjectById(userId, projectId);

      expect(result).toEqual({
        id: project.id,
        name: project.name,
        websiteUrl: project.websiteUrl,
        isActive: project.isActive,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      });
    });

    it('should throw error if project not found', async () => {
      const userId = 'user-id';
      const projectId = 'nonexistent-project';

      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        projectsService.getProjectById(userId, projectId)
      ).rejects.toThrow('Project not found');
    });
  });

  describe('updateProjectName', () => {
    it('should update project name successfully', async () => {
      const userId = 'user-id';
      const projectId = 'project-id';
      const newName = 'Updated Project Name';

      const project = {
        id: projectId,
        name: 'Old Name',
        websiteUrl: 'https://example.com',
        userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedProject = {
        ...project,
        name: newName,
        updatedAt: new Date(),
      };

      mockPrisma.project.findFirst.mockResolvedValue(project);
      mockPrisma.project.update.mockResolvedValue(updatedProject);

      const result = await projectsService.updateProjectName(
        userId,
        projectId,
        newName
      );

      expect(result.name).toBe(newName);
    });

    it('should throw error if project not found for update', async () => {
      const userId = 'user-id';
      const projectId = 'project-id';

      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        projectsService.updateProjectName(userId, projectId, 'name')
      ).rejects.toThrow('Project not found');
    });
  });

  describe('deactivateProject', () => {
    it('should deactivate project successfully', async () => {
      const userId = 'user-id';
      const projectId = 'project-id';

      const project = {
        id: projectId,
        name: 'Test Project',
        websiteUrl: 'https://example.com',
        userId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.project.findFirst.mockResolvedValue(project);
      mockPrisma.project.update.mockResolvedValue({});

      await expect(
        projectsService.deactivateProject(userId, projectId)
      ).resolves.toBeUndefined();
      expect(mockCacheService.invalidatePattern).toHaveBeenCalledWith(
        'monitoring_stats'
      );
    });

    it('should throw error if project not found for deactivation', async () => {
      const userId = 'user-id';
      const projectId = 'project-id';
      mockPrisma.project.findFirst.mockResolvedValue(null);

      await expect(
        projectsService.deactivateProject(userId, projectId)
      ).rejects.toThrow('Project not found');
    });
  });
});
