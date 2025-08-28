import { Router } from 'express';
import { DocsController } from './docs.controller';
import { DocsService } from './docs.service';
import swaggerUi from 'swagger-ui-express';
import { specs } from './docs.config';

export class DocsModule {
  private router: Router;
  private controller: DocsController;
  private service: DocsService;

  constructor() {
    this.router = Router();
    this.service = new DocsService();
    this.controller = new DocsController(this.service);
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // JSON спецификация
    this.router.get(
      '/json',
      this.controller.getOpenApiSpec.bind(this.controller)
    );

    // Swagger UI
    this.router.use('/', swaggerUi.serve);
    this.router.get(
      '/',
      swaggerUi.setup(specs, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'MD Site Monitor API Documentation',
      })
    );
  }

  getRouter(): Router {
    return this.router;
  }
}

export default DocsModule;
