import type { LoggerAdapterResolveOptions } from "#903rjwb52opy";

const primitiveInitializationKeys = new Set<string>();
const objectInitializationKeys = new WeakMap<object, Set<string>>();

function normalizeSourceKey(source: unknown): string {
  return String(source || "").trim() || "unknown";
}

function initializationIdentity(
  options: Pick<LoggerAdapterResolveOptions, "adapter"|"fallback"|"source">,
  logger: unknown,
): object | null {
  if (typeof options.adapter === "function") return options.adapter;
  if ((typeof logger === "object" && logger) || typeof logger === "function") {
    return logger as object;
  }
  return null;
}

function fallbackInitializationKey(
  options: Pick<LoggerAdapterResolveOptions, "fallback"|"source">,
): string {
  const fallback = options.fallback ?? "console";
  return fallback === "noop" ? "" : `${normalizeSourceKey(options.source)}::fallback:${fallback}`;
}

function markObjectInitialized(identity: object, sourceKey: string): boolean {
  const initialized = objectInitializationKeys.get(identity) || new Set<string>();
  if (initialized.has(sourceKey)) return false;
  initialized.add(sourceKey);
  objectInitializationKeys.set(identity, initialized);
  return true;
}

function shouldLogPackageInitialized(
  options: Pick<LoggerAdapterResolveOptions, "adapter"|"fallback"|"source">,
  logger: unknown,
): boolean {
  const sourceKey = normalizeSourceKey(options.source);
  const identity = initializationIdentity(options, logger);
  if (identity) return markObjectInitialized(identity, sourceKey);

  const fallbackKey = fallbackInitializationKey(options);
  if (!fallbackKey) return true;
  if (primitiveInitializationKeys.has(fallbackKey)) return false;
  primitiveInitializationKeys.add(fallbackKey);
  return true;
}

export { shouldLogPackageInitialized };
