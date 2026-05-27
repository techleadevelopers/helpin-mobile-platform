# UX/CSS - User ID, Post ID e Profile

Documento de referencia visual para as telas:

- `app/user/[id].tsx`
- `app/post/[id].tsx`
- `app/(tabs)/profile.tsx`

Objetivo: manter uma linguagem premium, limpa, verde, social e mobile-first em telas de usuario, perfil e detalhe de post.

## Direção Visual

As tres telas usam uma estetica de produto social com foco em cuidado animal:

- Base clara, quente e limpa.
- Verde institucional como cor principal.
- Cards brancos ou verde muito claro com bordas suaves.
- Elementos arredondados, mas sem exagerar em pill em excesso.
- Sombras pequenas para elevar cards importantes.
- Tipografia Montserrat para identidade forte e Inter para itens funcionais.
- Icones `MaterialCommunityIcons`.
- Feedback tatil em acoes importantes usando `expo-haptics`.

## Paleta

```css
:root {
  --zoo-primary: #2D6A4F;
  --zoo-primary-dark: #1C251D;
  --zoo-ink: #18231B;
  --zoo-ink-soft: #253026;
  --zoo-text: #3D473F;
  --zoo-muted: #7C867C;
  --zoo-muted-2: #8A928B;
  --zoo-muted-3: #A4AAA4;

  --zoo-bg: #FFFFFF;
  --zoo-bg-warm: #F7F8F4;
  --zoo-bg-soft: #F5F7F2;
  --zoo-bg-chip: #F4F6F3;
  --zoo-bg-green: #EAF3EC;
  --zoo-bg-green-2: #EAF7EF;
  --zoo-bg-green-3: #D7E9DA;

  --zoo-border: #E4EAE5;
  --zoo-border-soft: #E8EDE8;
  --zoo-border-green: #CFE0D4;

  --zoo-danger: #C95A5A;
  --zoo-danger-2: #B84D5F;
  --zoo-alert: #FF5A7A;
  --zoo-map-blue: #76A7FF;
  --zoo-pin-pink: #FF5A8C;

  --zoo-glass-green: rgba(42, 87, 58, 0.27);
  --zoo-glass-row: rgba(229, 240, 231, 0.38);
  --zoo-backdrop: rgba(20, 28, 22, 0.28);
}
```

## Tipografia

```css
:root {
  --font-brand: "Montserrat";
  --font-ui: "Inter";

  --text-xxs: 9px;
  --text-xs: 10px;
  --text-sm: 11px;
  --text-md: 12px;
  --text-lg: 13px;
  --text-xl: 14px;
  --text-title: 16px;
  --text-brand: 25px;

  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;
}
```

Uso por tela:

- Logo `ZooHelp`: Montserrat 700, 25px, sombra verde suave.
- Titulos de cards: Montserrat 700, 12-16px.
- Metadados e labels: Montserrat 500/600, 9-12px.
- Bottom nav: Inter 500, 10px.

## Layout Base

```css
.screen {
  flex: 1;
  background: var(--zoo-bg);
}

.screen-warm {
  flex: 1;
  background: var(--zoo-bg-warm);
}

.content {
  padding: 18px;
  gap: 14px;
}

.section {
  gap: 6px;
}
```

## Logo/Header Padrao

Usado em `user/[id]` e `post/[id]`.

```css
.logo-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0;
}

.logo-icon {
  width: 31.5px;
  height: 31.5px;
  border-radius: 8px;
}

.logo-text {
  margin-left: 2px;
  top: 2px;
  font-family: var(--font-brand);
  font-size: var(--text-brand);
  font-weight: var(--weight-bold);
  line-height: 31px;
  color: var(--zoo-primary);
  letter-spacing: -1px;
  text-shadow: 0 1px 2px rgba(46, 125, 50, 0.2);
}
```

## Cards

### Card Branco Premium

```css
.card {
  background: #FFFFFF;
  border: 1px solid var(--zoo-border-soft);
  border-radius: 18px;
  box-shadow: 0 4px 10px rgba(23, 32, 24, 0.06);
}
```

### Card Verde Claro

```css
.soft-green-card {
  background: rgba(234, 247, 239, 1);
  border-radius: 18px;
}
```

### Card de Autor no Post

```css
.author-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(244, 246, 243, 0.8);
  box-shadow: 0 5px 13px rgba(31, 53, 40, 0.055);
}

.author-name {
  font-family: var(--font-brand);
  font-size: 14px;
  font-weight: var(--weight-semibold);
  color: var(--zoo-ink);
}

.author-type {
  font-family: var(--font-brand);
  font-size: 11px;
  font-weight: var(--weight-semibold);
  color: var(--zoo-primary);
}
```

## Profile Screen

