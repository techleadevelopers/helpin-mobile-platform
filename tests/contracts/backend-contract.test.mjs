import assert from "node:assert/strict";
import test from "node:test";

const accountTypes = new Set(["person", "ong", "vet"]);
const animalTypes = new Set(["dog", "cat", "other"]);
const postTypes = new Set(["adoption", "lost", "found", "emergency", "campaign", "post"]);

const sampleAuthor = {
  id: "u1",
  name: "Instituto Amigos dos Animais",
  avatar: null,
  verified: true,
  type: "ong",
};

const samplePost = {
  id: "1",
  type: "adoption",
  animalType: "dog",
  name: "Mel",
  breed: "Vira-lata Caramelo",
  age: "2 anos",
  description: "Mel busca um lar responsavel.",
  location: "Sao Paulo, SP",
  neighborhood: "Vila Mariana",
  image: null,
  images: [],
  textOnly: false,
  author: sampleAuthor,
  likes: 127,
  comments: 23,
  shares: 45,
  urgent: false,
  createdAt: "2h atras",
  contact: "(11) 99999-0001",
  tags: ["vacinada", "castrada"],
};

const sampleOng = {
  id: "o1",
  name: "Instituto Amigos dos Animais",
  shortName: "IAA",
  description: "Rede de proteção animal.",
  mission: "Resgatar e recolocar animais em lares responsaveis.",
  location: "Vila Mariana, Sao Paulo, SP",
  city: "Sao Paulo",
  state: "SP",
  verified: true,
  animalsRescued: 15240,
  activeCases: 87,
  adoptions: 9430,
  animalTypes: ["Cachorros", "Gatos"],
  followers: 48200,
  since: "2016",
  cnpj: "00.000.000/0001-00",
  contact: "(11) 99999-0001",
  cause: "Adoção responsavel e resgate urbano",
};

function expectString(value, field) {
  assert.equal(typeof value, "string", `${field} must be string`);
}

function expectNumber(value, field) {
  assert.equal(typeof value, "number", `${field} must be number`);
  assert.ok(Number.isFinite(value), `${field} must be finite`);
}

function expectBoolean(value, field) {
  assert.equal(typeof value, "boolean", `${field} must be boolean`);
}

function expectNullableString(value, field) {
  assert.ok(value === null || typeof value === "string", `${field} must be string or null`);
}

function expectAuthor(value, prefix = "author") {
  assert.equal(typeof value, "object", `${prefix} must be object`);
  expectString(value.id, `${prefix}.id`);
  expectString(value.name, `${prefix}.name`);
  expectNullableString(value.avatar, `${prefix}.avatar`);
  expectBoolean(value.verified, `${prefix}.verified`);
  assert.ok(accountTypes.has(value.type), `${prefix}.type must be supported account type`);
}

function expectPost(value, prefix = "post") {
  assert.equal(typeof value, "object", `${prefix} must be object`);
  expectString(value.id, `${prefix}.id`);
  assert.ok(postTypes.has(value.type), `${prefix}.type must be supported post type`);
  assert.ok(animalTypes.has(value.animalType), `${prefix}.animalType must be supported animal type`);
  for (const field of ["name", "breed", "age", "description", "location", "neighborhood", "createdAt", "contact"]) {
    expectString(value[field], `${prefix}.${field}`);
  }
  expectNullableString(value.image, `${prefix}.image`);
  assert.ok(Array.isArray(value.images), `${prefix}.images must be array`);
  value.images.forEach((image, index) => expectPostMedia(image, `${prefix}.images[${index}]`));
  expectBoolean(value.textOnly, `${prefix}.textOnly`);
  expectAuthor(value.author, `${prefix}.author`);
  for (const field of ["likes", "comments", "shares"]) {
    expectNumber(value[field], `${prefix}.${field}`);
  }
  expectBoolean(value.urgent, `${prefix}.urgent`);
  assert.ok(Array.isArray(value.tags), `${prefix}.tags must be array`);
  value.tags.forEach((tag, index) => expectString(tag, `${prefix}.tags[${index}]`));
}

function expectPostMedia(value, prefix = "media") {
  assert.equal(typeof value, "object", `${prefix} must be object`);
  expectString(value.id, `${prefix}.id`);
  expectString(value.url, `${prefix}.url`);
  expectString(value.contentType, `${prefix}.contentType`);
  assert.ok(
    value.width === null || value.width === undefined || typeof value.width === "number",
    `${prefix}.width must be number or null`,
  );
  assert.ok(
    value.height === null || value.height === undefined || typeof value.height === "number",
    `${prefix}.height must be number or null`,
  );
  assert.ok(
    value.sizeBytes === null || value.sizeBytes === undefined || typeof value.sizeBytes === "number",
    `${prefix}.sizeBytes must be number or null`,
  );
  expectString(value.moderationStatus, `${prefix}.moderationStatus`);
}

