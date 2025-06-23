import { JWTUtil, JWTPayload } from '../../../src/utils/jwt.util';
import { AppError } from '../../../src/utils/errors';
import jwt from 'jsonwebtoken';

// Mock config
jest.mock('../../../src/config', () => ({
  config: {
    jwt: {
      secret: 'test-secret',
      expiresIn: '15m',
      refreshSecret: 'test-refresh-secret',
      refreshExpiresIn: '7d'
    }
  }
}));

describe('JWTUtil', () => {
  const mockPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    roles: ['user', 'admin'],
    permissions: ['read', 'write']
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = JWTUtil.generateAccessToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.decode(token) as JWTPayload;
      expect(decoded.sub).toBe(mockPayload.sub);
      expect(decoded.username).toBe(mockPayload.username);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.roles).toEqual(mockPayload.roles);
      expect(decoded.permissions).toEqual(mockPayload.permissions);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const userId = 'user-123';
      const tokenId = 'token-456';
      const token = JWTUtil.generateRefreshToken(userId, tokenId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = jwt.decode(token) as any;
      expect(decoded.sub).toBe(userId);
      expect(decoded.tokenId).toBe(tokenId);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = JWTUtil.generateAccessToken(mockPayload);
      const verified = JWTUtil.verifyAccessToken(token);
      
      expect(verified.sub).toBe(mockPayload.sub);
      expect(verified.username).toBe(mockPayload.username);
      expect(verified.email).toBe(mockPayload.email);
      expect(verified.roles).toEqual(mockPayload.roles);
      expect(verified.permissions).toEqual(mockPayload.permissions);
    });

    it('should throw AppError for expired token', () => {
      const expiredToken = jwt.sign(mockPayload, 'test-secret', { expiresIn: '-1s' });
      
      expect(() => JWTUtil.verifyAccessToken(expiredToken)).toThrow(AppError);
      expect(() => JWTUtil.verifyAccessToken(expiredToken)).toThrow('Token expired');
    });

    it('should throw AppError for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => JWTUtil.verifyAccessToken(invalidToken)).toThrow(AppError);
      expect(() => JWTUtil.verifyAccessToken(invalidToken)).toThrow('Invalid token');
    });

    it('should throw AppError for token with wrong secret', () => {
      const wrongSecretToken = jwt.sign(mockPayload, 'wrong-secret');
      
      expect(() => JWTUtil.verifyAccessToken(wrongSecretToken)).toThrow(AppError);
      expect(() => JWTUtil.verifyAccessToken(wrongSecretToken)).toThrow('Invalid token');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const userId = 'user-123';
      const tokenId = 'token-456';
      const token = JWTUtil.generateRefreshToken(userId, tokenId);
      const verified = JWTUtil.verifyRefreshToken(token);
      
      expect(verified.sub).toBe(userId);
      expect(verified.tokenId).toBe(tokenId);
    });

    it('should throw AppError for expired refresh token', () => {
      const expiredToken = jwt.sign(
        { sub: 'user-123', tokenId: 'token-456' },
        'test-refresh-secret',
        { expiresIn: '-1s' }
      );
      
      expect(() => JWTUtil.verifyRefreshToken(expiredToken)).toThrow(AppError);
      expect(() => JWTUtil.verifyRefreshToken(expiredToken)).toThrow('Refresh token expired');
    });

    it('should throw AppError for invalid refresh token', () => {
      const invalidToken = 'invalid.refresh.token';
      
      expect(() => JWTUtil.verifyRefreshToken(invalidToken)).toThrow(AppError);
      expect(() => JWTUtil.verifyRefreshToken(invalidToken)).toThrow('Invalid refresh token');
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const token = JWTUtil.generateAccessToken(mockPayload);
      const decoded = JWTUtil.decodeToken(token) as JWTPayload;
      
      expect(decoded).toBeDefined();
      expect(decoded.sub).toBe(mockPayload.sub);
      expect(decoded.username).toBe(mockPayload.username);
    });

    it('should return null for invalid token format', () => {
      const invalidToken = 'not-a-jwt-token';
      const decoded = JWTUtil.decodeToken(invalidToken);
      
      expect(decoded).toBeNull();
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokenId = 'token-789';
      const result = JWTUtil.generateTokenPair(mockPayload, tokenId);
      
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('expiresIn');
      expect(result).toHaveProperty('tokenType');
      
      expect(result.tokenType).toBe('Bearer');
      expect(result.expiresIn).toBe(900); // 15 minutes in seconds
      
      // Verify both tokens are valid
      const accessPayload = JWTUtil.verifyAccessToken(result.accessToken);
      expect(accessPayload.sub).toBe(mockPayload.sub);
      
      const refreshPayload = JWTUtil.verifyRefreshToken(result.refreshToken);
      expect(refreshPayload.sub).toBe(mockPayload.sub);
      expect(refreshPayload.tokenId).toBe(tokenId);
    });
  });

  describe('getExpiresInSeconds (private method test via generateTokenPair)', () => {
    it('should correctly convert different time formats', () => {
      // Test with different expiry formats by mocking config
      const originalConfig = jest.requireMock('../../../src/config').config;
      
      // Test seconds
      jest.requireMock('../../../src/config').config.jwt.expiresIn = '30s';
      let result = JWTUtil.generateTokenPair(mockPayload, 'test-id');
      expect(result.expiresIn).toBe(30);
      
      // Test minutes
      jest.requireMock('../../../src/config').config.jwt.expiresIn = '5m';
      result = JWTUtil.generateTokenPair(mockPayload, 'test-id');
      expect(result.expiresIn).toBe(300);
      
      // Test hours
      jest.requireMock('../../../src/config').config.jwt.expiresIn = '2h';
      result = JWTUtil.generateTokenPair(mockPayload, 'test-id');
      expect(result.expiresIn).toBe(7200);
      
      // Test days
      jest.requireMock('../../../src/config').config.jwt.expiresIn = '1d';
      result = JWTUtil.generateTokenPair(mockPayload, 'test-id');
      expect(result.expiresIn).toBe(86400);
      
      // Test invalid format (should default to 900)
      jest.requireMock('../../../src/config').config.jwt.expiresIn = 'invalid';
      result = JWTUtil.generateTokenPair(mockPayload, 'test-id');
      expect(result.expiresIn).toBe(900);
      
      // Test numeric value
      jest.requireMock('../../../src/config').config.jwt.expiresIn = 1800;
      result = JWTUtil.generateTokenPair(mockPayload, 'test-id');
      expect(result.expiresIn).toBe(1800);
      
      // Restore original config
      jest.requireMock('../../../src/config').config = originalConfig;
    });
  });
});