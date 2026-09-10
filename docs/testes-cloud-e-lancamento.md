# Testes cloud e gate de lançamento

O runner [cloud-e2e.mjs](../scripts/cloud-e2e.mjs) usa por padrão `https://helpin-platform-core-production.up.railway.app` e produz um relatório JSON no terminal.

## Cobertura

| Grupo | Fluxos verificados |
|---|---|
| Público | health, CORS, feed, ONGs, busca, casos próximos, suporte e métricas |
| Sessão | login, `/v1/me`, notificações, salas de chat, refresh e revogação do refresh anterior |
| Social e publicação | criar/repetir post, detalhe, curtir/descurtir, comentário/replay e listagem |
| Chat | abrir sala direta, enviar/repetir mensagem, listar, marcar leitura e ticket WebSocket |
| Resgate | criar emergência isolada, trigger/replay, localização, encerramento/replay e limpeza |

## Execução segura

Somente leitura — pode rodar contra a Railway pública:

```powershell
npm run test:cloud
```

Sessão (usa conta descartável):

```powershell
$env:E2E_TEST_EMAIL = 'qa+mobile@seu-dominio.com'
$env:E2E_TEST_PASSWORD = 'senha-da-conta-exclusiva-de-qa'
npm run test:cloud:auth
```

O teste completo altera dados, envia uma mensagem ao usuário de QA e cria/encerra uma simulação de resgate. Execute-o apenas depois de criar duas contas isoladas e de configurar uma área de teste sem pessoas inscritas para alertas:

```powershell
$env:E2E_TEST_EMAIL = 'qa-resgate@seu-dominio.com'
$env:E2E_TEST_PASSWORD = 'senha-da-conta-exclusiva-de-qa'
$env:E2E_CHAT_PARTICIPANT_ID = 'UUID-da-segunda-conta-de-qa'
$env:E2E_RESCUE_LAT = '-23.5505'
$env:E2E_RESCUE_LNG = '-46.6333'
$env:E2E_ALLOW_PRODUCTION_WRITES = 'I_HAVE_AN_ISOLATED_TEST_ACCOUNT'
npm run test:cloud:full
```

Posts criados são apagados no encerramento do runner. Mensagens de chat não possuem rota de exclusão e, por isso, devem ir exclusivamente para a segunda conta de QA.

## Regra de liberação

O comando público deve terminar com código zero, sem CORS curinga. Os comandos autenticado e completo devem ser executados no pipeline de homologação a cada release. Produção só recebe o artefato depois de homologação aprovada e do teste manual físico de push (Android e iOS, app fechado), pois token Expo e entrega em background dependem do dispositivo e não são simuláveis por HTTP.
