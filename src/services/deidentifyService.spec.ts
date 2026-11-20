import { deidentifyText } from './deidentifyService';

describe('deidentifyText', () => {
  it('de-identifies all supported entities and keeps the DOB context', () => {
    const input = 'Email john.doe@example.com, SSN 123-45-6789, card 4242-4242-4242-4242, IP 192.168.1.1, phone +1-415-555-0134, DOB: 1990-05-12.';

    const result = deidentifyText(input);

    expect(result.deidentifiedText).toBe(
      'Email [EMAIL], SSN [SSN], card [CREDIT_CARD], IP [IP_ADDRESS], phone [PHONE], DOB: [DATE_OF_BIRTH].',
    );
    expect(result.entitiesDetected).toEqual({
      CREDIT_CARD: 1,
      SSN: 1,
      IP_ADDRESS: 1,
      DATE_OF_BIRTH: 1,
      EMAIL: 1,
      PHONE: 1,
    });
  });

  it('de-identifies only selected entities', () => {
    const input = 'Email john.doe@example.com and SSN 123-45-6789.';

    const result = deidentifyText(input, ['EMAIL']);

    expect(result.deidentifiedText).toBe('Email [EMAIL] and SSN 123-45-6789.');
    expect(result.entitiesDetected).toEqual({ EMAIL: 1 });
  });

  it('throws a TypeError for non-string text', () => {
    expect(() => deidentifyText(123 as unknown as string)).toThrow(TypeError);
    expect(() => deidentifyText(null as unknown as string)).toThrow(TypeError);
  });

  it('prevents a dashed credit card from being intercepted by the phone rule', () => {
    const result = deidentifyText('Card: 4242-4242-4242-4242');

    expect(result.deidentifiedText).toBe('Card: [CREDIT_CARD]');
    expect(result.entitiesDetected.CREDIT_CARD).toBe(1);
    expect(result.entitiesDetected.PHONE).toBe(0);
  });
});
