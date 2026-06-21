import { resolveLogger } from "#zphq3sccnajd";

function runTrebiredCompatibleDemo() {
  const log = resolveLogger({
    logger: console as any,
    source: "logger-adapter-demo",
  });

  log.info("server", "started", { port: 3000 });
  log.warn("auth", "permission denied", { userId: "42" });
}

function runCustomShapeDemo() {
  const rows: Array<Record<string, unknown>> = [];
  const log = resolveLogger({
    logger: rows as any,
    adapter(logger, event) {
      (logger as Array<Record<string, unknown>>).push({
        when: event.timestamp,
        scope: event.group,
        severity: event.level,
        text: event.message,
        extra: event.metadata,
      });
    },
    source: "logger-adapter-demo",
  });

  log.fail("bootstrap", "missing-dir");
  process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
}

runTrebiredCompatibleDemo();
runCustomShapeDemo();
