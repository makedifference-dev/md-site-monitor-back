import { PrismaClient, type Project } from '@prisma/client';
import {
  CreateProjectRequest,
  ProjectResponse,
  ProjectsListResponse,
} from './projects.types';
import { ErrorService } from '../error/error.service';
import { DatabaseService } from '../core/database/database.service';
import { CacheService } from '../core/cache/cache.service';

export class ProjectsService {
  private prisma: PrismaClient;
  private errorService: ErrorService;
  private cacheService: CacheService;

  constructor(errorService?: ErrorService) {
    this.prisma = DatabaseService.getInstance();
    this.errorService = errorService ?? new ErrorService();
    this.cacheService = CacheService.getInstance();
  }

  async createProject(
    userId: string,
    data: CreateProjectRequest
  ): Promise<ProjectResponse> {
    // Проверяем количество проектов у пользователя
    const userProjectsCount = await this.prisma.project.count({
      where: { userId, isActive: true },
    });

    if (userProjectsCount >= 3) {
      throw this.errorService.createCustomError(
        'PROJECT_LIMIT_EXCEEDED',
        'User cannot have more than 3 active projects',
        400
      );
    }

    // Проверяем, что URL валидный
    if (!this.isValidUrl(data.websiteUrl)) {
      throw this.errorService.createValidationError('Invalid website URL');
    }

    // Создаем проект
    const project = await this.prisma.project.create({
      data: {
        name: data.name,
        websiteUrl: data.websiteUrl,
        userId,
      },
    });

    // Инвалидируем кэш мониторинга при создании проекта
    this.cacheService.invalidatePattern('monitoring_stats');

    return this.mapProjectToResponse(project);
  }

  async getUserProjects(userId: string): Promise<ProjectsListResponse> {
    const projects = await this.prisma.project.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      projects: projects.map(project => this.mapProjectToResponse(project)),
      total: projects.length,
    };
  }

  async getProjectById(
    userId: string,
    projectId: string
  ): Promise<ProjectResponse> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId, isActive: true },
    });

    if (!project) {
      throw this.errorService.createNotFoundError('Project not found');
    }

    return this.mapProjectToResponse(project);
  }

  async updateProjectName(
    userId: string,
    projectId: string,
    name: string
  ): Promise<ProjectResponse> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId, isActive: true },
    });

    if (!project) {
      throw this.errorService.createNotFoundError('Project not found');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: { name },
    });

    // Инвалидируем кэш проекта при обновлении
    this.cacheService.invalidatePattern(`project_history_${projectId}_*`);

    return this.mapProjectToResponse(updatedProject);
  }

  async deactivateProject(userId: string, projectId: string): Promise<void> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, userId, isActive: true },
    });

    if (!project) {
      throw this.errorService.createNotFoundError('Project not found');
    }

    await this.prisma.project.update({
      where: { id: projectId },
      data: { isActive: false },
    });

    // Инвалидируем кэш при деактивации проекта
    this.cacheService.invalidatePattern('monitoring_stats');
    this.cacheService.invalidatePattern(`project_history_${projectId}_*`);
  }

  private mapProjectToResponse(project: Project): ProjectResponse {
    return {
      id: project.id,
      name: project.name,
      websiteUrl: project.websiteUrl,
      isActive: project.isActive,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
