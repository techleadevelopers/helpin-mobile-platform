# ZooHelp Frontend Engine

Camada fina para o app Expo consumir o core Rust sem acoplar UI a detalhes de infraestrutura.

Uso previsto:

```ts
import { ZooHelpEngine } from "@workspace/zoohelp-engine";

const engine = new ZooHelpEngine({ apiBaseUrl: "http://127.0.0.1:8080" });
const feed = await engine.feed();
```

Regra arquitetural:
- UI Expo/React Native fica em `artifacts/mobile`.
- Contratos gerados ficam em `lib/api-client-react` e `lib/api-zod`.
- Backend Rust/Python fica fora do client, em `../backend`.
- Esta lib so centraliza configuração, capacidades e chamadas ao core.
