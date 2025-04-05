import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from './firebase-config.js';

// Initialize Google Auth Provider
const provider = new GoogleAuthProvider();

// Function to handle Google Sign-in
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        console.log('Successfully signed in:', user);
        updateUIForUser(user);
        showNotification('Successfully signed in!', 'success');
        return user;
    } catch (error) {
        console.error('Error signing in with Google:', error);
        showNotification('Error signing in. Please try again.', 'error');
        throw error;
    }
}

// Function to handle Sign-out
export async function handleSignOut() {
    try {
        await signOut(auth);
        updateUIForSignOut();
        showNotification('Successfully signed out!', 'success');
    } catch (error) {
        console.error('Error signing out:', error);
        showNotification('Error signing out. Please try again.', 'error');
        throw error;
    }
}

// Function to update UI when user signs in
function updateUIForUser(user) {
    const userProfileButton = document.getElementById('userProfileButton');
    const signInButton = document.getElementById('signInButton');
    
    if (userProfileButton && signInButton) {
        // Show user profile, hide sign in button
        userProfileButton.style.display = 'flex';
        signInButton.style.display = 'none';
        
        // Update profile picture and name
        const profilePic = userProfileButton.querySelector('.profile-pic');
        const profileName = userProfileButton.querySelector('.profile-name');
        
        if (profilePic && user.photoURL) {
            profilePic.src = user.photoURL;
        } else {
            profilePic.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'User');
        }
        
        if (profileName) {
            profileName.textContent = user.displayName || 'User';
        }
    }
}

// Function to update UI when user signs out
function updateUIForSignOut() {
    const userProfileButton = document.getElementById('userProfileButton');
    const signInButton = document.getElementById('signInButton');
    
    if (userProfileButton && signInButton) {
        // Hide user profile, show sign in button
        userProfileButton.style.display = 'none';
        signInButton.style.display = 'flex';
    }
}

// Function to show notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        updateUIForUser(user);
    } else {
        updateUIForSignOut();
    }
}); 