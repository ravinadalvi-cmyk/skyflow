import { NextFunction, Request, Response } from 'express';
import { deidentifyController } from './deidentifyController';
import { deidentifyText } from '../../services/deidentifyService';

jest.mock('../../services/deidentifyService', () => ({
  deidentifyText: jest.fn(),
}));

const mockedDeidentifyText = deidentifyText as jest.MockedFunction<typeof deidentifyText>;

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

describe('deidentifyController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls the service and returns the de-identification result', () => {
    const result = {
      deidentifiedText: 'Email [EMAIL]',
      entitiesDetected: { EMAIL: 1 },
    };

    mockedDeidentifyText.mockReturnValue(result);

    const { request, response, next, status, json } = createMocks({
      text: 'Email john.doe@example.com',
      entities: ['EMAIL'],
    });

    deidentifyController(request, response, next);

    expect(mockedDeidentifyText).toHaveBeenCalledWith(
      'Email john.doe@example.com',
      ['EMAIL'],
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(result);
    expect(next).not.toHaveBeenCalled();
  });

  it('passes service errors to next', () => {
    const error = new Error('De-identification failed');
    mockedDeidentifyText.mockImplementation(() => {
      throw error;
    });

    const { request, response, next } = createMocks({
      text: 'Hello',
    });

    deidentifyController(request, response, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(error);
  });
});
