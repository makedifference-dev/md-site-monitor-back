import { Request, Response } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectRequest } from './projects.types';
import { ErrorService } from '../error/error.service';

export class ProjectsController {
  private projectsService: ProjectsService;
  private errorService: ErrorService;

  constructor(projectsService: ProjectsService, errorService: ErrorService) {
    this.projectsService = projectsService;
    this.errorService = errorService;
  }

  async createProject(req: Request, res: Response): Promise<void> {
    const user = req.user as { id: string }; // Пользователь уже проверен middleware
    const { name, websiteUrl } = req.body as CreateProjectRequest;

    if (!name || !websiteUrl) {
      const error = this.errorService.createValidationError(
        'Name and website URL are required'
      );
      res.status(400).json(error);
      return;
    }

    if (name.length < 1 || name.length > 100) {
      const error = this.errorService.createValidationError(
        'Project name must be between 1 and 100 characters'
      );
      res.status(400).json(error);
      return;
    }

    const project = await this.projectsService.createProject(user.id, {
      name,
      websiteUrl,
    });
    res
      .status(201)
      .json({ message: 'Project created successfully', data: project });
  }

  async getUserProjects(req: Request, res: Response): Promise<void> {
    const user = req.user as { id: string }; // Пользователь уже проверен middleware
    const projects = await this.projectsService.getUserProjects(user.id);
    res.status(200).json({ message: 'User projects', data: projects });
  }

  async getProjectById(req: Request, res: Response): Promise<void> {
    const user = req.user as { id: string }; // Пользователь уже проверен middleware
    const { projectId } = req.params;

    if (!projectId) {
      const error = this.errorService.createValidationError(
        'Project ID is required'
      );
      res.status(400).json(error);
      return;
    }

    const project = await this.projectsService.getProjectById(
      user.id,
      projectId
    );
    res.status(200).json({ message: 'Project details', data: project });
  }

  async updateProjectName(req: Request, res: Response): Promise<void> {
    const user = req.user as { id: string }; // Пользователь уже проверен middleware
    const { projectId } = req.params;
    const { name } = req.body as { name: string };

    if (!projectId) {
      const error = this.errorService.createValidationError(
        'Project ID is required'
      );
      res.status(400).json(error);
      return;
    }

    if (!name) {
      const error = this.errorService.createValidationError(
        'Project name is required'
      );
      res.status(400).json(error);
      return;
    }

    if (name.length < 1 || name.length > 100) {
      const error = this.errorService.createValidationError(
        'Project name must be between 1 and 100 characters'
      );
      res.status(400).json(error);
      return;
    }

    const project = await this.projectsService.updateProjectName(
      user.id,
      projectId,
      name
    );
    res
      .status(200)
      .json({ message: 'Project name updated successfully', data: project });
  }

  async deactivateProject(req: Request, res: Response): Promise<void> {
    const user = req.user as { id: string }; // Пользователь уже проверен middleware
    const { projectId } = req.params;

    if (!projectId) {
      const error = this.errorService.createValidationError(
        'Project ID is required'
      );
      res.status(400).json(error);
      return;
    }

    await this.projectsService.deactivateProject(user.id, projectId);
    res.status(200).json({ message: 'Project deactivated successfully' });
  }
}
