import { createLoggerResolver } from "#5z1h2es9bgdq";
import { resolveConfiguredBrowserDefaultLogger } from "./default-logger.js";

const resolveLogger = createLoggerResolver(resolveConfiguredBrowserDefaultLogger);

export { resolveLogger };