function expectOng(value, prefix = "ong") {
  assert.equal(typeof value, "object", `${prefix} must be object`);
  for (const field of ["id", "name", "shortName", "description", "mission", "location", "city", "state", "since", "cnpj", "contact", "cause"]) {
    expectString(value[field], `${prefix}.${field}`);
  }
  expectBoolean(value.verified, `${prefix}.verified`);
  for (const field of ["animalsRescued", "activeCases", "adoptions", "followers"]) {
    expectNumber(value[field], `${prefix}.${field}`);
  }
  assert.ok(Array.isArray(value.animalTypes), `${prefix}.animalTypes must be array`);
}

function expectAuthResponse(value) {
  assert.equal(typeof value, "object", "auth response must be object");
  expectString(value.accessToken, "accessToken");
  expectString(value.refreshToken, "refreshToken");
  assert.equal(value.tokenType, "Bearer");
  expectAuthor(value.user, "user");
  expectString(value.user.email, "user.email");
  expectString(value.user.bio, "user.bio");
  for (const field of ["postsCount", "helpedCount", "adoptionsCount"]) {
    expectNumber(value.user[field], `user.${field}`);
  }
}

function expectOngRegistrationProfile(value) {
  assert.equal(typeof value, "object", "ongProfile must be object");
  expectString(value.legalName, "ongProfile.legalName");
  expectString(value.verificationStatus, "ongProfile.verificationStatus");
  assert.ok(value.ongType === null || value.ongType === undefined || typeof value.ongType === "string");
  assert.ok(value.cnpj === null || value.cnpj === undefined || typeof value.cnpj === "string");
  assert.ok(value.phone === null || value.phone === undefined || typeof value.phone === "string");
  assert.ok(value.city === null || value.city === undefined || typeof value.city === "string");
  assert.ok(value.state === null || value.state === undefined || typeof value.state === "string");
}

function expectChatConversation(value, prefix = "conversation") {
  assert.equal(typeof value, "object", `${prefix} must be object`);
  expectString(value.id, `${prefix}.id`);
  expectString(value.postId, `${prefix}.postId`);
  expectAuthor(value.participant, `${prefix}.participant`);
  expectString(value.lastMessage, `${prefix}.lastMessage`);
  expectString(value.lastMessageTime, `${prefix}.lastMessageTime`);
  expectNumber(value.unread, `${prefix}.unread`);
  expectString(value.postTitle, `${prefix}.postTitle`);
}

function expectChatMessage(value, prefix = "message") {
  assert.equal(typeof value, "object", `${prefix} must be object`);
  expectString(value.id, `${prefix}.id`);
  expectString(value.senderId, `${prefix}.senderId`);
  expectString(value.body, `${prefix}.body`);
  expectString(value.createdAt, `${prefix}.createdAt`);
}

function expectDonationIntent(value, prefix = "donation") {
  assert.equal(typeof value, "object", `${prefix} must be object`);
  expectString(value.id, `${prefix}.id`);
  expectString(value.ongId, `${prefix}.ongId`);
  expectNumber(value.amountCents, `${prefix}.amountCents`);
  expectString(value.currency, `${prefix}.currency`);
  expectString(value.status, `${prefix}.status`);
}

async function fetchJson(baseUrl, path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const body = await response.json().catch(() => null);
  return { response, body };
}

async function expectOkJson(baseUrl, path, init) {
  const result = await fetchJson(baseUrl, path, init);
  assert.ok(
    result.response.ok,
    `${init?.method ?? "GET"} ${path} expected ok, got ${result.response.status}: ${JSON.stringify(result.body)}`,
  );
  return result.body;
}

async function expectWebSocketEcho(baseUrl, roomId) {
  if (typeof WebSocket === "undefined") {
    return;
  }

  const wsUrl = baseUrl.replace(/^http/, "ws") + `/v1/chat/rooms/${roomId}/ws`;
  const payload = `ws contrato ${Date.now()}`;

  await new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl);
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error("websocket contract timed out"));
    }, 5000);

    socket.addEventListener("open", () => {
      socket.send(payload);
    });

    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      try {
        assert.equal(message.roomId, roomId);
        assert.equal(message.body, payload);
        expectString(message.messageId, "ws.messageId");
        expectString(message.senderId, "ws.senderId");
        expectString(message.createdAt, "ws.createdAt");
        clearTimeout(timeout);
        socket.close();
        resolve();
      } catch (error) {
        clearTimeout(timeout);
        socket.close();
        reject(error);
      }
    });

    socket.addEventListener("error", (event) => {
      clearTimeout(timeout);
      reject(event.error ?? new Error("websocket contract failed"));
    });
  });
}

