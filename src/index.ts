import dns from 'node:dns';
import util from 'node:util';

import ms from 'ms';
import { setTimeout } from 'timers/promises';
import validator from 'validator';

import { isDisposableDomain } from './disposable-domains.js';
import { ErrorCode, EmailValidationError, ErrorMessages } from './errors.js';

// Define MX record type to match Node.js dns module
interface MxRecord {
  exchange: string;
  priority: number;
}

/**
 * Detailed validation result returned when `detailed: true` option is used.
 * Provides comprehensive information about email validation including
 * specific failure reasons and error codes.
 */
export interface ValidationResult {
  /** Overall validation result - true only if all enabled checks pass */
  valid: boolean;
  /** The email address that was validated */
  email: string;
  /** Email format validation results */
  format: {
    /** Whether the email format is valid according to RFC 5322 */
    valid: boolean;
    /** Human-readable reason for validation failure */
    reason?: string;
    /** Machine-readable error code for programmatic handling */
    errorCode?: ErrorCode;
  };
  /** MX record validation results (only present when checkMx is enabled) */
  mx?: {
    /** Whether valid MX records were found */
    valid: boolean;
    /** Array of MX records found for the domain */
    records?: MxRecord[];
    /** Human-readable reason for validation failure */
    reason?: string;
    /** Machine-readable error code for programmatic handling */
    errorCode?: ErrorCode;
  };
  /** Disposable email validation results (only present when checkDisposable is enabled) */
  disposable?: {
    /** Whether the email is NOT from a disposable provider */
    valid: boolean;
    /** The disposable email provider domain if detected */
    provider?: string | null;
    /** Human-readable reason for validation failure */
    reason?: string;
    /** Machine-readable error code for programmatic handling */
    errorCode?: ErrorCode;
  };
}

/**
 * Configuration options for email validation.
 * All options are optional and have sensible defaults.
 */
export interface EmailValidatorOptions {
  /** Whether to check for MX records. Defaults to true. */
  checkMx?: boolean;
  /**
   * Timeout for DNS lookups. Can be a number in milliseconds or a string
   * in ms format (e.g., '5s', '100ms', '1m'). Defaults to '10s'.
   */
  timeout?: ms.StringValue | number;
  /** Whether to check for disposable email providers. Defaults to false. */
  checkDisposable?: boolean;
  /**
   * Whether to return detailed validation results instead of a simple boolean.
   * When true, returns a ValidationResult object. Defaults to false.
   */
  detailed?: boolean;
}

// Internal interface for testing - not exported
interface InternalEmailValidatorOptions extends EmailValidatorOptions {
  /** @internal - Testing only: Override DNS resolver function */
  _resolveMx?: (hostname: string) => Promise<MxRecord[]>;
}

// Convert the callback-based dns.resolveMx function into a promise-based one
const resolveMx = util.promisify(dns.resolveMx);

// Consistent error messages - kept for backward compatibility in error messages
const TIMEOUT_ERROR_MESSAGE = ErrorMessages[ErrorCode.DNS_LOOKUP_TIMEOUT];

/**
 * Validates an email address against the RFC 5322 standard.
 *
 * @param {string | unknown} email - The email address to validate.
 * @return {{ valid: boolean, reason?: string }} - Validation result with optional reason.
 */
const validateRfc5322 = (
  email: unknown
): { valid: boolean; reason?: string; errorCode?: ErrorCode } => {
  if (typeof email !== 'string') {
    return {
      valid: false,
      reason: ErrorMessages[ErrorCode.INVALID_INPUT_TYPE],
      errorCode: ErrorCode.INVALID_INPUT_TYPE,
    };
  }
  if (!email) {
    return {
      valid: false,
      reason: ErrorMessages[ErrorCode.EMAIL_EMPTY],
      errorCode: ErrorCode.EMAIL_EMPTY,
    };
  }
  if (!validator.isEmail(email)) {
    return {
      valid: false,
      reason: ErrorMessages[ErrorCode.INVALID_EMAIL_FORMAT],
      errorCode: ErrorCode.INVALID_EMAIL_FORMAT,
    };
  }
  return { valid: true };
};

