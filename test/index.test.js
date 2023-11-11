import emailValidator from '../src/index.js';

describe('Sophisticated Email Validator', () => {
  test('validates correct email format', async () => {
    expect(await emailValidator('test@example.com')).toBe(true);
  });

  test('should reject incorrect email format', async () => {
    expect(await emailValidator('invalid-email')).toBe(false);
  });

  test('should reject email from domain without MX records', async () => {
    expect(await emailValidator('test@adafwefewsd.com')).toBe(false);
  });
});
