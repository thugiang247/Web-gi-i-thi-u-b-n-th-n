import { initDarkMode } from './darkMode.js';
import { initParallaxScroll } from './parallaxScroll.js';
import { initIntersectionObserver } from './intersectionObserver.js';

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initParallaxScroll();
    initIntersectionObserver();

    const chatBubble = document.getElementById('chatBubble');
    const chatContainer = document.getElementById('chatContainer');
    const closeChatBtn = document.getElementById('closeChat');
    const chatInput = document.getElementById('chatInput');
    const sendMessageBtn = document.getElementById('sendMessage');
    const chatBody = document.getElementById('chatBody');

    function toggleChat() {
        chatContainer.classList.toggle('open');
    }

    function sendMessage() {
        const messageText = chatInput.value.trim();
        if (messageText !== '') {
            const now = new Date();
            const timeString = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            const messageElement = document.createElement('div');
            messageElement.classList.add('message', 'sent');
            messageElement.innerHTML = `<p>${messageText}</p><span class="message-meta">${timeString}</span>`;
            chatBody.appendChild(messageElement);
            chatInput.value = '';
            scrollToBottom();
            
            // Optional: Simulate a response from "Minh"
            setTimeout(() => {
                const responseElement = document.createElement('div');
                responseElement.classList.add('message', 'received');
                responseElement.innerHTML = `<p>Minh đã nhận được tin nhắn của bạn: "${messageText}"</p><span class="message-meta">${timeString}</span>`;
                chatBody.appendChild(responseElement);
                scrollToBottom();
            }, 1000);
        }
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
});