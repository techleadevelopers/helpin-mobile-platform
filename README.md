# <img src="https://res.cloudinary.com/limpeja/image/upload/v1779071066/Gemini_Generated_Image_v5ufmcv5ufmcv5uf-removebg-preview_lcxvg8.png" alt="ZooHelp Logo" width="58" align="center"> ZooHelp Mobile - Help the animals near you.

> Helping vulnerable animals has always meant a lot to me, and seeing technology used to create real-world compassion, rescue, and community impact is something I genuinely respect. 💚

### Global Animal Rescue, Adoption & Social Impact Mobile Platform

ZooHelp is a scalable mobile-first platform building trusted digital infrastructure for animal rescue, adoption, NGO networking, veterinary collaboration, and community-driven protection ecosystems.

Designed to connect:
- Animal rescuers
- NGOs
- Independent protectors
- Veterinary professionals
- Volunteers
- Donors
- Adopters

ZooHelp transforms fragmented rescue efforts into a unified, modern, trustworthy global ecosystem.

---

# Mission

To modernize and scale animal protection through technology by empowering communities, verified organizations, and social impact networks to rescue, protect, and rehome vulnerable animals worldwide.

---

# Core Product Vision

ZooHelp combines:

- Social marketplace
- Rescue coordination
- NGO infrastructure
- Community trust systems
- Geolocation discovery
- Donation ecosystems
- Adoption pipelines
- Emergency response layers

---

# Platform Capabilities

## User Features
- Animal adoption listings
- Lost & found reports
- Emergency rescue cases
- Donation campaigns
- Geolocated nearby cases
- Real-time chat
- NGO and protector profiles
- Verification systems
- Trust and transparency tools
- Community engagement

---

## NGO & Institutional Features
- Verified NGO onboarding
- Campaign management
- Rescue analytics
- Community management
- Volunteer coordination
- Donor funnels
- Trust dashboards
- Financial transparency layers

---

# Technology Stack

## Frontend
- Expo
- React Native
- Expo Router
- TypeScript
- NativeWind
- React Query
- AsyncStorage / MMKV
- Reanimated
- Gesture Handler

---

## Backend (Current MVP)
- Node.js
- Express 5
- PostgreSQL
- Drizzle ORM
- Zod
- OpenAPI
- Orval

---

## Planned Enterprise Evolution
- Rust core infrastructure
- Global geolocation services
- Trust scoring engines
- Advanced feed ranking
- Fraud prevention
- AI moderation
- Event-driven architecture
- Distributed scaling

---

# Run & Operate

## Development
- `pnpm --filter @workspace/api-server run dev` — Run API server (port 5000)
- `pnpm run typecheck` — Full monorepo typecheck
- `pnpm run build` — Build all packages
- `pnpm --filter @workspace/api-spec run codegen` — Regenerate API clients/schemas
- `pnpm --filter @workspace/db run push` — Push DB schema changes (development only)

---

## Environment
Required:
- `DATABASE_URL` — PostgreSQL connection string

---

# Repository Structure

## Mobile Platform
- `artifacts/mobile/` — Main Expo application
- `artifacts/mobile/app/` — File-based routing
- `artifacts/mobile/app/(tabs)/` — Core navigation:
  - Feed
  - Map
  - Publish
  - Chat
  - Profile
- `artifacts/mobile/components/` — Shared UI system
- `artifacts/mobile/context/` — Global state
- `artifacts/mobile/constants/` — Design system, palette, mock data

---

## Backend
- `artifacts/api-server/` — API services
- `lib/api-spec/openapi.yaml` — API contract source of truth

---

# Product Architecture

## Phase 1 — Marketplace Social Platform
- Feed
- Posts
- Adoption
- Rescue
- Chat
- NGO profiles
- Donations
- Trust systems

---

## Phase 2 — Rescue Operations
- Emergency routing
- Volunteer coordination
- Push alerts
- Regional growth
- NGO dashboards

---

## Phase 3 — Global Animal Protection Infrastructure
- Rust migration
- AI moderation
- Global trust layers
- Enterprise NGO SaaS
- ESG partnerships
- Vet ecosystem
- Global rescue network

---

# Design System

## Brand Palette
- Primary Green: `#4CAF50`
- Trust Blue: `#2F80ED`
- Emergency Coral: `#FF6B6B`
- Background: `#F8FAF8`

---

## Typography
- Inter
- Modern mobile-first hierarchy
- Emotional + trustworthy UX

---

## Design Principles
- Premium soft UI
- High trust
- Emotional resonance
- Accessibility
- Cognitive comfort
- Startup-grade polish

---

# Architecture Decisions

- Frontend-first MVP for accelerated product validation
- AsyncStorage persistence for rapid iteration
- Modular monorepo architecture
- OpenAPI-driven API contracts
- Scalable migration path toward Rust-based enterprise backend
- Community trust-first product strategy

---

# Business Model

ZooHelp operates on a freemium social impact model:

## Free
- Community access
- Publishing
- Adoption
- Rescue
- NGO discovery

---

## Revenue Layers
- Sponsored campaigns
- Verified NGO premium tools
- Boosted posts
- Donation processing
- Veterinary partnerships
- SaaS NGO tooling
- ESG enterprise partnerships

---

# User Preferences

- Portuguese (Brazil) primary market
- Mobile-first
- Trust-first UX
- Emotional but professional branding
- Global expansion readiness

---

# Gotchas

- `react-native-maps` must be pinned to `1.18.0`
- Do NOT add `react-native-maps` to Expo plugins array
- Always handle `fontError` alongside `fontsLoaded`

---

# Strategic Positioning

ZooHelp is not simply a pet adoption app.

ZooHelp is building:
### Digital infrastructure for global animal protection.

---

# Future Vision

### “Connecting the world to rescue, protect, and rehome animals through trusted technology.”

---

# Internal Notes

For workspace structure, TypeScript setup, and package conventions:
- Refer to `pnpm-workspace` skill documentation.