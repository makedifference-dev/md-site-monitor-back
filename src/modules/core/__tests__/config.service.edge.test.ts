import { jest } from '@jest/globals';

describe('ConfigService edge cases', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('throws original error when non-ZodError is raised during parse', async () => {
    await new Promise<void>(resolve => {
      jest.isolateModules(() => {
        const chain = () => ({
          transform: () => ({ default: () => ({}) }),
          default: () => ({}),
          min: () => ({ default: () => ({}) }),
          email: () => ({ default: () => ({}) }),
          optional: () => ({}),
        });

        jest.doMock('zod', () => ({
          z: {
            string: jest.fn(() => chain()),
            enum: jest.fn(() => ({ default: () => ({}) })),
            object: jest.fn(() => ({
              parse: jest.fn(() => {
                throw new Error('boom-non-zod');
              }),
            })),
            ZodError: class ZodError extends Error {},
          },
        }));

        const { ConfigService } = require('@/modules/core/config.service');

        expect(() => {
          ConfigService.getInstance();
        }).toThrow('boom-non-zod');
        resolve();
      });
    });
  });
});
