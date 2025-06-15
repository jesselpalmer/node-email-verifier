import dns from 'node:dns';
import util from 'node:util';

import ms from 'ms';
import { setTimeout } from 'timers/promises';
import validator from 'validator';

import { isDisposableDomain } from './disposable-domains.js';

// Define MX record type to match Node.js dns module
interface MxRecord {
  exchange: string;
  priority: number;
}

// Define validation result interface
export interface ValidationResult {
  valid: boolean;
  email: string;
  format: {
    valid: boolean;
    reason?: string;
  };
  mx?: {
    valid: boolean;
    records?: MxRecord[];
    reason?: string;
  };
  disposable?: {
    valid: boolean;
    provider?: string | null;
    reason?: string;
  };
}

// Define the public options type
export interface EmailValidatorOptions {
  checkMx?: boolean;
  timeout?: string | number;
  checkDisposable?: boolean;
  detailed?: boolean;
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
): { valid: boolean; reason?: string } => {
  if (typeof email !== 'string') {
    return { valid: false, reason: 'Email must be a string' };
  }
  if (!email) {
    return { valid: false, reason: 'Email cannot be empty' };
  }
  if (!validator.isEmail(email)) {
    return { valid: false, reason: 'Invalid email format' };
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
): Promise<{ valid: boolean; records?: MxRecord[]; reason?: string }> => {
  const domain = email.split('@')[1];

  try {
    const records = await resolveMxFn(domain);
    if (records && records.length > 0) {
      return { valid: true, records };
    } else {
      return { valid: false, reason: 'No MX records found' };
    }
  } catch (error) {
    return {
      valid: false,
      reason: `DNS lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
): { valid: boolean; provider?: string | null; reason?: string } => {
  const domain = email.split('@')[1];
  const isDisposable = isDisposableDomain(domain);

  if (isDisposable) {
    return {
      valid: false,
      provider: domain,
      reason: 'Email from disposable provider',
    };
  }

  return { valid: true, provider: null };
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

  // Convert timeout to milliseconds
  const timeoutMs = typeof timeout === 'string' ? ms(timeout) : timeout;

  // Initialize result object for detailed mode
  const result: ValidationResult = {
    valid: true,
    email: typeof email === 'string' ? email : String(email),
    format: { valid: true },
  };

  // Validate the email format
  const formatValidation = validateRfc5322(email);
  result.format = formatValidation;

  if (!formatValidation.valid) {
    result.valid = false;
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
    }
  }

  // Check MX records if required
  if (checkMx) {
    const timeoutController = new AbortController();
    const timeoutPromise = setTimeout(timeoutMs, undefined, {
      signal: timeoutController.signal,
    }).then(() => {
      throw new Error('Domain MX lookup timed out');
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
      result.mx = {
        valid: false,
        reason: error instanceof Error ? error.message : 'MX lookup failed',
      };
      result.valid = false;
      if (!detailed) return false;
    }
  }

  return detailed ? result : result.valid;
};

export default emailValidator;
