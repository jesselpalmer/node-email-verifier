/**
 * Error codes for email validation
 */
export enum ErrorCode {
  // Format validation errors
  INVALID_INPUT_TYPE = 'INVALID_INPUT_TYPE',
  EMAIL_EMPTY = 'EMAIL_EMPTY',
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',

  // MX validation errors
  NO_MX_RECORDS = 'NO_MX_RECORDS',
  DNS_LOOKUP_FAILED = 'DNS_LOOKUP_FAILED',
  DNS_LOOKUP_TIMEOUT = 'DNS_LOOKUP_TIMEOUT',
  MX_SKIPPED_DISPOSABLE = 'MX_SKIPPED_DISPOSABLE',

  // Disposable email errors
  DISPOSABLE_EMAIL = 'DISPOSABLE_EMAIL',

  // Timeout errors
  INVALID_TIMEOUT_VALUE = 'INVALID_TIMEOUT_VALUE',

  // Unknown errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for email validation
 */
export class EmailValidationError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'EmailValidationError';
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EmailValidationError);
    }
  }
}

/**
 * Error messages with their corresponding codes
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.INVALID_INPUT_TYPE]: 'Email must be a string',
  [ErrorCode.EMAIL_EMPTY]: 'Email cannot be empty',
  [ErrorCode.INVALID_EMAIL_FORMAT]: 'Invalid email format',
  [ErrorCode.NO_MX_RECORDS]: 'No MX records found',
  [ErrorCode.DNS_LOOKUP_FAILED]: 'DNS lookup failed',
  [ErrorCode.DNS_LOOKUP_TIMEOUT]: 'DNS lookup timed out',
  [ErrorCode.MX_SKIPPED_DISPOSABLE]: 'Skipped due to disposable email',
  [ErrorCode.DISPOSABLE_EMAIL]: 'Email from disposable provider',
  [ErrorCode.INVALID_TIMEOUT_VALUE]: 'Invalid timeout value',
  [ErrorCode.UNKNOWN_ERROR]: 'Unknown error',
};

/**
 * Create a standardized error object for validation results
 */
export interface ValidationError {
  code: ErrorCode;
  message: string;
  details?: unknown;
}

/**
 * Create a validation error object
 */
export function createValidationError(
  code: ErrorCode,
  customMessage?: string,
  details?: unknown
): ValidationError {
  return {
    code,
    message: customMessage || ErrorMessages[code],
    details,
  };
}
