export type EntityType =
  | 'EMAIL'
  | 'PHONE'
  | 'SSN'
  | 'DATE_OF_BIRTH'
  | 'CREDIT_CARD'
  | 'IP_ADDRESS';

export interface EntityRule {
  pattern: RegExp;
  validate?: (value: string) => boolean;
}

export function luhnValidate(value: string): boolean {
  const digits = value.replace(/[^0-9]/g, '');

  if (digits.length < 12 || digits.length > 19) {
    return false;
  }

  if (/^(.)\1+$/.test(digits)) {
    return false;
  }

  let sum = 0;
  let doubleDigit = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);

    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    doubleDigit = !doubleDigit;
  }

  return sum % 10 === 0;
}

export const VALID_COUNTRY_CODES = new Set([
  '1', '7', '20', '27', '30', '31', '32', '33', '34', '36', '39',
  '40', '41', '43', '44', '45', '46', '47', '48', '49', '51', '52',
  '53', '54', '55', '56', '57', '58', '60', '61', '62', '63', '64',
  '65', '66', '81', '82', '84', '90', '91', '92', '93', '94', '95',
  '98',
]);

export function validatePhone(value: string): boolean {
  if (value.startsWith('+')) {
    const digits = value.slice(1).match(/^\d+/)?.[0];

    if (!digits) {
      return false;
    }

    for (let length = Math.min(3, digits.length); length >= 1; length -= 1) {
      if (VALID_COUNTRY_CODES.has(digits.slice(0, length))) {
        return true;
      }
    }

    return false;
  }

  return /[\s().-]/.test(value);
}

export function isValidIpv4(value: string): boolean {
  const octets = value.split('.');

  if (octets.length !== 4) {
    return false;
  }

  return octets.every((octet) => {
    if (!/^\d{1,3}$/.test(octet)) {
      return false;
    }

    const number = Number(octet);
    return number >= 0 && number <= 255;
  });
}

export const entityRules: Record<EntityType, EntityRule> = {
  EMAIL: {
    pattern: /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+/gi,
  },

  PHONE: {
    pattern: /(?<![\w+])(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?|\d{2,4}[\s.-])?\d{3}[\s.-]\d{4}(?!\w)/g,
    validate: validatePhone,
  },

  SSN: {
    pattern: /(?<!\d)\d{3}-\d{2}-\d{4}(?!\d)/g,
  },

  DATE_OF_BIRTH: {
    pattern: /\b(?:DOB|DATE\s+OF\s+BIRTH)\s*:\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{4})/gi,
  },

  IP_ADDRESS: {
    pattern: /(?<![\d.])(?:\d{1,3}\.){3}\d{1,3}(?![\d.])/g,
    validate: isValidIpv4,
  },

  CREDIT_CARD: {
    pattern: /(?<!\d)(?:\d[ -]?){11,18}\d(?!\d)/g,
    validate: luhnValidate,
  },
};
