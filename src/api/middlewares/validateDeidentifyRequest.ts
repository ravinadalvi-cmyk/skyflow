import { NextFunction, Request, Response } from 'express';
import { EntityType } from '../../rules/entityRules';

export const supportedEntities: EntityType[] = [
  'EMAIL',
  'PHONE',
  'SSN',
  'DATE_OF_BIRTH',
  'CREDIT_CARD',
  'IP_ADDRESS',
];

export function validateDeidentifyRequest(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  const { text, entities } = request.body as {
    text?: unknown;
    entities?: unknown;
  };

  if (typeof text !== 'string' || text.trim().length === 0) {
    response.status(400).json({
      error: 'text is required and must be a non-empty string',
    });
    return;
  }

  if (entities !== undefined) {
    if (
      !Array.isArray(entities)
      || entities.some((entity) => typeof entity !== 'string')
    ) {
      response.status(400).json({
        error: 'entities must be an array of entity names',
      });
      return;
    }

    const invalidEntities = (entities as string[]).filter(
      (entity) => !supportedEntities.includes(entity as EntityType),
    );

    if (invalidEntities.length > 0) {
      response.status(400).json({
        error: `Unsupported entity names: ${invalidEntities.join(', ')}`,
        supportedEntities,
      });
      return;
    }
  }

  next();
}
