import *as packageLogger from "@package/logger";

import { checkLogGroupClaim, reservedNamespace } from "./namespace.js";

type GuardRegistrar = {
  registerLogGroupGuard?: (guard: {
      check: (claim: { group: string; source: string }) => void;
      prefixes: string[];
  }) => unknown;
};

const registered = new Set<unknown>();

function register(module: GuardRegistrar): void {
  const registrar = module.registerLogGroupGuard;
  if (typeof registrar !== "function" || registered.has(registrar)) return;
  registered.add(registrar);
  registrar({ check: (claim) => checkLogGroupClaim(claim), prefixes: [reservedNamespace()] });
}

async function registerOtherCopy(): Promise<void> {
  try {
    register(await import(`@${reservedNamespace()}/logger`) as GuardRegistrar);
  } catch {
    return;
  }
}

function installLogNamespaceGuard(): void {
  register(packageLogger as GuardRegistrar);
  void registerOtherCopy();
}

export { installLogNamespaceGuard };
