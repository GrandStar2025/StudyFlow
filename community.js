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

        // Call initTheme when user logs in
        initTheme();
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
        
        // Add edit and delete options for own messages
        const messageActions = message.sender === currentUser.uid ? `
            <div class="message-actions">
                <button class="btn btn-link text-white p-0 edit-btn" title="Edit">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn btn-link text-white p-0 delete-btn" title="Delete">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </div>
        ` : '';
        
        messageElement.innerHTML = `
            <a href="profile.html?uid=${message.sender}" class="profile-link">
                <img src="${senderAvatar}" alt="${senderName}" class="message-avatar" title="View ${senderName}'s profile">
            </a>
            <div class="message-content">
                <div class="message-text" id="content-${messageId}">${message.text}</div>
                <div class="message-footer">
                    <div class="message-time">${time}${message.edited ? ' (edited)' : ''}</div>
                    ${messageActions}
                </div>
            </div>
        `;
        
        // Add event listeners for edit and delete buttons
        if (message.sender === currentUser.uid) {
            const editBtn = messageElement.querySelector('.edit-btn');
            const deleteBtn = messageElement.querySelector('.delete-btn');
            
            editBtn.addEventListener('click', () => editWorldChatMessage(messageId, message.text));
            deleteBtn.addEventListener('click', () => deleteWorldChatMessage(messageId));
        }
        
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
    const messageElement = document.getElementById(`content-${messageId}`);
    const originalContent = messageElement.innerHTML;
    const originalText = currentText;

    // Create edit form
    messageElement.innerHTML = `
        <div class="edit-message-form">
            <div class="input-group">
                <input type="text" class="form-control" value="${originalText}">
                <button class="btn btn-primary save-edit" type="button">
                    <i class="bi bi-check-lg"></i>
                </button>
                <button class="btn btn-secondary cancel-edit" type="button">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        </div>
    `;

    const editInput = messageElement.querySelector('input');
    const saveBtn = messageElement.querySelector('.save-edit');
    const cancelBtn = messageElement.querySelector('.cancel-edit');

    // Focus input and place cursor at end
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);

    // Handle save
    saveBtn.addEventListener('click', async () => {
        const newText = editInput.value.trim();
        if (newText && newText !== originalText) {
            try {
                const messageRef = ref(db, `worldChat/messages/${messageId}`);
                const snapshot = await get(messageRef);
                const currentMessage = snapshot.val();
                
                if (currentMessage && currentMessage.sender === currentUser.uid) {
                    await set(messageRef, {
                        ...currentMessage,
                        text: newText,
                        edited: true,
                        editedAt: Date.now()
                    });
                }
            } catch (error) {
                console.error('Error editing message:', error);
                messageElement.innerHTML = originalContent;
            }
        } else {
            messageElement.innerHTML = originalContent;
        }
    });

    // Handle cancel
    cancelBtn.addEventListener('click', () => {
        messageElement.innerHTML = originalContent;
    });

    // Handle Enter key
    editInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveBtn.click();
        }
    });

    // Handle Escape key
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cancelBtn.click();
        }
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
    usersMap.clear();
    Object.entries(users).forEach(([uid, userData]) => {
        if (uid !== currentUser.uid) {
            usersMap.set(uid, userData);
        }
    });

    // Update both online users and friends lists
    updateOnlineUsersList(users);
    updateFriendsList(users);

    // Update world chat status if we're in world chat
    if (isWorldChat) {
        let onlineCount = 1; // Start with 1 to include current user
        usersMap.forEach(userData => {
            if (userData.status === 'online') {
                onlineCount++;
            }
        });
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
        
        // Add edit and delete options for own messages
        const messageActions = message.sender === currentUser.uid ? `
            <div class="message-actions">
                <button class="btn btn-link text-white p-0 edit-btn" title="Edit">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn btn-link text-white p-0 delete-btn" title="Delete">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </div>
        ` : '';
        
        messageElement.innerHTML = `
            <a href="profile.html?uid=${message.sender}" class="profile-link">
                <img src="${senderAvatar}" alt="${senderName}" class="message-avatar" title="View ${senderName}'s profile">
            </a>
            <div class="message-content">
                <div class="message-text" id="content-${messageId}">${message.text}</div>
                <div class="message-footer">
                    <div class="message-time">${time}${message.edited ? ' (edited)' : ''}</div>
                    ${messageActions}
                </div>
            </div>
        `;
        
        // Add event listeners for edit and delete buttons
        if (message.sender === currentUser.uid) {
            const editBtn = messageElement.querySelector('.edit-btn');
            const deleteBtn = messageElement.querySelector('.delete-btn');
            
            editBtn.addEventListener('click', () => {
                const chatId = getChatId(currentUser.uid, selectedUser);
                editPrivateMessage(messageId, message.text, chatId);
            });
            
            deleteBtn.addEventListener('click', () => {
                const chatId = getChatId(currentUser.uid, selectedUser);
                deletePrivateMessage(messageId, chatId);
            });
        }
        
        container.appendChild(messageElement);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

// Function to edit private chat message
async function editPrivateMessage(messageId, currentText, chatId) {
    const messageElement = document.getElementById(`content-${messageId}`);
    const originalContent = messageElement.innerHTML;
    const originalText = currentText;

    // Create edit form
    messageElement.innerHTML = `
        <div class="edit-message-form">
            <div class="input-group">
                <input type="text" class="form-control" value="${originalText}">
                <button class="btn btn-primary save-edit" type="button">
                    <i class="bi bi-check-lg"></i>
                </button>
                <button class="btn btn-secondary cancel-edit" type="button">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        </div>
    `;

    const editInput = messageElement.querySelector('input');
    const saveBtn = messageElement.querySelector('.save-edit');
    const cancelBtn = messageElement.querySelector('.cancel-edit');

    // Focus input and place cursor at end
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);

    // Handle save
    saveBtn.addEventListener('click', async () => {
        const newText = editInput.value.trim();
        if (newText && newText !== originalText) {
            try {
                const messageRef = ref(db, `chats/${chatId}/messages/${messageId}`);
                const snapshot = await get(messageRef);
                const currentMessage = snapshot.val();
                
                if (currentMessage && currentMessage.sender === currentUser.uid) {
                    await set(messageRef, {
                        ...currentMessage,
                        text: newText,
                        edited: true,
                        editedAt: Date.now()
                    });
                }
            } catch (error) {
                console.error('Error editing message:', error);
                messageElement.innerHTML = originalContent;
            }
        } else {
            messageElement.innerHTML = originalContent;
        }
    });

    // Handle cancel
    cancelBtn.addEventListener('click', () => {
        messageElement.innerHTML = originalContent;
    });

    // Handle Enter key
    editInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveBtn.click();
        }
    });

    // Handle Escape key
    editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            cancelBtn.click();
        }
    });
}

