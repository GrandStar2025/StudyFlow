// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getDatabase, ref, set, get, push, remove, update, onValue } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';

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
const db = getDatabase(app);

// Watch History Functions
export async function addToWatchHistory(userId, video) {
    try {
        const watchHistoryRef = ref(db, `users/${userId}/watchHistory`);
        const snapshot = await get(watchHistoryRef);
        let watchedVideos = snapshot.val() || [];
        
        // Remove if already exists
        watchedVideos = watchedVideos.filter(v => v.id.videoId !== video.id.videoId);
        
        // Add to beginning of array
        watchedVideos.unshift({
            ...video,
            watchedAt: new Date().toISOString()
        });
        
        // Keep only last 50 videos
        if (watchedVideos.length > 50) {
            watchedVideos = watchedVideos.slice(0, 50);
        }
        
        await set(watchHistoryRef, watchedVideos);
    } catch (error) {
        console.error('Error adding to watch history:', error);
        throw error;
    }
}

export async function getWatchHistory(userId) {
    try {
        const watchHistoryRef = ref(db, `users/${userId}/watchHistory`);
        const snapshot = await get(watchHistoryRef);
        return snapshot.val() || [];
    } catch (error) {
        console.error('Error getting watch history:', error);
        throw error;
    }
}

export async function clearWatchHistory(userId) {
    try {
        const watchHistoryRef = ref(db, `users/${userId}/watchHistory`);
        await set(watchHistoryRef, null);
    } catch (error) {
        console.error('Error clearing watch history:', error);
        throw error;
    }
}

// Search History Functions
export async function addToSearchHistory(userId, query) {
    try {
        const searchHistoryRef = ref(db, `users/${userId}/searchHistory`);
        const snapshot = await get(searchHistoryRef);
        let searchHistory = snapshot.val() || [];
        
        // Remove if already exists
        searchHistory = searchHistory.filter(item => item !== query);
        
        // Add to beginning of array
        searchHistory.unshift(query);
        
        // Keep only last 10 searches
        if (searchHistory.length > 10) {
            searchHistory = searchHistory.slice(0, 10);
        }
        
        await set(searchHistoryRef, searchHistory);
    } catch (error) {
        console.error('Error adding to search history:', error);
        throw error;
    }
}

export async function getSearchHistory(userId) {
    try {
        const searchHistoryRef = ref(db, `users/${userId}/searchHistory`);
        const snapshot = await get(searchHistoryRef);
        return snapshot.val() || [];
    } catch (error) {
        console.error('Error getting search history:', error);
        throw error;
    }
}

export async function deleteFromSearchHistory(userId, index) {
    try {
        const searchHistory = await getSearchHistory(userId);
        searchHistory.splice(index, 1);
        const searchHistoryRef = ref(db, `users/${userId}/searchHistory`);
        await set(searchHistoryRef, searchHistory);
    } catch (error) {
        console.error('Error deleting from search history:', error);
        throw error;
    }
}