/**
 * Checks if the domain of an email address has MX (Mail Exchange) records.
 *
 * @param {string} email - The email address whose MX records are to be checked.
 * @return {Promise<{ valid: boolean; records?: MxRecord[]; reason?: string }>} - Promise that resolves to validation result.
 */
const checkMxRecords = async (
  email: string,
  resolveMxFn: (hostname: string) => Promise<MxRecord[]> = resolveMx
): Promise<{
  valid: boolean;
  records?: MxRecord[];
  reason?: string;
  errorCode?: ErrorCode;
}> => {
  const domain = email.split('@')[1];

  try {
    const records = await resolveMxFn(domain);
    if (records && records.length > 0) {
      return { valid: true, records };
    } else {
      return {
        valid: false,
        reason: ErrorMessages[ErrorCode.NO_MX_RECORDS],
        errorCode: ErrorCode.NO_MX_RECORDS,
      };
    }
  } catch (error) {
    return {
      valid: false,
      reason: `DNS lookup failed: ${error instanceof Error ? error.message : ErrorMessages[ErrorCode.UNKNOWN_ERROR]}`,
      errorCode: ErrorCode.DNS_LOOKUP_FAILED,
    };
  }
};

/**
 * Checks if the domain of an email address is from a disposable email provider.
 *
 * @param {string} email - The email address to check.
 * @return {{ valid: boolean; provider?: string | null; reason?: string }} - Validation result.
 */
const checkDisposableEmail = (
  email: string
): {
  valid: boolean;
  provider?: string | null;
  reason?: string;
  errorCode?: ErrorCode;
} => {
  const domain = email.split('@')[1];
  const isDisposable = isDisposableDomain(domain);

  if (isDisposable) {
    return {
      valid: false,
      provider: domain,
      reason: ErrorMessages[ErrorCode.DISPOSABLE_EMAIL],
      errorCode: ErrorCode.DISPOSABLE_EMAIL,
    };
  }

  return { valid: true, provider: null };
};

/**
 * Parse and validate timeout value
 * @param {string | number} timeout - Timeout value to parse
 * @returns {number} Parsed timeout in milliseconds
 * @throws {Error} If timeout is invalid or non-positive
 * @example
 * parseTimeout(5000)    // 5000 (5 seconds in ms)
 * parseTimeout('5s')    // 5000 (5 seconds)
 * parseTimeout('100ms') // 100 (100 milliseconds)
 * parseTimeout('1m')    // 60000 (1 minute)
 * parseTimeout('1h')    // 3600000 (1 hour)
 */
const parseTimeout = (timeout: ms.StringValue | number): number => {
  let timeoutMs: number;

  if (typeof timeout === 'string') {
    const parsed = ms(timeout as ms.StringValue);
    if (typeof parsed !== 'number' || parsed <= 0) {
      throw new EmailValidationError(
        ErrorCode.INVALID_TIMEOUT_VALUE,
        `Invalid timeout value: ${timeout}`,
        { timeout }
      );
    }
    timeoutMs = parsed;
  } else {
    if (timeout <= 0) {
      throw new EmailValidationError(
        ErrorCode.INVALID_TIMEOUT_VALUE,
        `Invalid timeout value: ${timeout}`,
        { timeout }
      );
    }
    timeoutMs = timeout;
  }

  return timeoutMs;
};

/**
 * A sophisticated email validator that checks both the format of the email
 * address and the existence of MX records for the domain, depending on the
 * options provided.
 *
 * @param {unknown} email - The email address to validate.
 * @param {EmailValidatorOptions|boolean} [opts={}] - An object containing options for the validator
 *  or a boolean indicating whether to check MX records (for backward compatibility).
 * @param {boolean} [opts.checkMx=true] - Determines whether to check for MX
 *  records.
 * @param {boolean} [opts.checkDisposable=false] - Determines whether to check for disposable
 *  email providers.
 * @param {boolean} [opts.detailed=false] - Return detailed validation results instead of boolean.
 * @param {string|number} [opts.timeout='10s'] - The time in ms module format,
 *  such as '2000ms' or '10s', after which the MX validation will be aborted.
 *  The default timeout is 10 seconds.
 * @return {Promise<boolean | ValidationResult>} - Promise that resolves to true/false or detailed results.
 */
