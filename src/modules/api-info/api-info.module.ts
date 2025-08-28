import { Router } from 'express';
import { ApiInfoController } from './api-info.controller';
import { ApiInfoService } from './api-info.service';

export class ApiInfoModule {
  private router: Router;
  private controller: ApiInfoController;
  private service: ApiInfoService;

  constructor() {
    this.router = Router();
    this.service = new ApiInfoService();
    this.controller = new ApiInfoController(this.service);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Root endpoint (/)
    this.router.get('/', this.controller.getRoot.bind(this.controller));
  }

  getRouter(): Router {
    return this.router;
  }
}

export default ApiInfoModule;
