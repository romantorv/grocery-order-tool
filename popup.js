// Popup Logic for Grocery Ordering Helper Extension

// Get DOM references when the script loads
const itemListInput = document.getElementById('itemListInput');
const startButton = document.getElementById('startButton');
const statusList = document.getElementById('statusList');

// Add event listener to the start button
startButton.addEventListener('click', processItems);

// Helper function to create a delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to wait for tab to complete loading
function waitForTabLoad(tabId) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            reject(new Error('Page load timeout'));
        }, 30000); // 30 second timeout

        const listener = (updatedTabId, changeInfo, tab) => {
            if (updatedTabId === tabId && changeInfo.status === 'complete') {
                clearTimeout(timeout);
                chrome.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        };

        chrome.tabs.onUpdated.addListener(listener);
    });
}

// Helper function to update item status in the UI
function updateItemStatus(itemId, message, cssClass) {
    const listItem = document.getElementById(itemId);
    if (listItem) {
        const statusSpan = listItem.querySelector('.status');
        if (statusSpan) {
            statusSpan.textContent = message;
            statusSpan.className = `status ${cssClass}`;
        }
        // Also update the li's border color
        listItem.className = cssClass;
    }
}

// Helper function to display error messages
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    statusList.parentNode.insertBefore(errorDiv, statusList);

    // Remove error message after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Helper function to display success messages
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    statusList.parentNode.appendChild(successDiv);
}

// Main function to process all items
async function processItems() {
    try {
        // Get input and clear any previous status
        const inputText = itemListInput.value.trim();
        statusList.innerHTML = '';

        // Clear any previous error/success messages
        const existingMessages = document.querySelectorAll('.error-message, .success-message');
        existingMessages.forEach(msg => msg.remove());

        if (!inputText) {
            showErrorMessage('Please enter some grocery items to process.');
            return;
        }

        // Parse and validate input
        const lines = inputText.split('\n').filter(line => line.trim() !== '');
        const items = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const parts = line.split(/\s+/);

            if (parts.length < 2) {
                showErrorMessage(`Line ${i + 1}: Invalid format. Expected "URL quantity"`);
                return;
            }

            // URL is all parts except the last one (quantity)
            const url = parts.slice(0, -1).join(' ');
            const quantityStr = parts[parts.length - 1];

            // Validate URL
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                showErrorMessage(`Line ${i + 1}: Invalid URL format. Must start with http:// or https://`);
                return;
            }

            // Validate quantity
            const quantity = parseInt(quantityStr, 10);
            if (isNaN(quantity) || quantity <= 0) {
                showErrorMessage(`Line ${i + 1}: Invalid quantity. Must be a positive number.`);
                return;
            }

            // Create item object
            const item = {
                id: `item-${i}`,
                url: url,
                quantity: quantity,
                status: 'waiting'
            };
            items.push(item);

            // Create UI element for this item
            const listItem = document.createElement('li');
            listItem.id = item.id;
            listItem.className = 'status-waiting';

            const truncatedUrl = url.length > 50 ? url.substring(0, 47) + '...' : url;
            listItem.innerHTML = `
                <span class="item-url">${truncatedUrl}</span>
                <span class="item-quantity">Quantity: ${quantity}</span>
                <span class="status status-waiting">Waiting to process</span>
            `;

            statusList.appendChild(listItem);
        }

        // Disable start button during processing
        startButton.disabled = true;

        // Get active tab
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tabs || tabs.length === 0) {
            showErrorMessage('No active tab found. Please open a grocery website first.');
            return;
        }

        const tabId = tabs[0].id;

        // Process items sequentially
        let successCount = 0;
        let errorCount = 0;

        for (const item of items) {
            try {
                // Update UI to show processing
                updateItemStatus(item.id, 'Processing...', 'status-processing');

                // Navigate to the item URL
                await chrome.tabs.update(tabId, { url: item.url });

                // Wait for page to load
                await waitForTabLoad(tabId);

                // Additional delay for dynamic content to load
                await sleep(1500);

                // Inject content script to add item to cart
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: addItemToCartOnPageWithHelpers,
                    args: [item.quantity]
                });

                // Process results
                const result = results[0]?.result;
                if (result && result.success) {
                    updateItemStatus(item.id, 'Added to cart ✓', 'status-added');
                    successCount++;
                } else {
                    const errorMsg = result?.error || 'Unknown error occurred';
                    updateItemStatus(item.id, `Error: ${errorMsg}`, 'status-error');
                    errorCount++;
                    console.error(`Failed to add item ${item.url}:`, errorMsg);
                }

                // Delay between items
                await sleep(5000);

            } catch (error) {
                updateItemStatus(item.id, `Error: ${error.message}`, 'status-error');
                errorCount++;
                console.error(`Error processing item ${item.url}:`, error);
            }
        }

        // Show completion message
        if (errorCount === 0) {
            showSuccessMessage(`✅ All ${successCount} items successfully added to cart!`);
        } else {
            showSuccessMessage(`✅ ${successCount} items added, ${errorCount} failed. Check the status above for details.`);
        }

    } catch (error) {
        console.error('Error in processItems:', error);
        showErrorMessage(`Unexpected error: ${error.message}`);
    } finally {
        // Re-enable the start button
        startButton.disabled = false;
    }
}

