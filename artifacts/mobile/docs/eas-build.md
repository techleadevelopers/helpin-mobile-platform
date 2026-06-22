# Gerar APK teste
eas build --platform android --profile apk_direct_test

# Observacao
# O workspace pnpm do client inclui apenas artifacts/mobile para o EAS nao
# validar artifacts/admin durante o build do APK.

# APK Play Store
# Antes de enviar uma atualizacao para o Google Play, ajuste em `app.config.ts`:
# - `APP_VERSION`: versao visivel para o usuario, exemplo `1.0.2`.
# - `ANDROID_VERSION_CODE`: numero inteiro sempre maior que o ultimo enviado ao Google Play.
# Como o `eas.json` usa `appVersionSource: local`, o EAS usa esses valores do app config.
eas build --platform android --profile production

# IPAA Apple Store
eas build --platform ios --profile production

eas submit --platform ios --profile production
