import type { Response } from 'express';
import { z, type ZodError, type ZodSchema } from 'zod';
import type { ErrorService } from '@/modules/error/error.service';

export type Validator<T> = (
  data: unknown
) => { ok: true; data: T } | { ok: false; message: string };

export function makeValidator<T>(
  schema: ZodSchema<T>,
  mapError?: (err: ZodError) => string
): Validator<T> {
  return (data: unknown) => {
    const result = schema.safeParse(data);
    if (result.success) {
      return { ok: true, data: result.data };
    }
    const message = mapError ? mapError(result.error) : 'Invalid request data';
    return { ok: false, message };
  };
}

export function respondValidation(
  res: Response,
  errorService: ErrorService,
  message: string
): void {
  const err = errorService.createValidationError(message);
  res.status(400).json(err);
}

export const nonEmptyString = (): z.ZodString => z.string().min(1);
