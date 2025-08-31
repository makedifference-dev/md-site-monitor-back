import type { Request, Response } from 'express';
import type { DocsService } from './docs.service';

export class DocsController {
  constructor(private docsService: DocsService) {}

  getOpenApiSpec(req: Request, res: Response): void {
    const spec = this.docsService.getOpenApiSpec();
    res.setHeader('Content-Type', 'application/json');
    res.send(spec);
  }
}
