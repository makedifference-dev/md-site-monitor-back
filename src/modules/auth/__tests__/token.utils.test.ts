import { hashRefreshToken } from '@/modules/auth/token.utils';

describe('hashRefreshToken', () => {
  const originalEnv = { ...process.env };
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('hashes token with sha256 when no pepper', () => {
    delete process.env.REFRESH_TOKEN_PEPPER;
    const h1 = hashRefreshToken('token-123');
    const h2 = hashRefreshToken('token-123');
    expect(h1).toBe(h2);
    expect(typeof h1).toBe('string');
    expect(h1).toHaveLength(64); // sha256 hex digest
  });

  it('uses HMAC with pepper when provided', () => {
    process.env.REFRESH_TOKEN_PEPPER = 'pepper';
    const plain = hashRefreshToken('abc');
    process.env.REFRESH_TOKEN_PEPPER = 'pepper2';
    const different = hashRefreshToken('abc');
    expect(plain).not.toBe(different);
    expect(plain).toHaveLength(64);
    expect(different).toHaveLength(64);
  });
});

