import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import routes from './routes';

jest.mock('../middlewares/validateDeidentifyRequest', () => ({
  validateDeidentifyRequest: jest.fn(),
}));

jest.mock('../controllers/deidentifyController', () => ({
  deidentifyController: jest.fn(),
}));

import { validateDeidentifyRequest } from '../middlewares/validateDeidentifyRequest';
import { deidentifyController } from '../controllers/deidentifyController';

const mockedValidate = validateDeidentifyRequest as jest.Mock;
const mockedController = deidentifyController as jest.Mock;

function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use(routes);
  return app;
}

describe('POST /deidentify route', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedValidate.mockImplementation(
      (_request: Request, _response: Response, next: NextFunction) => next(),
    );

    mockedController.mockImplementation(
      (_request: Request, response: Response) => {
        response.status(200).json({ deidentifiedText: '[EMAIL]' });
      },
    );
  });

  it('runs validation and the controller for a valid request', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/deidentify')
      .send({ text: 'john@example.com', entities: ['EMAIL'] });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ deidentifiedText: '[EMAIL]' });
    expect(mockedValidate).toHaveBeenCalledTimes(1);
    expect(mockedController).toHaveBeenCalledTimes(1);
  });

  it('returns 400 and does not call the controller when validation fails', async () => {
    mockedValidate.mockImplementation(
      (_request: Request, response: Response) => {
        response.status(400).json({ error: 'Invalid request' });
      },
    );

    const app = createApp();

    const response = await request(app)
      .post('/deidentify')
      .send({ text: '' });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid request' });
    expect(mockedValidate).toHaveBeenCalledTimes(1);
    expect(mockedController).not.toHaveBeenCalled();
  });
});
