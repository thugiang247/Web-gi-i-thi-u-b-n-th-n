// js/api.js - Handles interactions with various AI APIs

/**
 * Prepares API request parameters based on service type and settings.
 * @param {string} serviceId - The ID of the AI service (e.g., 'openai', 'gemini').
 * @param {string} promptText - The text prompt for the AI.
 * @param {object} options - Optional parameters like maxTokens.
 * @returns {object} - An object containing endpoint, headers, requestData, and model.
 * @throws {Error} - If API key is missing or service is not configured.
 */
function prepareAPIRequest(serviceId, promptText, options = {}) {
    // Access global settings and available services from settings.js
    const settings = window.aiServiceSettings[serviceId] || {};
    const config = window.availableAIServices[serviceId];

    if (!config) {
        throw new Error(`Service configuration not found for serviceId: ${serviceId}`);
    }

    // Determine the model to use: options -> user setting -> default -> custom setting
    let model = options.model || settings.model || config.defaultModel;
    if (model === 'custom' && settings.customModel) {
        model = settings.customModel;
    } else if (model === 'custom' && !settings.customModel) {
        // If 'custom' is selected but no custom model name is provided, fall back to default
        console.warn(`Custom model selected for ${serviceId} but no custom model name set. Falling back to default: ${config.defaultModel}`);
        model = config.defaultModel;
    }

    // Determine API Key: user setting -> empty string
    let apiKey = settings.apiKey || '';

    // Determine Endpoint: user setting -> default from config -> null
    let endpoint = settings.endpoint || config.defaultEndpoint || null;

    console.log(`[prepareAPIRequest] Service: ${serviceId}, Model: ${model}, Endpoint: ${endpoint}, API Key Set: ${!!apiKey}`);

    // Prepare headers
    const headers = {
        'Content-Type': 'application/json'
    };

    // Prepare request data based on service type
    let requestData;

    if (serviceId === 'openai' || serviceId === 'lmstudio' || serviceId === 'custom') {
        if (!endpoint) {
            throw new Error(`API Endpoint is not set for ${config.name} in settings and no default is available.`);
        }
        // Add Authorization header if API key is provided (required for OpenAI, optional for LM Studio/Custom)
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        // Ensure the endpoint URL is correctly formatted for OpenAI-compatible APIs
        let finalEndpoint = endpoint.replace(/\/$/, ''); // Remove trailing slash
        if (!finalEndpoint.endsWith('/v1/chat/completions')) {
             if (finalEndpoint.endsWith('/v1')) {
                 finalEndpoint += '/chat/completions';
             } else {
                 finalEndpoint += '/v1/chat/completions';
             }
        }
        endpoint = finalEndpoint; // Update the endpoint variable

        requestData = {
            model: model,
            messages: [{ role: "user", content: promptText }] // Simple user prompt for testing/basic requests
            // Note: For chat.js, the messages structure will be more complex (system prompt, context, images)
        };
        // Add optional parameters if provided
        if (options.maxTokens) requestData.max_tokens = options.maxTokens;
        if (options.temperature) requestData.temperature = options.temperature;
        if (options.topP) requestData.top_p = options.topP;

    } else if (serviceId === 'gemini') {
        if (!apiKey) {
            throw new Error('API Key Required for Gemini');
        }
        // Gemini uses a different endpoint structure and includes the API key in the URL
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`; // Use v1beta endpoint for newer Gemini models

        requestData = {
            contents: [{ parts: [{ text: promptText }] }] // Simple user prompt
        };

        // Handle generation config for Gemini
        const generationConfig = {};
        if (options.maxTokens) generationConfig.maxOutputTokens = options.maxTokens;
        if (options.temperature) generationConfig.temperature = options.temperature;
        if (options.topP) generationConfig.topP = options.topP;
        // Add other Gemini-specific parameters from options if needed

        if (Object.keys(generationConfig).length > 0) {
            requestData.generationConfig = generationConfig;
        }
    } else {
        throw new Error(`Unsupported AI service: ${serviceId}`);
    }

    return { endpoint, headers, requestData, model };
}

/**
 * Sends a request to the specified AI service.
 * @param {string} serviceId - The ID of the AI service.
 * @param {string} prompt - The prompt text.
 * @param {object} options - Optional parameters (e.g., maxTokens, model, temperature, topP).
 * @returns {Promise<object>} - A promise resolving with the AI response.
 * @throws {Error} - If the API request fails.
 */
async function sendAIRequest(serviceId, promptOrMessages, options = {}) {
    // promptOrMessages can be a simple string or a complex message structure (like in chat.js)
    try {
        // Prepare the basic request structure using the prompt/options
        // Note: prepareAPIRequest is designed for simpler prompts. For complex chat structures,
        // chat.js will need to construct the final `requestData` body itself,
        // but it can still use prepareAPIRequest to get the endpoint, headers, and model.
        // Let's adapt prepareAPIRequest slightly or handle complex bodies here.

        // Option 1: Pass complex body directly if needed (more flexible)
        let preparedRequest;
        if (typeof promptOrMessages === 'string') {
            preparedRequest = prepareAPIRequest(serviceId, promptOrMessages, options);
        } else {
            // Assume promptOrMessages is the pre-constructed body content (e.g., messages array)
            // We still need endpoint, headers, model from prepareAPIRequest, passing a dummy prompt.
            const baseRequest = prepareAPIRequest(serviceId, "Placeholder prompt", options);
            preparedRequest = {
                ...baseRequest,
                requestData: promptOrMessages // Use the complex body passed in
            };
             // Ensure the model from options/settings is correctly set in the complex body if needed
             if (preparedRequest.requestData.model && preparedRequest.model !== preparedRequest.requestData.model) {
                 console.warn(`Model mismatch: prepareAPIRequest determined ${preparedRequest.model}, but body contains ${preparedRequest.requestData.model}. Using model from body.`);
                 preparedRequest.model = preparedRequest.requestData.model; // Prioritize model in the complex body if present
             } else if (!preparedRequest.requestData.model) {
                 preparedRequest.requestData.model = preparedRequest.model; // Ensure model is in the body if not already set
             }
        }

        const { endpoint, headers, requestData, model } = preparedRequest;

        console.log(`[sendAIRequest] Sending to ${serviceId} (${model}) at ${endpoint}`);
        // console.log('[sendAIRequest] Headers:', headers); // Optional: Log headers (be careful with API keys)
        // console.log('[sendAIRequest] Body:', JSON.stringify(requestData, null, 2)); // Log body for debugging

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            let errorText = `HTTP error ${response.status}`;
            try {
                const errorData = await response.json(); // Try to parse JSON error response
                errorText += `: ${errorData.error?.message || JSON.stringify(errorData)}`;
            } catch (e) {
                errorText += `: ${await response.text()}`; // Fallback to plain text
            }
            throw new Error(errorText);
        }

        const data = await response.json();

        // Check for API-specific errors within the JSON response
        if (data.error) {
            const errorMessage = typeof data.error === 'object' ? (data.error.message || JSON.stringify(data.error)) : data.error;
            throw new Error(`API Error: ${errorMessage}`);
        }

        // Return the extracted result, the model used, and the raw data
        return {
            result: getResponseFromData(data, serviceId), // Pass serviceId to getResponseFromData
            model: model, // Return the actual model used
            data: data // Return the full response data
        };

    } catch (error) {
        console.error(`Error sending request to ${serviceId}:`, error);
        // Add user-friendly error mapping here if desired
        let userFriendlyError = error.message;
        if (error.message.includes('API Key Required')) {
             userFriendlyError = `API Key is missing or invalid for ${window.availableAIServices[serviceId]?.name || serviceId}. Please check settings.`;
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
             userFriendlyError = `Could not connect to the AI service endpoint. Please check the endpoint URL in settings and ensure the service is running.`;
        } else if (error.message.includes('HTTP error 401') || error.message.includes('Unauthorized')) {
             userFriendlyError = `Authentication failed. Please check your API Key for ${window.availableAIServices[serviceId]?.name || serviceId}.`;
        } else if (error.message.includes('HTTP error 404')) {
             userFriendlyError = `API endpoint not found. Please check the endpoint URL in settings.`;
        }
        // Throw the potentially more user-friendly error message
        throw new Error(userFriendlyError);
    }
}

/**
 * Extracts the AI response text from different API response formats.
 * @param {object} data - The raw API response data.
 * @returns {string} - The extracted response text.
 */
function getResponseFromData(data, serviceId) {
    // Handle OpenAI / LM Studio / Custom (OpenAI format)
    if (serviceId === 'openai' || serviceId === 'lmstudio' || serviceId === 'custom') {
        if (data.choices && data.choices[0]) {
            // Standard chat completion response
            if (data.choices[0].message && data.choices[0].message.content) {
                return data.choices[0].message.content;
            }
            // Older completion response format (less common now)
            if (data.choices[0].text) {
                return data.choices[0].text;
            }
        }
    }
    // Handle Gemini
    else if (serviceId === 'gemini') {
        if (data.candidates && data.candidates[0]) {
            // Check safety ratings first - might want to return a specific message if blocked
            const safetyRatings = data.candidates[0].safetyRatings;
            if (safetyRatings && safetyRatings.some(rating => rating.probability !== 'NEGLIGIBLE' && rating.blocked)) {
                 console.warn("Gemini response potentially blocked due to safety settings:", safetyRatings);
                 // return "[Response blocked due to safety settings]"; // Or handle as needed
            }

            if (data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                return data.candidates[0].content.parts[0].text || '';
            }
        }
         // Handle potential errors returned in the Gemini response body itself (if not caught by response.ok)
         if (data.error) {
             console.error("Gemini API returned an error in the response body:", data.error);
             return `[Error from Gemini: ${data.error.message || JSON.stringify(data.error)}]`;
         }
    }

    // Fallback / Unknown format
    console.warn(`Could not extract standard response text for service ${serviceId}. Data:`, data);
    // Try some common alternative fields as a last resort
    if (data.message && data.message.content) return data.message.content;
    if (data.content) return data.content;
    if (data.text) return data.text;

    return '[Could not parse AI response]'; // Indicate parsing failure
}


/**
 * Tests the API connection for a given service.
 * @param {string} serviceId - The ID of the AI service.
 */
async function testAPIConnection(serviceId) {
  const resultDiv = document.getElementById(`test-connection-result-${serviceId}`);
  if (!resultDiv) {
      console.error(`Result div not found for service: ${serviceId}`);
      return;
  }

  resultDiv.textContent = 'Testing...';
  resultDiv.className = 'mt-2 small text-muted'; // Reset style

  try {
    // Get current settings and config for the service being tested
    const settings = window.aiServiceSettings[serviceId] || {};
    const config = window.availableAIServices[serviceId];
    if (!config) {
        throw new Error(`Configuration for service ${serviceId} not found.`);
    }

    // Determine the actual model to use for the test, reading directly from the UI select element
    let modelToTest = config.defaultModel; // Start with default as a fallback
    const modelSelectElement = document.getElementById(`${serviceId}-model-select`);
    if (modelSelectElement) {
        const selectedModelValue = modelSelectElement.value;
        if (selectedModelValue === 'custom') {
            const customModelInputElement = document.getElementById(`${serviceId}-custom-model`);
            if (customModelInputElement && customModelInputElement.value) {
                modelToTest = customModelInputElement.value;
            } else {
                 console.warn(`[testAPIConnection] Custom model selected for ${serviceId} but no custom model name input found or value is empty. Testing with default: ${config.defaultModel}`);
                 modelToTest = config.defaultModel; // Fallback to default if custom selected but no input/value
            }
        } else if (selectedModelValue) {
            modelToTest = selectedModelValue; // Use the selected value from the dropdown
        } else {
             console.warn(`[testAPIConnection] Model select element found for ${serviceId} but has no value. Testing with default: ${config.defaultModel}`);
             modelToTest = settings.model || config.defaultModel; // Fallback to settings or default if select has no value
        }
    } else {
        console.warn(`[testAPIConnection] Model select element not found for ${serviceId}. Falling back to settings or default.`);
        modelToTest = settings.model || config.defaultModel; // Fallback if element not found
    }

    console.log(`[testAPIConnection] Testing service: ${serviceId}, Model: ${modelToTest}`);

    // Use a simple prompt that should work for most models
    const testPrompt = "Hello, world!";
    // Pass the determined model and small maxTokens in options
    const options = {
        model: modelToTest,
        maxTokens: 10
    };

    // Call sendAIRequest with the specific model to test
    const response = await sendAIRequest(serviceId, testPrompt, options);

    // Update result div on success, include the model tested
    resultDiv.textContent = `Connection successful! (Model: ${response.model})`; // Use model from response
    resultDiv.className = 'mt-2 small text-success';

  } catch (error) {
    console.error(`Test API Connection Failed for ${serviceId}:`, error); // Keep console.error for debugging failed tests

    // Update result div on failure
    resultDiv.textContent = `Connection failed: ${error.message}`;
    resultDiv.className = 'mt-2 small text-danger';
  }
}


// Expose necessary functions to the global scope
window.prepareAPIRequest = prepareAPIRequest;
window.sendAIRequest = sendAIRequest;
window.getResponseFromData = getResponseFromData;
window.testAPIConnection = testAPIConnection;