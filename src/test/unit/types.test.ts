import {
  createProjectRequestExample,
  projectResponseExample,
  projectsListResponseExample,
} from '../../modules/projects/projects.types';
import {
  registerRequestExample,
  loginRequestExample,
  userResponseExample,
} from '../../modules/auth/auth.types';
import { rootInfoResponseExample } from '../../modules/api-info/api-info.types';

describe('Type Examples', () => {
  describe('Projects Types', () => {
    it('should have valid createProjectRequestExample', () => {
      expect(createProjectRequestExample).toBeDefined();
      expect(createProjectRequestExample.name).toBe('My Website');
      expect(createProjectRequestExample.websiteUrl).toBe(
        'https://example.com'
      );
    });

    it('should have valid projectResponseExample', () => {
      expect(projectResponseExample).toBeDefined();
      expect(projectResponseExample.id).toBeDefined();
      expect(projectResponseExample.name).toBe('My Website');
      expect(projectResponseExample.websiteUrl).toBe('https://example.com');
      expect(projectResponseExample.isActive).toBe(true);
    });

    it('should have valid projectsListResponseExample', () => {
      expect(projectsListResponseExample).toBeDefined();
      expect(projectsListResponseExample.projects).toBeDefined();
      expect(Array.isArray(projectsListResponseExample.projects)).toBe(true);
      expect(projectsListResponseExample.total).toBe(1);
    });
  });

  describe('Auth Types', () => {
    it('should have valid registerRequestExample', () => {
      expect(registerRequestExample).toBeDefined();
      expect(registerRequestExample.email).toBe('user@example.com');
      expect(registerRequestExample.password).toBe('password123');
      expect(registerRequestExample.fullName).toBe('Иван Иванов');
    });

    it('should have valid loginRequestExample', () => {
      expect(loginRequestExample).toBeDefined();
      expect(loginRequestExample.email).toBe('user@example.com');
      expect(loginRequestExample.password).toBe('password123');
    });

    it('should have valid userResponseExample', () => {
      expect(userResponseExample).toBeDefined();
      expect(userResponseExample.id).toBeDefined();
      expect(userResponseExample.email).toBe('user@example.com');
      expect(userResponseExample.fullName).toBe('Иван Иванов');
      expect(userResponseExample.isActive).toBe(true);
    });
  });

  describe('API Info Types', () => {
    it('should have valid rootInfoResponseExample', () => {
      expect(rootInfoResponseExample).toBeDefined();
      expect(rootInfoResponseExample.message).toBe(
        'MD Site Monitor Backend API'
      );
      expect(rootInfoResponseExample.status).toBe('running');
      expect(rootInfoResponseExample.environment).toBe('development');
    });
  });
});
