import { resolveConfiguredDefaultLogger } from "#baraacncu5kl";
import { resolveCallerLoggerPrefix, resolveCallerPackageRoot } from "#mlfgwbpmizvo";
import { callerGuard } from "./../guard/namespace.js";
import { createLoggerResolver } from "./core.js";

const resolveLogger = createLoggerResolver(
  resolveConfiguredDefaultLogger,
  resolveCallerLoggerPrefix,
  () => callerGuard(resolveCallerPackageRoot(() => false)),
);

export { resolveLogger };
