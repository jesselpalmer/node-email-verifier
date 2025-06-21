import {
  ErrorCode,
  ErrorMessages,
  EmailValidationError,
  createValidationError,
  isEmailValidationError,
  extractErrorCode,
} from '../src/errors.js';

describe('Error utilities', () => {
  describe('EmailValidationError', () => {
    test('should create error with code and default message', () => {
      const error = new EmailValidationError(ErrorCode.INVALID_EMAIL_FORMAT);

      expect(error.name).toBe('EmailValidationError');
      expect(error.code).toBe(ErrorCode.INVALID_EMAIL_FORMAT);
      expect(error.message).toBe(ErrorMessages[ErrorCode.INVALID_EMAIL_FORMAT]);
      expect(error.originalError).toBeUndefined();
    });

    test('should create error with custom message', () => {
      const customMessage = 'Custom error message';
      const error = new EmailValidationError(
        ErrorCode.DNS_LOOKUP_FAILED,
        customMessage
      );

      expect(error.message).toBe(customMessage);
      expect(error.code).toBe(ErrorCode.DNS_LOOKUP_FAILED);
    });

    test('should store original error', () => {
      const originalError = new Error('Original error');
      const error = new EmailValidationError(
        ErrorCode.UNKNOWN_ERROR,
        'Wrapper error',
        originalError
      );

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('createValidationError', () => {
    test('should create error with base message', () => {
      const error = createValidationError(ErrorCode.NO_MX_RECORDS);

      expect(error).toBeInstanceOf(EmailValidationError);
      expect(error.code).toBe(ErrorCode.NO_MX_RECORDS);
      expect(error.message).toBe(ErrorMessages[ErrorCode.NO_MX_RECORDS]);
    });

    test('should append details to message', () => {
      const details = 'Additional context';
      const error = createValidationError(ErrorCode.DNS_LOOKUP_FAILED, details);

      expect(error.message).toBe(
        `${ErrorMessages[ErrorCode.DNS_LOOKUP_FAILED]}: ${details}`
      );
    });

    test('should include original error', () => {
      const originalError = new Error('DNS error');
      const error = createValidationError(
        ErrorCode.DNS_LOOKUP_TIMEOUT,
        'Timeout details',
        originalError
      );

      expect(error.originalError).toBe(originalError);
    });
  });

  describe('isEmailValidationError', () => {
    test('should return true for EmailValidationError instances', () => {
      const error = new EmailValidationError(ErrorCode.INVALID_EMAIL_FORMAT);
      expect(isEmailValidationError(error)).toBe(true);
    });

    test('should return false for regular Error instances', () => {
      const error = new Error('Regular error');
      expect(isEmailValidationError(error)).toBe(false);
    });

    test('should return false for non-error values', () => {
      expect(isEmailValidationError('string')).toBe(false);
      expect(isEmailValidationError(null)).toBe(false);
      expect(isEmailValidationError(undefined)).toBe(false);
      expect(isEmailValidationError(123)).toBe(false);
      expect(isEmailValidationError({})).toBe(false);
    });
  });

  describe('extractErrorCode', () => {
    test('should extract code from EmailValidationError', () => {
      const error = new EmailValidationError(ErrorCode.DISPOSABLE_EMAIL);
      expect(extractErrorCode(error)).toBe(ErrorCode.DISPOSABLE_EMAIL);
    });

    test('should map timeout message to DNS_LOOKUP_TIMEOUT', () => {
      const error = new Error('DNS lookup timed out');
      expect(extractErrorCode(error)).toBe(ErrorCode.DNS_LOOKUP_TIMEOUT);
    });

    test('should map DNS lookup message to DNS_LOOKUP_FAILED', () => {
      const error = new Error('DNS lookup failed: ENOTFOUND');
      expect(extractErrorCode(error)).toBe(ErrorCode.DNS_LOOKUP_FAILED);
    });

    test('should map invalid timeout message to INVALID_TIMEOUT_VALUE', () => {
      const error = new Error('Invalid timeout value: abc');
      expect(extractErrorCode(error)).toBe(ErrorCode.INVALID_TIMEOUT_VALUE);
    });

    test('should return UNKNOWN_ERROR for unrecognized errors', () => {
      const error = new Error('Some other error');
      expect(extractErrorCode(error)).toBe(ErrorCode.UNKNOWN_ERROR);
    });

    test('should return UNKNOWN_ERROR for non-error values', () => {
      expect(extractErrorCode('string')).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(extractErrorCode(null)).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(extractErrorCode(123)).toBe(ErrorCode.UNKNOWN_ERROR);
    });
  });

  describe('ErrorMessages', () => {
    test('should have messages for all error codes', () => {
      // Ensure every ErrorCode has a corresponding message
      Object.values(ErrorCode).forEach((code) => {
        expect(ErrorMessages[code]).toBeDefined();
        expect(typeof ErrorMessages[code]).toBe('string');
        expect(ErrorMessages[code].length).toBeGreaterThan(0);
      });
    });
  });
});
