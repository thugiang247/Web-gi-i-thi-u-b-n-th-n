// settings.js - Handles settings panel interactions and saving configurations

const aiSettingsSection = document.getElementById('ai-settings-section');

// Default and current settings structure
let aiServiceSettings = JSON.parse(localStorage.getItem('pdfChatAIServiceSettings')) || {};

// Define available AI services and their configurations
// In a real app, this might come from a backend or a more complex config file
const availableAIServices = {
    'gemini': {
        name: 'Google Gemini',
        defaultModel: 'gemini-pro',
        modelOptions: [
            { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
            { value: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash' },
            { value: 'gemini-2.5-pro-exp-03-25', label: 'Gemini 2.5 Pro' },
            { value: 'custom', label: 'Custom Model' }
        ],
        settingsFields: [
            { id: 'apiKey', label: 'API Key', type: 'text', placeholder: 'Enter your Gemini API Key' }
        ]
    },
    'openai': {
        name: 'OpenAI',
        defaultModel: 'gpt-3.5-turbo',
        defaultEndpoint: 'https://api.openai.com/v1', // Add default OpenAI endpoint
        modelOptions: [
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
            { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
            { value: 'gpt-4o', label: 'GPT-4o' },
            { value: 'custom', label: 'Custom Model' }
        ],
        settingsFields: [
            { id: 'apiKey', label: 'API Key', type: 'text', placeholder: 'Enter your OpenAI API Key' }
        ]
    },
    'lmstudio': {
        name: 'LM Studio',
        defaultModel: 'local-model', // LM Studio typically serves local models
        defaultEndpoint: 'http://localhost:1234/v1', // Add default endpoint
        modelOptions: [
             { value: 'local-model', label: 'Local Model (from LM Studio)' },
             { value: 'custom', label: 'Custom Model' }
        ],
        settingsFields: [
            { id: 'endpoint', label: 'API Endpoint', type: 'text', placeholder: 'e.g., http://localhost:1234/v1' } // Base URL ending with /v1
            // LM Studio might not require an API key depending on configuration
        ]
    },
     'custom': {
        name: 'Custom AI Service',
        defaultModel: 'custom-model',
        modelOptions: [
             { value: 'custom', label: 'Custom Model' }
        ],
        settingsFields: [
            { id: 'endpoint', label: 'API Endpoint', type: 'text', placeholder: 'Enter full endpoint URL (e.g., https://api.example.com/v1)' }, // Guide user for full URL
            { id: 'apiKey', label: 'API Key (Optional)', type: 'text', placeholder: 'Enter your API Key (if required)' }
        ]
    }
};

// Get the currently selected AI service ID from settings or default to the first available
let currentAIServiceId = aiServiceSettings.currentServiceId || Object.keys(availableAIServices)[0];
// Ensure the default selected service is one of the available ones after update
if (!availableAIServices[currentAIServiceId]) {
    currentAIServiceId = Object.keys(availableAIServices)[0];
    aiServiceSettings.currentServiceId = currentAIServiceId;
    saveAIServiceSettings();
}

/**
 * Initializes the settings panel.
 */
function initializeSettings() {
    if (!aiSettingsSection) {
        console.error('AI settings section element not found!');
        return;
    }

    renderAIServiceSettings();
    // Add event listener for changes within the settings section
    aiSettingsSection.addEventListener('change', handleSettingsChange);
}

/**
 * Renders the AI service selection and settings fields.
 */
function renderAIServiceSettings() {
    if (!aiSettingsSection) return;

    const serviceIds = Object.keys(availableAIServices);
    if (serviceIds.length === 0) {
        aiSettingsSection.innerHTML = '<p>No AI services configured.</p>';
        return;
    }

    // Ensure currentAIServiceId is valid
    if (!availableAIServices[currentAIServiceId]) {
        currentAIServiceId = serviceIds[0];
    }

    const currentServiceConfig = availableAIServices[currentAIServiceId];
    const currentServiceSettings = aiServiceSettings[currentAIServiceId] || {};

    let settingsHtml = `
        <div class="mb-3">
            <label for="ai-service-select" class="form-label">Select AI Service</label>
            <select class="form-select" id="ai-service-select">
                ${serviceIds.map(serviceId => {
                    const serviceConfig = availableAIServices[serviceId];
                    const selected = currentAIServiceId === serviceId ? 'selected' : '';
                    return `<option value="${serviceId}" ${selected}>${serviceConfig.name}</option>`;
                }).join('')}
            </select>
        </div>
    `;

    // Render settings fields for the selected service
    if (currentServiceConfig.settingsFields) {
        currentServiceConfig.settingsFields.forEach(field => {
            const value = currentServiceSettings[field.id] || '';
            settingsHtml += `
                <div class="mb-3">
                    <label for="${currentAIServiceId}-${field.id}" class="form-label">${field.label}</label>
                    <input type="${field.type}" class="form-control" id="${currentAIServiceId}-${field.id}" value="${escapeHTML(value)}" placeholder="${field.placeholder || ''}">
                </div>
            `;
        });
    }

     // Render model selection if available
    if (currentServiceConfig.modelOptions) {
         const currentModel = currentServiceSettings.model || currentServiceConfig.defaultModel;
         settingsHtml += `
            <div class="mb-3">
                <label for="${currentAIServiceId}-model-select" class="form-label">Select Model</label>
                <select class="form-select" id="${currentAIServiceId}-model-select">
                    ${currentServiceConfig.modelOptions.map(option => {
                        const selected = currentModel === option.value ? 'selected' : '';
                        return `<option value="${option.value}" ${selected}>${option.label}</option>`;
                    }).join('')}
                </select>
            </div>
         `;

         // Add custom model input if 'custom' option exists
         if (currentServiceConfig.modelOptions.some(option => option.value === 'custom')) {
             const customModelValue = currentServiceSettings.customModel || '';
             settingsHtml += `
                 <div class="mb-3 ${currentModel === 'custom' ? '' : 'd-none'}" id="${currentAIServiceId}-custom-model-div">
                     <label for="${currentAIServiceId}-custom-model" class="form-label">Custom Model Name</label>
                     <input type="text" class="form-control" id="${currentAIServiceId}-custom-model" value="${escapeHTML(customModelValue)}" placeholder="Enter custom model name">
                 </div>
             `;
         }
    }


    // Add a test connection button and a result area
    settingsHtml += `
        <button class="btn btn-secondary mt-3" id="test-api-btn" data-service-id="${currentAIServiceId}">Test Connection</button>
        <div id="test-connection-result-${currentAIServiceId}" class="mt-2 small"></div> <!-- Area for test result -->
    `;


    aiSettingsSection.innerHTML = settingsHtml;

    // Add event listener specifically for the model select to handle custom input visibility
    const modelSelect = document.getElementById(`${currentAIServiceId}-model-select`);
    if (modelSelect) {
        modelSelect.addEventListener('change', handleModelSelectChange);
    }
}

/**
 * Handles changes within the AI settings section.
 * @param {Event} event - The change event.
 */
function handleSettingsChange(event) {
    const target = event.target;

    // Handle AI Service Select change
    if (target.id === 'ai-service-select') {
        currentAIServiceId = target.value;
        aiServiceSettings.currentServiceId = currentAIServiceId; // Save selected service

        // Ensure settings for the newly selected service are initialized if they don't exist
        if (!aiServiceSettings[currentAIServiceId]) {
            aiServiceSettings[currentAIServiceId] = {};
        }

        saveAIServiceSettings();
        renderAIServiceSettings(); // Re-render settings for the new service
        return; // Stop further processing for this event
    }

    // Handle changes within the current service's settings fields
    const currentServiceConfig = availableAIServices[currentAIServiceId];
    if (!currentServiceConfig) return;

    if (!aiServiceSettings[currentAIServiceId]) {
        aiServiceSettings[currentAIServiceId] = {};
    }

    // Check if the changed element is one of the defined settings fields
    const changedField = currentServiceConfig.settingsFields?.find(field => target.id === `${currentAIServiceId}-${field.id}`);
    if (changedField) {
        aiServiceSettings[currentAIServiceId][changedField.id] = target.value;
        saveAIServiceSettings();
    } else if (target.id === `${currentAIServiceId}-model-select`) {
         aiServiceSettings[currentAIServiceId].model = target.value;
         saveAIServiceSettings();
         // The handleModelSelectChange listener will handle custom input visibility
    } else if (target.id === `${currentAIServiceId}-custom-model`) {
         aiServiceSettings[currentAIServiceId].customModel = target.value;
         saveAIServiceSettings();
    }
}

/**
 * Handles change event on the model select dropdown to show/hide custom model input.
 */
function handleModelSelectChange(event) {
    const modelSelect = event.target;
    const customModelDiv = document.getElementById(`${currentAIServiceId}-custom-model-div`);
    if (customModelDiv) {
        if (modelSelect.value === 'custom') {
            customModelDiv.classList.remove('d-none');
        } else {
            customModelDiv.classList.add('d-none');
            // Optionally clear custom model value if not using custom
            if (aiServiceSettings[currentAIServiceId]) {
                 delete aiServiceSettings[currentAIServiceId].customModel;
                 saveAIServiceSettings();
            }
        }
    }
}


/**
 * Saves AI service settings to localStorage.
 */
function saveAIServiceSettings() {
    localStorage.setItem('pdfChatAIServiceSettings', JSON.stringify(aiServiceSettings));
}

/**
 * Saves AI service settings to localStorage.
 */
function saveAIServiceSettings() {
    localStorage.setItem('pdfChatAIServiceSettings', JSON.stringify(aiServiceSettings));
}


// Helper function to escape HTML for input values
function escapeHTML(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, function(match) {
        return {
            '&': '&',
            '<': '<',
            '>': '>',
            '"': '"',
            "'": '&#039;'
        }[match];
    });
}

// Initialize settings when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeSettings);

/**
 * Gets the configuration for the currently selected AI service.
 * @returns {object|null} The service configuration object or null if not found.
 */
function getCurrentAIServiceConfig() {
    return availableAIServices[currentAIServiceId] || null;
}

/**
 * Gets the user-configured settings for the currently selected AI service.
 * @returns {object} The service settings object. Returns an empty object if no settings are found for the current service.
 */
 function getCurrentAIServiceSettings() {
     // Ensure the settings object exists for the current service ID
     if (!aiServiceSettings[currentAIServiceId]) {
         aiServiceSettings[currentAIServiceId] = {};
         // We don't necessarily need to save immediately here, as handleSettingsChange
         // will save when the user actually changes a setting.
     }
     return aiServiceSettings[currentAIServiceId];
 }


// Expose necessary functions to the global scope
window.getCurrentAIServiceConfig = getCurrentAIServiceConfig;
window.getCurrentAIServiceSettings = getCurrentAIServiceSettings;
window.availableAIServices = availableAIServices; // Expose available services for chat.js to potentially use config details
window.aiServiceSettings = aiServiceSettings; // Expose settings for api.js

// Add event listener for the test button (using event delegation on the settings panel)
if (aiSettingsSection) {
    aiSettingsSection.addEventListener('click', (event) => {
        if (event.target.id === 'test-api-btn') {
            const serviceId = event.target.dataset.serviceId;
            // Call the testAPIConnection function from the separate api.js file
            if (window.testAPIConnection) {
                window.testAPIConnection(serviceId);
            } else {
                console.error('testAPIConnection function not available in global scope.');
                showNotification('API test function not loaded.', 'danger');
            }
        }
    });
}

