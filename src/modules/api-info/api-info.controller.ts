import type { Request, Response } from 'express';
import type { ApiInfoService } from './api-info.service';

export class ApiInfoController {
  private apiInfoService: ApiInfoService;

  constructor(apiInfoService: ApiInfoService) {
    this.apiInfoService = apiInfoService;
  }

  getRoot(req: Request, res: Response): void {
    const rootInfo = this.apiInfoService.getRootInfo();
    res.json(rootInfo);
  }
}
