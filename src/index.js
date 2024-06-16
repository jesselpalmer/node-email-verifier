import dns from 'dns';
import util from 'util';
import validator from 'validator';
import ms from 'ms';
import { setTimeout } from 'timers/promises';

// Convert the callback-based dns.resolveMx function into a promise-based one
const resolveMx = util.promisify(dns.resolveMx);

/**
 * Validates an email address against the RFC 5322 standard.
 * 
 * @param {string} email - The email address to validate.
 * @return {boolean} - True if the email address is valid, false otherwise.
 */
const validateRfc5322 = (email) => {
  return typeof email === 'string' && validator.isEmail(email);
};

/**
 * Checks if the domain of an email address has MX (Mail Exchange) records.
 * 
 * @param {string} email - The email address whose MX records are to be checked.
 * @return {Promise<boolean>} - Promise that resolves to true if MX records
 *  exist, false otherwise.
 */
const checkMxRecords = async (email) => {
  const domain = email.split('@')[1];

  try {
    const records = await resolveMx(domain);
    return records && records.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * A sophisticated email validator that checks both the format of the email
 * address and the existence of MX records for the domain, depending on the
 * checkMx parameter.
 * 
 * @param {string} email - The email address to validate.
 * @param {object} opts - An object containing options for the validator,
 * curently supported options are:
 * - checkMx: boolean - Determines whether to check for MX records. Defaults to
 *   true. This option overrides the checkMx parameter.
 * - timeout: number - The time in ms module format, such as '2000ms' or '10s',
 *   after which the MX validation will be aborted. The default timeout is 10
 *   seconds.
 * @param {boolean} checkMx - Determines whether to check for MX records.
 *  Defaults to true.
 * @return {Promise<boolean>} - Promise that resolves to true if the email is
 *  valid, false otherwise.
 */
async function emailValidator(email, opts, checkMx) {
  if (arguments.length === 2 && typeof opts === 'boolean') {
    checkMx = opts;
  }
  else if (arguments.length < 3) {
    checkMx = true;
  }

  opts ||= {};

  if (!('checkMx' in opts)) {
    opts.checkMx = checkMx;
  }

  if (!('timeout' in opts)) {
    opts.timeout = '10s';
  }
  opts.timeout = ms(opts.timeout);

  if (!validateRfc5322(email)) return false;

  if (opts.checkMx) {
    let timeoutController = new AbortController();
    let timeout = setTimeout(opts.timeout, undefined, { signal: timeoutController.signal }).then(() => {
      throw new Error('Domain MX lookup timed out');
    });
    let hasMxRecords = false;
    let lookupMx = checkMxRecords(email).then((res) => {
      hasMxRecords = res;
      timeoutController.abort();
    });
    await Promise.race([lookupMx, timeout]);
    if (!hasMxRecords) return false;
  }

  return true;
};

export default emailValidator;
