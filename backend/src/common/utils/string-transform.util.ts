export function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function trimAndUppercaseString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}
