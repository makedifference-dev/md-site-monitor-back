import type { Request, Response } from 'express';

let capturedCompressionOptions: any;
let capturedApiRateLimitOptions: any;
let capturedAuthRateLimitOptions: any;

jest.mock('compression', () => {
  const mockCompression: any = (options: any) => {
    capturedCompressionOptions = options;
    // return a no-op middleware
    return (_req: Request, _res: Response, next: () => void) => next();
  };
  mockCompression.filter = () => true;
  return mockCompression;
});

jest.mock('express-rate-limit', () => {
  return (options: any) => {
    // capture separate instances by keys in options
    if (options?.message?.error === 'TOO_MANY_REQUESTS') {
      capturedApiRateLimitOptions = options;
    } else if (options?.message?.error === 'TOO_MANY_AUTH_ATTEMPTS') {
      capturedAuthRateLimitOptions = options;
    }
    // return a no-op middleware
    return (_req: Request, _res: Response, next: () => void) => next();
  };
});

describe('performance middleware config', () => {
  beforeAll(() => {
    jest.resetModules();
  });

  it('captures compression filter branches and rate limit skip functions', async () => {
    // Dynamically import after mocks are set
    const mod = await import('@/modules/core/performance.middleware');

    // Test compression filter true/false branches
    const reqNoCompress = {
      headers: { 'x-no-compression': 'true' },
    } as any as Request;
    const reqNormal = { headers: {} } as any as Request;
    const res = {} as any as Response;

    // When header present => false
    expect(capturedCompressionOptions.filter(reqNoCompress, res)).toBe(false);
    // When absent => delegates to compression.filter (mock returns true)
    expect(capturedCompressionOptions.filter(reqNormal, res)).toBe(true);

    // Test api rate limit skip
    expect(capturedApiRateLimitOptions.skip({ path: '/health' } as any)).toBe(
      true
    );
    expect(
      capturedApiRateLimitOptions.skip({ path: '/api-docs/v1' } as any)
    ).toBe(true);
    expect(capturedApiRateLimitOptions.skip({ path: '/projects' } as any)).toBe(
      false
    );

    // Test auth rate limit skip
    expect(
      capturedAuthRateLimitOptions.skip({ path: '/auth/refresh' } as any)
    ).toBe(true);
    expect(
      capturedAuthRateLimitOptions.skip({ path: '/auth/login' } as any)
    ).toBe(false);

    // Access exports to ensure module executed
    expect(typeof mod.performanceHeaders).toBe('function');
  });
});
