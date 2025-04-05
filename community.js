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
let isWorldChat = true; // Default to world chat

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
            profilePic.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'User') + '&background=random';
        }
        userName.textContent = user.displayName || 'User';
        userName.classList.remove('d-none');
        
        // Show profile dropdown, hide auth buttons
        profileDropdown.style.display = 'block';
        authButtons.style.display = 'none';
        
        // Initialize chat
        await initializeChat();
        
        // Set up world chat option
        setupWorldChat();
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

// Function to set up world chat
function setupWorldChat() {
    const worldChatOption = document.getElementById('worldChatOption');
    
    worldChatOption.addEventListener('click', () => {
        // Update UI to show world chat is selected
        document.querySelectorAll('.user-item').forEach(item => {
            item.classList.remove('active');
        });
        worldChatOption.classList.add('active');
        
        // Set world chat mode
        isWorldChat = true;
        selectedUser = null;
        
        // Update chat header
        document.getElementById('activeChatUserAvatar').src = 'images/world.png';
        document.getElementById('activeChatUserAvatar').style.background = '#6610f2';
        document.getElementById('activeChatUserName').textContent = 'World Chat';
        
        // Count online users
        let onlineCount = 1; // Start with 1 to include current user
        usersMap.forEach(userData => {
            if (userData.status === 'online') {
                onlineCount++;
            }
        });
        document.getElementById('activeChatUserStatus').textContent = `${onlineCount} users online • All users can chat here`;
        
        // Enable chat input
        document.getElementById('messageInput').disabled = false;
        document.getElementById('messageForm').querySelector('button').disabled = false;
        
        // Load world chat messages
        loadWorldChatMessages();
    });
}

// Function to load world chat messages
async function loadWorldChatMessages() {
    const worldChatRef = ref(db, 'worldChat/messages');
    const snapshot = await get(worldChatRef);
    const messages = snapshot.val();
    displayWorldChatMessages(messages);
    
    // Subscribe to new world chat messages
    onValue(worldChatRef, (snapshot) => {
        const messages = snapshot.val();
        displayWorldChatMessages(messages);
    });
}

