import { resolveConfiguredDefaultLogger } from "#baraacncu5kl";
import { createLoggerResolver } from "./core.js";

const resolveLogger = createLoggerResolver(resolveConfiguredDefaultLogger);

export { resolveLogger };
