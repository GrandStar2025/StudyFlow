const GEMINI_API_KEY = 'AIzaSyCKZn93_nxT9yt321zSc7-5c6go2vIXTgQ';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

class AIAssistant {
    constructor() {
        this.chatHistory = [];
        this.isTyping = false;
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.btn = document.getElementById('aiAssistantBtn');
        this.chat = document.getElementById('aiAssistantChat');
        this.messagesContainer = document.getElementById('chatMessages');
        this.input = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendMessageBtn');
        this.closeBtn = document.getElementById('closeChatBtn');
    }

    attachEventListeners() {
        if (this.btn) {
            this.btn.addEventListener('click', () => {
                this.toggleChat();
                if (this.chat.classList.contains('active')) {
                    this.showWelcomeMessage();
                }
            });
        }
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.toggleChat());
        }
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }
        if (this.input) {
            this.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
        }
    }

    toggleChat() {
        if (this.chat) {
            this.chat.classList.toggle('active');
            if (this.chat.classList.contains('active')) {
                this.input.focus();
            }
        }
    }

    async sendMessage() {
        if (!this.input || !this.input.value.trim() || this.isTyping) return;

        const message = this.input.value.trim();
        this.addMessage(message, 'user');
        this.input.value = '';
        this.showTypingIndicator();

        try {
            const response = await this.getAIResponse(message);
            this.removeTypingIndicator();
            this.addMessage(response, 'assistant');
        } catch (error) {
            this.removeTypingIndicator();
            this.showError('Sorry, I encountered an error. Please try again.');
            console.error('AI Response Error:', error);
        }
    }

    async getAIResponse(message) {
        try {
            console.log('Sending request to Gemini API...');
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: message
                        }]
                    }]
                })
            });

            console.log('API Response Status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error Response:', errorData);
                throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            console.log('API Response Data:', data);
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid API response format');
            }

            const responseText = data.candidates[0].content.parts[0].text;
            if (!responseText) {
                throw new Error('Empty response from API');
            }

            return responseText;
        } catch (error) {
            console.error('API Error:', error);
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Network error. Please check your internet connection.');
            } else if (error.message.includes('API Error: 400')) {
                throw new Error('Invalid request. Please try again with a different message.');
            } else if (error.message.includes('API Error: 403')) {
                throw new Error('API key error. Please check your API key configuration.');
            } else if (error.message.includes('API Error: 429')) {
                throw new Error('Too many requests. Please try again later.');
            } else {
                throw error;
            }
        }
    }

    addMessage(text, sender) {
        if (!this.messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${sender}`;
        messageDiv.innerHTML = text;
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        if (!this.messagesContainer || !this.sendBtn) return;
        
        this.isTyping = true;
        this.sendBtn.disabled = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        typingDiv.id = 'typingIndicator';
        this.messagesContainer.appendChild(typingDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        this.isTyping = false;
        if (this.sendBtn) {
            this.sendBtn.disabled = false;
        }
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    showError(message) {
        if (!this.messagesContainer) return;
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'ai-error-message';
        errorDiv.textContent = message;
        this.messagesContainer.appendChild(errorDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    showWelcomeMessage() {
        const welcomeMessage = `
<div class="welcome-message">
    <div class="welcome-header">
        <span class="welcome-icon">🎓</span>
        <h3>Welcome to Study Flow Assistant!</h3>
    </div>
    <div class="welcome-content">
        <p>I'm your personal learning companion, ready to help you with:</p>
        <ul class="welcome-features">
            <li><span class="feature-icon">🔍</span> Finding educational videos</li>
            <li><span class="feature-icon">📚</span> Creating and managing playlists</li>
            <li><span class="feature-icon">💡</span> Answering study questions</li>
            <li><span class="feature-icon">📝</span> Providing learning resources</li>
        </ul>
        <p class="welcome-prompt">How can I assist you today?</p>
    </div>
</div>
        `;
        this.addMessage(welcomeMessage, 'assistant');
    }
}

// Make the class available globally
window.AIAssistant = AIAssistant;

// Initialize AI Assistant when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.aiAssistant = new AIAssistant();
}); 