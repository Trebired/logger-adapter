import { resolveLogger } from "#zphq3sccnajd";

function runPackageCompatibleDemo() {
  const log = resolveLogger({
      logger: console as any,
      source: "adapter-demo",
  });

  log.info("service.start", "started", { pid: process.pid });
  log.warn("service.request", "slow", { durationMs: 1250 });
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
      source: "adapter-demo",
  });

  log.fail("service.config", "missing value");
  process.stdout.write(`${JSON.stringify(rows, null, 2)}\n`);
}

runPackageCompatibleDemo();
runCustomShapeDemo();
