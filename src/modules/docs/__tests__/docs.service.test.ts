import { DocsService } from '@/modules/docs/docs.service';

describe('DocsService', () => {
  let docsService: DocsService;

  beforeEach(() => {
    docsService = new DocsService();
  });

  describe('constructor', () => {
    it('should create docs service instance', () => {
      expect(docsService).toBeDefined();
    });
  });

  describe('getOpenApiSpec', () => {
    it('should return OpenAPI specifications', () => {
      const specs = docsService.getOpenApiSpec();

      expect(specs).toBeDefined();
      expect(specs).toHaveProperty('openapi');
      expect(specs).toHaveProperty('info');
      expect(specs).toHaveProperty('paths');
    });

    it('should return valid OpenAPI structure', () => {
      const specs = docsService.getOpenApiSpec() as any;

      expect(specs.openapi).toBeDefined();
      expect(specs.info).toBeDefined();
      expect(specs.info.title).toBeDefined();
      expect(specs.info.version).toBeDefined();
      expect(specs.paths).toBeDefined();
    });
  });
});
