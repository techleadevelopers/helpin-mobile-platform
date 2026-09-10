# Auditoria do fluxo de usuário

## Parecer

**Não aprovado para produção de operações críticas.** O fluxo de publicação foi fortalecido, mas autenticação de sessão, alertas de resgate e operações offline de resgate ainda deixam o usuário sem uma experiência confiável em campo.

## Achados prioritários

| Prioridade | Fluxo | Evidência | Impacto para o usuário | Ação obrigatória |
|---|---|---|---|---|
| Crítica | Sessão | O servidor emite e persiste `refresh_token`, mas não expõe rota de renovação; o mobile somente o armazena. | Após o access token (15 min por padrão) expirar, o usuário perde ações autenticadas e é desconectado mesmo tendo sessão válida de 30 dias. | Criar `POST /v1/auth/refresh`, rotação/revogação do token e interceptor único que renove uma vez após 401. |
| Crítica | Resgate offline | A outbox de resgate limita em 50 e corta excedentes, não tem chave de idempotência, prazo, jitter ou estado terminal. O `trigger` cria sempre uma nova sessão. | Reenvio após timeout pode abrir vários resgates; sinais críticos podem sumir silenciosamente. | Outbox v2 durável, idempotência por operação, deduplicação de trigger por post/autor, ordenação causal, backoff, dead-letter e UI de recuperação. |
| Crítica | Alertas de emergência | `registerRescueAlerts` retorna `null` sem registrar token ou localização, apesar de API/worker de push existirem. | Ninguém recebe alertas quando o app está em background ou fechado; a promessa de alerta por proximidade não se cumpre. | Integrar `expo-notifications`, registrar token, consentimento e raio; testar iOS/Android/background e recibos Expo. |
| Alta | Credenciais no dispositivo | `expo-secure-store` não consta das dependências; o fallback de `secureSession` usa `AsyncStorage`. | JWT e refresh token podem ficar em armazenamento não protegido quando o módulo não existe. | Adicionar e configurar `expo-secure-store`; em produção, falhar de forma segura em vez de cair para AsyncStorage. |
| Alta | Comentários e mutações | O cliente repete POST automaticamente, mas criação de comentário não tem chave/índice idempotente; share e várias operações de resgate também não têm contrato explícito de replay. | Timeout após commit pode duplicar comentário, compartilhamento, incidente ou evento operacional. | Definir idempotência por comando mutável; usar índice único/`ON CONFLICT` e devolver o resultado canônico. |
| Alta | Doações | O backend consulta idempotência e depois faz `INSERT`, sem `ON CONFLICT`; há índice único. | Duas chamadas concorrentes podem produzir 500 em vez de replay seguro, especialmente perigoso com pagamentos habilitados. | Aplicar o mesmo padrão atômico usado em posts: `INSERT … ON CONFLICT … RETURNING`/busca do registro vencedor; testes de timeout e concorrência. |
| Alta | Deploy web | O endpoint público respondeu a preflight com `Access-Control-Allow-Origin: *`. | Divergência de configuração reduz a proteção prevista para as origens web e é sinal de drift de ambiente. | Em produção, permitir apenas origens explícitas e validar a configuração no boot/deploy. |
| Média | Notificações in-app | A tela começa com uma notificação fictícia e consulta API somente no mount; falhas são ignoradas. | Usuário pode tomar a mensagem de demonstração como alerta real e não vê atualizações sem reabrir a tela. | Estado vazio explícito, pull-to-refresh, retry visível e indicadores de falha/desatualização. |
| Média | Post pendente | A nova outbox guarda `failed` e expõe `retryFailedPost`, mas nenhuma tela apresenta itens pendentes/falhos ou o botão “Tentar novamente”. | O usuário não tem como recuperar uma publicação terminalmente falhada sem suporte ou reinício. | Criar central de sincronização no perfil/feed, com erro, próxima tentativa e ação de reenviar/remover. |
| Média | Mídia web | `blob:` não sobrevive a reinício; o item é mantido, mas não há interface para escolher a mídia novamente. | Publicação fica irrecuperável sem instrução acionável. | Marcar `requires_media_reselection`, manter texto/metadados e abrir editor já preenchido. |
| Média | Observabilidade mobile | Sentry é carregado dinamicamente, mas não consta nas dependências; muitos fluxos críticos silenciam erros. | Falhas reais de publicação, chat e notificação não chegam à operação. | Instalar/configurar SDK ou remover o carregamento opcional; capturar erros de comandos críticos com request ID e sem PII. |

