import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getDatabase, ref, onValue, push, set, get } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js';
import { GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

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

let currentUser = null;
let selectedUser = null;
let usersMap = new Map();

// Check authentication state
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        
        // Save user data to Firebase
        const userRef = ref(db, `users/${user.uid}`);
        await set(userRef, {
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email,
            status: 'online',
            lastSeen: Date.now()
        });
        
        // Update UI elements
        const profilePic = document.getElementById('userProfilePic');
        const userName = document.getElementById('userName');
        const profileDropdown = document.getElementById('profileDropdown');
        const authButtons = document.getElementById('authButtons');
        
        // Update profile info
        if (user.photoURL) {
            profilePic.src = user.photoURL;
        } else {
            profilePic.src = 'https://via.placeholder.com/32';
        }
        userName.textContent = user.displayName || 'User';
        userName.classList.remove('d-none');
        
        // Show profile dropdown, hide auth buttons
        profileDropdown.style.display = 'block';
        authButtons.style.display = 'none';
        
        // Initialize chat
        await initializeChat();
    } else {
        // Redirect to signin page if not authenticated
        window.location.href = 'index.html';
    }
});

// Add sign out functionality
document.getElementById('signOutButton').addEventListener('click', async () => {
    try {
        // Set user status to offline before signing out
        if (currentUser) {
            const userRef = ref(db, `users/${currentUser.uid}`);
            await set(userRef, {
                ...currentUser,
                status: 'offline',
                lastSeen: Date.now()
            });
        }
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

// Add Google Sign In function
window.signInWithGoogle = async function() {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Save user data to Firebase
        const userRef = ref(db, `users/${user.uid}`);
        await set(userRef, {
            displayName: user.displayName,
            photoURL: user.photoURL,
            email: user.email,
            status: 'online',
            lastSeen: Date.now()
        });
        
        // Update UI immediately after successful sign in
        const profilePic = document.getElementById('userProfilePic');
        const userName = document.getElementById('userName');
        const profileDropdown = document.getElementById('profileDropdown');
        const authButtons = document.getElementById('authButtons');
        
        if (user.photoURL) {
            profilePic.src = user.photoURL;
        } else {
            profilePic.src = 'https://via.placeholder.com/32';
        }
        userName.textContent = user.displayName || 'User';
        userName.classList.remove('d-none');
        profileDropdown.style.display = 'block';
        authButtons.style.display = 'none';
    } catch (error) {
        console.error('Error signing in:', error);
    }
}

async function initializeChat() {
    // Set user's online status
    const userStatusRef = ref(db, `users/${currentUser.uid}/status`);
    await set(userStatusRef, 'online');

    // Remove status on disconnect
    const userStatusOfflineRef = ref(db, `users/${currentUser.uid}/status`);
    window.addEventListener('beforeunload', async () => {
        await set(userStatusOfflineRef, 'offline');
    });

    // Set initial chat header with current user's profile
    const profilePic = currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.displayName || 'User') + '&background=random';
    document.getElementById('activeChatUserAvatar').src = profilePic;
    document.getElementById('activeChatUserAvatar').onerror = function() {
        this.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.displayName || 'User') + '&background=random';
    };

    // Listen for online users
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        updateUsersList(users);
    });

    // Initialize message form
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message && selectedUser) {
            await sendMessage(message);
            messageInput.value = '';
        }
    });
}

function updateUsersList(users) {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    usersMap.clear();

    Object.entries(users).forEach(([uid, userData]) => {
        if (uid !== currentUser.uid) {
            usersMap.set(uid, userData);
            const userElement = createUserElement(uid, userData);
            usersList.appendChild(userElement);
        }
    });
}

