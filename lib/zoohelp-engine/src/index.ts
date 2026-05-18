export type ZooHelpRuntime = "expo" | "web";

export interface ZooHelpEngineConfig {
  apiBaseUrl: string;
  getAccessToken?: () => Promise<string | null> | string | null;
  runtime?: ZooHelpRuntime;
}

export interface CoreCapability {
  domain: string;
  owner: "rust" | "python";
  reason: string;
}

export type AccountType = "person" | "ong" | "vet";
export type AnimalType = "dog" | "cat" | "other";
export type PostType = "adoption" | "lost" | "found" | "emergency" | "campaign" | "post";

export interface AuthorContract {
  id: string;
  name: string;
  avatar: string | null;
  verified: boolean;
  type: AccountType;
}

export interface UserContract extends AuthorContract {
  email: string;
  bio: string;
  postsCount: number;
  helpedCount: number;
  adoptionsCount: number;
}

export interface PostContract {
  id: string;
  type: PostType;
  animalType: AnimalType;
  name: string;
  breed: string;
  age: string;
  description: string;
  location: string;
  neighborhood: string;
  image: string | null;
  images: PostMediaContract[];
  textOnly: boolean;
  author: AuthorContract;
  likes: number;
  comments: number;
  shares: number;
  urgent: boolean;
  createdAt: string;
  contact: string;
  tags: string[];
}

export interface PostMediaContract {
  id: string;
  url: string;
  contentType: "image/jpeg" | "image/png" | "image/webp" | string;
  width?: number | null;
  height?: number | null;
  sizeBytes?: number | null;
  moderationStatus: "queued" | "approved" | "rejected" | "needs_review" | string;
}

export interface OngContract {
  id: string;
  name: string;
  shortName: string;
  description: string;
  mission: string;
  location: string;
  city: string;
  state: string;
  verified: boolean;
  animalsRescued: number;
  activeCases: number;
  adoptions: number;
  animalTypes: string[];
  followers: number;
  since: string;
  cnpj: string;
  contact: string;
  cause: string;
}

export interface ChatConversationContract {
  id: string;
  postId: string;
  participant: AuthorContract;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  postTitle: string;
}

export interface ChatMessageContract {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface AuthResponseContract {
  user: UserContract;
  ongProfile?: {
    legalName: string;
    ongType?: string | null;
    cnpj?: string | null;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    verificationStatus: string;
  } | null;
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
}

export interface CreatePostResponseContract {
  post: PostContract;
  media: PostMediaContract[];
  moderationStatus: "queued" | "approved" | "rejected" | "needs_review";
  fraudRisk: number;
}

export interface MediaUploadIntentContract {
  provider: "cloudinary" | string;
  uploadId: string;
  objectKey: string;
  uploadUrl: string;
  publicUrl: string;
  resourceType: "image" | "video" | string;
  expiresInSeconds: number;
  maxSizeBytes: number;
  allowedContentTypes: string[];
  cloudinary: {
    cloudName: string;
    apiKey: string;
    signature: string;
    timestamp: number;
    folder: string;
    publicId: string;
  };
}

export interface NearbyCaseContract {
  post: PostContract;
  distanceKm: number;
}

export interface SearchResponseContract {
  posts: PostContract[];
  ongs: OngContract[];
}

export interface DonationIntentContract {
  id: string;
  ongId: string;
  amountCents: number;
  currency: string;
  status: string;
}

export interface NotificationContract {
  id: string;
  title: string;
  read: boolean;
}

export interface MarketplaceItemContract {
  id: string;
  title: string;
  itemType: string;
}

export const CORE_CAPABILITIES: CoreCapability[] = [
  { domain: "api", owner: "rust", reason: "baixa latencia e contratos publicos" },
  { domain: "auth", owner: "rust", reason: "seguranca, sessao e autorizacao" },
  { domain: "feed", owner: "rust", reason: "alto volume de leitura" },
  { domain: "posts", owner: "rust", reason: "validacao, transacao e fan-out" },
  { domain: "chat", owner: "rust", reason: "realtime e concorrencia" },
  { domain: "geo", owner: "rust", reason: "PostGIS e busca proxima" },
  { domain: "trust", owner: "rust", reason: "score usado em fluxo critico" },
  { domain: "ai-moderation", owner: "python", reason: "modelos de visao computacional" },
  { domain: "nlp", owner: "python", reason: "classificacao e experimentacao" },
  { domain: "advanced-fraud-models", owner: "python", reason: "ML offline/assincrono" },
];

export class ZooHelpEngine {
  private readonly config: ZooHelpEngineConfig;

