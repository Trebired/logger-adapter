import { resolveCallerPackageRoot } from "./../config/caller.js";
import { PACKAGE_ORGANIZATION_NAME } from "./../package/metadata.js";
import { packageOwner } from "./owner.js";

type NamespaceClaim = { group: string; source?: string };

const OFF_VALUES = new Set(["0", "false", "off", "no"]);

function guardDisabled(): boolean {
  const raw = String(process.env.TREBIRED_LOG_GUARD || "").trim().toLowerCase();
  return OFF_VALUES.has(raw);
}

function reservedNamespace(): string {
  return PACKAGE_ORGANIZATION_NAME;
}

function claimsNamespace(group: string): boolean {
  const reserved = reservedNamespace();
  return group === reserved || group.startsWith(`${reserved}.`);
}

function refusalMessage(claim: NamespaceClaim, packageRoot: string, name: string): string {
  const reserved = reservedNamespace();
  const who = name || "a package with no name";
  return `${who} logged under "${claim.group}" and the ${reserved} log namespace belongs to`
  +` @${reserved} packages. The package is at ${packageRoot}.`
  +` Log under a group of its own instead.`;
}

function refuse(claim: NamespaceClaim, packageRoot: string, name: string): never {
  const message = refusalMessage(claim, packageRoot, name);
  const runtime = globalThis.process as { exit?: (code: number) => never; stderr?: { write: (text: string) => unknown } };
  if (typeof runtime?.exit === "function") {
    runtime.stderr?.write(`[FAIL, log.namespace] ${message}\n`);
    runtime.exit(1);
  }
  throw new Error(message);
}

function assertNamespaceClaim(claim: NamespaceClaim, packageRoot: string): void {
  if (guardDisabled() || !claimsNamespace(claim.group)) return;
  const owner = packageOwner(packageRoot, reservedNamespace());
  if (owner.owned) return;
  refuse(claim, packageRoot, owner.name);
}

function callerGuard(packageRoot: string): (claim: NamespaceClaim) => void {
  const owner = packageOwner(packageRoot, reservedNamespace());
  return (claim) => {
    if (owner.owned || guardDisabled() || !claimsNamespace(claim.group)) return;
    refuse(claim, packageRoot, owner.name);
  };
}

function loggingPackageNames(): Set<string> {
  const reserved = reservedNamespace();
  return new Set([`@${reserved}/logger`, `@${reserved}/logger-adapter`]);
}

function ownNamespace(packageName: string): string {
  return packageName.replace(new RegExp(`^@([^/]+)/`, "u"), "$1.");
}

function announcesItself(claim: NamespaceClaim, packageName: string): boolean {
  if (!loggingPackageNames().has(packageName)) return false;
  const own = ownNamespace(packageName);
  return claim.group === own || claim.group.startsWith(`${own}.`);
}

function checkLogGroupClaim(claim: NamespaceClaim): void {
  if (guardDisabled() || !claimsNamespace(claim.group)) return;
  const reserved = reservedNamespace();
  const immediateRoot = resolveCallerPackageRoot(() => false);
  if (announcesItself(claim, packageOwner(immediateRoot, reserved).name)) return;
  const skipped = loggingPackageNames();
  assertNamespaceClaim(claim, resolveCallerPackageRoot((root) => skipped.has(packageOwner(root, reserved).name)));
}

export { assertNamespaceClaim, callerGuard, checkLogGroupClaim, claimsNamespace, reservedNamespace };
export type { NamespaceClaim };