Arquivo: `app/(tabs)/profile.tsx`

### UX

- Fundo geral `#F7F8F4`.
- Top bar com dois botoes circulares verdes claros.
- Avatar central elevado com anel, sombra, badge de verificação e camera.
- Nome e role centralizados.
- Localização em pill verde claro.
- Lista de casos com rows brancas.
- Menu principal em card branco unico com divisores internos.
- Danger zone em vermelho claro, separada visualmente.

### CSS Equivalente

```css
.profile-screen {
  flex: 1;
  background: #F7F8F4;
}

.profile-top-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 6px 18px 8px;
}

.profile-icon-btn {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #EAF7EF;
}

.profile-center-dots {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
}

.profile-dot {
  width: 4px;
  height: 4px;
  border-radius: 2px;
  background: #CAD8CB;
}

.profile-dot-active {
  width: 16px;
  height: 4px;
  border-radius: 2px;
  background: var(--zoo-primary);
}

.avatar-ring {
  width: 104px;
  height: 104px;
  border-radius: 52px;
  background: #F7F8F4;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 14px rgba(0, 0, 0, 0.08);
}

.profile-photo {
  width: 86px;
  height: 86px;
  border-radius: 43px;
  background: var(--zoo-primary);
}

.profile-camera-badge {
  position: absolute;
  right: -2px;
  bottom: 4px;
  width: 27px;
  height: 27px;
  border-radius: 13.5px;
  background: #EAF7EF;
  border: 2px solid #F7F8F4;
  display: flex;
  align-items: center;
  justify-content: center;
}

.identity-block {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 18px;
}

.user-name {
  font-family: var(--font-brand);
  font-size: 17px;
  font-weight: var(--weight-bold);
  color: #1C251D;
  letter-spacing: -0.25px;
}

.user-role {
  font-family: var(--font-brand);
  font-size: 11px;
  font-weight: var(--weight-medium);
  color: #7B827B;
}

.location-pill {
  margin-top: 5px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 14px;
  background: #EAF7EF;
}

.section-block {
  margin: 0 18px;
  gap: 9px;
}

.case-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 11px;
  border-radius: 18px;
  background: #FFFFFF;
}

.menu-card {
  margin: 0 18px;
  border-radius: 24px;
  background: #FFFFFF;
  overflow: hidden;
}

.menu-item {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
}

.menu-icon-wrap {
  width: 34px;
  height: 34px;
  border-radius: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-divider {
  height: 1px;
  margin-left: 60px;
  background: #F0F2EE;
}

.logout-btn {
  margin: 0 18px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 0;
  border-radius: 18px;
  background: #EEF2EC;
}

.danger-zone {
  margin: 0 18px;
  border-radius: 18px;
  background: #FFF1F2;
  padding: 12px;
  gap: 8px;
}
```

## User ID Screen

Arquivo: `app/user/[id].tsx`

### UX

- Header com gradiente `#F5F7F2 -> #FFFFFF`.
- Busca compacta no topo.
- Perfil publico com avatar, nome, role, localização e acoes.
- Estatisticas em barra com borda superior/inferior.
- Tabs em container verde claro.
- Grid de posts em cards pequenos.
- Overlay de seguidores/seguindo com `BlurView`, fundo verde vidro e rows translucidas.

### CSS Equivalente

```css
.public-user-header {
  padding: 22px 18px 12px;
  background: linear-gradient(180deg, #F5F7F2 0%, #FFFFFF 100%);
}

.user-search-box {
  min-height: 34px;
  margin-top: 10px;
  padding: 0 11px;
  border-radius: 17px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 7px;
  background: #F4F6F3;
  border: 1px solid #E4EAE5;
}

.profile-head {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  margin-top: 18px;
}

.name {
  flex: 1;
  font-family: var(--font-brand);
  font-size: 16px;
  font-weight: var(--weight-bold);
  color: #162018;
}

.role {
  font-family: var(--font-brand);
  font-size: 11px;
  font-weight: var(--weight-semibold);
  color: var(--zoo-primary);
}

.action-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 9px;
  margin-top: 11px;
}

.follow-button {
  flex: 1;
  height: 36px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--zoo-primary);
}

.following-button {
  background: #EAF3EC;
  border: 1px solid #CFE0D4;
}

.message-button {
  flex: 1;
  height: 36px;
  border-radius: 18px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #FFFFFF;
  border: 1px solid #DCE4DD;
}

.stats-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  padding: 9px 0;
  border-top: 1px solid #E4EAE5;
  border-bottom: 1px solid #E4EAE5;
}

.stat-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 2px;
}

.stat-value {
  font-family: var(--font-brand);
  font-size: 16px;
  font-weight: var(--weight-bold);
  color: #172018;
}

.stat-label {
  font-family: var(--font-brand);
  font-size: 9px;
  font-weight: var(--weight-medium);
  color: #7C867C;
}

.tabs {
  display: flex;
  flex-direction: row;
  margin: 10px 14px 8px;
  padding: 4px;
  gap: 4px;
  border-radius: 18px;
  background: #F4F7F3;
  border: 1px solid #E6ECE7;
}

.tab-button {
  flex: 1;
  min-height: 46px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: transparent;
}

.tab-button-active {
  background: #FFFFFF;
  border: 1px solid #DCE8DF;
}

.posts-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 2px 12px 0;
  row-gap: 10px;
}

.post-row {
  width: 48.7%;
  gap: 8px;
  padding: 10px;
  border-radius: 18px;
  background: #FFFFFF;
  border: 1px solid #E7EDE8;
  box-shadow: 0 4px 10px rgba(23, 32, 24, 0.06);
}

.post-thumb {
  width: 85%;
  aspect-ratio: 1;
  align-self: center;
  border-radius: 13px;
  background: #E8ECF0;
}
```