// Function to delete private chat message
async function deletePrivateMessage(messageId, chatId) {
    if (confirm('Are you sure you want to delete this message?')) {
        try {
            const messageRef = ref(db, `chats/${chatId}/messages/${messageId}`);
            const snapshot = await get(messageRef);
            const message = snapshot.val();
            
            if (message && message.sender === currentUser.uid) {
                await set(messageRef, null);
            }
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    }
}

// Add CSS styles for messages and dark mode
const style = document.createElement('style');
style.textContent = `
    .message {
        max-width: 80%;
        margin-bottom: 1rem;
        padding: 0.75rem 1rem;
        border-radius: 12px;
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 10px;
    }

    .message.sent {
        background: #0D6EFD;
        color: white;
        align-self: flex-end;
        border-radius: 16px 16px 4px 16px;
        margin-left: auto;
        flex-direction: row-reverse;
    }

    .message.received {
        background: var(--bs-dark);
        color: var(--bs-light);
        align-self: flex-start;
        border-radius: 16px 16px 16px 4px;
    }

    [data-bs-theme="dark"] .message.received {
        background: #2B3035;
        border: 1px solid #373B3E;
    }

    .message-content {
        display: flex;
        flex-direction: column;
    }

    .message-text {
        margin-bottom: 4px;
        word-break: break-word;
    }

    .message-time {
        font-size: 0.75rem;
        opacity: 0.8;
        margin-top: 2px;
        color: inherit;
    }

    .message-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
    }

    .message.sent .message-time {
        text-align: right;
    }

    .message.received .message-avatar {
        margin-right: 8px;
    }

    .message.sent .message-avatar {
        margin-left: 8px;
    }

    .messages-container {
        padding: 1rem;
        overflow-y: auto;
        height: calc(100vh - 180px);
        background: var(--bs-body-bg);
    }

    [data-bs-theme="dark"] .messages-container {
        background: #212529;
    }

    .empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--bs-secondary);
    }

    .empty-state i {
        font-size: 3rem;
        margin-bottom: 1rem;
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
        const isDarkMode = themeSwitch.checked;
        const newTheme = isDarkMode ? 'dark' : 'light';
        
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

// Add responsive CSS styles
const responsiveStyles = `
    /* Mobile Navigation */
    .mobile-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--bs-body-bg);
        border-top: 1px solid var(--bs-border-color);
        padding: 12px 8px;
        z-index: 1000;
        display: flex;
        justify-content: space-around;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    }

    .mobile-nav .nav-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 8px 16px;
        border-radius: 12px;
        transition: all 0.3s ease;
        text-decoration: none;
        position: relative;
        color: var(--bs-body-color) !important;
    }

    .mobile-nav .nav-link i {
        font-size: 1.5rem;
        margin-bottom: 4px;
        transition: all 0.3s ease;
        color: var(--bs-body-color);
    }

    .mobile-nav .nav-link small {
        font-size: 0.75rem;
        font-weight: 500;
        transition: all 0.3s ease;
        color: var(--bs-body-color);
    }

    /* Hover effects */
    .mobile-nav .nav-link:hover {
        transform: translateY(-2px);
    }

    .mobile-nav .nav-link[data-section="world"]:hover {
        background: rgba(13, 110, 253, 0.1);
    }

    .mobile-nav .nav-link[data-section="world"]:hover i,
    .mobile-nav .nav-link[data-section="world"]:hover small {
        color: #0D6EFD;
    }

    .mobile-nav .nav-link[data-section="online"]:hover {
        background: rgba(25, 135, 84, 0.1);
    }

    .mobile-nav .nav-link[data-section="online"]:hover i,
    .mobile-nav .nav-link[data-section="online"]:hover small {
        color: #198754;
    }

    .mobile-nav .nav-link[data-section="friends"]:hover {
        background: rgba(220, 53, 69, 0.1);
    }

    .mobile-nav .nav-link[data-section="friends"]:hover i,
    .mobile-nav .nav-link[data-section="friends"]:hover small {
        color: #DC3545;
    }

    .mobile-nav .nav-link[data-section="groups"]:hover {
        background: rgba(102, 16, 242, 0.1);
    }

    .mobile-nav .nav-link[data-section="groups"]:hover i,
    .mobile-nav .nav-link[data-section="groups"]:hover small {
        color: #6610F2;
    }

    /* Active states */
    .mobile-nav .nav-link.active {
        transform: translateY(-4px);
    }

    .mobile-nav .nav-link.active i,
    .mobile-nav .nav-link.active small {
        color: white !important;
    }

    .mobile-nav .nav-link[data-section="world"].active {
        background: #0D6EFD;
        box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
    }

    .mobile-nav .nav-link[data-section="online"].active {
        background: #198754;
        box-shadow: 0 4px 12px rgba(25, 135, 84, 0.3);
    }

    .mobile-nav .nav-link[data-section="friends"].active {
        background: #DC3545;
        box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
    }

    .mobile-nav .nav-link[data-section="groups"].active {
        background: #6610F2;
        box-shadow: 0 4px 12px rgba(102, 16, 242, 0.3);
    }

    /* Dark mode adjustments */
    [data-bs-theme="dark"] .mobile-nav {
        background: #212529;
        border-color: #373B3E;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.25);
    }

    [data-bs-theme="dark"] .mobile-nav .nav-link {
        opacity: 0.95;
    }

    [data-bs-theme="dark"] .mobile-nav .nav-link:hover {
        opacity: 1;
    }

    [data-bs-theme="dark"] .mobile-nav .nav-link.active {
        opacity: 1;
    }

    /* Chat Container */
    .chat-container {
        height: calc(100vh - 56px);
        overflow: hidden;
    }

    /* Sections */
    .chat-section {
        padding: 1rem;
        border-bottom: 1px solid var(--bs-border-color);
    }

    .section-header {
        margin-bottom: 1rem;
    }

    /* Chat Area */
    .chat-main {
        height: 100%;
    }

    .chat-area {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .chat-header {
        padding: 1rem;
        background: var(--bs-body-bg);
        border-bottom: 1px solid var(--bs-border-color);
        display: flex;
        align-items: center;
        gap: 1rem;
        position: sticky;
        top: 0;
        z-index: 10;
    }

    .messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        margin-bottom: 60px;
    }

    @media (max-width: 991.98px) {
        .messages-container {
            height: calc(100vh - 180px);
            margin-bottom: 80px;
        }

        .message-form {
            position: fixed;
            bottom: 76px;
            left: 0;
            right: 0;
            padding: 1rem;
            background: var(--bs-body-bg);
            border-top: 1px solid var(--bs-border-color);
        }

        .message {
            max-width: 85%;
        }

        .chat-header {
            position: sticky;
            top: 0;
            background: var(--bs-body-bg);
            z-index: 1000;
        }
    }

    /* Message Form */
    .message-form {
        padding: 1rem;
        background: var(--bs-body-bg);
        border-top: 1px solid var(--bs-border-color);
    }

    .message-form .input-group {
        background: var(--bs-body-bg);
    }

    .message-form input {
        border-radius: 24px;
        padding: 0.75rem 1.25rem;
        border: 1px solid var(--bs-border-color);
        background: var(--bs-body-bg);
    }

    .message-form button {
        border-radius: 50%;
        width: 42px;
        height: 42px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 8px;
    }
