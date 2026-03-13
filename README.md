# 🎵 WaxLog

A personal music journal for Android. Track the albums you've listened to, are currently listening to, or want to listen to — with per-track ratings, statistics, and visual exploration by genre and artist.

## 📲 Download

[![Build APK](https://github.com/Fosalud/Waxlog/actions/workflows/build.yml/badge.svg)](https://github.com/TU_USUARIO/waxlog/actions/workflows/build.yml)

> **[⬇️ Download latest APK](https://expo.dev/accounts/Fosalud/projects/waxlog/builds)**

---

## ✨ Features

- **Personal library** — organize albums by status: listened, listening, or want to listen
- **Per-track ratings** — rate each song individually with automatic album average
- **Genre explorer** — visual grid with cover art, filters, and average rating per genre
- **Artist explorer** — full discography from Deezer with your saved albums highlighted
- **Statistics** — rating distribution chart, completion rate, artists and track counts
- **Smart lists** — recently added, by decade, this month's anniversaries, forgotten albums, top rated
- **Random album** — get a suggestion from your pending list when you don't know what to play
- **Search** — find albums on Deezer or search within your local library
- **Backup & Restore** — export and import your entire collection as a JSON file

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React Native + Expo SDK 54 | Core framework |
| expo-sqlite | Local database (offline-first) |
| react-native-reanimated | High-performance animations |
| expo-linear-gradient | Dynamic gradients and backgrounds |
| react-native-image-colors | Dominant color extraction from album art |
| Deezer API | Album and artist metadata |
| EAS Build | Cloud APK compilation |

## 📸 Screenshots

<!-- Add screenshots here -->

## 🚀 Run locally

```bash
# Clone the repo
git clone https://github.com/TU_USUARIO/waxlog.git
cd waxlog

# Install dependencies
npm install

# Start with Expo Go
npx expo start
```

## 🏗️ Build APK manually

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

---

Built with React Native · Local SQLite database · No backend required