### Overlay Vidro Verde

```css
.social-overlay-root {
  flex: 1;
  justify-content: flex-end;
}

.social-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(20, 28, 22, 0.28);
}

.social-sheet {
  margin: 0 10px 10px;
  padding: 8px 14px 14px;
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 10px 22px rgba(36, 76, 53, 0.14);
}

.social-sheet-tint {
  position: absolute;
  inset: 0;
  background: rgba(42, 87, 58, 0.27);
}

.social-title {
  font-family: var(--font-brand);
  font-size: 16px;
  font-weight: var(--weight-bold);
  color: #F3F7F4;
}

.social-subtitle {
  margin-top: 2px;
  font-family: var(--font-brand);
  font-size: 10px;
  font-weight: var(--weight-medium);
  color: rgba(243, 247, 244, 0.78);
}

.social-row {
  min-height: 52px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 9px;
  padding: 0 9px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.22);
}

.social-row-tint {
  position: absolute;
  inset: 0;
  background: rgba(229, 240, 231, 0.38);
}
```

## Post ID Screen

Arquivo: `app/post/[id].tsx`

### UX

- Header simples com logo central.
- Card de autor no topo.
- Grade de fotos dinamica:
  - 1 foto: full width.
  - 2 fotos: duas colunas.
  - 3 fotos: destaque + stack lateral.
  - 4+ fotos: grid 2x2 com overlay `+N`.
- Bloco de publicação com borda tracejada verde.
- Linha de localização compacta.
- Card de mapa horizontal, premium, com preview e pin.
- Card de contato e sheet de contato.
- Tres botoes de ação: Rota, Chat, Contato.
- Bottom nav padronizada por `UserBottomNav`.

### CSS Equivalente

```css
.post-content {
  padding: 18px;
  padding-top: 10px;
  gap: 14px;
  background: var(--zoo-bg);
}

.publication-block {
  gap: 3px;
}

.publication-title {
  padding-top: 5px;
  margin-left: 10px;
  font-family: var(--font-brand);
  font-size: 15px;
  font-weight: var(--weight-semibold);
  line-height: 21px;
  letter-spacing: -1px;
  color: var(--zoo-primary);
  text-shadow: 0 1px 2px rgba(46, 125, 50, 0.2);
}

.title-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  min-height: 136px;
  border-radius: 16px;
  border: 0.8px dashed rgba(45, 106, 79, 0.24);
}

.description {
  padding: 5px 0;
  font-family: var(--font-brand);
  font-size: 14px;
  font-weight: var(--weight-medium);
  line-height: 20px;
  color: var(--zoo-ink);
  opacity: 0.85;
}

.title-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F8FAF7;
  border: 0.5px solid var(--zoo-border);
  box-shadow: 0 3px 7px rgba(31, 53, 40, 0.05);
}

.location-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  padding: 0 2px;
}

.location-text {
  flex: 1;
  font-family: var(--font-brand);
  font-size: 12px;
  line-height: 16px;
  color: var(--zoo-muted);
}
```

### Fotos do Post

```css
.photo-section {
  margin-top: -2px;
  position: relative;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.07);
}

.photo-badges-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
}

.post-photo-grid {
  display: flex;
  flex-direction: row;
  gap: 8px;
}

.post-photo-grid-wrap {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
}

.post-photo-tile {
  border-radius: 13px;
  overflow: hidden;
  border: 1px solid var(--zoo-border);
  background: #E8ECF0;
}

.post-photo-single {
  width: 100%;
  height: 190px;
}

.post-photo-half {
  flex: 1;
  height: 126px;
}

.post-photo-feature {
  flex: 1.35;
  height: 170px;
}

.post-photo-side-stack {
  flex: 1;
  gap: 8px;
}

.post-photo-stacked {
  height: 81px;
}

.post-photo-quarter {
  width: 48.8%;
  height: 112px;
}

.post-photo-more-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.48);
}
```

