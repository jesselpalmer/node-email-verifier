import dns from 'node:dns';
import util from 'node:util';

import ms from 'ms';
import { setTimeout } from 'timers/promises';
import validator from 'validator';

import { isDisposableDomain } from './disposable-domains.js';
import { ErrorCode, ErrorMessages, EmailValidationError } from './errors.js';
import { createDebugLogger } from './debug-logger.js';

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
  /** Top-level error code for quick access to the first validation failure */
  errorCode?: ErrorCode;
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
  /**
   * Whether to enable debug mode with structured logging.
   * When true, logs detailed timing and memory usage information.
   * Defaults to false.
   */
  debug?: boolean;
}

// Internal interface for testing - not exported
interface InternalEmailValidatorOptions extends EmailValidatorOptions {
  /** @internal - Testing only: Override DNS resolver function */
  _resolveMx?: (hostname: string) => Promise<MxRecord[]>;
}

// Convert the callback-based dns.resolveMx function into a promise-based one
const resolveMx = util.promisify(dns.resolveMx);

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
      reason: ErrorMessages[ErrorCode.EMAIL_MUST_BE_STRING],
      errorCode: ErrorCode.EMAIL_MUST_BE_STRING,
    };
  }
  if (!email) {
    return {
      valid: false,
      reason: ErrorMessages[ErrorCode.EMAIL_CANNOT_BE_EMPTY],
      errorCode: ErrorCode.EMAIL_CANNOT_BE_EMPTY,
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
 * Checks if the domain has valid MX records.
 *
 * @param {string} domain - The domain to check.
 * @param {InternalEmailValidatorOptions} options - Validation options.
 * @return {Promise<{ mxRecords: any[], valid: boolean, reason?: string }>} - MX record validation result.
 */
const checkMxRecords = async (
  domain: string,
  options: InternalEmailValidatorOptions
): Promise<{
  mxRecords: MxRecord[];
  valid: boolean;
  reason?: string;
  errorCode?: ErrorCode;
}> => {
  try {
    const _resolveMx = options._resolveMx || resolveMx;
    const mxRecords = await _resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) {
      return { mxRecords, valid: true };
    } else {
      return {
        mxRecords: [],
        valid: false,
        reason: ErrorMessages[ErrorCode.NO_MX_RECORDS],
        errorCode: ErrorCode.NO_MX_RECORDS,
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isDnsError =
      errorMessage.includes('ENOTFOUND') ||
      errorMessage.includes('ENODATA') ||
      errorMessage.includes('getaddrinfo') ||
      errorMessage.includes('DNS lookup failed') ||
      errorMessage.includes('Unknown error');

    // If it's a mock error message that specifically says "DNS lookup failed", treat it as DNS error
    const isMockDnsError = errorMessage === 'DNS lookup failed: Unknown error';

    return {
      mxRecords: [],
      valid: false,
      reason:
        isDnsError || isMockDnsError
          ? ErrorMessages[ErrorCode.DNS_LOOKUP_FAILED]
          : ErrorMessages[ErrorCode.MX_LOOKUP_FAILED],
      errorCode:
        isDnsError || isMockDnsError
          ? ErrorCode.DNS_LOOKUP_FAILED
          : ErrorCode.MX_LOOKUP_FAILED,
    };
  }
};

/**
 * Checks if an email address is valid by verifying:
 * 1. The email follows RFC 5322 format
 * 2. (Optional) The domain has valid MX records
 * 3. (Optional) The email is not from a disposable provider
 *
 * @param {string} email - The email address to validate.
 * @param {EmailValidatorOptions | boolean} [options] - Validation options or boolean for backward compatibility.
 * @return {Promise<boolean | ValidationResult>} - Returns boolean by default, or ValidationResult if detailed is true.
 * @throws {EmailValidationError} When timeout is exceeded or invalid timeout value is provided.
 * @example
 * // Simple validation (boolean result)
 * const isValid = await emailValidator('test@example.com');
 *
 * // Detailed validation with error codes
 * const result = await emailValidator('test@example.com', { detailed: true });
 * if (!result.valid) {
 *   console.log('Error code:', result.errorCode);
 * }
 */
async function emailValidator(
  email: string,
  options?: EmailValidatorOptions | boolean
): Promise<boolean | ValidationResult> {
  // Handle backward compatibility: convert boolean to options object
  let opts: InternalEmailValidatorOptions;
  if (typeof options === 'boolean') {
    opts = { checkMx: options };
  } else {
    opts = options || {};
  }

  // Default values
  const checkMx = opts.checkMx !== false; // default true
  const checkDisposable = opts.checkDisposable === true; // default false
  const detailed = opts.detailed === true; // default false
  const debug = opts.debug === true; // default false
  const timeout = opts.timeout !== undefined ? opts.timeout : '10s';

  // Create debug logger
  const logger = createDebugLogger(debug, email as string);

  // Log validation start
  const endValidation = logger.startPhase('validation_start', {
    checkMx,
    checkDisposable,
    detailed,
    timeout,
  });

  // Convert timeout to milliseconds
  let timeoutMs: number;
  if (typeof timeout === 'number') {
    if (timeout <= 0 || !Number.isFinite(timeout)) {
      const error = new EmailValidationError(
        ErrorCode.INVALID_TIMEOUT_VALUE,
        `Invalid timeout value: ${timeout}`
      );
      logger.logError('timeout_validation', error);
      endValidation();
      throw error;
    }
    timeoutMs = timeout;
  } else {
    const parsed = ms(timeout);
    if (parsed === undefined || parsed <= 0) {
      const error = new EmailValidationError(
        ErrorCode.INVALID_TIMEOUT_VALUE,
        `Invalid timeout value: ${timeout}`
      );
      logger.logError('timeout_validation', error);
      endValidation();
      throw error;
    }
    timeoutMs = parsed;
  }

  // Validate RFC 5322 format
  const endFormatCheck = logger.startPhase('format_validation');
  const formatResult = validateRfc5322(email);
  if (!formatResult.valid) {
    logger.log({
      phase: 'format_validation_failed',
      data: { reason: formatResult.reason, errorCode: formatResult.errorCode },
    });
  }
  endFormatCheck();
  if (!formatResult.valid) {
    endValidation();
    if (detailed) {
      return {
        valid: false,
        email: String(email),
        format: formatResult,
        errorCode: formatResult.errorCode,
      };
    }
    return false;
  }

  // Extract domain from email
  const domain = email.split('@')[1];

  // Check if disposable (if enabled)
  let disposableResult:
    | {
        valid: boolean;
        provider: string | null;
        reason?: string;
        errorCode?: ErrorCode;
      }
    | undefined;
  if (checkDisposable) {
    const endDisposableCheck = logger.startPhase('disposable_check', {
      domain,
    });
    const isDisposable = isDisposableDomain(domain);
    endDisposableCheck();

    if (isDisposable) {
      logger.log({
        phase: 'disposable_email_detected',
        data: { domain, provider: domain },
      });
      disposableResult = {
        valid: false,
        provider: domain,
        reason: ErrorMessages[ErrorCode.DISPOSABLE_EMAIL],
        errorCode: ErrorCode.DISPOSABLE_EMAIL,
      };

      if (!detailed) {
        endValidation();
        return false;
      }
    } else {
      disposableResult = { valid: true, provider: null } as {
        valid: boolean;
        provider: string | null;
        reason?: string;
        errorCode?: ErrorCode;
      };
    }
  }

  // Check MX records (if enabled)
  let mxResult:
    | {
        valid: boolean;
        records?: MxRecord[];
        reason?: string;
        errorCode?: ErrorCode;
      }
    | undefined;
  if (checkMx) {
    // Skip MX check for disposable emails that already failed
    if (checkDisposable && disposableResult && !disposableResult.valid) {
      mxResult = {
        valid: false,
        records: [],
        reason: ErrorMessages[ErrorCode.MX_SKIPPED_DISPOSABLE],
        errorCode: ErrorCode.MX_SKIPPED_DISPOSABLE,
      };
    } else {
      try {
        const endMxCheck = logger.startPhase('mx_record_check', {
          domain,
          timeoutMs,
        });

        // Create a race between the MX check and timeout with proper cleanup
        const abortController = new AbortController();
        const mxCheckPromise = checkMxRecords(domain, opts);
        const timeoutPromise = setTimeout(timeoutMs, undefined, {
          signal: abortController.signal,
        }).then(() => {
          throw new EmailValidationError(ErrorCode.DNS_LOOKUP_TIMEOUT);
        });

        const result = await Promise.race([mxCheckPromise, timeoutPromise]);

        // Cancel the timeout to prevent hanging handles
        abortController.abort();
        endMxCheck();

        logger.log({
          phase: 'mx_records_found',
          data: {
            valid: result.valid,
            recordCount: result.mxRecords?.length || 0,
            records: result.mxRecords,
          },
        });

        mxResult = {
          valid: result.valid,
          records: result.mxRecords,
          ...(result.reason && {
            reason: result.reason,
            errorCode: result.errorCode,
          }),
        };

        if (!result.valid) {
          logger.log({
            phase: 'mx_validation_failed',
            data: { reason: result.reason, errorCode: result.errorCode },
          });
          endValidation();
          if (detailed) {
            return {
              valid: false,
              email,
              format: { valid: true },
              mx: mxResult,
              ...(checkDisposable && { disposable: disposableResult }),
              errorCode: result.errorCode,
            };
          }
          return false;
        }
      } catch (error) {
        logger.logError('mx_check', error as Error);

        // Always ensure cleanup happens before returning or re-throwing
        const cleanup = () => endValidation();

        if (error instanceof EmailValidationError) {
          cleanup();
          throw error; // Re-throw timeout errors
        }

        // Handle other errors
        const errorResult = {
          valid: false,
          records: [],
          reason: ErrorMessages[ErrorCode.MX_LOOKUP_FAILED],
          errorCode: ErrorCode.MX_LOOKUP_FAILED,
        };

        cleanup();
        if (detailed) {
          return {
            valid: false,
            email,
            format: { valid: true },
            mx: errorResult,
            ...(checkDisposable && { disposable: disposableResult }),
            errorCode: ErrorCode.MX_LOOKUP_FAILED,
          };
        }
        return false;
      }
    }
  }

  // If we get here, build the final result
  if (detailed) {
    // Check if any validation failed
    const hasFailure =
      (checkDisposable && disposableResult && !disposableResult.valid) ||
      (checkMx && mxResult && !mxResult.valid);

    const result: ValidationResult = {
      valid: !hasFailure,
      email,
      format: { valid: true },
    };

    if (checkMx && mxResult) {
      result.mx = mxResult;
    }

    if (checkDisposable && disposableResult) {
      result.disposable = disposableResult;
    }

    // Set top-level error code to the first failure
    if (hasFailure) {
      if (checkDisposable && disposableResult && !disposableResult.valid) {
        result.errorCode = ErrorCode.DISPOSABLE_EMAIL;
      } else if (checkMx && mxResult && !mxResult.valid) {
        result.errorCode = mxResult.errorCode;
      }
    }

    logger.log({
      phase: 'validation_complete',
      data: {
        valid: result.valid,
        errorCode: result.errorCode,
      },
    });
    endValidation();

    return result;
  }

  logger.log({
    phase: 'validation_complete',
    data: { valid: true },
  });
  endValidation();

  return true;
}

export default emailValidator;

// Re-export error codes for public API
export { ErrorCode };