function createUserElement(uid, userData) {
    const div = document.createElement('div');
    div.className = 'user-item';
    
    // Get profile picture URL, use a default if not available
    const profilePic = userData.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.displayName || 'User') + '&background=random';
    
    div.innerHTML = `
        <img src="${profilePic}" alt="${userData.displayName}" class="user-avatar" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(userData.displayName || 'User')}&background=random'">
        <div class="user-info">
            <div class="user-name">${userData.displayName || 'User'}</div>
        </div>
        <div class="user-status ${userData.status === 'online' ? 'online' : 'offline'}"></div>
    `;

    div.addEventListener('click', () => selectUser(uid));
    return div;
}

async function selectUser(uid) {
    selectedUser = uid;
    const userData = usersMap.get(uid);

    // Update chat header with proper profile picture
    const profilePic = userData.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.displayName || 'User') + '&background=random';
    
    document.getElementById('activeChatUserAvatar').src = profilePic;
    document.getElementById('activeChatUserAvatar').onerror = function() {
        this.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.displayName || 'User') + '&background=random';
    };
    
    document.getElementById('activeChatUserName').textContent = userData.displayName || 'User';
    document.getElementById('activeChatUserStatus').textContent = userData.status === 'online' ? 'Online' : 'Offline';

    // Enable chat input
    document.getElementById('messageInput').disabled = false;
    document.getElementById('messageForm').querySelector('button').disabled = false;

    // Load chat history
    await loadMessages(uid);

    // Subscribe to new messages
    const chatRef = ref(db, `chats/${getChatId(currentUser.uid, uid)}/messages`);
    onValue(chatRef, (snapshot) => {
        const messages = snapshot.val();
        displayMessages(messages);
    });
}

function getChatId(uid1, uid2) {
    return [uid1, uid2].sort().join('_');
}

async function sendMessage(text) {
    const chatId = getChatId(currentUser.uid, selectedUser);
    const chatRef = ref(db, `chats/${chatId}/messages`);
    const newMessageRef = push(chatRef);

    await set(newMessageRef, {
        sender: currentUser.uid,
        text: text,
        timestamp: Date.now()
    });
}

async function loadMessages(otherUid) {
    const chatId = getChatId(currentUser.uid, otherUid);
    const chatRef = ref(db, `chats/${chatId}/messages`);
    const snapshot = await get(chatRef);
    const messages = snapshot.val();
    displayMessages(messages);
}

function displayMessages(messages) {
    const container = document.getElementById('messagesContainer');
    container.innerHTML = '';

    if (!messages) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-chat-dots"></i>
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }

    Object.entries(messages).forEach(([id, message]) => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender === currentUser.uid ? 'sent' : 'received'}`;
        
        const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-content">${message.text}</div>
            <div class="message-time">${time}</div>
        `;
        
        container.appendChild(messageElement);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Handle theme switching
const themeSwitch = document.getElementById('themeSwitch');

async function initTheme() {
    if (!currentUser) return;
    
    try {
        const settingsRef = ref(db, `users/${currentUser.uid}/settings`);
        const snapshot = await get(settingsRef);
        const settings = snapshot.val() || {};
        const theme = settings.theme || 'light';
        
        document.documentElement.setAttribute('data-bs-theme', theme);
        themeSwitch.checked = theme === 'dark';
    } catch (error) {
        console.error('Error initializing theme:', error);
        document.documentElement.setAttribute('data-bs-theme', 'light');
        themeSwitch.checked = false;
    }
}

async function toggleTheme() {
    if (!currentUser) return;
    
    try {
        const currentTheme = document.documentElement.getAttribute('data-bs-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Update theme immediately
        document.documentElement.setAttribute('data-bs-theme', newTheme);
        
        // Save to Firebase
        const settingsRef = ref(db, `users/${currentUser.uid}/settings`);
        const snapshot = await get(settingsRef);
        const settings = snapshot.val() || {};
        settings.theme = newTheme;
        await set(settingsRef, settings);
    } catch (error) {
        console.error('Error toggling theme:', error);
    }
}

// Add theme switch event listener
themeSwitch.addEventListener('change', toggleTheme); 