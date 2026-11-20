import { NextFunction, Request, Response } from 'express';
import { deidentifyText } from '../../services/deidentifyService';

export function deidentifyController(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  try {
    const { text, entities } = request.body as {
      text: string;
      entities?: string[];
    };

    const result = deidentifyText(text, entities);
    response.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
