import {
  entityRules,
  EntityType,
} from '../rules/entityRules';

export type EntitiesDetected = Partial<Record<EntityType, number>>;

export interface DeidentificationResult {
  deidentifiedText: string;
  entitiesDetected: EntitiesDetected;
}

const ALL_ENTITIES: EntityType[] = [
  'CREDIT_CARD',
  'SSN',
  'IP_ADDRESS',
  'DATE_OF_BIRTH',
  'EMAIL',
  'PHONE',
];

function isEntityType(value: string): value is EntityType {
  return ALL_ENTITIES.includes(value as EntityType);
}

export function deidentifyText(
  text: string,
  requestedEntities?: string[],
): DeidentificationResult {
  if (typeof text !== 'string') {
    throw new TypeError('text must be a string');
  }

  const entityList = requestedEntities == null
    ? ALL_ENTITIES
    : [...new Set(requestedEntities.filter(isEntityType))];

  let deidentifiedText = text;
  const entitiesDetected: EntitiesDetected = {};

  for (const entityType of entityList) {
    const rule = entityRules[entityType];
    let count = 0;

    rule.pattern.lastIndex = 0;

    deidentifiedText = deidentifiedText.replace(rule.pattern, (...args: unknown[]) => {
      const fullMatch = String(args[0]);
      const captureGroups = args.slice(1, -2);

      let matchValue = fullMatch;

      if (entityType === 'DATE_OF_BIRTH' && typeof captureGroups[0] === 'string') {
        matchValue = captureGroups[0];
      }

      if (rule.validate && !rule.validate(matchValue)) {
        return fullMatch;
      }

      count += 1;

      if (entityType === 'DATE_OF_BIRTH') {
        return fullMatch.replace(matchValue, `[${entityType}]`);
      }

      return `[${entityType}]`;
    });

    entitiesDetected[entityType] = count;
  }

  return {
    deidentifiedText,
    entitiesDetected,
  };
}
