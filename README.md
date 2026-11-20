# Rule-Based Text De-identification Service

## Overview

A lightweight Node.js and TypeScript service for identifying and redacting sensitive personally identifiable information (PII) in free-form text.

The service uses custom regular expressions, explicit validation functions, and structured rule processing. It does not use external PII detection APIs, external de-identification services, or machine-learning and PII detection libraries. Text is processed locally by the service.

The HTTP API accepts a text value and an optional list of entity types, then returns the transformed text and detection counts.

## Prerequisites

- Node.js 18 or newer
- npm
- Windows, macOS, or Linux

## Setup and Commands

From the project root:

```powershell
npm install
npm run build
```

Start the server in development mode:

```powershell
npm run dev
```

Start the compiled server:

```powershell
npm start
```

The default server URL is:

```text
http://localhost:3000
```

Set a different port through the environment:

```powershell
$env:PORT=4000
npm run dev
```

Run all tests:

```powershell
npm test
```

Run tests with coverage:

```powershell
npm run test:coverage
```

Run an individual test file:

```powershell
npm test -- src/rules/entityRules.spec.ts --coverage
```

## Supported Entities

| Entity | Detection behavior | Validation and limitations |
|---|---|---|
| `EMAIL` | Matches standard email syntax containing a local part, `@`, and domain. | Suitable for common addresses; may miss quoted local parts or unusual valid formats. |
| `PHONE` | Matches common local and international formats using separators, parentheses, spaces, or dashes. | International numbers are accepted only with a known country code. Formatted numbers without country codes are required to contain formatting characters. Unformatted 10-digit numbers are ignored. |
| `SSN` | Matches the US format `XXX-XX-XXXX`. | Context is not required, so numbers with the same shape may produce false positives. |
| `DATE_OF_BIRTH` | Matches dates following `DOB:` or `DATE OF BIRTH:`. | Both `YYYY-MM-DD` and common numeric slash or dash formats are supported. Only the date portion is redacted; calendar validity is not fully guaranteed. |
| `CREDIT_CARD` | Matches 12–19 separated or unseparated digits. | Applies length checks, repeated-digit rejection, and the Luhn algorithm to reduce false positives. Luhn-valid product or account numbers can still be detected incorrectly. |
| `IP_ADDRESS` | Matches dotted IPv4 candidates. | Each candidate must contain four octets, and every octet must be between `0` and `255`. |

If `entities` is omitted, all six supported entities are processed. If `entities` is supplied, only the listed entities are processed.

## API Usage

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

### De-identify Text

```http
POST /deidentify
Content-Type: application/json
```

Request body:

```json
{
  "text": "Patient can be reached at john.doe@example.com or +1-415-555-0134. SSN: 123-45-6789. DOB: 1990-05-12. IP: 192.168.1.1. Card: 4242-4242-4242-4242.",
  "entities": ["EMAIL", "PHONE", "SSN", "DATE_OF_BIRTH", "CREDIT_CARD", "IP_ADDRESS"]
}
```

The `entities` property is optional:

```json
{
  "text": "Contact john.doe@example.com or leave SSN 123-45-6789 unchanged.",
  "entities": ["EMAIL"]
}
```

Expected response:

```json
{
  "deidentifiedText": "Patient can be reached at [EMAIL] or [PHONE]. SSN: [SSN]. DOB: [DATE_OF_BIRTH]. IP: [IP_ADDRESS]. Card: [CREDIT_CARD].",
  "entitiesDetected": {
    "CREDIT_CARD": 1,
    "SSN": 1,
    "IP_ADDRESS": 1,
    "DATE_OF_BIRTH": 1,
    "EMAIL": 1,
    "PHONE": 1
  }
}
```

The placeholder names correspond to the entity names provided by the caller.

## Validation Responses

An empty or missing `text` value returns HTTP `400`:

```json
{
  "error": "text is required and must be a non-empty string"
}
```

An invalid `entities` value also returns HTTP `400`:

```json
{
  "error": "entities must be an array of entity names"
}
```

Unsupported entity names return HTTP `400` and list the supported names:

```json
{
  "error": "Unsupported entity names: INVALID_THING",
  "supportedEntities": ["EMAIL", "PHONE", "SSN", "DATE_OF_BIRTH", "CREDIT_CARD", "IP_ADDRESS"]
}
```

## Design Decisions and Architecture

### Rules

The `src/rules/` directory contains modular entity definitions and custom validators:

- Each rule has a regular expression.
- Rules may provide an additional validation function.
- Validators enforce constraints that regex alone cannot reliably express.
- Credit cards use Luhn validation.
- Phone numbers validate known international country codes and require formatting for unqualified local numbers.
- IPv4 addresses validate every octet's numeric range.

### Services

The `src/services/` directory contains the text-processing logic.

The service:

1. Accepts text and an optional entity selection.
2. Processes entity rules in a deterministic order.
3. Replaces validated matches with placeholders.
4. Counts detections for each entity.
5. Returns an object containing the transformed text and counts.

Keeping this logic outside Express makes it reusable in HTTP endpoints, scripts, and future batch-processing workflows.

### API Layer

The `src/api/` directory separates web concerns:

- `routes/` maps HTTP routes to middleware and controllers.
- `middlewares/` validates request payloads before processing.
- `controllers/` invokes the service and returns HTTP responses.

Express configuration and server startup are separated as well:

- `src/app.ts` configures the Express application.
- `src/server.ts` starts the HTTP listener.

### Overlap Prevention

Rules are processed from most restrictive to more general patterns:

```text
CREDIT_CARD, SSN, IP_ADDRESS, DATE_OF_BIRTH, EMAIL, PHONE
```

This helps prevent a matched credit card or other structured value from being processed a second time by a broader phone pattern. Detected values are replaced with placeholders before remaining rules execute.

## Testing

Jest tests cover:

- Individual regex patterns and validators
- Full and partial de-identification
- Invalid and missing input
- Overlapping entity detection
- Request middleware behavior
- Controller success and error handling
- Route registration and middleware sequencing

TypeScript tests are compiled with `ts-jest`.

## Known Limitations and Trade-offs

- This system is intentionally rule-based rather than probabilistic; it can miss valid PII and produce false positives.
- A 9-digit product or account identifier shaped like `XXX-XX-XXXX` can be mistaken for an SSN.
- A Luhn-valid but non-credit-card numeric sequence can be flagged as a card number.
- Phone detection does not validate every international numbering plan or mobile/operator prefix.
- IPv4 strings may be matched even when used in non-network contexts.
- Dates are detected in explicit DOB contexts and do not validate leap years or every calendar edge case.
- Person names are not redacted by default. Reliable name detection in free-form text is difficult and prone to error without NLP or a machine-learning model.
- Regular-expression limits can differ from officially valid email and address formats.

These trade-offs favor transparency, speed, maintainability, and local processing over exhaustive PII recognition.

## Future Improvements

Potential enhancements include:

- Batch processing for arrays of text records
- Context-based name detection with strict, opt-in patterns
- Additional international phone and SSN formats
- Configurable rule definitions and custom entity rules
- Date and address validation with context-aware rules
- Confidence scores for detections
- Audit logging with strict data-retention controls
- A dedicated error-handling middleware
- Integration tests against a running Express application
- More extensive fuzz, Unicode, punctuation, and overlap testing

## Security Note

All input processing happens inside the application process. The service does not send text to an external API or third-party service. Operators should still avoid retaining request logs containing sensitive input and should add appropriate authentication, rate limiting, TLS, and secure logging controls before production use.
