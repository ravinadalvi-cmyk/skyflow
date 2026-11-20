import { NextFunction, Request, Response } from 'express';
import { validateDeidentifyRequest } from './validateDeidentifyRequest';

function createMocks(body: unknown): {
  request: Request;
  response: Response;
  next: jest.MockedFunction<NextFunction>;
  status: jest.Mock;
  json: jest.Mock;
} {
  const json = jest.fn();
  const status = jest.fn(() => ({ json }));
  const response = { status } as unknown as Response;
  const request = { body } as Request;
  const next = jest.fn() as jest.MockedFunction<NextFunction>;

  return { request, response, next, status, json };
}

describe('validateDeidentifyRequest', () => {
  it.each([
    {},
    { text: '' },
    { text: '   ' },
  ])('rejects missing or empty text: %p', (body) => {
    const { request, response, next, status, json } = createMocks(body);

    validateDeidentifyRequest(request, response, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: 'text is required and must be a non-empty string',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    { text: 'hello', entities: 'EMAIL' },
    { text: 'hello', entities: ['EMAIL', 123] },
  ])('rejects an invalid entities array: %p', (body) => {
    const { request, response, next, status, json } = createMocks(body);

    validateDeidentifyRequest(request, response, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: 'entities must be an array of entity names',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects unsupported entity names', () => {
    const { request, response, next, status, json } = createMocks({
      text: 'hello',
      entities: ['EMAIL', 'INVALID_THING'],
    });

    validateDeidentifyRequest(request, response, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unsupported entity names: INVALID_THING',
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it.each([
    { text: 'hello' },
    { text: 'hello', entities: ['EMAIL', 'PHONE'] },
  ])('accepts a valid request: %p', (body) => {
    const { request, response, next, status } = createMocks(body);

    validateDeidentifyRequest(request, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
  });
});
