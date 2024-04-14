import emailValidator from '../src/index.js';

describe('Email Validator', () => {
  describe('with MX record check', () => {
    test('should validate correct email format and MX record exists', async () => {
      expect(await emailValidator('test@example.com')).toBe(true);
    });

    test('should reject email from domain without MX records', async () => {
      expect(await emailValidator('test@adafwefewsd.com')).toBe(false);
    });

    test('should reject non-string inputs', async () => {
      expect(await emailValidator(undefined)).toBe(false);
      expect(await emailValidator(null)).toBe(false);
      expect(await emailValidator(1234)).toBe(false);
      expect(await emailValidator({})).toBe(false);
    });
  });

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

    test('should reject non-string inputs', async () => {
      expect(await emailValidator(undefined, false)).toBe(false);
      expect(await emailValidator(null, false)).toBe(false);
      expect(await emailValidator(1234, false)).toBe(false);
      expect(await emailValidator({}, false)).toBe(false);
    });
  });
});
