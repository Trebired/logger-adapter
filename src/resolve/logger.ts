import { resolveConfiguredDefaultLogger } from "#baraacncu5kl";
import { resolveCallerLoggerPrefix } from "#mlfgwbpmizvo";
import { createLoggerResolver } from "./core.js";

const resolveLogger = createLoggerResolver(resolveConfiguredDefaultLogger, resolveCallerLoggerPrefix);

export { resolveLogger };
