// pdfHandler.js - Handles PDF file uploads and initial processing

let currentPdfDoc = null; // Store the loaded PDF document object

/**
 * Handles the PDF file upload event.
 * @param {Event} event - The file input change event.
 */
async function handlePdfUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    if (file.type !== 'application/pdf') {
        showNotification('Please upload a PDF file.', 'danger');
        return;
    }

    showPdfInfo(file.name, 'Loading...');
    setInputState(true); // Disable input while processing
    clearChat(); // Clear previous chat

    const fileReader = new FileReader();

    fileReader.onload = async function() {
        const typedarray = new Uint8Array(this.result);

        try {
            // Load the PDF document
            const pdf = await pdfjsLib.getDocument(typedarray).promise;
            currentPdfDoc = pdf;
            updatePdfStatus(`Loaded ${pdf.numPages} pages. Processing...`);

updatePdfStatus('Extracting text...');
            const pdfText = await getPdfTextContent();

            const isScanned = await isScannedPdf(pdf); // Implement scanned detection

            if (isScanned) {
                 updatePdfStatus('Scanned PDF detected. Converting to images...');
                 showNotification('Scanned PDF detected. Converting pages to images for processing.', 'info', 5000);
                 const pdfImages = await convertPdfToImages(pdf);
                 updatePdfStatus(`Converted ${pdfImages.length} pages to images. Ready to chat.`);
                 setInputState(false); // Enable input
                 showNotification('PDF loaded and converted to images successfully!', 'success');
                 // Store images globally or pass to chat module
                 window.currentPdfImages = pdfImages; // Expose images globally for chat.js
                 window.currentPdfText = null; // Clear text if using images
            } else {
                updatePdfStatus('Text extraction complete. Ready to chat.');
                setInputState(false); // Enable input
                showNotification('PDF loaded and text extracted successfully!', 'success');
                window.currentPdfText = pdfText; // Expose text globally for chat.js
                window.currentPdfImages = null; // Clear images if using text
            }


        } catch (error) {
            console.error('Error loading or processing PDF:', error);
            showNotification('Error loading or processing PDF. Please try again.', 'danger');
            hidePdfInfo();
            setInputState(true); // Keep input disabled on error
            clearChat(); // Reset chat area
        }
    };

    fileReader.readAsArrayBuffer(file);
}

// Add event listener to the hidden file input
pdfUploadInput.addEventListener('change', handlePdfUpload);

// Trigger the hidden file input when the upload button is clicked
uploadBtn.addEventListener('click', () => {
    pdfUploadInput.click();
});

/**
 * Extracts text content from the loaded PDF document.
 * @returns {Promise<string|null>} A promise that resolves with the full text content or null if no PDF is loaded.
 */
async function getPdfTextContent() {
    if (!currentPdfDoc) {
        return null;
    }

    let fullText = '';
    for (let i = 1; i <= currentPdfDoc.numPages; i++) {
        try {
            const page = await currentPdfDoc.getPage(i);
            const textContent = await page.getTextContent();
            // Join text items with a space, handle potential null/undefined items
            const pageText = textContent.items
                .filter(item => typeof item.str === 'string') // Filter out non-string items
                .map(item => item.str)
                .join(' ');
            fullText += pageText + '\n'; // Add a newline between pages
        } catch (pageError) {
            console.error(`Error extracting text from page ${i}:`, pageError);
            // Continue with other pages even if one fails
        }
    }
    return fullText;
}

/**
 * Simple heuristic to detect if a PDF is likely scanned (image-based).
 * Checks if the total extracted text length is very low relative to the number of pages.
 * @param {object} pdfDoc - The PDF document object from PDF.js.
 * @returns {Promise<boolean>} A promise that resolves to true if likely scanned, false otherwise.
 */
async function isScannedPdf(pdfDoc) {
    const totalTextLength = (await getPdfTextContent())?.length || 0;
    const minTextPerPage = 100; // Adjusted arbitrary threshold - can be tuned
    // Consider a PDF scanned if average text per page is below threshold
    return totalTextLength < pdfDoc.numPages * minTextPerPage;
}

/**
 * Converts each page of the PDF into an image data URL.
 * @param {object} pdfDoc - The PDF document object from PDF.js.
 * @returns {Promise<string[]>} A promise that resolves with an array of image data URLs (PNG format).
 */
async function convertPdfToImages(pdfDoc) {
    const images = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 2 }); // Increased scale for better image quality
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };
        await page.render(renderContext).promise;
        images.push(canvas.toDataURL('image/png')); // Get image data URL
    }
    return images; // Return array of image data URLs
}


// Expose necessary data and functions globally for chat.js
window.getPdfTextContent = getPdfTextContent; // Still useful for text-based PDFs
window.currentPdfText = null; // To store text content
window.currentPdfImages = null; // To store image data URLs