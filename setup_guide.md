# Setup Guide for Cine Riddle

This guide will help you set up the environment and run the project on your macOS machine.

## Prerequisites
- **Node.js**: v18 or later (v23.9.0 detected)
- **Watchman**: `brew install watchman` (recommended for React Native)
- **Android Studio**: Installed with SDK 34 or later.

## Environment Setup

### 1. Configure Android SDK
The project expects the Android SDK at `~/Library/Android/sdk`. 
If you have it installed elsewhere, update the `android/local.properties` file:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

### 2. Set Environment Variables
Run the following command in your terminal to source the environment variables:
```bash
source ./setup_env.sh
```
*Note: You may want to add these exports to your `~/.zshrc` for persistence.*

### 3. Install Dependencies
```bash
npm install
```

## Running the Project

### Start Expo Bundler
```bash
npx expo start
```
Options in the terminal:
- Press `a` to run on Android (requires an emulator or a connected device via USB).
- Press `i` to run on iOS (requires Xcode and Simulator).
- Press `w` to run on Web.

### Debugging
If you encounter "SDK not found" errors:
1. Open **Android Studio**.
2. Go to **Settings > Languages & Frameworks > Android SDK**.
3. Copy the **Android SDK Location** path.
4. Update `android/local.properties` with this path.
