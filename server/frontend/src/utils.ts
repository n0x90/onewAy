function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function convert_snake_case_to_pascal_case(value: string): string {
  return value
    .split('_')
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
}

export function convertSnakeCaseToCamelCase(value: string): string {
  const pascalCase = convert_snake_case_to_pascal_case(value);
  if (pascalCase.length === 0) return pascalCase;
  return pascalCase[0].toLowerCase() + pascalCase.slice(1);
}

export function convertCamelCaseToSnakeCase(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function convertObjectKeysToCamelCase<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => convertObjectKeysToCamelCase(item)) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const output: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    output[convertSnakeCaseToCamelCase(key)] =
      convertObjectKeysToCamelCase(nestedValue);
  }

  return output as T;
}

export function convertObjectKeysToSnakeCase<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => convertObjectKeysToSnakeCase(item)) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const output: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    output[convertCamelCaseToSnakeCase(key)] =
      convertObjectKeysToSnakeCase(nestedValue);
  }

  return output as T;
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return 'N/A';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