// Video Progress Functions
export async function saveVideoProgress(userId, videoId, progress) {
    try {
        const progressRef = ref(db, `users/${userId}/videoProgress/${videoId}`);
        await set(progressRef, {
            ...progress,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error saving video progress:', error);
        throw error;
    }
}

export async function getVideoProgress(userId, videoId) {
    try {
        const progressRef = ref(db, `users/${userId}/videoProgress/${videoId}`);
        const snapshot = await get(progressRef);
        return snapshot.val();
    } catch (error) {
        console.error('Error getting video progress:', error);
        throw error;
    }
}

// Study Notes Functions
export async function saveNotes(userId, videoId, notes) {
    try {
        const notesRef = ref(db, `users/${userId}/notes/${videoId}`);
        await set(notesRef, notes);
    } catch (error) {
        console.error('Error saving notes:', error);
        throw error;
    }
}

export async function getNotes(userId, videoId) {
    try {
        const notesRef = ref(db, `users/${userId}/notes/${videoId}`);
        const snapshot = await get(notesRef);
        return snapshot.val() || [];
    } catch (error) {
        console.error('Error getting notes:', error);
        throw error;
    }
}

// Tasks Functions
export async function saveTasks(userId, tasks) {
    try {
        const tasksRef = ref(db, `users/${userId}/tasks`);
        await set(tasksRef, tasks);
    } catch (error) {
        console.error('Error saving tasks:', error);
        throw error;
    }
}

export async function getTasks(userId) {
    try {
        const tasksRef = ref(db, `users/${userId}/tasks`);
        const snapshot = await get(tasksRef);
        return snapshot.val() || [];
    } catch (error) {
        console.error('Error getting tasks:', error);
        throw error;
    }
}

// Performance Metrics Functions
export async function updateStudyTime(userId, timeInMinutes) {
    try {
        const today = new Date().toDateString();
        const studyTimeRef = ref(db, `users/${userId}/performance/${today}`);
        const snapshot = await get(studyTimeRef);
        const currentTime = (snapshot.val()?.studyTime || 0) + timeInMinutes;
        
        await set(studyTimeRef, {
            studyTime: currentTime,
            lastUpdated: new Date().toISOString()
        });
        
        return currentTime;
    } catch (error) {
        console.error('Error updating study time:', error);
        throw error;
    }
}

export async function getStudyTime(userId) {
    try {
        const today = new Date().toDateString();
        const studyTimeRef = ref(db, `users/${userId}/performance/${today}`);
        const snapshot = await get(studyTimeRef);
        return snapshot.val()?.studyTime || 0;
    } catch (error) {
        console.error('Error getting study time:', error);
        throw error;
    }
}

// Video Completion Status Functions
export async function markVideoCompleted(userId, videoId) {
    try {
        const completedRef = ref(db, `users/${userId}/completedVideos/${videoId}`);
        await set(completedRef, {
            completedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error marking video as completed:', error);
        throw error;
    }
}

export async function isVideoCompleted(userId, videoId) {
    try {
        const completedRef = ref(db, `users/${userId}/completedVideos/${videoId}`);
        const snapshot = await get(completedRef);
        return snapshot.exists();
    } catch (error) {
        console.error('Error checking video completion:', error);
        throw error;
    }
}

// Last Search Functions
export async function saveLastSearch(userId, query, results) {
    try {
        const searchRef = ref(db, `users/${userId}/lastSearch`);
        await set(searchRef, {
            query,
            results,
            timestamp: new Date().getTime()
        });
    } catch (error) {
        console.error('Error saving last search:', error);
        throw error;
    }
}

export async function getLastSearch(userId) {
    try {
        const searchRef = ref(db, `users/${userId}/lastSearch`);
        const snapshot = await get(searchRef);
        const data = snapshot.val();
        
        if (data && (new Date().getTime() - data.timestamp < 24 * 60 * 60 * 1000)) {
            return data;
        }
        return null;
    } catch (error) {
        console.error('Error getting last search:', error);
        throw error;
    }
}

// Real-time Listeners
export function setupRealtimeListeners(userId, callbacks) {
    // Notes listener
    const notesRef = ref(db, `users/${userId}/notes`);
    onValue(notesRef, (snapshot) => {
        const notes = snapshot.val() || {};
        if (callbacks.onNotesUpdate) {
            callbacks.onNotesUpdate(notes);
        }
    });

    // Tasks listener
    const tasksRef = ref(db, `users/${userId}/tasks`);
    onValue(tasksRef, (snapshot) => {
        const tasks = snapshot.val() || [];
        if (callbacks.onTasksUpdate) {
            callbacks.onTasksUpdate(tasks);
        }
    });

    // Performance listener
    const performanceRef = ref(db, `users/${userId}/performance`);
    onValue(performanceRef, (snapshot) => {
        const performance = snapshot.val() || {};
        if (callbacks.onPerformanceUpdate) {
            callbacks.onPerformanceUpdate(performance);
        }
    });

    // Watch History listener
    const watchHistoryRef = ref(db, `users/${userId}/watchHistory`);
    onValue(watchHistoryRef, (snapshot) => {
        const watchHistory = snapshot.val() || [];
        if (callbacks.onWatchHistoryUpdate) {
            callbacks.onWatchHistoryUpdate(watchHistory);
        }
    });
} 