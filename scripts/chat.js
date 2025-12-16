import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '../API_KEY.js';

let chatSession;

export function initChat() {
    const chatBubble = document.getElementById('chatBubble');
    const chatContainer = document.getElementById('chatContainer');
    const closeChatBtn = document.getElementById('closeChat');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessage');
    const chatBody = document.getElementById('chatBody');

    // Initialize the Generative AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Start a chat session
    startNewChatSession();

    function startNewChatSession() {
        chatSession = model.startChat({
            history: [
                {
                    role: "user",
                    parts: "Bạn là một AI trợ lý cá nhân, tên bạn là Minh. Bạn sẽ giúp đỡ người dùng với mọi thắc mắc của họ."
                },
                {
                    role: "model",
                    parts: "Chào bạn, tôi là Minh, rất vui được hỗ trợ bạn. Bạn cần tôi giúp gì?"
                }
            ],
            generationConfig: {
                maxOutputTokens: 200,
            },
        });
        // Clear previous messages and add initial message
        chatBody.innerHTML = `
            <div class="message received">
                <p>Chào bạn, tôi là Minh, rất vui được hỗ trợ bạn. Bạn cần tôi giúp gì?</p>
            </div>
        `;
        scrollToBottom();
    }

    function toggleChat() {
        chatContainer.classList.toggle('open');
        if (chatContainer.classList.contains('open')) {
            chatInput.focus();
            scrollToBottom();
        }
    }

    async function sendMessage() {
        const messageText = chatInput.value.trim();
        if (messageText === '') return;

        displayMessage(messageText, 'sent');
        chatInput.value = '';
        scrollToBottom();

        try {
            const result = await chatSession.sendMessage(messageText);
            const response = await result.response;
            const text = response.text();
            displayMessage(text, 'received');
            scrollToBottom();
        } catch (error) {
            console.error("Error sending message to Gemini API:", error);
            displayMessage("Xin lỗi, tôi không thể phản hồi lúc này. Vui lòng thử lại sau.", 'received');
            scrollToBottom();
        }
    }

    function displayMessage(text, type) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);
        messageElement.innerHTML = `<p>${text}</p>`;
        chatBody.appendChild(messageElement);
    }

    function scrollToBottom() {
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    chatBubble.addEventListener('click', toggleChat);
    closeChatBtn.addEventListener('click', toggleChat);
    sendMessageBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}