const emailValidator = async (
  email: unknown,
  opts: EmailValidatorOptions | boolean = {}
): Promise<boolean | ValidationResult> => {
  // Handle the case where opts is a boolean for backward compatibility
  let options: InternalEmailValidatorOptions;
  if (typeof opts === 'boolean') {
    options = { checkMx: opts };
  } else {
    options = opts as InternalEmailValidatorOptions;
  }

  // Set default values for opts if not provided
  const {
    checkMx = true,
    checkDisposable = false,
    detailed = false,
    timeout = '10s',
    _resolveMx,
  } = options;

  // Convert timeout to milliseconds using helper function
  const timeoutMs = parseTimeout(timeout);

  // Initialize result object for detailed mode
  const result: ValidationResult = {
    valid: true,
    email: '', // Will be set after format validation
    format: { valid: true },
  };

  // Validate the email format
  const formatValidation = validateRfc5322(email);
  result.format = formatValidation;

  if (!formatValidation.valid) {
    result.valid = false;
    result.email = typeof email === 'string' ? email : String(email);
    if (!detailed) return false;
    return result;
  }

  // We know email is a string at this point
  const emailStr = email as string;
  result.email = emailStr;

  // Check for disposable email if required
  if (checkDisposable) {
    const disposableCheck = checkDisposableEmail(emailStr);
    result.disposable = disposableCheck;

    if (!disposableCheck.valid) {
      result.valid = false;
      if (!detailed) return false;
      // In detailed mode, skip MX lookup if disposable check fails to avoid unnecessary network calls
      if (checkMx) {
        result.mx = {
          valid: false,
          reason: ErrorMessages[ErrorCode.MX_SKIPPED_DISPOSABLE],
          errorCode: ErrorCode.MX_SKIPPED_DISPOSABLE,
        };
      }
      return result;
    }
  }

  // Check MX records if required
  if (checkMx) {
    const timeoutController = new AbortController();
    const timeoutPromise = setTimeout(timeoutMs, undefined, {
      signal: timeoutController.signal,
    }).then(() => {
      throw new EmailValidationError(
        ErrorCode.DNS_LOOKUP_TIMEOUT,
        TIMEOUT_ERROR_MESSAGE
      );
    });

    const lookupMx = checkMxRecords(emailStr, _resolveMx).then((mxResult) => {
      timeoutController.abort();
      return mxResult;
    });

    try {
      const mxResult = await Promise.race([lookupMx, timeoutPromise]);
      result.mx = mxResult;

      if (!mxResult.valid) {
        result.valid = false;
        if (!detailed) return false;
      }
    } catch (error) {
      // For timeout errors, always throw regardless of detailed mode
      if (
        error instanceof EmailValidationError &&
        error.code === ErrorCode.DNS_LOOKUP_TIMEOUT
      ) {
        throw error;
      }

      result.mx = {
        valid: false,
        reason:
          error instanceof Error
            ? error.message
            : ErrorMessages[ErrorCode.DNS_LOOKUP_FAILED],
        errorCode:
          error instanceof EmailValidationError
            ? error.code
            : ErrorCode.DNS_LOOKUP_FAILED,
      };
      result.valid = false;
      if (!detailed) return false;
    }
  }

  return detailed ? result : result.valid;
};

export default emailValidator;

/**
 * Error codes enum for programmatic error handling.
 * Use these codes to handle specific validation failures in your application.
 * @see {@link ValidationResult} for how error codes are included in results
 */
export { ErrorCode } from './errors.js';
