const doesContainAtLeastOnePeriod = str => str.includes('.')
const doesContainAtSymbol = str => str.includes('@')

const isEmailValid = str => { return doesContainAtLeastOnePeriod(str) &&
                              doesContainAtSymbol(str) &&
                              doesContainCorrectTld(str) }

const emailAddresses = ['jesselpalmer@gmail.com']