// Function to display world chat messages
function displayWorldChatMessages(messages) {
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

    Object.entries(messages).forEach(([messageId, message]) => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender === currentUser.uid ? 'sent' : 'received'}`;
        
        const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Get sender info
        const sender = usersMap.get(message.sender) || { displayName: 'User', photoURL: null };
        const senderName = message.sender === currentUser.uid ? 'You' : sender.displayName;
        const senderAvatar = sender.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(sender.displayName || 'User')}&background=random`;
        
        messageElement.innerHTML = `
            <a href="profile.html?uid=${message.sender}" class="profile-link">
                <img src="${senderAvatar}" alt="${senderName}" class="message-avatar" title="View ${senderName}'s profile">
            </a>
            <div class="message-content">
                <div class="message-text">${message.text}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        container.appendChild(messageElement);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Function to send world chat message
async function sendWorldChatMessage(text) {
    const worldChatRef = ref(db, 'worldChat/messages');
    const newMessageRef = push(worldChatRef);

    await set(newMessageRef, {
        sender: currentUser.uid,
        text: text,
        timestamp: Date.now()
    });
}

// Function to edit world chat message
async function editWorldChatMessage(messageId, currentText) {
    const contentElement = document.getElementById(`content-${messageId}`);
    const originalText = currentText;

    // Create edit input
    contentElement.innerHTML = `
        <div class="edit-message-form">
            <input type="text" class="form-control edit-input" value="${originalText}">
            <div class="edit-actions mt-2">
                <button class="btn btn-sm btn-primary save-edit">Save</button>
                <button class="btn btn-sm btn-secondary cancel-edit">Cancel</button>
            </div>
        </div>
    `;

    const editInput = contentElement.querySelector('.edit-input');
    const saveBtn = contentElement.querySelector('.save-edit');
    const cancelBtn = contentElement.querySelector('.cancel-edit');

    // Focus input and place cursor at end
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);

    // Handle save
    saveBtn.addEventListener('click', async () => {
        const newText = editInput.value.trim();
        if (newText && newText !== originalText) {
            const messageRef = ref(db, `worldChat/messages/${messageId}`);
            await set(messageRef, {
                sender: currentUser.uid,
                text: newText,
                timestamp: Date.now(),
                edited: true
            });
        } else {
            contentElement.textContent = originalText;
        }
    });

    // Handle cancel
    cancelBtn.addEventListener('click', () => {
        contentElement.textContent = originalText;
    });
}

// Function to delete world chat message
async function deleteWorldChatMessage(messageId) {
    if (confirm('Are you sure you want to delete this message?')) {
        try {
            const messageRef = ref(db, `worldChat/messages/${messageId}`);
            await set(messageRef, null);
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    }
}

// Update the message form event listener to handle both private and world chat
async function initializeChat() {
    // Set user's online status
    const userStatusRef = ref(db, `users/${currentUser.uid}/status`);
    await set(userStatusRef, 'online');

    // Remove status on disconnect
    const userStatusOfflineRef = ref(db, `users/${currentUser.uid}/status`);
    window.addEventListener('beforeunload', async () => {
        await set(userStatusOfflineRef, 'offline');
    });

    // Set initial chat header with world chat
    document.getElementById('activeChatUserAvatar').src = 'images/world.png';
    document.getElementById('activeChatUserAvatar').style.background = '#6610f2';
    document.getElementById('activeChatUserName').textContent = 'World Chat';
    
    // Count initial online users (starting with 1 for current user)
    let onlineCount = 1;
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);
    const users = snapshot.val();
    if (users) {
        Object.values(users).forEach(userData => {
            if (userData.status === 'online' && userData.uid !== currentUser.uid) {
                onlineCount++;
            }
        });
    }
    document.getElementById('activeChatUserStatus').textContent = `${onlineCount} users online • All users can chat here`;

    // Enable chat input for world chat
    document.getElementById('messageInput').disabled = false;
    document.getElementById('messageForm').querySelector('button').disabled = false;

    // Load world chat messages by default
    loadWorldChatMessages();

    // Listen for online users
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
        if (message) {
            if (isWorldChat) {
                await sendWorldChatMessage(message);
            } else if (selectedUser) {
                await sendMessage(message);
            }
            messageInput.value = '';
        }
    });
}

// Update selectUser function to handle switching between world chat and private chat
async function selectUser(uid) {
    // Update UI to show private chat is selected
    document.querySelectorAll('.user-item').forEach(item => {
        item.classList.remove('active');
    });
    document.getElementById('worldChatOption').classList.remove('active');
    
    // Set private chat mode
    isWorldChat = false;
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
    const chatId = getChatId(currentUser.uid, uid);
    await loadMessages(uid);
    
    // Mark messages as read
    await markMessagesAsRead(chatId);

    // Subscribe to new messages
    const chatRef = ref(db, `chats/${chatId}/messages`);
    onValue(chatRef, (snapshot) => {
        const messages = snapshot.val();
        displayMessages(messages);
        // Mark new messages as read
        markMessagesAsRead(chatId);
    });
}

function updateUsersList(users) {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    usersMap.clear();

    // Count online users
    let onlineCount = 1; // Start with 1 to include current user

    Object.entries(users).forEach(([uid, userData]) => {
        if (uid !== currentUser.uid) {
            usersMap.set(uid, userData);
            const userElement = createUserElement(uid, userData);
            usersList.appendChild(userElement);
            // Increment online count if user is online
            if (userData.status === 'online') {
                onlineCount++;
            }
        }
    });

    // Update world chat status if we're in world chat
    if (isWorldChat) {
        document.getElementById('activeChatUserStatus').textContent = `${onlineCount} users online • All users can chat here`;
    }
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

    Object.entries(messages).forEach(([messageId, message]) => {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.sender === currentUser.uid ? 'sent' : 'received'}`;
        
        const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Get sender avatar and info
        let senderAvatar, senderName;
        if (message.sender === currentUser.uid) {
            senderAvatar = currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName || 'User')}&background=random`;
            senderName = 'You';
        } else {
            const userData = usersMap.get(selectedUser);
            senderAvatar = userData?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.displayName || 'User')}&background=random`;
            senderName = userData?.displayName || 'User';
        }
        
        messageElement.innerHTML = `
            <a href="profile.html?uid=${message.sender}" class="profile-link">
                <img src="${senderAvatar}" alt="${senderName}" class="message-avatar" title="View ${senderName}'s profile">
            </a>
            <div class="message-content">
                <div class="message-text">${message.text}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
        
        container.appendChild(messageElement);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

async function editMessage(messageId, currentText) {
    const contentElement = document.getElementById(`content-${messageId}`);
    const originalText = currentText;

    // Create edit input
    contentElement.innerHTML = `
        <div class="edit-message-form">
            <input type="text" class="form-control edit-input" value="${originalText}">
            <div class="edit-actions mt-2">
                <button class="btn btn-sm btn-primary save-edit">Save</button>
                <button class="btn btn-sm btn-secondary cancel-edit">Cancel</button>
            </div>
        </div>
    `;

    const editInput = contentElement.querySelector('.edit-input');
    const saveBtn = contentElement.querySelector('.save-edit');
    const cancelBtn = contentElement.querySelector('.cancel-edit');

    // Focus input and place cursor at end
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);

    // Handle save
    saveBtn.addEventListener('click', async () => {
        const newText = editInput.value.trim();
        if (newText && newText !== originalText) {
            const chatId = getChatId(currentUser.uid, selectedUser);
            const messageRef = ref(db, `chats/${chatId}/messages/${messageId}`);
            await set(messageRef, {
                sender: currentUser.uid,
                text: newText,
                timestamp: Date.now(),
                edited: true
            });
        } else {
            contentElement.textContent = originalText;
        }
    });

    // Handle cancel
    cancelBtn.addEventListener('click', () => {
        contentElement.textContent = originalText;
    });
}

async function deleteMessage(messageId) {
    if (confirm('Are you sure you want to delete this message?')) {
        try {
            const chatId = getChatId(currentUser.uid, selectedUser);
            const messageRef = ref(db, `chats/${chatId}/messages/${messageId}`);
            await set(messageRef, null);
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    }
}

// Add CSS styles for message actions
const style = document.createElement('style');
style.textContent = `
    .message {
        position: relative;
    }
    
    .message-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 4px;
    }
    
    .message-actions {
        display: none;
        gap: 4px;
    }
    
    .message:hover .message-actions {
        display: flex;
    }
    
    .message.sent .message-actions .btn-link {
        padding: 2px 4px;
        opacity: 0.8;
    }
    
    .message.sent .message-actions .btn-link:hover {
        opacity: 1;
    }
    
    .edit-message-form {
        min-width: 200px;
    }
    
    .edit-message-form .form-control {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
    }
    
    .edit-actions {
        display: flex;
        gap: 8px;
    }
`;
document.head.appendChild(style);

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

// Add CSS for world chat
const worldChatStyles = `
    .world-chat-option {
        border-bottom: 1px solid rgba(var(--primary-rgb), 0.1);
        padding-bottom: 0.5rem;
    }
    
    .message-sender {
        font-size: 0.8rem;
        font-weight: 500;
        margin-bottom: 2px;
        color: var(--primary-color);
    }
    
    .message.received .message-sender {
        color: var(--text-muted);
    }
`;

style.textContent += worldChatStyles;

// Add CSS for profile links
const profileLinkStyles = `
    .profile-link {
        text-decoration: none;
        transition: transform 0.2s ease;
        display: block;
    }
    
    .profile-link:hover {
        transform: scale(1.1);
    }
    
    .message.sent .profile-link {
        order: 1;
    }
    
    .message-avatar {
        cursor: pointer;
    }
`;

style.textContent += profileLinkStyles; 