// Note: updateItemQuantity() and addItemToCart() functions are now embedded
// within addItemToCartOnPageWithHelpers() for content script injection

// Content script function that gets injected into the grocery website page
// This function will run in the context of the target website
async function addItemToCartOnPageWithHelpers(quantity) {
    // Helper function to update item quantity (included in injection)
    function updateItemQuantity(quantity) {
        const functionContainer = document.querySelector('h1').parentElement;
        const quantitySelectors = [
            'input[type="number"]',
        ];

        let quantityInput = null;
        for (const selector of quantitySelectors) {
            quantityInput = functionContainer.querySelector(selector);
            if (quantityInput) break;
        }

        if (!quantityInput) {
            return { success: false, error: 'Quantity input field not found. Please customize selectors for this website.' };
        }
        // Set quantity
        quantityInput.value = quantity;

        // Dispatch events to ensure frameworks recognize the change
        quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        quantityInput.dispatchEvent(new Event('change', { bubbles: true }));

        return { success: true };
    }

    // Helper function to add item to cart (included in injection)
    function addItemToCart() {
        const functionContainer = document.querySelector('h1').parentElement;
        // Find add to cart button
        let addToCartButton = null;
        const addToCartSelectors = [
            'button:contains("Chọn ")',
        ];

        for (const selector of addToCartSelectors) {
            // Handle :contains() pseudo-selector manually
            if (selector.includes(':contains(')) {
                const text = selector.match(/contains\("([^"]+)"\)/)[1];
                const buttons = functionContainer.querySelectorAll('button');
                for (const button of buttons) {
                    if (button.textContent.toLowerCase().includes(text.toLowerCase())) {
                        addToCartButton = button;
                        break;
                    }
                }
            } else {
                addToCartButton = functionContainer.querySelector(selector);
            }
            if (addToCartButton) break;
        }

        if (!addToCartButton) {
            return { success: false, error: 'Add to Cart button not found. Please customize selectors for this website.' };
        }

        // Check if button is disabled
        if (addToCartButton.disabled) {
            return { success: false, error: 'Add to Cart button is disabled' };
        }

        addToCartButton.dispatchEvent(new Event('click', { bubbles: true }));
        return { success: true };
    }

    // Main function logic
    try {
        const quantityResult = updateItemQuantity(quantity);
        if (!quantityResult.success) {
            return quantityResult;
        }

        // Small delay to allow any UI updates before clicking add to cart
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Click the add to cart button
        const cartResult = addItemToCart();
        return cartResult;

    } catch (error) {
        console.error('Error in addItemToCartOnPageWithHelpers:', error);
        return { success: false, pending: false, error: error.message };
    }
}