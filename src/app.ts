import express, { Request, Response } from 'express';
import deidentifyRoutes from './api/routes/routes';

export const app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_request: Request, response: Response) => {
  response.status(200).json({ status: 'ok' });
});

app.use(deidentifyRoutes);
