// Must set env vars BEFORE importing — jwt.ts reads them at module init time
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32-chars-pad!';

import { generateTokens, verifyAccessToken, verifyRefreshToken, generateAgentToken } from '../src/utils/jwt';

const TEST_USER_ID = 'test-user-uuid-1234';

describe('generateTokens / verifyAccessToken', () => {
  it('generates an access token that verifies correctly', () => {
    const { accessToken } = generateTokens(TEST_USER_ID);
    const decoded = verifyAccessToken(accessToken);
    expect(decoded.userId).toBe(TEST_USER_ID);
  });

  it('throws on invalid access token', () => {
    expect(() => verifyAccessToken('bad-token')).toThrow();
  });

  it('throws on tampered access token', () => {
    const { accessToken } = generateTokens(TEST_USER_ID);
    const tampered = accessToken.slice(0, -5) + 'XXXXX';
    expect(() => verifyAccessToken(tampered)).toThrow();
  });
});

describe('verifyRefreshToken', () => {
  it('verifies a valid refresh token', () => {
    const { refreshToken } = generateTokens(TEST_USER_ID);
    const decoded = verifyRefreshToken(refreshToken);
    expect(decoded.userId).toBe(TEST_USER_ID);
  });

  it('throws on invalid refresh token', () => {
    expect(() => verifyRefreshToken('invalid')).toThrow();
  });
});

describe('generateAgentToken', () => {
  it('generates an agent token with serverID and userID', () => {
    const token = generateAgentToken('server-123', TEST_USER_ID);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // valid JWT structure
  });
});