## Fluxos revisados

### Identidade e conta

Login, cadastro, redefinição, exclusão e perfil possuem rotas correspondentes. A lacuna é a continuidade de sessão: o backend grava refresh tokens, mas não há endpoint nem método no cliente para usá-los. Exclusão de conta é uma anonimização com retenção de 90 dias; a interface declara “permanentemente apagados”, portanto a cópia deve refletir a política efetiva.

### Feed, posts e mídia

O fluxo novo de post persiste a intenção antes de rede, guarda uploads concluídos e usa replay atômico no servidor. Ainda faltam testes de integração contra PostgreSQL para timeout depois de commit e dois criadores concorrentes. Curtidas são idempotentes no banco. Comentários não são: o retry genérico de POST pode produzir duplicatas porque não há chave persistida nem índice correspondente.

### Chat

Mensagens têm chave obrigatória e persistência idempotente no servidor; o cliente conserva a chave durante uma nova tentativa local da mensagem. O socket obtém ticket e reconecta. Falta uma outbox de mensagem para morte do processo/offline e uma política limitada de reconexão: o loop atual pode tentar indefinidamente em falha de credencial ou indisponibilidade.

### Resgate e localização

É o maior risco funcional. `trigger` não deduplica por chave e insere sempre uma sessão; a outbox reexecuta sem limitação e corta itens após 50. Além disso, push está completamente desativado no cliente. Não liberar operação de emergência até que trigger/location/end tenham contratos idempotentes, filas persistentes sem descarte e testes com rede intermitente.

### Pagamentos, suporte e notificações

Pagamentos já usam índice de idempotência, mas a implementação ainda tem corrida pré-inserção. O recurso está desabilitado por configuração padrão, o que reduz a exposição atual. Notificações do backend têm API, mas a experiência mobile não entrega push e não apresenta uma recuperação clara de falha.

## Compatibilidade mobile ↔ backend

| Contrato | Situação |
|---|---|
| Login/cadastro/me/perfil | Compatível, sem renovação de sessão. |
| Post e upload de mídia | Compatível após a correção de outbox/replay. |
| Feed, perfis, busca, ONGs, chat, comentários | Rotas existentes; comentários precisam idempotência. |
| Resgate, localização e incidentes | Rotas existem, mas confiabilidade offline/replay é insuficiente. |
| Push | API e worker existem; cliente não faz o registro. |
| Doação | Rota existe, mas o replay concorrente não é seguro. |

## Gates mínimos de liberação

1. Implementar renovação de token e teste de expiração de 15 minutos.
2. Reescrever outbox de resgate com idempotência e sem truncamento.
3. Habilitar push real e validar recepção em background em Android/iOS.
4. Tornar comentários, resgates, incidentes e doações seguros contra replay/concorrência.
5. Criar testes de integração com PostgreSQL/Redis para timeout após commit, concorrência, 429, offline→online e reinício.
6. Instalar Rust/Cargo no CI e tornar `cargo test`, `cargo fmt --check`, `cargo clippy -- -D warnings` e `npm run typecheck` obrigatórios.
7. Corrigir CORS de produção para lista explícita de origens e testar o preflight publicado.

## Evidências

1. [Cliente de sessão](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/services/secureSession.ts) e [emissão de refresh token](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/backend/src/routes/identity/auth.rs).
2. [Outbox de resgate](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/services/rescueOutbox.ts) e [trigger de resgate](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/backend/src/routes/operations/rescue.rs).
3. [Registro de alertas desativado](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/services/rescueNotifications.ts).
4. [Engine HTTP e retries](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/services/zoohelpEngine.ts), [comentários](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/backend/src/routes/content/posts.rs) e [doações](/C:/Users/Chainfx/Desktop/helpin-mobile-platform/backend/src/routes/commerce/donations.rs).
5. Verificação externa em 2026-09-09: [healthz](https://helpin-platform-core-production.up.railway.app/healthz) e preflight de `/v1/feed` retornaram HTTP 200; o preflight devolveu `Access-Control-Allow-Origin: *`.
