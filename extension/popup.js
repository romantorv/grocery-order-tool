// Popup Logic for Grocery Ordering Helper Extension

// Get DOM references when the script loads
const apiUrlInput = document.getElementById('apiUrlInput');
const fetchButton = document.getElementById('fetchButton');
const pendingItems = document.getElementById('pendingItems');
const startButton = document.getElementById('startButton');
const statusList = document.getElementById('statusList');

// Store fetched items
let currentItems = [];

// Add event listeners
fetchButton.addEventListener('click', fetchPendingItems);
startButton.addEventListener('click', processItems);

// Load saved API URL
chrome.storage.sync.get(['apiUrl'], (result) => {
    if (result.apiUrl) {
        apiUrlInput.value = result.apiUrl;
    }
});

// Save API URL when changed
apiUrlInput.addEventListener('change', () => {
    chrome.storage.sync.set({ apiUrl: apiUrlInput.value });
});

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

// Function to fetch pending items from API
async function fetchPendingItems() {
    try {
        // Clear any previous error/success messages
        const existingMessages = document.querySelectorAll('.error-message, .success-message');
        existingMessages.forEach(msg => msg.remove());

        fetchButton.disabled = true;
        fetchButton.textContent = 'Fetching...';

        const apiUrl = apiUrlInput.value.trim();
        if (!apiUrl) {
            showErrorMessage('Please enter API URL');
            return;
        }

        // Fetch pending items from extension endpoint
        const response = await fetch(`${apiUrl}/api/extension/pending-items`);

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to fetch pending items');
        }

        currentItems = data.items || [];

        // Display the items
        displayPendingItems(currentItems);

        // Enable/disable start button based on items
        startButton.disabled = currentItems.length === 0;

        if (currentItems.length === 0) {
            showSuccessMessage('No pending items found');
        } else {
            showSuccessMessage(`Found ${currentItems.length} pending items`);
        }

    } catch (error) {
        console.error('Error fetching pending items:', error);
        showErrorMessage(`Error fetching items: ${error.message}`);
        currentItems = [];
        startButton.disabled = true;
    } finally {
        fetchButton.disabled = false;
        fetchButton.textContent = 'Fetch Items';
    }
}

// Function to display pending items in the UI
function displayPendingItems(items) {
    if (items.length === 0) {
        pendingItems.innerHTML = '<div class="empty-state">No pending items found</div>';
        return;
    }

    const itemsHtml = items.map(item => {
        const truncatedUrl = item.productUrl.length > 50 ?
            item.productUrl.substring(0, 47) + '...' :
            item.productUrl;

        return `
            <div class="pending-item">
                <span class="pending-item-url">${truncatedUrl}</span>
                <div class="pending-item-details">
                    Quantity: ${item.quantity} | User: ${item.userName}
                    ${item.notes ? ` | Notes: ${item.notes}` : ''}
                </div>
            </div>
        `;
    }).join('');

    pendingItems.innerHTML = itemsHtml;
}

// Main function to process all items
async function processItems() {
    try {
        // Clear any previous status
        statusList.innerHTML = '';

        // Clear any previous error/success messages
        const existingMessages = document.querySelectorAll('.error-message, .success-message');
        existingMessages.forEach(msg => msg.remove());

        if (currentItems.length === 0) {
            showErrorMessage('No items to process. Please fetch items first.');
            return;
        }

        // Create status items for each item
        currentItems.forEach((item, index) => {
            const listItem = document.createElement('li');
            listItem.id = `item-${item._id}`;
            listItem.className = 'status-waiting';

            const truncatedUrl = item.productUrl.length > 50 ?
                item.productUrl.substring(0, 47) + '...' :
                item.productUrl;

            listItem.innerHTML = `
                <span class="item-url">${truncatedUrl}</span>
                <span class="item-quantity">Quantity: ${item.quantity} | User: ${item.userName}</span>
                <span class="status status-waiting">Waiting to process</span>
            `;

            statusList.appendChild(listItem);
        });

        // Disable buttons during processing
        startButton.disabled = true;
        fetchButton.disabled = true;

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
        const processedItemIds = [];

        for (const item of currentItems) {
            try {
                // Update UI to show processing
                updateItemStatus(`item-${item._id}`, 'Processing...', 'status-processing');

                // Navigate to the item URL
                await chrome.tabs.update(tabId, { url: item.productUrl });

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
                    updateItemStatus(`item-${item._id}`, 'Added to cart ✓', 'status-added');
                    successCount++;
                    processedItemIds.push(item._id);
                } else {
                    const errorMsg = result?.error || 'Unknown error occurred';
                    updateItemStatus(`item-${item._id}`, `Error: ${errorMsg}`, 'status-error');
                    errorCount++;
                    console.error(`Failed to add item ${item.productUrl}:`, errorMsg);
                    // Continue processing other items even if this one failed
                }

                // Delay between items
                await sleep(3000);

            } catch (error) {
                updateItemStatus(`item-${item._id}`, `Error: ${error.message}`, 'status-error');
                errorCount++;
                console.error(`Error processing item ${item.productUrl}:`, error);
                // Continue processing other items even if this one failed
            }
        }

        // Mark successfully processed items as ordered in the backend
        if (processedItemIds.length > 0) {
            try {
                const apiUrl = apiUrlInput.value.trim();
                const markOrderedResponse = await fetch(`${apiUrl}/api/extension/mark-ordered`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ itemIds: processedItemIds })
                });

                if (!markOrderedResponse.ok) {
                    console.error('Failed to mark items as ordered in backend');
                }
            } catch (error) {
                console.error('Error marking items as ordered:', error);
            }
        }

        // Show completion message
        if (errorCount === 0) {
            showSuccessMessage(`✅ All ${successCount} items successfully added to cart!`);
        } else {
            showSuccessMessage(`✅ ${successCount} items added, ${errorCount} failed. Check the status above for details.`);
        }

        // Refresh the pending items list
        await fetchPendingItems();

    } catch (error) {
        console.error('Error in processItems:', error);
        showErrorMessage(`Unexpected error: ${error.message}`);
    } finally {
        // Re-enable the buttons
        startButton.disabled = currentItems.length === 0;
        fetchButton.disabled = false;
    }
}

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
        return { success: false, error: error.message };
    }
}