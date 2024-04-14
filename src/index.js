import dns from 'dns';
import util from 'util';
import validator from 'validator';

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
 * @param {boolean} checkMx - Determines whether to check for MX records.
 *  Defaults to true.
 * @return {Promise<boolean>} - Promise that resolves to true if the email is
 *  valid, false otherwise.
 */
const emailValidator = async (email, checkMx = true) => {
  if (!validateRfc5322(email)) return false;

  if (checkMx) {
    const hasMxRecords = await checkMxRecords(email);
    if (!hasMxRecords) return false;
  }

  return true;
};

export default emailValidator;