### Mapa e Acoes

```css
.rescue-map-card {
  height: 96px;
  display: flex;
  flex-direction: row;
  overflow: hidden;
  border-radius: 22px;
  background: #FFFFFF;
  border: 0.5px solid #E3EAE5;
  box-shadow: 0 7px 17px rgba(31, 53, 40, 0.09);
}

.rescue-map-info {
  width: 138px;
  padding: 15px;
  gap: 3px;
  z-index: 2;
}

.rescue-map-title {
  font-family: var(--font-brand);
  font-size: 13px;
  font-weight: var(--weight-bold);
  color: #1C251D;
}

.rescue-map-subtitle {
  font-family: var(--font-brand);
  font-size: 9px;
  font-weight: var(--weight-medium);
  color: #9AA19A;
  line-height: 13px;
}

.rescue-map-link {
  margin-top: 7px;
  font-family: var(--font-brand);
  font-size: 11px;
  font-weight: var(--weight-bold);
  color: var(--zoo-primary);
}

.post-actions-row {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 15px;
  padding-top: 5px;
}

.post-action-button {
  width: 108px;
  min-height: 44px;
  overflow: hidden;
  border-radius: 22px;
}

.post-action-solid {
  min-height: 44px;
  border-radius: 22px;
  background: #626C65;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 7px;
}

.post-action-text {
  font-family: var(--font-brand);
  font-size: 12.5px;
  font-weight: var(--weight-bold);
  color: #F3F7F4;
  letter-spacing: -0.1px;
}
```

## Bottom Nav Padrao

Arquivo: `components/UserBottomNav.tsx`

Padrao atual para telas de usuario:

- `Feed` ou `Dashboard`
- `Mapa`
- `Publicar -> /composer` para usuario comum
- `Casos` para ONG
- `Chat`
- `Perfil`

```css
.bottom-nav {
  min-height: 64px;
  padding-top: 8px;
  padding-horizontal: 4px;
  border-top: 1px solid var(--zoo-border);
  display: flex;
  flex-direction: row;
  background: #FFFFFF;
  box-shadow: 0 -6px 16px rgba(20, 38, 27, 0.07);
}

.bottom-nav-item {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.bottom-nav-text {
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: var(--weight-medium);
}
```

## Modais e Sheets

### Backdrop

```css
.sheet-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(20, 28, 22, 0.28);
}
```

### Sheet Claro

```css
.sheet {
  margin: 0 10px 10px;
  padding: 8px 16px 16px;
  border-radius: 24px;
  background: #FFFFFF;
  border: 1px solid #E6ECE7;
}

.sheet-handle {
  align-self: center;
  width: 34px;
  height: 4px;
  border-radius: 2px;
  background: #DDE5DF;
  margin-bottom: 14px;
}
```

### Modal de Imagem

```css
.image-modal {
  flex: 1;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-modal-close {
  position: absolute;
  top: 48px;
  right: 18px;
  z-index: 2;
  width: 42px;
  height: 42px;
  border-radius: 21px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.16);
}
```

## Regras de UX Para Novas Telas

1. Use `#2D6A4F` como acento principal, nao como fundo dominante em toda a tela.
2. Cards principais devem ter raio entre 16 e 24.
3. Use sombras pequenas; reserve sombras fortes para sheets e overlays.
4. Evite micro-cards dentro de cards quando a informação for apenas texto simples.
5. Para overlays premium, use vidro verde com `BlurView` e uma camada `rgba(42, 87, 58, 0.27)`.
6. Botoes primarios devem ter verde solido, texto branco e raio 18-22.
7. Botoes secundarios devem ser brancos ou verde claro com borda.
8. Metadados devem usar `#7C867C` ou `#8A928B`.
9. Listas densas devem usar divisores internos em vez de cards separados demais.
10. A navbar padrao deve ser `UserBottomNav`, com `Publicar` navegando para `/composer`.

## Componentes e Bibliotecas

- `MaterialCommunityIcons`: icones principais.
- `expo-image`: imagens de perfil e posts.
- `expo-linear-gradient`: headers com gradiente.
- `expo-blur`: overlays de vidro.
- `expo-haptics`: feedback em botoes e acoes.
- `react-native-reanimated`: microinteracoes no profile.
- `UserBottomNav`: navbar padrao de usuario.
- `Avatar`: identidade de usuario/ONG/veterinario.
- `StatusBadge`: status de post/caso.
- `OperationalStatus`: estado operacional dos casos.

