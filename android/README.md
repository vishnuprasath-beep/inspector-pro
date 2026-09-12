# Inspectra Pro — Android Application & APK Build Guide

This directory contains the native Android Studio project for **Inspectra Pro**, wrapping the live production cloud portal (`https://inspectra-pro-2026.surge.sh`) with native hardware acceleration, automatic WebRTC camera feed passthrough, and GPS geolocation permissions.

---

## Option 1: Instant 1-Tap Native APK Install via Android Chrome (Fastest — No Tools Required)

Android's Chrome browser comes with a built-in **WebAPK compiler**:
1. Open Google Chrome on your Android mobile device.
2. Navigate to:
   ```
   https://inspectra-pro-2026.surge.sh
   ```
   *(or mirror: `https://inspectra-global.surge.sh`)*
3. Tap the **three vertical dots (⋮)** in the top-right corner of Chrome.
4. Tap **"Install App"** (or **"Add to Home screen"**).
5. Tap **Install**.
6. Google Play Services will automatically compile and install a signed native **Inspectra Pro APK** directly into your phone's app drawer, with:
   - Standalone full-screen mode (no URL bar).
   - Instant camera and geolocation access.
   - Separate Field Inspector and Admin portals.

---

## Option 2: Build APK via Android Studio

### Prerequisites
- Android Studio installed on your computer.

### Steps
1. Launch **Android Studio**.
2. Click **File** $\rightarrow$ **Open...** and choose the `android` folder:
   `c:\Users\prakash c\New folder (2)\android`
3. Wait 1-2 minutes for Gradle sync to complete.
4. From the top menu bar, click:
   **Build** $\rightarrow$ **Build Bundle(s) / APK(s)** $\rightarrow$ **Build APK(s)**.
5. Once compiled, click **"locate"** in the popup notification to get your `app-debug.apk`.
6. Transfer `app-debug.apk` to any Android phone via WhatsApp, Google Drive, or USB cable, tap to install, and launch!

---

## Option 3: Download Signed APK from PWABuilder (Cloud APK Generation)

1. Open [https://www.pwabuilder.com/](https://www.pwabuilder.com/) in your browser.
2. Paste the production URL:
   ```
   https://inspectra-pro-2026.surge.sh
   ```
3. Click **Start** $\rightarrow$ Click **Package for Stores** $\rightarrow$ Select **Android**.
4. Click **Generate APK / AAB package**.
5. Download the `.apk` file directly and install on your phone.

---

## Credentials for Testing

| # | Role | Designation / Post | Name | Login ID | Password | Portal Access |
|---|------|---------------------|------|----------|----------|---------------|
| 1 | **Admin** | Administrator | K. Selvakumar, IAS | `admin` | `Admin@2026` | `/admin-dashboard` |
| 2 | **Admin** | Director | Dr. S. Radhakrishnan | `director` | `Director@2026` | `/admin-dashboard` |
| 3 | **Admin** | Supervisor | M. Muthukumar | `supervisor` | `Super@2026` | `/admin-dashboard` |
| 4 | **Inspector** | Field Inspector 01 | Vishnu Prasath | `vishnu.p` | `Field@2026` | `/field-inspector` |
| 5 | **Inspector** | Field Inspector 02 | Vishnu Varthan | `vishnu.v` | `Field@2026` | `/field-inspector` |
| 6 | **Inspector** | Field Inspector 03 | Sivavaiyapuri | `siva.v` | `Field@2026` | `/field-inspector` |
| 7 | **Inspector** | Field Inspector 04 | Sriram | `sriram` | `Field@2026` | `/field-inspector` |
| 8 | **Inspector** | Field Inspector 05 | Mahalakshmi | `maha.l` | `Field@2026` | `/field-inspector` |
| 9 | **Inspector** | Field Inspector 06 | Sivamathi | `sivamathi` | `Field@2026` | `/field-inspector` |
