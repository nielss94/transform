# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

---

## Release (EAS Build & Submit)

This project is configured for EAS. Make sure you have the Expo CLI and EAS CLI logged in (`npx expo login`, `npx eas login`).

### Prereqs
- Set identifiers in `app.json`:
  - Android: `expo.android.package`, `expo.android.versionCode`
  - iOS: `expo.ios.bundleIdentifier`, `expo.ios.buildNumber`
- Add app icons and splash (already set under `assets/images`).
- Ensure your `scheme` is unique (`beforeafter`).

### Build

Android (internal/dev):
```bash
npm run build:android:preview
```

Android (store/production):
```bash
npm run build:android
```

iOS (store/production):
```bash
npm run build:ios
```

During first build, EAS will help you create or reuse signing credentials.

### Submit

Android → Play Console:
```bash
npm run submit:android
```
- Requires a Play Console service account JSON uploaded to EAS (EAS will prompt to configure once).

iOS → App Store Connect:
```bash
npm run submit:ios
```
- Requires an App Store Connect API Key (Issuer ID, Key ID, .p8) configured with EAS.

### Versioning
- Bump `expo.version` for marketing version.
- Increment `expo.android.versionCode` (integer) for each Play Console release.
- Increment `expo.ios.buildNumber` (string) for each App Store release.

### Useful
- Preview build for testers (Android APK):
```bash
npm run build:android:preview
```
- Development build for local testing:
```bash
eas build --profile development --platform android
```

For more: see Expo docs on EAS Build and Submit.
