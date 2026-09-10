# Segunda auditoria adversarial — fluxo completo do usuário

## Parecer

**Não aprovado para operações críticas nem para carga pública.** Houve evolução material: SecureStore está instalado, existe `POST /v1/auth/refresh`, o gatilho de resgate passou a deduplicar sessão ativa, push deixou de ser um stub e comentários/doações ganharam proteção de replay. Contudo, a implementação atual ainda perde continuidade de sessão quando a resposta de rotação se perde, não conclui a idempotência do resgate e apresenta gargalos/controles frágeis sob escala.

## Cenários adversariais executados por inspeção

| Prioridade | Cenário | Resultado atual | Impacto | Correção necessária |
|---|---|---|---|---|
| Crítica | O servidor rotaciona refresh token, mas a resposta se perde no caminho para o app. | O token antigo já foi revogado; o retry usa o token antigo, recebe 401 e o cliente apaga a sessão. | Logout indevido exatamente quando a rede está instável. | Persistir família/versão de refresh e resposta canônica por chave de idempotência, ou permitir janela curta de replay seguro do token já rotacionado. |
| Crítica | Resgate offline: trigger pendente, seguido de localização/end antes de sincronizar. | `rescueService` grava location com `rescueId` `local-*`; quando o trigger recebe ID real, não há remapeamento das operações posteriores. | Localizações e encerramento vão para uma URL inválida e acabam em dead-letter. | Modelar um `operationId`/referência local de sessão e resolver para ID canônico antes de enviar dependentes. |
| Crítica | Timeout após `PATCH location`, `PATCH end` ou `POST incident`. | O app envia `Idempotency-Key`, mas as rotas backend não leem nem persistem essa chave. Location cria pontos repetidos; incident cria registros repetidos; end repetido retorna 404. | Histórico operacional inconsistente e recuperação offline impossível. | Tabela de comandos de resgate com `(actor, operation, idempotency_key)` único e resposta canônica; fazer end idempotente. |
| Crítica | Pico de IPs/chaves aleatórias ou Redis indisponível. | Rate limiting local usa `HashMap<String, Vec<Instant>>` sem coleta de chaves vazias; `client_ip` aceita headers encaminhados sem fronteira de proxy confiável. Redis cria conexão multiplexada por chamada e renova TTL a cada request. | Consumo de memória/conexões, bypass por IP forjado e bloqueio prolongado sob tráfego contínuo. | Limite somente no edge/Redis com script Lua/fixed window correto, conexão/pool reutilizado, TTL apenas na primeira criação e headers confiáveis apenas atrás de proxy validado. |
| Alta | Subida/rolling deploy com muitas réplicas. | `AppState::new` executa grande conjunto de DDL/runtime schema em cada boot. | Locks de banco, startup lento e risco de indisponibilidade em rollout. | Remover DDL do processo web; migrations versionadas, aplicadas uma vez pelo job de deploy. |
| Alta | Alto volume de resgates/push. | Worker busca somente 50 jobs a cada 5 s e usa 10 entregas concorrentes; recibos não são reivindicados com lock. | Latência cresce sem limite observável e múltiplos workers podem consultar o mesmo recibo. | Métricas de lag/idade, autoscaling orientado a fila, claim atômico de recibos e testes de throughput/SLO. |
| Alta | Carga de notificações / tela aberta por longo período. | UI inicia com alerta fictício, busca apenas no mount e ignora erro; não há pull-to-refresh/retry/estado desatualizado. | Usuário pode interpretar demo como alerta real e não vê incidentes novos. | Estado vazio verdadeiro, refresh manual/foreground, erro visível e indicador de última atualização. |
| Alta | Reenvio de comentário após restart/ação repetida. | A API exige chave e o banco a deduplica, mas o cliente só gera chave efêmera se o chamador não a fornece. | O contrato não preserva a mesma intenção entre tentativas independentes. | Outbox de comentário ou chave persistida no estado do compositor até confirmação. |
| Alta | Produção web. | Em 2026-09-09, o endpoint público ainda respondeu `Access-Control-Allow-Origin: *`, embora o código exija lista fora de development. | Drift entre repositório e deploy; qualquer origem pode chamar APIs expostas por CORS. | Corrigir variáveis Railway, registrar configuração efetiva no boot e bloquear release quando preflight não corresponder à allowlist. |
| Média | Fila local cresce sem rede. | A outbox v2 não trunca, mas também não tem limite de bytes, UI de dead-letter, exportação ou ação de recuperação. | `AsyncStorage` pode falhar por quota e a falha não é recuperável pelo usuário. | Limite por tamanho com UX explícita, central de sincronização, retry/remover/exportar e telemetria sem PII. |
| Média | Push em Android/iOS fechado/background. | Token/consentimento agora são solicitados, mas não há handler de notificação, canal Android declarado nem teste automatizado de recibo/dispositivo. | Registro não prova entrega nem navegação correta ao tocar no alerta. | Configurar canais/categorias e response handler; executar matriz real iOS/Android/background com recibos Expo. |

## Fluxo final sob pressão

```text
App offline → trigger local → location/end locais
                    │
                    ├─ sync trigger gera rescue ID real
                    └─ operações dependentes continuam com local-*  ← quebra atual

Access token expirado → refresh rotacionado → resposta perdida
                                          └─ retry do refresh antigo → 401/logout  ← quebra atual
```

## O que foi efetivamente fortalecido

- `expo-secure-store` e `expo-notifications` constam das dependências; armazenamento inseguro é recusado em build de produção.
- O refresh endpoint revoga e substitui o token, e o app coordena um refresh em voo para evitar corrida local.
- Trigger de resgate serializa o par autor/caso e há índice parcial de sessão ativa.
- Comentários têm chave/índice de idempotência; doações usam `ON CONFLICT` atômico.

Esses itens não bastam para mudar o parecer enquanto os cenários críticos acima não tiverem testes de integração executados.

## Teste de carga mínimo antes de liberar

1. k6/Locust: 10× tráfego esperado em feed, login, refresh, posts e geobusca; verificar p95/p99, erros e saturação de pool.
2. PostgreSQL real: 50 triggers concorrentes para mesmo post/autor; timeout após commit para trigger/location/end/incident/comment/donation.
3. Chaos: Redis, NATS, Expo e banco indisponíveis parcial e totalmente; provar comportamento, retry e recuperação.
4. Mobile real: matar processo entre trigger e location; alternar offline/online; expirar token durante resposta; iOS e Android em background/encerrado.
5. Deploy: migrations uma única vez, múltiplas réplicas, rollback e preflight da origem permitida/não permitida.

## Evidências

- [Rate limit](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/backend/src/services/security/rate_limit.rs), [estado/boot](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/backend/src/state.rs) e [CORS](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/backend/src/main.rs).
- [Outbox](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/services/rescueOutbox.ts), [serviço de resgate](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/services/rescueService.ts) e [rotas de resgate](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/backend/src/routes/operations/rescue.rs).
- [Refresh mobile](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/services/zoohelpApi.ts), [refresh backend](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/backend/src/routes/identity/auth.rs) e [worker de push](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/backend/src/services/workers/push_worker.rs).
- Verificação externa em 2026-09-09: `/healthz` respondeu 200 e o preflight público continuou a devolver `Access-Control-Allow-Origin: *`.
