# ZooHelp Apple Release Checklist

## Build Readiness

- Install dependencies with `pnpm install` at the client workspace root.
- Run `pnpm run typecheck`.
- Run `pnpm run test:contracts`.
- Configure `EXPO_OWNER`, `ASC_APP_ID`, and `APPLE_TEAM_ID`.
- Set production API with `EXPO_PUBLIC_API_BASE_URL=https://zoohelp-core-production.up.railway.app`.
- Build TestFlight: `pnpm exec eas build --platform ios --profile production`.
- Submit TestFlight/App Store: `pnpm exec eas submit --platform ios --profile production`.

## App Store Connect

- App name: ZooHelp.
- Bundle ID: `com.zoohelp.app`.
- Category: Social Networking or Lifestyle.
- Age rating: review user-generated content, animal rescue cases, donations, chat.
- Add support URL.
- Add privacy policy URL.
- Add screenshots for required iPhone sizes.
- Fill App Privacy labels for account data, location, user content, identifiers, diagnostics, and purchases/donations if enabled.

## Release Blockers Before Public Launch

- Replace remaining screen-level mocks with backend-backed data or make mock mode explicitly disabled in production.
- Verify auth, register person/ONG, feed, post creation, Cloudinary media upload, chat, geolocation, donations, moderation, and reporting flows against production backend.
- Add content moderation/reporting controls for user-generated content.
- Add account deletion flow and support contact.
- Run TestFlight QA on real iPhone devices.

