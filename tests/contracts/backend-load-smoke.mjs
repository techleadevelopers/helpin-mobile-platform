import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

const baseUrl = process.env.ZOOHELP_BACKEND_URL;
if (!baseUrl) {
  console.log("SKIP: Set ZOOHELP_BACKEND_URL=http://127.0.0.1:8080 to run backend load smoke.");
  process.exit(0);
}

const totalRequests = Number(process.env.ZOOHELP_LOAD_REQUESTS ?? 300);
const concurrency = Number(process.env.ZOOHELP_LOAD_CONCURRENCY ?? 30);
const maxP95Ms = Number(process.env.ZOOHELP_LOAD_MAX_P95_MS ?? 250);
const maxErrorRate = Number(process.env.ZOOHELP_LOAD_MAX_ERROR_RATE ?? 0.01);

const scenarios = [
  ["GET", "/healthz"],
  ["GET", "/readyz"],
  ["GET", "/v1/feed"],
  ["GET", "/v1/feed?type=emergency"],
  ["GET", "/v1/posts/1"],
  ["GET", "/v1/ongs"],
  ["GET", "/v1/ongs/o1"],
  ["GET", "/v1/chat/rooms"],
  ["GET", "/v1/chat/rooms/c1/messages"],
  ["GET", "/v1/geo/nearby?lat=-23.5505&lng=-46.6333&radius_km=30"],
  ["GET", "/v1/search?q=Mel"],
];

let next = 0;
let errors = 0;
const latencies = [];

async function runOne(index) {
  const [method, path] = scenarios[index % scenarios.length];
  const started = performance.now();
  try {
    const response = await fetch(`${baseUrl}${path}`, { method });
    await response.arrayBuffer();
    if (!response.ok) errors += 1;
  } catch {
    errors += 1;
  } finally {
    latencies.push(performance.now() - started);
  }
}

async function worker() {
  while (next < totalRequests) {
    const index = next;
    next += 1;
    await runOne(index);
  }
}

const suiteStarted = performance.now();
await Promise.all(Array.from({ length: concurrency }, worker));
const elapsedMs = performance.now() - suiteStarted;
latencies.sort((a, b) => a - b);

const percentile = (p) => latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))] ?? 0;
const p50 = percentile(0.5);
const p95 = percentile(0.95);
const p99 = percentile(0.99);
const errorRate = errors / totalRequests;
const rps = totalRequests / (elapsedMs / 1000);

console.log(JSON.stringify({
  totalRequests,
  concurrency,
  errors,
  errorRate,
  rps: Number(rps.toFixed(2)),
  p50Ms: Number(p50.toFixed(2)),
  p95Ms: Number(p95.toFixed(2)),
  p99Ms: Number(p99.toFixed(2)),
}, null, 2));

assert.ok(errorRate <= maxErrorRate, `error rate ${errorRate} exceeded ${maxErrorRate}`);
assert.ok(p95 <= maxP95Ms, `p95 ${p95}ms exceeded ${maxP95Ms}ms`);
