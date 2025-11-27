// chat.js - Handles sending and receiving chat messages

/**
 * Sends a user message and triggers an AI response.
 */
async function sendMessage() {
    const message = userInput.value.trim();
    if (message === '') {
        return;
    }

    displayMessage(message, 'user'); // Display user message
    userInput.value = ''; // Clear input field
    setInputState(true); // Disable input while waiting for AI

    displayMessage('Thinking...', 'system');

      try {
          const serviceId = window.aiServiceSettings.currentServiceId;
          if (!serviceId || !window.availableAIServices[serviceId]) {
              displayMessage('Error: AI service not selected or configured. Please check settings.', 'danger');
              setInputState(false);
              return;
          }
  
          const serviceConfig = window.availableAIServices[serviceId];
          const serviceSettings = window.aiServiceSettings[serviceId] || {};
  
          // Determine model using the same logic as prepareAPIRequest (options -> user -> default -> custom)
          // In chat.js, we don't have separate 'options', so it's user -> default -> custom
          let model = serviceSettings.model || serviceConfig.defaultModel;
          if (model === 'custom' && serviceSettings.customModel) {
              model = serviceSettings.customModel;
          } else if (model === 'custom' && !serviceSettings.customModel) {
              console.warn(`Custom model selected for ${serviceId} but no custom model name set. Falling back to default: ${config.defaultModel}`);
              model = serviceConfig.defaultModel;
          }
  
          console.log(`[sendMessage] Using Service: ${serviceId}, Model: ${model}`);
  
          const useImages = window.currentPdfImages && window.currentPdfImages.length > 0;
          const useText = window.currentPdfText && window.currentPdfText.length > 0;
  
          if (!useImages && !useText) {
              displayMessage('Error: No PDF content (text or images) available to chat about.', 'danger');
              setInputState(false);
              return;
          }
  
          // Construct the request body (payload) based on the service and content
          let requestPayload;
  
          if (serviceId === 'gemini') {
              // Check model compatibility for images (simple check)
              if (useImages && !model.includes('1.5') && !model.includes('flash') && !model.includes('pro')) { // Adjusted check for known vision models
                  displayMessage(`Warning: Selected Gemini model "${model}" might not support image input. Consider Gemini 1.5 Flash/Pro.`, 'warning');
                  // Proceed anyway, but warn the user. A stricter check could return an error.
              }
  
              let geminiParts = [];
              if (useText) {
                  geminiParts.push({ text: `Context from PDF:\n${window.currentPdfText}` });
              }
              if (useImages) {
                  window.currentPdfImages.forEach(imageDataUrl => {
                      const base64Data = imageDataUrl.split(',')[1];
                      geminiParts.push({
                          inline_data: { mime_type: 'image/png', data: base64Data }
                      });
                  });
              }
              geminiParts.push({ text: `User Query: ${message}` });
  
              requestPayload = {
                  contents: [{ parts: geminiParts }],
                  // Generation config could be added here if needed, fetched from settings or defaults
                  // generationConfig: { ... }
              };
  
          } else if (serviceId === 'openai' || serviceId === 'lmstudio' || serviceId === 'custom') {
              // Check model compatibility for images (simple check for OpenAI)
              if (useImages && serviceId === 'openai' && !model.includes('gpt-4') && !model.includes('vision')) { // Adjusted check
                   displayMessage(`Warning: Selected OpenAI model "${model}" might not support image input. Consider GPT-4 Turbo/GPT-4o.`, 'warning');
                   // Proceed anyway
              }
               if (useImages && (serviceId === 'lmstudio' || serviceId === 'custom')) {
                   console.warn("Sending images to custom/LM Studio endpoint. Ensure the model supports multi-modal input in OpenAI format.");
               }
  
  
              let userContent = [];
              if (useText) {
                  userContent.push({ type: 'text', text: `Context from PDF:\n${window.currentPdfText}` });
              }
              if (useImages) {
                  window.currentPdfImages.forEach(imageDataUrl => {
                      // OpenAI expects the full data URL for image_url
                      userContent.push({ type: 'image_url', image_url: { url: imageDataUrl } });
                  });
              }
              userContent.push({ type: 'text', text: `User Query: ${message}` });
  
              requestPayload = {
                  model: model, // Model needs to be part of the payload for OpenAI format
                  messages: [
                      { role: 'system', content: `You are a helpful assistant that answers questions based on the provided PDF content.` },
                      { role: 'user', content: userContent }
                  ]
                  // Optional parameters like max_tokens, temperature could be added here
                  // max_tokens: serviceSettings.maxTokens || 1024, // Example
              };
          } else {
              displayMessage(`Error: Unsupported AI service selected: ${serviceConfig.name}.`, 'danger');
              setInputState(false);
              return;
          }
  
          // Call the unified sendAIRequest function from api.js
          // Pass the complex payload directly instead of a simple prompt string
          const { result: aiResponse, model: responseModel } = await window.sendAIRequest(serviceId, requestPayload);
  
          console.log(`[sendMessage] Received response using model: ${responseModel}`);
          displayMessage(aiResponse, 'ai');
  
      } catch (error) {
          console.error('Error during AI request:', error);
          // Display the potentially more user-friendly error message from sendAIRequest
          displayMessage(`Error: ${error.message}`, 'danger');
      } finally {
          setInputState(false); // Enable input after response or error
          updatePdfStatus('Ready to chat.'); // Update status
      }
  }

// Event listener for the send button
sendBtn.addEventListener('click', sendMessage);

// Event listener for pressing Enter in the input field
userInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault(); // Prevent newline in textarea
        sendMessage();
    }
});