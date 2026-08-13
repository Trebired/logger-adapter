function cleanGroup(value: unknown): string {
  return String(value || "").trim().replace(new RegExp("^\\.+|\\.+$", "g"), "");
}

function applyGroupPrefix(group: string, prefix?: false | string): string {
  const normalizedGroup = cleanGroup(group);
  const normalizedPrefix = cleanGroup(prefix);

  if (!normalizedPrefix) return normalizedGroup;
  if (!normalizedGroup) return normalizedPrefix;
  if (normalizedGroup === normalizedPrefix || normalizedGroup.startsWith(`${normalizedPrefix}.`)) {
    return normalizedGroup;
  }

  return `${normalizedPrefix}.${normalizedGroup}`;
}

function applyInitializationGroupPrefix(group: string | undefined, prefix?: false | string): string {
  const normalizedGroup = cleanGroup(group);
  const suffix = !normalizedGroup || normalizedGroup === "initialize"
  ? "initialize"
  : normalizedGroup.endsWith(".initialize")
  ? normalizedGroup
  : `${normalizedGroup}.initialize`;
  return applyGroupPrefix(suffix, prefix);
}

function sourcePackagePrefix(source: unknown): false | string {
  const raw = cleanGroup(source);
  if (!raw) return false;
  const scoped = new RegExp("^@([^/]+)/(.+)$", "u").exec(raw);
  if (!scoped) return false;
  return cleanGroup(`${scoped[1]}.${scoped[2]}`.replace(new RegExp("[/@]+", "g"), "."));
}

export { applyGroupPrefix, applyInitializationGroupPrefix, sourcePackagePrefix };
