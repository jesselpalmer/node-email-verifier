import dns from 'dns';
import util from 'util';
import validator from 'validator';

const resolveMx = util.promisify(dns.resolveMx);

const validateRfc5322 = (email) => {
  return validator.isEmail(email);
};

const checkMxRecords = async (email) => {
  const domain = email.split('@')[1];
  try {
    const records = await resolveMx(domain);
    return records && records.length > 0;
  } catch (error) {
    return false;
  }
}

const sophisticatedEmailValidator = async (email) => {
  if (!validateRfc5322(email)) return false;

  const hasMxRecords = await checkMxRecords(email);
  if (!hasMxRecords) return false;

  return true;
}