`;

style.textContent += responsiveStyles;

// Add mobile navigation functionality
document.querySelectorAll('.mobile-nav .nav-link').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.mobile-nav .nav-link').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Show corresponding section
        const sectionName = button.dataset.section;
        document.querySelectorAll('.chat-section').forEach(section => {
            if (section.dataset.section === sectionName) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
    });
});

// Add styles for sections
const sectionStyles = `
    /* Sections Common Styles */
    .chat-section {
        padding: 1.25rem;
        border-bottom: 1px solid var(--bs-border-color);
    }

    .section-header {
        font-size: 1.1rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: var(--bs-heading-color);
    }

    /* Users List Styles */
    .users-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .user-item {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        gap: 12px;
        background: var(--bs-body-bg);
    }

    .user-item:hover {
        background: rgba(var(--bs-primary-rgb), 0.1);
    }

    .user-item.active {
        background: var(--bs-primary);
        color: white;
    }

    .user-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }

    .user-info {
        flex: 1;
    }

    .user-name {
        font-weight: 500;
        margin-bottom: 2px;
    }

    .user-status {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-left: auto;
    }

    .user-status.online {
        background: #198754;
    }

    .user-status.offline {
        background: #6c757d;
    }

    /* Groups List Styles */
    .groups-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .group-item {
        display: flex;
        align-items: center;
        padding: 0.75rem;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        gap: 12px;
        background: var(--bs-body-bg);
    }

    .group-item:hover {
        background: rgba(var(--bs-primary-rgb), 0.1);
    }

    .group-avatar {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        background: var(--bs-primary);
        color: white;
    }

    .group-info {
        flex: 1;
    }

    .group-name {
        font-weight: 500;
        margin-bottom: 2px;
    }

    /* Search Inputs */
    .form-control-sm {
        border-radius: 20px;
        padding: 0.375rem 1rem;
    }

    .btn-sm {
        width: 32px;
        height: 32px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }

    /* Dark Mode Adjustments */
    [data-bs-theme="dark"] .user-item,
    [data-bs-theme="dark"] .group-item {
        background: #2B3035;
        border: 1px solid #373B3E;
    }

    [data-bs-theme="dark"] .user-item:hover,
    [data-bs-theme="dark"] .group-item:hover {
        background: #373B3E;
        border-color: #495057;
    }

    [data-bs-theme="dark"] .form-control {
        background: #2B3035;
        border-color: #373B3E;
        color: #fff;
    }

    [data-bs-theme="dark"] .form-control:focus {
        background: #2B3035;
        border-color: var(--bs-primary);
        color: #fff;
    }
