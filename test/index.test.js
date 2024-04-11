import emailValidator from '../src/index.js';

describe('Email Validator', () => {
  // Testing with MX record check enabled
  describe('with MX record check', () => {
    test('should validate correct email format and MX record exists', async () => {
      expect(await emailValidator('test@example.com')).toBe(true);
    });

    test('should reject email from domain without MX records', async () => {
      expect(await emailValidator('test@adafwefewsd.com')).toBe(false);
    });
  });

  // Testing without MX record check
  describe('without MX record check', () => {
    test('should validate correct email format regardless of MX records', async () => {
      expect(await emailValidator('test@example.com', false)).toBe(true);
    });

    test('should reject incorrect email format regardless of MX records', async () => {
      expect(await emailValidator('invalid-email', false)).toBe(false);
    });

    test('should validate email from domain without MX records', async () => {
      expect(await emailValidator('test@adafwefewsd.com', false)).toBe(true);
    });
  });
});
