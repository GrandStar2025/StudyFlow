// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getDatabase, ref, set, get } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD33YiLLyTxlIycnHcArDKbgxvK_se27eA",
    authDomain: "studyflow-6ed25.firebaseapp.com",
    databaseURL: "https://studyflow-6ed25-default-rtdb.firebaseio.com",
    projectId: "studyflow-6ed25",
    storageBucket: "studyflow-6ed25.firebasestorage.app",
    messagingSenderId: "562903369542",
    appId: "1:562903369542:web:3f80ceb14d749870fc0747",
    measurementId: "G-TD7DS8YKSB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// Default settings
const defaultSettings = {
    notifications: true,
    language: 'en',
    privacy: {
        shareHistory: false,
        shareNotes: false,
        shareProgress: true
    },
    studyPreferences: {
        autoPlay: true,
        playbackSpeed: 1.0,
        quality: 'auto'
    }
};

// Get settings from local storage
function getLocalSettings() {
    const settings = localStorage.getItem('userSettings');
    return settings ? JSON.parse(settings) : defaultSettings;
}

// Save settings to local storage
function saveLocalSettings(settings) {
    localStorage.setItem('userSettings', JSON.stringify(settings));
}

// Save settings to Firebase
async function saveFirebaseSettings(userId, settings) {
    try {
        await set(ref(db, `users/${userId}/settings`), settings);
        return true;
    } catch (error) {
        console.error('Error saving settings to Firebase:', error);
        return false;
    }
}

// Get settings from Firebase
async function getFirebaseSettings(userId) {
    try {
        const snapshot = await get(ref(db, `users/${userId}/settings`));
        return snapshot.exists() ? snapshot.val() : defaultSettings;
    } catch (error) {
        console.error('Error getting settings from Firebase:', error);
        return defaultSettings;
    }
}

// Apply settings to the UI
function applySettings(settings) {
    // Apply notifications
    document.getElementById('notificationsToggle').checked = settings.notifications;

    // Apply language
    document.getElementById('languageSelect').value = settings.language;

    // Apply privacy settings
    document.getElementById('shareHistoryToggle').checked = settings.privacy.shareHistory;
    document.getElementById('shareNotesToggle').checked = settings.privacy.shareNotes;
    document.getElementById('shareProgressToggle').checked = settings.privacy.shareProgress;

    // Apply study preferences
    document.getElementById('autoPlayToggle').checked = settings.studyPreferences.autoPlay;
    document.getElementById('playbackSpeedSelect').value = settings.studyPreferences.playbackSpeed;
    document.getElementById('qualitySelect').value = settings.studyPreferences.quality;
}

// Save settings (both locally and to Firebase)
async function saveSettings(settings) {
    // Save to local storage first (immediate)
    saveLocalSettings(settings);

    // Apply settings immediately
    applySettings(settings);

    // Save to Firebase in the background
    const user = auth.currentUser;
    if (user) {
        saveFirebaseSettings(user.uid, settings);
    }
}

// Initialize settings
async function initializeSettings() {
    const user = auth.currentUser;
    let settings;

    if (user) {
        // Get settings from Firebase
        settings = await getFirebaseSettings(user.uid);
        // Save to local storage for faster access
        saveLocalSettings(settings);
    } else {
        // Use local settings
        settings = getLocalSettings();
    }

    // Apply settings
    applySettings(settings);
}

// Update UI based on auth state
function updateUIForUser(user) {
    const profileDropdown = document.getElementById('profileDropdown');
    const authButtons = document.getElementById('authButtons');
    const userProfilePic = document.getElementById('userProfilePic');
    const userName = document.getElementById('userName');

    if (user) {
        // User is signed in
        profileDropdown.style.display = 'block';
        authButtons.style.display = 'none';
        userProfilePic.src = user.photoURL || 'https://via.placeholder.com/32';
        userName.textContent = user.displayName || 'User';
        userName.classList.remove('d-none');
        userName.classList.add('d-md-inline');
    } else {
        // User is signed out
        profileDropdown.style.display = 'none';
        authButtons.style.display = 'block';
        userProfilePic.src = 'https://via.placeholder.com/32';
        userName.textContent = 'Sign In';
        userName.classList.add('d-none');
    }
}

// Event listeners for settings changes
document.addEventListener('DOMContentLoaded', () => {
    // Initialize settings
    initializeSettings();

    // Set up auth state observer
    onAuthStateChanged(auth, async (user) => {
        updateUIForUser(user);
        if (user) {
            // Load user settings from Firebase when signed in
            const settings = await getFirebaseSettings(user.uid);
            saveLocalSettings(settings);
            applySettings(settings);
        }
    });

    // Sign out functionality
    const signOutButton = document.getElementById('signOutButton');
    if (signOutButton) {
        signOutButton.addEventListener('click', async () => {
            try {
                await auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('Error signing out:', error);
            }
        });
    }

    // Theme switch
    document.getElementById('themeSwitch').addEventListener('change', (e) => {
        const themeSettings = ThemeManager.getLocalTheme();
        themeSettings.theme = e.target.checked ? 'dark' : 'light';
        ThemeManager.saveTheme(themeSettings);
    });

    // Notifications toggle
    document.getElementById('notificationsToggle').addEventListener('change', (e) => {
        const settings = getLocalSettings();
        settings.notifications = e.target.checked;
        saveSettings(settings);
    });

    // Language select
    document.getElementById('languageSelect').addEventListener('change', (e) => {
        const settings = getLocalSettings();
        settings.language = e.target.value;
        saveSettings(settings);
    });

    // Privacy toggles
    document.getElementById('shareHistoryToggle').addEventListener('change', (e) => {
        const settings = getLocalSettings();
        settings.privacy.shareHistory = e.target.checked;
        saveSettings(settings);
    });

    document.getElementById('shareNotesToggle').addEventListener('change', (e) => {
        const settings = getLocalSettings();
        settings.privacy.shareNotes = e.target.checked;
        saveSettings(settings);
    });

    document.getElementById('shareProgressToggle').addEventListener('change', (e) => {
        const settings = getLocalSettings();
        settings.privacy.shareProgress = e.target.checked;
        saveSettings(settings);
    });

    // Study preferences
    document.getElementById('autoPlayToggle').addEventListener('change', (e) => {
        const settings = getLocalSettings();
        settings.studyPreferences.autoPlay = e.target.checked;
        saveSettings(settings);
    });

    document.getElementById('playbackSpeedSelect').addEventListener('change', (e) => {
        const settings = getLocalSettings();
        settings.studyPreferences.playbackSpeed = parseFloat(e.target.value);
        saveSettings(settings);
    });

    document.getElementById('qualitySelect').addEventListener('change', (e) => {
        const settings = getLocalSettings();
        settings.studyPreferences.quality = e.target.value;
        saveSettings(settings);
    });

    // Primary color picker
    document.getElementById('primaryColorPicker').addEventListener('input', (e) => {
        const themeSettings = ThemeManager.getLocalTheme();
        themeSettings.primaryColor = e.target.value;
        ThemeManager.saveTheme(themeSettings);
    });
});

// Google Sign In
async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // After successful sign-in, update UI and load settings
        updateUIForUser(user);
        const settings = await getFirebaseSettings(user.uid);
        saveLocalSettings(settings);
        applySettings(settings);
    } catch (error) {
        console.error('Error signing in with Google:', error);
    }
}

// Make signInWithGoogle available globally
window.signInWithGoogle = signInWithGoogle;

// Export functions for use in other files
window.SettingsManager = {
    getSettings: getLocalSettings,
    saveSettings: saveSettings,
    applySettings: applySettings
}; 