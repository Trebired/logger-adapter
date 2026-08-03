import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tempRoot = path.join(rootDir, ".tmp", "verify-bridge");
const bridgePath = path.join(rootDir, "dist", "bridge", "server.js");

async function main() {
  await fs.rm(tempRoot, { force: true, recursive: true });
  await fs.mkdir(tempRoot, { recursive: true });
  await verifyBridgeRoundTrip();
  await verifyBridgeErrors();
  console.log("Bridge verification succeeded.");
}

async function verifyBridgeRoundTrip() {
  const logsDir = path.join(tempRoot, "logs");
  const bridge = startBridge();
  await bridge.send({
    id: "1",
    logger: {
      console: false,
      dir: logsDir,
      quiet: true,
      save: true,
      source: "native-app",
    },
    type: "configure",
  });
  assert.equal((await bridge.read("1")).ok, true);

  await bridge.send({
    group: "app.start",
    level: "info",
    message: "started",
    metadata: { pid: process.pid },
    timestamp: new Date(0).toISOString(),
    type: "log",
  });
  await bridge.send({ id: "2", type: "flush" });
  assert.equal((await bridge.read("2")).ok, true);
  await bridge.send({ id: "3", type: "close" });
  assert.equal((await bridge.read("3")).ok, true);
  await bridge.wait();

  const logs = await collectFiles(logsDir);
  const combined = (await Promise.all(logs.map((file) => fs.readFile(file, "utf8")))).join("\n");
  assert.ok(combined.includes("app.start"));
  assert.ok(combined.includes("started"));
  assert.ok(combined.includes("native-app"));
}

async function verifyBridgeErrors() {
  const bridge = startBridge();
  await bridge.send({ id: "1", type: "flush" });
  const response = await bridge.read("1");
  assert.equal(response.ok, false);
  assert.equal(response.type, "error");
  await bridge.send({ id: "2", type: "close" });
  assert.equal((await bridge.read("2")).ok, true);
  await bridge.wait();
}

function startBridge() {
  const state = createBridgeState();
  attachBridgeStreams(state);

  return {
    send: (command) => sendBridgeCommand(state, command),
    read: (id) => readBridgeResponse(state, id),
    wait: () => waitForBridgeExit(state),
  };
}

function createBridgeState() {
  const child = spawn("bun", [bridgePath], {
    cwd: rootDir,
    stdio: ["pipe", "pipe", "pipe"],
  });

  return {
    child,
    exitCode: null,
    exited: false,
    pending: [],
    stderr: "",
    stdout: "",
  };
}

function attachBridgeStreams(state) {
  state.child.stdout.setEncoding("utf8");
  state.child.stdout.on("data", (chunk) => {
    state.stdout += chunk;
    drainPending(state);
  });
  state.child.stderr.setEncoding("utf8");
  state.child.stderr.on("data", (chunk) => {
    state.stderr += chunk;
  });
  state.child.on("exit", (code) => {
    state.exitCode = code;
    state.exited = true;
    drainPending(state);
  });
}

function drainPending(state) {
  for (let index = state.pending.length - 1; index >= 0; index -= 1) {
    const item = state.pending[index];
    const response = takeResponse(state, item.id);
    if (response) {
      state.pending.splice(index, 1);
      item.resolve(response);
      continue;
    }
    if (state.exited) {
      state.pending.splice(index, 1);
      item.reject(new Error(`bridge exited before response ${item.id}: ${state.stderr}`));
    }
  }
}

function takeResponse(state, id) {
  const lines = state.stdout.split(/\r?\n/u);
  state.stdout = lines.pop() || "";
  const kept = [];
  let found = null;
  for (const line of lines) {
    if (!line.trim()) continue;
    const parsed = JSON.parse(line);
    if (!found && parsed.id === id) found = parsed;
    else kept.push(line);
  }
  state.stdout = kept.join("\n") + (kept.length ? "\n" : "") + state.stdout;
  return found;
}

async function sendBridgeCommand(state, command) {
  state.child.stdin.write(`${JSON.stringify(command)}\n`);
}

function readBridgeResponse(state, id) {
  const response = takeResponse(state, id);
  if (response) return Promise.resolve(response);
  return new Promise((resolve, reject) => {
    state.pending.push({ id, reject, resolve });
    drainPending(state);
  });
}

function waitForBridgeExit(state) {
  if (state.exited) {
    return state.exitCode === 0 || state.exitCode === null
      ? Promise.resolve()
      : Promise.reject(new Error(`bridge exited with ${state.exitCode}: ${state.stderr}`));
  }
  return new Promise((resolve, reject) => {
    state.child.on("exit", (code) => {
      if (code === 0 || code === null) resolve();
      else reject(new Error(`bridge exited with ${code}: ${state.stderr}`));
    });
  });
}

async function collectFiles(root) {
  const files = [];
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(next);
      else if (entry.isFile()) files.push(next);
    }
  }
  return files;
}

await main();
