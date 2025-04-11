// Function to load the AI assistant
function loadAIAssistant() {
    // Create a link element for the AI assistant styles
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'ai-assistant.css';
    document.head.appendChild(link);

    // Create the AI assistant container
    const aiAssistant = document.createElement('div');
    aiAssistant.innerHTML = `
        <div class="ai-assistant">
            <button class="ai-assistant-btn" id="aiAssistantBtn">
                <i class="bi bi-robot"></i>
            </button>
            <div class="ai-assistant-chat" id="aiAssistantChat">
                <div class="ai-chat-header">
                    <span>AI Assistant</span>
                    <button class="btn btn-sm btn-light" id="closeChatBtn">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="ai-chat-messages" id="chatMessages"></div>
                <div class="ai-chat-input">
                    <input type="text" id="chatInput" placeholder="Ask me anything...">
                    <button id="sendMessageBtn">
                        <i class="bi bi-send"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(aiAssistant);

    // Initialize the AI Assistant
    if (typeof AIAssistant !== 'undefined') {
        window.aiAssistant = new AIAssistant();
    } else {
        console.error('AIAssistant class not found');
    }
}

// Load the AI assistant when the page loads
document.addEventListener('DOMContentLoaded', loadAIAssistant); 