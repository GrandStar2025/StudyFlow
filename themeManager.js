// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
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

// Default theme settings
const defaultTheme = {
    theme: 'light',
    primaryColor: '#4361ee'
};

// Convert hex color to RGB
function hexToRgb(hex) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return { r, g, b };
}

// Apply theme settings to the document
function applyTheme(settings) {
    // Apply theme (light/dark)
    document.documentElement.setAttribute('data-bs-theme', settings.theme);

    // Apply primary color
    document.documentElement.style.setProperty('--primary-color', settings.primaryColor);
    const rgb = hexToRgb(settings.primaryColor);
    document.documentElement.style.setProperty('--primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);

    // Update color picker if it exists
    const colorPicker = document.getElementById('primaryColorPicker');
    if (colorPicker) {
        colorPicker.value = settings.primaryColor;
    }

    // Update theme switch if it exists
    const themeSwitch = document.getElementById('themeSwitch');
    if (themeSwitch) {
        themeSwitch.checked = settings.theme === 'dark';
    }
}

// Get theme from local storage
function getLocalTheme() {
    const theme = localStorage.getItem('themeSettings');
    return theme ? JSON.parse(theme) : defaultTheme;
}

// Save theme to local storage
function saveLocalTheme(settings) {
    localStorage.setItem('themeSettings', JSON.stringify(settings));
}

// Save theme to Firebase
async function saveFirebaseTheme(userId, settings) {
    try {
        await set(ref(db, `users/${userId}/theme`), settings);
        return true;
    } catch (error) {
        console.error('Error saving theme to Firebase:', error);
        return false;
    }
}

// Get theme from Firebase
async function getFirebaseTheme(userId) {
    try {
        const snapshot = await get(ref(db, `users/${userId}/theme`));
        return snapshot.exists() ? snapshot.val() : defaultTheme;
    } catch (error) {
        console.error('Error getting theme from Firebase:', error);
        return defaultTheme;
    }
}

// Save theme settings
async function saveTheme(settings) {
    // Save locally first (immediate)
    saveLocalTheme(settings);
    
    // Apply immediately
    applyTheme(settings);

    // Save to Firebase in background if user is signed in
    const user = auth.currentUser;
    if (user) {
        await saveFirebaseTheme(user.uid, settings);
    }
}

// Initialize theme
async function initializeTheme() {
    // First apply local theme for immediate effect
    const localTheme = getLocalTheme();
    applyTheme(localTheme);

    // Then check if user is signed in and sync with Firebase
    const user = auth.currentUser;
    if (user) {
        const firebaseTheme = await getFirebaseTheme(user.uid);
        if (firebaseTheme) {
            await saveTheme(firebaseTheme);
        }
    }
}

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User signed in, get their theme from Firebase
        const firebaseTheme = await getFirebaseTheme(user.uid);
        await saveTheme(firebaseTheme);
    }
});

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTheme);

// Export theme manager functions
window.ThemeManager = {
    saveTheme,
    getLocalTheme,
    applyTheme,
    initializeTheme
}; 