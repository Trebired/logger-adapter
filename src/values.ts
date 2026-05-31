function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export { isPlainObject, isRecord };
