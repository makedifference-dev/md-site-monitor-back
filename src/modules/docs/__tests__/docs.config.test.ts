import { specs } from '@/modules/docs/docs.config';

describe('Docs Config', () => {
  describe('specs', () => {
    it('should generate valid OpenAPI specifications', () => {
      expect(specs).toBeDefined();
      expect(typeof specs).toBe('object');
    });

    it('should have required OpenAPI properties', () => {
      expect(specs).toHaveProperty('openapi');
      expect(specs).toHaveProperty('info');
      expect(specs).toHaveProperty('servers');
      expect(specs).toHaveProperty('components');
      expect(specs).toHaveProperty('paths');
    });

    it('should have correct API information', () => {
      const specsAny = specs as any;
      expect(specsAny.info.title).toBe('MD Site Monitor API');
      expect(specsAny.info.version).toBe('1.0.0');
      expect(specsAny.info.description).toContain('Backend API');
    });

    it('should have security schemes configured', () => {
      const specsAny = specs as any;
      expect(specsAny.components.securitySchemes).toHaveProperty('bearerAuth');
      expect(specsAny.components.securitySchemes.bearerAuth.type).toBe('http');
      expect(specsAny.components.securitySchemes.bearerAuth.scheme).toBe(
        'bearer'
      );
    });

    it('should have schemas defined', () => {
      const specsAny = specs as any;
      expect(specsAny.components.schemas).toBeDefined();
      expect(typeof specsAny.components.schemas).toBe('object');
    });

    it('should have paths defined', () => {
      const specsAny = specs as any;
      expect(specsAny.paths).toBeDefined();
      expect(typeof specsAny.paths).toBe('object');
    });
  });
});