  constructor(config: ZooHelpEngineConfig) {
    this.config = {
      ...config,
      apiBaseUrl: config.apiBaseUrl.replace(/\/+$/, ""),
      runtime: config.runtime ?? "expo",
    };
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.config.getAccessToken?.();
    const headers = new Headers(init.headers);
    headers.set("accept", "application/json");

    if (init.body && !headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
    if (token && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${token}`);
    }

    const response = await fetch(`${this.config.apiBaseUrl}${path}`, { ...init, headers });
    if (!response.ok) {
      throw new Error(`ZooHelp core request failed: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  health() {
    return this.request<{ status: string; service: string }>("/healthz");
  }

  feed(input: { lat?: number; lng?: number; radiusKm?: number; type?: PostType; authorType?: AccountType } = {}) {
    const params = new URLSearchParams();
    if (input.lat != null) params.set("lat", String(input.lat));
    if (input.lng != null) params.set("lng", String(input.lng));
    if (input.radiusKm != null) params.set("radius_km", String(input.radiusKm));
    if (input.type) params.set("type", input.type);
    if (input.authorType) params.set("author_type", input.authorType);
    const suffix = params.toString() ? `?${params}` : "";
    return this.request<PostContract[]>(`/v1/feed${suffix}`);
  }

  login(email: string, password: string) {
    return this.request<AuthResponseContract>("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  register(input: {
    name: string;
    email: string;
    password: string;
    accountType?: AccountType;
    ongType?: string;
    cnpj?: string;
    phone?: string;
    city?: string;
    state?: string;
  }) {
    return this.request<AuthResponseContract>("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  createPost(input: {
    name?: string;
    postType: PostType;
    animalType: AnimalType;
    breed?: string;
    age?: string;
    description: string;
    location: string;
    neighborhood?: string;
    image?: string | null;
    images?: Array<{
      objectKey?: string;
      publicUrl?: string;
      url?: string;
      contentType?: string;
      width?: number;
      height?: number;
      sizeBytes?: number;
      checksumSha256?: string;
    }>;
    urgent?: boolean;
    contact?: string;
    tags?: string[];
  }) {
    return this.request<CreatePostResponseContract>("/v1/posts", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  createMediaUploadIntent(input: {
    fileName: string;
    contentType: "image/jpeg" | "image/png" | "image/webp" | "video/mp4" | "video/quicktime" | "video/webm" | string;
    sizeBytes: number;
    checksumSha256?: string;
  }) {
    return this.request<MediaUploadIntentContract>("/v1/media/upload-intents", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  post(id: string) {
    return this.request<PostContract>(`/v1/posts/${encodeURIComponent(id)}`);
  }

  likePost(id: string) {
    return this.request<{ postId: string; liked: boolean }>(`/v1/posts/${encodeURIComponent(id)}/like`, {
      method: "POST",
    });
  }

  ongs() {
    return this.request<OngContract[]>("/v1/ongs");
  }

  ong(id: string) {
    return this.request<OngContract>(`/v1/ongs/${encodeURIComponent(id)}`);
  }

  followOng(id: string) {
    return this.request<{ ongId: string; following: boolean }>(`/v1/ongs/${encodeURIComponent(id)}/follow`, {
      method: "POST",
    });
  }

  chatRooms() {
    return this.request<ChatConversationContract[]>("/v1/chat/rooms");
  }

  chatMessages(roomId: string) {
    return this.request<ChatMessageContract[]>(`/v1/chat/rooms/${encodeURIComponent(roomId)}/messages`);
  }

  sendChatMessage(roomId: string, body: string) {
    return this.request<{ message: ChatMessageContract }>(
      `/v1/chat/rooms/${encodeURIComponent(roomId)}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ body }),
      },
    );
  }

  nearby(input: { lat?: number; lng?: number; radiusKm?: number } = {}) {
    const params = new URLSearchParams();
    if (input.lat != null) params.set("lat", String(input.lat));
    if (input.lng != null) params.set("lng", String(input.lng));
    if (input.radiusKm != null) params.set("radius_km", String(input.radiusKm));
    const suffix = params.toString() ? `?${params}` : "";
    return this.request<NearbyCaseContract[]>(`/v1/geo/nearby${suffix}`);
  }

  search(q: string) {
    return this.request<SearchResponseContract>(`/v1/search?q=${encodeURIComponent(q)}`);
  }

  createDonationIntent(input: { ongId: string; amountCents: number; currency?: string }) {
    return this.request<DonationIntentContract>("/v1/donations/intents", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  notifications() {
    return this.request<NotificationContract[]>("/v1/notifications");
  }

  marketplaceItems() {
    return this.request<MarketplaceItemContract[]>("/v1/marketplace/items");
  }
}
