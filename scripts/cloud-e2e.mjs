/*
 * Contract and end-to-end verifier for the deployed Helpin API.
 *
 * Safe by default: `npm run test:cloud` performs no writes.  The write
 * suites are deliberately opt-in because this URL is the public Railway API.
 * Never use a personal account: use a disposable, verified test account.
 */
import { randomUUID } from 'node:crypto';

const baseUrl = (process.env.API_BASE_URL || 'https://helpin-platform-core-production.up.railway.app').replace(/\/$/, '');
const args = new Set(process.argv.slice(2));
const wantsAuth = args.has('--auth') || args.has('--full');
const wantsWrites = args.has('--writes') || args.has('--full');
const wantsRescue = args.has('--rescue') || args.has('--full');
const runId = `e2e-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
const report = { target: baseUrl, runId, startedAt: new Date().toISOString(), checks: [] };
let accessToken;
let refreshToken;
let createdPostId;
const createdPostIds = [];

function record(name, ok, detail = '') {
  report.checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for this suite`);
  return value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(name, path, { method = 'GET', body, headers = {}, expected = [200] } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      accept: 'application/json',
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  const ok = expected.includes(response.status);
  record(name, ok, `HTTP ${response.status}`);
  if (!ok) throw new Error(`${name}: expected ${expected.join('/')} but received ${response.status}: ${text.slice(0, 300)}`);
  return { response, json, text };
}

async function publicSuite() {
  const health = await request('healthz', '/healthz');
  assert(health.json && typeof health.json === 'object', 'healthz did not return JSON');

  const origin = process.env.E2E_WEB_ORIGIN || 'https://zoohelp.app';
  const cors = await request('CORS preflight', '/v1/feed', {
    method: 'OPTIONS',
    headers: { origin, 'access-control-request-method': 'GET' },
    expected: [200, 204],
  });
  const allowedOrigin = cors.response.headers.get('access-control-allow-origin');
  const strictCors = allowedOrigin === origin;
  record('CORS allows only requested configured origin', strictCors, `received ${allowedOrigin ?? 'none'}`);

  const feed = await request('feed', '/v1/feed');
  assert(Array.isArray(feed.json), 'feed response is not an array');
  await request('ONG directory', '/v1/ongs');
  await request('public search', '/v1/search?q=animal');
  await request('nearby cases', '/v1/geo/nearby?lat=-23.5505&lng=-46.6333');
  await request('support metadata', '/v1/support/meta');
  await request('impact metrics', '/v1/impact/metrics');
}

async function authSuite() {
  const email = requireEnv('E2E_TEST_EMAIL');
  const password = requireEnv('E2E_TEST_PASSWORD');
  const login = await request('login', '/v1/auth/login', { method: 'POST', body: { email, password } });
  accessToken = login.json?.accessToken;
  refreshToken = login.json?.refreshToken;
  assert(accessToken && refreshToken, 'login did not return accessToken and refreshToken');
  await request('current user', '/v1/me');
  await request('notifications list', '/v1/notifications');
  await request('chat rooms list', '/v1/chat/rooms');

  const refresh = await request('refresh token rotation', '/v1/auth/refresh', {
    method: 'POST', body: { refreshToken }, headers: { 'x-auth-refresh': '1' },
  });
  assert(refresh.json?.accessToken && refresh.json?.refreshToken, 'refresh did not return rotated credentials');
  const oldRefresh = refreshToken;
  accessToken = refresh.json.accessToken;
  refreshToken = refresh.json.refreshToken;
  const replay = await request('old refresh token is revoked', '/v1/auth/refresh', {
    method: 'POST', body: { refreshToken: oldRefresh }, headers: { 'x-auth-refresh': '1' }, expected: [401],
  });
  assert(replay.response.status === 401, 'old refresh token was accepted');
  await request('current user after refresh', '/v1/me');
}

function writeGuard() {
  assert(process.env.E2E_ALLOW_PRODUCTION_WRITES === 'I_HAVE_AN_ISOLATED_TEST_ACCOUNT',
    'writes blocked: set E2E_ALLOW_PRODUCTION_WRITES=I_HAVE_AN_ISOLATED_TEST_ACCOUNT');
  assert(accessToken, 'login must run before write suites');
}

async function socialAndPostSuite() {
  writeGuard();
  const key = randomUUID();
  const post = await request('create disposable adoption post', '/v1/posts', {
    method: 'POST', headers: { 'idempotency-key': key }, body: {
      name: `Teste ${runId}`, postType: 'adoption', animalType: 'dog',
      description: `Registro automatizado descartável ${runId}.`,
      location: 'São Paulo, SP', neighborhood: 'Teste automatizado', textOnly: true,
    }, expected: [200, 201],
  });
  createdPostId = post.json?.post?.id;
  assert(createdPostId, 'post creation did not return post.id');
  createdPostIds.push(createdPostId);

  const replay = await request('post idempotency replay', '/v1/posts', {
    method: 'POST', headers: { 'idempotency-key': key }, body: {
      name: `Teste ${runId}`, postType: 'adoption', animalType: 'dog',
      description: `Registro automatizado descartável ${runId}.`, location: 'São Paulo, SP',
      neighborhood: 'Teste automatizado', textOnly: true,
    }, expected: [200, 201],
  });
  assert(replay.json?.post?.id === createdPostId, 'post replay created a second record');
  await request('post detail', `/v1/posts/${createdPostId}`);
  await request('like post', `/v1/posts/${createdPostId}/like`, { method: 'PUT' });
  await request('unlike post', `/v1/posts/${createdPostId}/like`, { method: 'DELETE' });

  const commentKey = randomUUID();
  const commentBody = { body: `Comentário descartável ${runId}` };
  const comment = await request('create comment', `/v1/posts/${createdPostId}/comments`, {
    method: 'POST', headers: { 'idempotency-key': commentKey }, body: commentBody, expected: [200, 201],
  });
  const commentReplay = await request('comment idempotency replay', `/v1/posts/${createdPostId}/comments`, {
    method: 'POST', headers: { 'idempotency-key': commentKey }, body: commentBody, expected: [200, 201],
  });
  assert(JSON.stringify(comment.json) === JSON.stringify(commentReplay.json), 'comment replay differs from canonical response');
  await request('list comments', `/v1/posts/${createdPostId}/comments`);
}

