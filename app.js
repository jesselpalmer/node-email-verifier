import dns from 'dns';
import util from 'util';

const resolveMx = util.promisify(dns.resolveMx);

async function checkMxRecords(email) {
  const domain = email.split('@')[1];
  try {
    const records = await resolveMx(domain);
    return records && records.length > 0;
  } catch (error) {
    return false;
  }
}

const doesContainAtLeastOnePeriod = str => str.includes('.')
const doesContainAtSymbol = str => str.includes('@')

const isEmailValid = str => { return doesContainAtLeastOnePeriod(str) &&
                              doesContainAtSymbol(str) &&
                              doesContainCorrectTld(str) }

const emailAddresses = ['jesselpalmer@gmail.com']
