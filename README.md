<div align="center">

# 🎵 WaxLog

A personal music journal for Android. Track the albums you've listened to, are currently listening to, or want to listen to — with per-track ratings, statistics, and visual exploration by genre and artist.

[![Build APK](https://github.com/diegoguadron2/Waxlog/actions/workflows/build.yml/badge.svg)](https://github.com/diegoguadron2/Waxlog/actions/workflows/build.yml)
&nbsp;
![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)
&nbsp;
![Expo](https://img.shields.io/badge/Expo_SDK_54-000020?style=flat&logo=expo&logoColor=white)
&nbsp;
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat&logo=sqlite&logoColor=white)

### [⬇️ Download latest APK](https://expo.dev/accounts/diegoguadron2/projects/waxlog/builds)

</div>

---

## 📸 Screenshots

![Image](https://github.com/user-attachments/assets/3c13dafe-3294-4bfa-b529-08542d172efc)
![Image](https://github.com/user-attachments/assets/c919d2ef-c989-44ad-999c-64580e00cb87)
![Image](https://github.com/user-attachments/assets/4286aa39-43a4-494e-b493-632c614b9e52)
![Image](https://github.com/user-attachments/assets/89b38883-cced-4db2-b7a5-0a16f809a371)
![Image](https://github.com/user-attachments/assets/e3d34ca4-5b9a-434c-bee9-c190658bfc32)
![Image](https://github.com/user-attachments/assets/0d4c0992-5604-4fd1-8f38-498a1d2a9193)
![Image](https://github.com/user-attachments/assets/4281c9c9-7724-46c7-b1d5-9f220334af15)

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

## 🚀 Run locally

```bash
# Clone the repo
git clone https://github.com/diegoguadron2/Waxlog.git
cd Waxlog

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

<div align="center">
Built with React Native &nbsp;·&nbsp; Local SQLite database &nbsp;·&nbsp; No backend required
</div>
