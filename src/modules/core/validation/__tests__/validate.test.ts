import { makeValidator, respondValidation, nonEmptyString } from '@/modules/core/validation/validate';
import { z } from 'zod';

describe('validation helpers', () => {
  it('makeValidator returns ok on success and error on failure (default message)', () => {
    const schema = z.object({ a: z.number() });
    const validate = makeValidator(schema);
    expect(validate({ a: 1 })).toEqual({ ok: true, data: { a: 1 } });
    const res = validate({ a: 'x' });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.message).toBe('Invalid request data');
    }
  });

  it('respondValidation writes 400 with error from ErrorService', () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const errorService: any = {
      createValidationError: jest.fn().mockReturnValue({ error: 'VALIDATION_ERROR', message: 'bad', statusCode: 400 }),
    };
    respondValidation(res, errorService, 'bad');
    expect(errorService.createValidationError).toHaveBeenCalledWith('bad');
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'VALIDATION_ERROR', message: 'bad', statusCode: 400 });
  });

  it('nonEmptyString schema rejects empty string', () => {
    const s = nonEmptyString();
    expect(s.safeParse('').success).toBe(false);
    expect(s.safeParse('x').success).toBe(true);
  });
});

