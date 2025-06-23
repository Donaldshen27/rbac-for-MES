import { BcryptUtil } from '../../../src/utils/bcrypt.util';

// Mock config
jest.mock('../../../src/config', () => ({
  config: {
    security: {
      saltRounds: 10
    }
  }
}));

describe('BcryptUtil', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await BcryptUtil.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      expect(hash).toMatch(/^\$2[aby]\$/); // Bcrypt hash format
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await BcryptUtil.hashPassword(password);
      const hash2 = await BcryptUtil.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123!';
      const hash = await BcryptUtil.hashPassword(password);
      
      const isMatch = await BcryptUtil.comparePassword(password, hash);
      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await BcryptUtil.hashPassword(password);
      
      const isMatch = await BcryptUtil.comparePassword(wrongPassword, hash);
      expect(isMatch).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const password = 'TestPassword123!';
      const hash = await BcryptUtil.hashPassword(password);
      
      const isMatch = await BcryptUtil.comparePassword('', hash);
      expect(isMatch).toBe(false);
    });
  });

  describe('isPasswordStrong', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'TestPass123!',
        'MyP@ssw0rd',
        'Secure#Pass1',
        'Complex$123Pass',
        'V3ry!Str0ng'
      ];
      
      strongPasswords.forEach(password => {
        expect(BcryptUtil.isPasswordStrong(password)).toBe(true);
      });
    });

    it('should reject passwords shorter than 8 characters', () => {
      expect(BcryptUtil.isPasswordStrong('Test1!')).toBe(false);
      expect(BcryptUtil.isPasswordStrong('Abc123!')).toBe(false);
    });

    it('should reject passwords without uppercase letters', () => {
      expect(BcryptUtil.isPasswordStrong('testpass123!')).toBe(false);
      expect(BcryptUtil.isPasswordStrong('lowercase123@')).toBe(false);
    });

    it('should reject passwords without lowercase letters', () => {
      expect(BcryptUtil.isPasswordStrong('TESTPASS123!')).toBe(false);
      expect(BcryptUtil.isPasswordStrong('UPPERCASE123@')).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      expect(BcryptUtil.isPasswordStrong('TestPassword!')).toBe(false);
      expect(BcryptUtil.isPasswordStrong('NoNumbers@Here')).toBe(false);
    });

    it('should reject passwords without special characters', () => {
      expect(BcryptUtil.isPasswordStrong('TestPassword123')).toBe(false);
      expect(BcryptUtil.isPasswordStrong('NoSpecialChars1')).toBe(false);
    });
  });

  describe('getPasswordStrengthErrors', () => {
    it('should return empty array for strong password', () => {
      const errors = BcryptUtil.getPasswordStrengthErrors('TestPass123!');
      expect(errors).toHaveLength(0);
    });

    it('should return all errors for completely weak password', () => {
      const errors = BcryptUtil.getPasswordStrengthErrors('weak');
      
      expect(errors).toContain('Password must be at least 8 characters long');
      expect(errors).toContain('Password must contain at least one uppercase letter');
      expect(errors).toContain('Password must contain at least one number');
      expect(errors).toContain('Password must contain at least one special character');
      expect(errors).toHaveLength(4);
    });

    it('should return specific errors for partially weak passwords', () => {
      // Missing special character
      let errors = BcryptUtil.getPasswordStrengthErrors('TestPass123');
      expect(errors).toHaveLength(1);
      expect(errors).toContain('Password must contain at least one special character');
      
      // Missing number
      errors = BcryptUtil.getPasswordStrengthErrors('TestPass!');
      expect(errors).toHaveLength(1);
      expect(errors).toContain('Password must contain at least one number');
      
      // Too short
      errors = BcryptUtil.getPasswordStrengthErrors('Test1!');
      expect(errors).toHaveLength(1);
      expect(errors).toContain('Password must be at least 8 characters long');
      
      // Multiple issues
      errors = BcryptUtil.getPasswordStrengthErrors('test');
      expect(errors.length).toBeGreaterThan(1);
    });

    it('should handle edge cases', () => {
      // Empty password
      const errors = BcryptUtil.getPasswordStrengthErrors('');
      expect(errors.length).toBeGreaterThan(0);
      
      // Only special characters
      const specialOnly = BcryptUtil.getPasswordStrengthErrors('!@#$%^&*');
      expect(specialOnly).toContain('Password must contain at least one uppercase letter');
      expect(specialOnly).toContain('Password must contain at least one lowercase letter');
      expect(specialOnly).toContain('Password must contain at least one number');
      
      // Very long password without requirements
      const longWeak = BcryptUtil.getPasswordStrengthErrors('verylongpasswordwithoutupperorcaseornumbersorspecialchars');
      expect(longWeak.length).toBeGreaterThan(0);
    });
  });

  describe('integration tests', () => {
    it('should work with real-world password scenarios', async () => {
      const testCases = [
        { password: 'Admin@123', shouldBeStrong: true },
        { password: 'password', shouldBeStrong: false },
        { password: 'P@ssw0rd!', shouldBeStrong: true },
        { password: '12345678', shouldBeStrong: false },
        { password: 'Test_User#2023', shouldBeStrong: true }
      ];
      
      for (const testCase of testCases) {
        const isStrong = BcryptUtil.isPasswordStrong(testCase.password);
        expect(isStrong).toBe(testCase.shouldBeStrong);
        
        if (isStrong) {
          const hash = await BcryptUtil.hashPassword(testCase.password);
          const isMatch = await BcryptUtil.comparePassword(testCase.password, hash);
          expect(isMatch).toBe(true);
        }
      }
    });
  });
});