async function chatSuite() {
  writeGuard();
  const participantId = requireEnv('E2E_CHAT_PARTICIPANT_ID');
  const room = await request('open direct chat', '/v1/chat/rooms', {
    method: 'POST', body: { participantId }, expected: [200, 201],
  });
  const roomId = room.json?.id ?? room.json?.room?.id;
  assert(roomId, 'open chat did not return a room id');
  const key = randomUUID();
  const message = await request('send chat message', `/v1/chat/rooms/${roomId}/messages`, {
    method: 'POST', headers: { 'idempotency-key': key }, body: { body: `Teste automático ${runId}` }, expected: [200, 201],
  });
  const replay = await request('chat message idempotency replay', `/v1/chat/rooms/${roomId}/messages`, {
    method: 'POST', headers: { 'idempotency-key': key }, body: { body: `Teste automático ${runId}` }, expected: [200, 201],
  });
  assert(JSON.stringify(message.json) === JSON.stringify(replay.json), 'chat replay differs from canonical response');
  await request('list chat messages', `/v1/chat/rooms/${roomId}/messages`);
  await request('mark chat read', `/v1/chat/rooms/${roomId}/read`, { method: 'PATCH' });
  await request('create websocket ticket', `/v1/chat/rooms/${roomId}/ws-ticket`, { method: 'POST' });
}

async function rescueSuite() {
  writeGuard();
  const lat = Number(requireEnv('E2E_RESCUE_LAT'));
  const lng = Number(requireEnv('E2E_RESCUE_LNG'));
  assert(Number.isFinite(lat) && Number.isFinite(lng), 'rescue coordinates are invalid');
  const postKey = randomUUID();
  const post = await request('create isolated emergency post', '/v1/posts', {
    method: 'POST', headers: { 'idempotency-key': postKey }, body: {
      name: `Resgate teste ${runId}`, postType: 'emergency', animalType: 'other', urgent: true,
      description: `SIMULAÇÃO AUTOMATIZADA — NÃO É UM RESGATE REAL — ${runId}`,
      location: 'Área isolada de teste', neighborhood: 'Teste automatizado', latitude: lat, longitude: lng,
      geoSource: 'gps_confirmed', routePublic: false, textOnly: true,
    }, expected: [200, 201],
  });
  createdPostId = post.json?.post?.id;
  assert(createdPostId, 'emergency post did not return post.id');
  createdPostIds.push(createdPostId);
  const key = randomUUID();
  const trigger = await request('start rescue', '/v1/rescue/active', {
    method: 'POST', headers: { 'idempotency-key': key }, body: { postId: createdPostId, lat, lng, accuracy: 10 }, expected: [200, 201],
  });
  const rescueId = trigger.json?.rescue?.id;
  assert(rescueId, 'rescue trigger did not return rescue.id');
  const triggerReplay = await request('rescue trigger replay', '/v1/rescue/active', {
    method: 'POST', headers: { 'idempotency-key': key }, body: { postId: createdPostId, lat, lng, accuracy: 10 }, expected: [200, 201],
  });
  assert(triggerReplay.json?.rescue?.id === rescueId, 'rescue replay created another session');
  await request('update rescue location', `/v1/rescue/active/${rescueId}/location`, {
    method: 'PATCH', headers: { 'idempotency-key': randomUUID() }, body: { lat, lng, accuracy: 8 },
  });
  await request('end rescue', `/v1/rescue/active/${rescueId}/end`, { method: 'PATCH', headers: { 'idempotency-key': randomUUID() } });
  await request('end rescue replay', `/v1/rescue/active/${rescueId}/end`, { method: 'PATCH', headers: { 'idempotency-key': randomUUID() } });
}

async function cleanup() {
  if (!accessToken) return;
  for (const postId of createdPostIds.reverse()) {
    try { await request(`cleanup test post ${postId}`, `/v1/posts/${postId}`, { method: 'DELETE', expected: [200, 204] }); }
    catch (error) { record(`cleanup test post ${postId}`, false, error.message); }
  }
}

try {
  await publicSuite();
  if (wantsAuth) await authSuite();
  if (wantsWrites) { await socialAndPostSuite(); await chatSuite(); }
  if (wantsRescue) await rescueSuite();
} catch (error) {
  record('suite execution', false, error instanceof Error ? error.message : String(error));
} finally {
  await cleanup();
  report.finishedAt = new Date().toISOString();
  report.passed = report.checks.filter((check) => check.ok).length;
  report.failed = report.checks.filter((check) => !check.ok).length;
  console.log(`\n${JSON.stringify(report, null, 2)}`);
  process.exitCode = report.failed ? 1 : 0;
}