`;

style.textContent += sectionStyles;

// Function to update online users list
function updateOnlineUsersList(users) {
    const onlineUsersList = document.getElementById('onlineUsersList');
    onlineUsersList.innerHTML = '';

    Object.entries(users).forEach(([uid, userData]) => {
        if (uid !== currentUser.uid && userData.status === 'online') {
            const userElement = createUserElement(uid, userData);
            onlineUsersList.appendChild(userElement);
        }
    });

    if (onlineUsersList.children.length === 0) {
        onlineUsersList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-people"></i>
                <p>No users online at the moment</p>
            </div>
        `;
    }
}

// Function to update friends list
function updateFriendsList(users) {
    const friendsList = document.getElementById('friendsList');
    friendsList.innerHTML = '';

    // For now, showing all users as potential friends
    Object.entries(users).forEach(([uid, userData]) => {
        if (uid !== currentUser.uid) {
            const userElement = createUserElement(uid, userData);
            friendsList.appendChild(userElement);
        }
    });

    if (friendsList.children.length === 0) {
        friendsList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-person-heart"></i>
                <p>No friends added yet</p>
            </div>
        `;
    }
}

// Add search functionality
document.querySelectorAll('.chat-section input[type="text"]').forEach(input => {
    input.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const section = e.target.closest('.chat-section');
        const items = section.querySelectorAll('.user-item, .group-item');

        items.forEach(item => {
            const name = item.querySelector('.user-name, .group-name').textContent.toLowerCase();
            if (name.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });
});

/* Update the sections container styles */
const scrollableStyles = `
    /* Main container styles */
    .chat-container {
        height: calc(100vh - 56px);
        overflow: hidden;
    }

    /* Sidebar styles */
    .chat-sidebar {
        height: 100%;
        overflow-y: auto;
        background: var(--bs-body-bg);
        border-right: 1px solid var(--bs-border-color);
    }

    .sections-container {
        height: 100%;
        overflow-y: auto;
        padding-bottom: 80px;
    }

    /* Section styles */
    .chat-section {
        padding: 1.25rem;
        border-bottom: 1px solid var(--bs-border-color);
    }

    /* Lists styles */
    .users-list, .groups-list {
        max-height: calc(100vh - 250px);
        overflow-y: auto;
        padding-right: 5px;
    }

    .users-list::-webkit-scrollbar,
    .groups-list::-webkit-scrollbar,
    .sections-container::-webkit-scrollbar {
        width: 6px;
    }

    .users-list::-webkit-scrollbar-thumb,
    .groups-list::-webkit-scrollbar-thumb,
    .sections-container::-webkit-scrollbar-thumb {
        background: var(--bs-secondary);
        border-radius: 3px;
    }

    .users-list::-webkit-scrollbar-track,
    .groups-list::-webkit-scrollbar-track,
    .sections-container::-webkit-scrollbar-track {
        background: transparent;
    }

    /* Mobile adjustments */
    @media (max-width: 991.98px) {
        .chat-container {
            height: calc(100vh - 56px);
        }

        .sections-container {
            height: calc(100vh - 136px);
            padding-bottom: 90px;
        }

        .users-list, .groups-list {
            max-height: calc(100vh - 300px);
        }

        .mobile-nav {
            background: var(--bs-body-bg);
            border-top: 1px solid var(--bs-border-color);
            padding: 12px 8px;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 1000;
        }
    }

    /* Dark mode adjustments */
    [data-bs-theme="dark"] .chat-sidebar {
        background: #212529;
        border-color: #373B3E;
    }

    [data-bs-theme="dark"] .users-list::-webkit-scrollbar-thumb,
    [data-bs-theme="dark"] .groups-list::-webkit-scrollbar-thumb,
    [data-bs-theme="dark"] .sections-container::-webkit-scrollbar-thumb {
        background: #495057;
    }
`;

// Add the scrollable styles to existing styles
style.textContent += scrollableStyles;

// Add styles for message actions
const messageActionStyles = `
    .message-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 4px;
    }

    .message-actions {
        display: none;
        gap: 8px;
    }

    .message:hover .message-actions {
        display: flex;
    }

    .message-actions .btn-link {
        color: inherit;
        opacity: 0.7;
        transition: opacity 0.2s ease;
    }

    .message-actions .btn-link:hover {
        opacity: 1;
    }

    .edit-message-form {
        margin-top: 8px;
    }

    .edit-message-form .form-control {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: white;
        border-radius: 8px;
        padding: 8px 12px;
    }

    .edit-actions {
        display: flex;
        gap: 8px;
        margin-top: 8px;
    }

    .edit-actions .btn {
        padding: 4px 12px;
        font-size: 0.875rem;
    }
`;

// Add the message action styles to existing styles
style.textContent += messageActionStyles;

// Add styles for edit message form
const editMessageStyles = `
    .edit-message-form {
        margin: -4px -8px;
    }

    .edit-message-form .input-group {
        background: transparent;
    }

    .edit-message-form .form-control {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: inherit;
        border-radius: 8px;
        padding: 8px 12px;
    }

    .edit-message-form .btn {
        padding: 0 10px;
        margin-left: 4px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .edit-message-form .btn i {
        font-size: 1.1rem;
    }

    .message.received .edit-message-form .form-control {
        background: rgba(0, 0, 0, 0.1);
        border-color: rgba(0, 0, 0, 0.2);
    }

    [data-bs-theme="dark"] .message.received .edit-message-form .form-control {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
    }
`;

// Add the edit message styles to existing styles
style.textContent += editMessageStyles; 