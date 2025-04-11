const GEMINI_API_KEY = 'AIzaSyCKZn93_nxT9yt321zSc7-5c6go2vIXTgQ';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

class AIAssistant {
    constructor() {
        this.chatHistory = [];
        this.isTyping = false;
        this.welcomeShown = false;
        this.initializeElements();
        this.attachEventListeners();
        this.loadChatHistory(); // Load previous chat history
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
                const wasClosed = !this.chat.classList.contains('active');
                this.toggleChat();
                if (wasClosed && !this.welcomeShown) {
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

    // Load chat history from localStorage
    loadChatHistory() {
        const savedHistory = localStorage.getItem('studyFlowChatHistory');
        if (savedHistory) {
            this.chatHistory = JSON.parse(savedHistory);
        }
    }

    // Save chat history to localStorage
    saveChatHistory() {
        localStorage.setItem('studyFlowChatHistory', JSON.stringify(this.chatHistory));
    }

    async getAIResponse(message) {
        try {
            // Store the message in chat history
            this.chatHistory.push({ role: 'user', content: message });
            this.saveChatHistory();

            // Check for identity-related questions
            const identityQuestions = [
                'who are you',
                'what are you',
                'tum kon ho',
                'aap kaun ho',
                'what is your name',
                'what can you do',
                'who is you',
                'are you google',
                'are you chatgpt',
                'are you ai',
                'are you bot'
            ];

            const isIdentityQuestion = identityQuestions.some(question => 
                message.toLowerCase().includes(question)
            );

            if (isIdentityQuestion) {
                return "I'm Study Flow's assistant! I help with videos, playlists, and study resources. How can I help you?";
            }

            // Prepare context from entire chat history
            const context = this.chatHistory.map(msg => 
                `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
            ).join('\n');

            // Create a more detailed prompt for better understanding
            const prompt = `
You are Study Flow's assistant. Always identify yourself as Study Flow's assistant when asked about your identity.

Complete conversation history:
${context}

Current user message: "${message}"

Please:
1. Understand the user's intent and context from the entire conversation
2. Reference previous messages if relevant
3. Provide a concise, helpful response
4. If the message is unclear, ask for clarification
5. Keep the response under 150 characters
6. Always identify yourself as Study Flow's assistant when asked about your identity
`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error('Failed to get response from AI');
            }

            const data = await response.json();
            let responseText = data.candidates[0].content.parts[0].text;

            // Store the response in chat history
            this.chatHistory.push({ role: 'assistant', content: responseText });
            this.saveChatHistory();

            // Ensure response is concise
            if (responseText.length > 150) {
                responseText = responseText.substring(0, 147) + '...';
            }

            return responseText;
        } catch (error) {
            console.error('Error getting AI response:', error);
            return "Sorry, I'm having trouble. Please try again.";
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
        if (this.welcomeShown) return;
        
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
        this.welcomeShown = true;
    }

    // Add method to clear chat history
    clearChatHistory() {
        this.chatHistory = [];
        localStorage.removeItem('studyFlowChatHistory');
        this.messagesContainer.innerHTML = ''; // Clear the chat UI
        this.showWelcomeMessage(); // Show welcome message again
    }
}

// Make the class available globally
window.AIAssistant = AIAssistant;

// Initialize AI Assistant when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.aiAssistant = new AIAssistant();
}); 