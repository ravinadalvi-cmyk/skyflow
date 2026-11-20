import {
  entityRules,
  isValidIpv4,
  luhnValidate,
  validatePhone,
} from './entityRules';

function matchesRegex(pattern: RegExp, value: string): boolean {
  pattern.lastIndex = 0;
  return pattern.test(value);
}

describe('luhnValidate', () => {
  it('accepts a valid 16-digit credit card number', () => {
    expect(luhnValidate('4242424242424242')).toBe(true);
  });

  it('rejects an invalid 16-digit credit card number', () => {
    expect(luhnValidate('4242424242424241')).toBe(false);
  });

  it('rejects credit card numbers below 12 digits', () => {
    expect(luhnValidate('12345678911')).toBe(false);
  });

  it('rejects credit card numbers above 19 digits', () => {
    expect(luhnValidate('12345678901234567890')).toBe(false);
  });
});

describe('isValidIpv4', () => {
  it('accepts a valid IPv4 address', () => {
    expect(isValidIpv4('192.168.1.1')).toBe(true);
  });

  it('rejects IPv4 addresses containing octets above 255', () => {
    expect(isValidIpv4('999.999.999.999')).toBe(false);
    expect(isValidIpv4('256.0.0.1')).toBe(false);
  });
});

describe('validatePhone', () => {
  it('accepts a formatted phone with a known country code', () => {
    expect(validatePhone('+1-415-555-0134')).toBe(true);
  });

  it('rejects a phone with an invalid country code', () => {
    expect(validatePhone('+89-415-555-0134')).toBe(false);
  });

  it('accepts a formatted 10-digit phone without a country code', () => {
    expect(validatePhone('(415) 555-0134')).toBe(true);
  });

  it('rejects an unformatted 10-digit number', () => {
    expect(validatePhone('1234567890')).toBe(false);
  });
});

describe('entity regex patterns', () => {
  it('matches a standard email address', () => {
    expect(matchesRegex(entityRules.EMAIL.pattern, 'john.doe@example.com')).toBe(true);
  });

  it('matches a standard US SSN', () => {
    expect(matchesRegex(entityRules.SSN.pattern, '123-45-6789')).toBe(true);
  });

  it('matches a date of birth context and captures the date', () => {
    expect(matchesRegex(entityRules.DATE_OF_BIRTH.pattern, 'DOB: 1990-05-12')).toBe(true);
  });
});
