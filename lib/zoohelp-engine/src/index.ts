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

  feed() {
    return this.request<Array<{ id: string; kind: string; title: string; urgency: number }>>("/v1/feed");
  }
}
