import { createLoggerResolver } from "#5z1h2es9bgdq";
import { sourcePackagePrefix } from "#br5q34hru3ot";
import { resolveConfiguredBrowserDefaultLogger } from "./default-logger.js";

const resolveLogger = createLoggerResolver(
  resolveConfiguredBrowserDefaultLogger,
  (options) => sourcePackagePrefix(options.source),
);

export { resolveLogger };
