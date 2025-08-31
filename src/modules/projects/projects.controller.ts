import type { Request, Response } from 'express';
import type { ProjectsService } from './projects.service';
import {
  type CreateProjectRequest,
  type ProjectIdParam,
  type UpdateProjectNameRequest,
  validateCreateProject,
  validateProjectIdParam,
  validateUpdateProjectName,
} from './projects.contract';
import type { ErrorService } from '../error/error.service';
import type { RequestUser } from '../auth/auth.contract';

export class ProjectsController {
  private projectsService: ProjectsService;
  private errorService: ErrorService;

  constructor(projectsService: ProjectsService, errorService: ErrorService) {
    this.projectsService = projectsService;
    this.errorService = errorService;
  }

  async createProject(req: Request, res: Response): Promise<void> {
    const user = req.user as RequestUser; // Пользователь уже проверен middleware
    const parsed = validateCreateProject(req.body);
    if (!parsed.ok) {
      const error = this.errorService.createValidationError(parsed.message);
      res.status(400).json(error);
      return;
    }
    const { name, websiteUrl } = parsed.data as CreateProjectRequest;

    const project = await this.projectsService.createProject(user.id, {
      name,
      websiteUrl,
    });
    res
      .status(201)
      .json({ message: 'Project created successfully', data: project });
  }

  async getUserProjects(req: Request, res: Response): Promise<void> {
    const user = req.user as RequestUser; // Пользователь уже проверен middleware
    const projects = await this.projectsService.getUserProjects(user.id);
    res.status(200).json({ message: 'User projects', data: projects });
  }

  async getProjectById(req: Request, res: Response): Promise<void> {
    const user = req.user as RequestUser; // Пользователь уже проверен middleware
    const idParsed = validateProjectIdParam(req.params);
    if (!idParsed.ok) {
      const error = this.errorService.createValidationError(idParsed.message);
      res.status(400).json(error);
      return;
    }
    const { projectId } = idParsed.data as ProjectIdParam;

    const project = await this.projectsService.getProjectById(
      user.id,
      projectId
    );
    res.status(200).json({ message: 'Project details', data: project });
  }

  async updateProjectName(req: Request, res: Response): Promise<void> {
    const user = req.user as RequestUser; // Пользователь уже проверен middleware
    const idParsed = validateProjectIdParam(req.params);
    if (!idParsed.ok) {
      const error = this.errorService.createValidationError(idParsed.message);
      res.status(400).json(error);
      return;
    }
    const bodyParsed = validateUpdateProjectName(req.body);
    if (!bodyParsed.ok) {
      const error = this.errorService.createValidationError(bodyParsed.message);
      res.status(400).json(error);
      return;
    }
    const { projectId } = idParsed.data as ProjectIdParam;
    const { name } = bodyParsed.data as UpdateProjectNameRequest;

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
    const user = req.user as RequestUser; // Пользователь уже проверен middleware
    const parsed = validateProjectIdParam(req.params);
    if (!parsed.ok) {
      const error = this.errorService.createValidationError(parsed.message);
      res.status(400).json(error);
      return;
    }
    const { projectId } = parsed.data as ProjectIdParam;

    await this.projectsService.deactivateProject(user.id, projectId);
    res.status(200).json({ message: 'Project deactivated successfully' });
  }
}
