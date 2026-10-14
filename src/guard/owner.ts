import fs from "node:fs";
import path from "node:path";

type PackageOwner = { name: string; owned: boolean };

const owners = new Map<string, PackageOwner>();

function readPackageName(packageRoot: string): string {
  try {
    const raw = fs.readFileSync(path.join(packageRoot, "package.json"), "utf8");
    return String((JSON.parse(raw) as { name?: unknown }).name || "").trim();
  } catch {
    return "";
  }
}

function packageOwner(packageRoot: string, organization: string): PackageOwner {
  const cached = owners.get(packageRoot);
  if (cached) return cached;
  const name = readPackageName(packageRoot);
  const owner: PackageOwner = { name, owned: name.startsWith(`@${organization}/`) };
  owners.set(packageRoot, owner);
  return owner;
}

export { packageOwner };
export type { PackageOwner };
