import Constants from 'expo-constants';
import { Alert, Linking } from 'react-native';

const GITHUB_REPO = 'DHNSHYDV/cine-riddle';
const UPDATE_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export async function checkForUpdates() {
    try {
        const currentVersion = Constants.expoConfig?.version || '1.0.0';
        console.log(`[UpdateService] Current Version: ${currentVersion}`);

        const response = await fetch(API_URL);
        if (!response.ok) {
            console.log('[UpdateService] Failed to fetch latest release from GitHub');
            return;
        }

        const latestRelease = await response.json();
        const latestVersion = latestRelease.tag_name.replace('v', '');
        console.log(`[UpdateService] Latest Version: ${latestVersion}`);

        if (isVersionNewer(currentVersion, latestVersion)) {
            showUpdateAlert();
        }
    } catch (error) {
        console.error('[UpdateService] Error checking for updates:', error);
    }
}

function isVersionNewer(current: string, latest: string) {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const c = currentParts[i] || 0;
        const l = latestParts[i] || 0;
        if (l > c) return true;
        if (l < c) return false;
    }
    return false;
}

function showUpdateAlert() {
    Alert.alert(
        "Update Available",
        "A new version of Cine Riddle is available. Download the latest APK to get the newest features and fixes!",
        [
            {
                text: "Later",
                style: "cancel"
            },
            {
                text: "Download Now",
                onPress: () => Linking.openURL(UPDATE_URL)
            }
        ]
    );
}
