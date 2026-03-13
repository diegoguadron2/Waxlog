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

<div align="center">
<table>
  <tr>
    <td><img src="https://github.com/diegoguadron2/Waxlog/blob/732cc6dfa1cdabcbb9effbfc25e80534844fb1c2/assets/readme/IMG_20260313_125943.jpg.jpeg
" width="160"/></td>
    <td><img src="assets\readme\IMG_20260313_130008.jpeg
" width="160"/></td>
    <td><img src="assets\readme\IMG_20260313_130028.jpeg
" width="160"/></td>
    <td><img src="assets\readme\IMG_20260313_130051.jpeg
" width="160"/></td>
  </tr>
  <tr>
    <td><img src="assets\readme\IMG_20260313_130111.jpg.jpeg
"/></td>
    <td><img src="assets\readme\IMG_20260313_130129.jpg.jpeg
" width="160"/></td>
    <td><img src="assets\readme\IMG_20260313_130224.jpeg" width="160"/></td>
    <td></td>
  </tr>
</table>
</div>

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
