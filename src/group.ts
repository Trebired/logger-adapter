function cleanGroup(value: unknown): string {
  return String(value || "").trim().replace(new RegExp("^\\.+|\\.+$", "g"), "");
}

function applyGroupPrefix(group: string, prefix?: string): string {
  const normalizedGroup = cleanGroup(group);
  const normalizedPrefix = cleanGroup(prefix);

  if (!normalizedPrefix) return normalizedGroup;
  if (!normalizedGroup) return normalizedPrefix;
  if (normalizedGroup === normalizedPrefix || normalizedGroup.startsWith(`${normalizedPrefix}.`)) {
    return normalizedGroup;
  }

  return `${normalizedPrefix}.${normalizedGroup}`;
}

function applyInitializationGroupPrefix(group: string | undefined, prefix?: string): string {
  const normalizedGroup = cleanGroup(group);
  const suffix = !normalizedGroup || normalizedGroup === "initialize"
  ? "initialize"
  : normalizedGroup.endsWith(".initialize")
  ? normalizedGroup
  : `${normalizedGroup}.initialize`;
  return applyGroupPrefix(suffix, prefix);
}

export { applyGroupPrefix, applyInitializationGroupPrefix };
