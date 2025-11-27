// ui.js - Handles user interface interactions and updates

const chatThread = document.getElementById('chat-thread');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const uploadBtn = document.getElementById('upload-btn');
const pdfUploadInput = document.getElementById('pdf-upload');
const pdfInfoDiv = document.getElementById('pdf-info');
const pdfNameSpan = document.getElementById('pdf-name');
const pdfStatusSpan = document.getElementById('pdf-status');
const notificationElement = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');

/**
 * Displays a message in the chat thread.
 * @param {string} content - The message content.
 * @param {'user' | 'ai' | 'system'} sender - The sender of the message ('user', 'ai', or 'system').
 */
function displayMessage(content, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${sender}-message`);

    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    contentElement.textContent = content; // Use textContent to prevent XSS

    messageElement.appendChild(contentElement);
    chatThread.appendChild(messageElement);

    // Scroll to the bottom
    chatThread.scrollTop = chatThread.scrollHeight;
}

/**
 * Clears the chat thread.
 */
function clearChat() {
    chatThread.innerHTML = '';
    displayMessage('Upload a PDF to start chatting.', 'system');
}

/**
 * Sets the disabled state of the input and send button.
 * @param {boolean} disabled - True to disable, false to enable.
 */
function setInputState(disabled) {
    userInput.disabled = disabled;
    sendBtn.disabled = disabled;
}

/**
 * Shows information about the loaded PDF.
 * @param {string} name - The name of the PDF file.
 * @param {string} status - The current status (e.g., "Processing...", "Ready to chat").
 */
function showPdfInfo(name, status) {
    pdfNameSpan.textContent = name;
    pdfStatusSpan.textContent = status;
    pdfInfoDiv.style.display = 'block';
}

/**
 * Updates the status message for the PDF.
 * @param {string} status - The new status message.
 */
function updatePdfStatus(status) {
    pdfStatusSpan.textContent = status;
}

/**
 * Hides the PDF information block.
 */
function hidePdfInfo() {
    pdfInfoDiv.style.display = 'none';
    pdfNameSpan.textContent = '';
    pdfStatusSpan.textContent = '';
}


/**
 * Shows a notification message.
 * @param {string} message - The message to display.
 * @param {'info' | 'success' | 'danger'} type - The type of notification (for styling).
 * @param {number} duration - The duration in milliseconds to show the notification.
 */
function showNotification(message, type = 'info', duration = 3000) {
    notificationMessage.textContent = message;
    notificationElement.className = `notification ${type}`; // Reset classes and add type
    notificationElement.classList.add('show');

    setTimeout(() => {
        notificationElement.classList.remove('show');
        // Optional: Hide the element completely after transition
        setTimeout(() => {
             notificationElement.style.display = 'none';
        }, 500); // Match CSS transition duration
    }, duration);
}

// Initial state
clearChat();
setInputState(true);
hidePdfInfo();