test("frontend fixture contract matches backend post shape", () => {
  expectPost(samplePost);
});

test("frontend fixture contract matches backend ONG shape", () => {
  expectOng(sampleOng);
});

test("live backend contract, when ZOOHELP_BACKEND_URL is provided", async (t) => {
  const baseUrl = process.env.ZOOHELP_BACKEND_URL;
  if (!baseUrl) {
    t.skip("Set ZOOHELP_BACKEND_URL=http://127.0.0.1:8080 to run live backend contract checks.");
    return;
  }

  const health = await expectOkJson(baseUrl, "/healthz");
  assert.equal(health.status, "ok");

  const ready = await expectOkJson(baseUrl, "/readyz");
  assert.equal(ready.status, "ready");
  assert.equal(ready.database_configured, true);

  const login = await expectOkJson(baseUrl, "/v1/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "pessoa@zoohelp.com",
      password: "senha-segura",
    }),
  });
  expectAuthResponse(login);
  assert.equal(login.user.type, "person");

  const personAuth = await expectOkJson(baseUrl, "/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Pessoa Teste",
      email: "pessoa-register@zoohelp.com",
      password: "senha-segura",
      accountType: "person",
    }),
  });
  expectAuthResponse(personAuth);
  assert.equal(personAuth.user.type, "person");
  assert.equal(personAuth.ongProfile, null);

  const ongAuth = await expectOkJson(baseUrl, "/v1/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "ONG Teste",
      email: "ong@zoohelp.com",
      password: "senha-segura",
      accountType: "ong",
      ongType: "rescue",
      cnpj: "12.345.678/0001-90",
      phone: "(11) 99999-0001",
      city: "Sao Paulo",
      state: "SP",
    }),
  });
  expectAuthResponse(ongAuth);
  assert.equal(ongAuth.user.type, "ong");
  expectOngRegistrationProfile(ongAuth.ongProfile);
  assert.equal(ongAuth.ongProfile.ongType, "rescue");
  assert.equal(ongAuth.ongProfile.cnpj, "12.345.678/0001-90");
  assert.equal(ongAuth.ongProfile.phone, "(11) 99999-0001");
  assert.equal(ongAuth.ongProfile.city, "Sao Paulo");
  assert.equal(ongAuth.ongProfile.state, "SP");

  const feed = await expectOkJson(baseUrl, "/v1/feed");
  assert.ok(Array.isArray(feed));
  assert.ok(feed.length > 0);
  expectPost(feed[0], "feed[0]");

  const emergencyFeed = await expectOkJson(baseUrl, "/v1/feed?type=emergency");
  assert.ok(Array.isArray(emergencyFeed));
  assert.ok(emergencyFeed.length > 0);
  expectPost(emergencyFeed[0], "emergencyFeed[0]");
  assert.equal(emergencyFeed[0].type, "emergency");

  const localizedFeed = await expectOkJson(baseUrl, "/v1/feed?lat=-23.5614&lng=-46.6559&radius_km=20");
  assert.ok(Array.isArray(localizedFeed));
  assert.equal(localizedFeed[0].id, "2");

  const ongFeed = await expectOkJson(baseUrl, "/v1/feed?author_type=ong");
  assert.ok(Array.isArray(ongFeed));
  assert.ok(ongFeed.length > 0);
  assert.equal(ongFeed[0].author.type, "ong");

  const post = await expectOkJson(baseUrl, "/v1/posts/1");
  expectPost(post);
  assert.equal(post.id, "1");

  const uploadIntent = await expectOkJson(baseUrl, "/v1/media/upload-intents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fileName: "resgate.webp",
      contentType: "image/webp",
      sizeBytes: 420000,
    }),
  });
  expectString(uploadIntent.uploadId, "uploadIntent.uploadId");
  assert.equal(uploadIntent.provider, "cloudinary");
  expectString(uploadIntent.objectKey, "uploadIntent.objectKey");
  expectString(uploadIntent.uploadUrl, "uploadIntent.uploadUrl");
  expectString(uploadIntent.publicUrl, "uploadIntent.publicUrl");
  expectString(uploadIntent.resourceType, "uploadIntent.resourceType");
  expectNumber(uploadIntent.expiresInSeconds, "uploadIntent.expiresInSeconds");
  expectNumber(uploadIntent.maxSizeBytes, "uploadIntent.maxSizeBytes");
  assert.ok(Array.isArray(uploadIntent.allowedContentTypes));
  assert.equal(uploadIntent.resourceType, "image");
  assert.ok(uploadIntent.uploadUrl.includes("api.cloudinary.com"));
  expectString(uploadIntent.cloudinary.cloudName, "uploadIntent.cloudinary.cloudName");
  expectString(uploadIntent.cloudinary.apiKey, "uploadIntent.cloudinary.apiKey");
  expectString(uploadIntent.cloudinary.signature, "uploadIntent.cloudinary.signature");
  expectNumber(uploadIntent.cloudinary.timestamp, "uploadIntent.cloudinary.timestamp");
  expectString(uploadIntent.cloudinary.folder, "uploadIntent.cloudinary.folder");
  expectString(uploadIntent.cloudinary.publicId, "uploadIntent.cloudinary.publicId");

  const createdPost = await expectOkJson(baseUrl, "/v1/posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "Teste contrato",
      postType: "adoption",
      animalType: "dog",
      description: "Animal vacinado para adoção responsavel.",
      location: "Sao Paulo, SP",
      neighborhood: "Vila Mariana",
      contact: "(11) 99999-0001",
      tags: ["vacinado"],
      images: [{
        objectKey: uploadIntent.objectKey,
        publicUrl: uploadIntent.publicUrl,
        contentType: "image/webp",
        width: 1080,
        height: 1080,
        sizeBytes: 420000,
      }],
    }),
  });
  expectPost(createdPost.post, "createdPost.post");
  assert.equal(createdPost.post.image, uploadIntent.publicUrl);
  assert.equal(createdPost.post.images[0].url, uploadIntent.publicUrl);
  expectPostMedia(createdPost.media[0], "createdPost.media[0]");
  assert.equal(createdPost.moderationStatus, "queued");
  expectNumber(createdPost.fraudRisk, "createdPost.fraudRisk");

  const like = await expectOkJson(baseUrl, "/v1/posts/1/like", { method: "POST" });
  assert.equal(like.postId, "1");
  assert.equal(like.liked, true);

  const ongs = await expectOkJson(baseUrl, "/v1/ongs");
  assert.ok(Array.isArray(ongs));
  assert.ok(ongs.length > 0);
  expectOng(ongs[0], "ongs[0]");

  const ong = await expectOkJson(baseUrl, "/v1/ongs/o1");
  expectOng(ong);
  assert.equal(ong.id, "o1");

  const follow = await expectOkJson(baseUrl, "/v1/ongs/o1/follow", { method: "POST" });
  assert.equal(follow.ongId, "o1");
  assert.equal(follow.following, true);

  const rooms = await expectOkJson(baseUrl, "/v1/chat/rooms");
  assert.ok(Array.isArray(rooms));
  assert.ok(rooms.length > 0);
  expectChatConversation(rooms[0], "rooms[0]");

  const room = await expectOkJson(baseUrl, `/v1/chat/rooms/${rooms[0].id}`);
  expectChatConversation(room);

  const messages = await expectOkJson(baseUrl, `/v1/chat/rooms/${rooms[0].id}/messages`);
  assert.ok(Array.isArray(messages));
  assert.ok(messages.length > 0);
  expectChatMessage(messages[0], "messages[0]");

  const sent = await expectOkJson(baseUrl, `/v1/chat/rooms/${rooms[0].id}/messages`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ body: "Mensagem de contrato frontend/backend" }),
  });
  expectChatMessage(sent.message, "sent.message");
  assert.equal(sent.message.body, "Mensagem de contrato frontend/backend");

  await expectWebSocketEcho(baseUrl, rooms[0].id);

  const nearby = await expectOkJson(baseUrl, "/v1/geo/nearby?lat=-23.5505&lng=-46.6333&radius_km=30");
  assert.ok(Array.isArray(nearby));
  assert.ok(nearby.length > 0);
  expectPost(nearby[0].post, "nearby[0].post");
  expectNumber(nearby[0].distanceKm, "nearby[0].distanceKm");

  const search = await expectOkJson(baseUrl, "/v1/search?q=Mel");
  assert.ok(Array.isArray(search.posts));
  assert.ok(Array.isArray(search.ongs));
  expectPost(search.posts[0], "search.posts[0]");

  const donation = await expectOkJson(baseUrl, "/v1/donations/intents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ongId: "o1", amountCents: 1000, currency: "BRL" }),
  });
  expectDonationIntent(donation);
  assert.equal(donation.ongId, "o1");
});
