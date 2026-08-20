import assert from "node:assert/strict";

import { logPackageInitialized, resolveLogger } from "../../dist/index.js";
import { logPackageInitialized as logBrowserPackageInitialized, resolveLogger as resolveBrowserLogger } from "../../dist/browser/index.js";

function collectEvents() {
  const events = [];
  return {
    events,
    logger: (event) => events.push(event),
  };
}

function verifyServerPrefix() {
  const capture = collectEvents();
  const logger = resolveLogger({
      fallback: "noop",
      groupPrefix: "trebired.bundler",
      logger: capture.logger,
      source: "@trebired/bundler",
  });

  logger.info("watch", "started");
  logger.warn("trebired.bundler.watch", "reused");
  logger.error("", "root");
  logPackageInitialized({
      fallback: "noop",
      groupPrefix: "trebired.bundler",
      logger: capture.logger,
      source: "@trebired/bundler",
  });

  assert.deepEqual(capture.events.map((event) => event.group), [
      "trebired.bundler.watch",
      "trebired.bundler.watch",
      "trebired.bundler",
      "trebired.bundler.initialize",
  ]);
}

function verifyBrowserPrefix() {
  const capture = collectEvents();
  const logger = resolveBrowserLogger({
      fallback: "noop",
      logger: capture.logger,
      source: "@trebired/frontend",
  });

  logger.info("runtime", "bound");
  logBrowserPackageInitialized({
      fallback: "noop",
      groupPrefix: "trebired.frontend",
      logger: capture.logger,
      source: "@trebired/frontend",
  });

  assert.deepEqual(capture.events.map((event) => event.group), [
      "trebired.frontend.runtime",
      "trebired.frontend.initialize",
  ]);
}

function verifyInitializedDedupe() {
  const capture = collectEvents();
  logPackageInitialized({
      fallback: "noop",
      group: "trebired.git-host",
      logger: capture.logger,
      source: "@trebired/git-host",
  });
  logPackageInitialized({
      fallback: "noop",
      group: "trebired.git-host.forge",
      logger: capture.logger,
      source: "@trebired/git-host",
  });
  logPackageInitialized({
      fallback: "noop",
      group: "trebired.git-host.forge.api",
      logger: capture.logger,
      source: "@trebired/git-host",
  });

  assert.deepEqual(capture.events.map((event) => event.group), [
      "trebired.git-host.initialize",
  ]);
}

verifyServerPrefix();
verifyBrowserPrefix();
verifyInitializedDedupe();
console.log("Adapter verification succeeded.");
