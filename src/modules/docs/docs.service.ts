import { specs } from './docs.config';

export class DocsService {
  getOpenApiSpec(): typeof specs {
    return specs;
  }
}
