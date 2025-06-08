## Chrome Extension: Grocery Ordering Helper

**Goal:** Create a Chrome extension that allows a user to paste a list of grocery item URLs and quantities into a popup, and then automates the process of navigating to each URL, setting the quantity, and clicking the "Add to Cart" button within the user's currently logged-in browser session on the target grocery website.

**Assumptions:**
*   The user will manually log into the grocery website *before* using the extension.
*   The extension operates within the active tab where the user is logged in.
*   The grocery website uses standard HTML elements for quantity input and the "Add to Cart" button.

---

### Step 1: Define the Extension Manifest (`manifest.json`)

1.  **Create the `manifest.json` file.** This is the core configuration file for the extension.
2.  **Set Manifest Version:** Specify `"manifest_version": 3`.
3.  **Basic Information:** Define `"name"`, `"version"`, and `"description"` for the extension.
4.  **Permissions:**
    *   Request the `"activeTab"` permission: Allows the extension to interact with the currently active tab when the user invokes the extension (clicks the popup).
    *   Request the `"scripting"` permission: Essential for injecting the content script (`content.js` or an injected function) into the grocery website pages.
    *   Request the `"storage"` permission (Optional): Can be used later if you want to persist the list of items or settings, but not strictly required for the basic functionality.
5.  **Host Permissions:**
    *   Define `"host_permissions"`. This is **critical**.
    *   Add a string matching the URL pattern of the target grocery website (e.g., `"*://*.grocerystore.com/*"`). **This pattern MUST be updated to match the actual website.** This grants the extension permission to inject scripts onto that specific site.
6.  **Action (Popup):**
    *   Define the `"action"` key.
    *   Set `"default_popup": "popup.html"` to specify the HTML file for the extension's popup interface.
    *   Set `"default_icon"` with paths to icons of different sizes (e.g., 16x16, 48x48, 128x128) for the browser toolbar. Create placeholder `images` directory and icon files if needed.
7.  **Icons (Optional):** Define the top-level `"icons"` key with paths to icons used on the Chrome Extensions management page.

---

### Step 2: Create the Popup User Interface (`popup.html`)

1.  **Create the `popup.html` file.** This file defines the structure of the extension's popup window.
2.  **Basic HTML Structure:** Set up standard `<html>`, `<head>`, and `<body>` tags. Include a `<title>`.
3.  **Input Area:**
    *   Add a `<textarea>` element where users will paste the list of items.
    *   Assign it a unique `id` (e.g., `id="itemListInput"`).
    *   Include a `placeholder` attribute to show the expected input format (e.g., "URL Quantity\nURL Quantity...").
    *   Provide descriptive text (e.g., using `<p>` or `<h3>`) instructing the user.
4.  **Control Button:**
    *   Add a `<button>` element to initiate the process.
    *   Assign it a unique `id` (e.g., `id="startButton"`).
    *   Set the button text (e.g., "Start Adding Items").
5.  **Status Display Area:**
    *   Add an element to display the status of each item being processed. An unordered list (`<ul>`) is suitable.
    *   Assign it a unique `id` (e.g., `id="statusList"`). This list will be populated dynamically by JavaScript.
    *   Add a heading (e.g., `<h3>Status</h3>`).
6.  **Link JavaScript:** Include a `<script src="popup.js" defer></script>` tag at the end of the `<body>` to link the popup's logic file. The `defer` attribute is good practice.
7.  **Basic Styling (Optional):** Add inline `<style>` tags or link a separate CSS file to provide basic layout and readability (e.g., set width, font, padding, basic styles for status messages). Define CSS classes for different statuses (e.g., `.status-waiting`, `.status-processing`, `.status-added`, `.status-error`).

---

### Step 3: Implement the Popup Logic (`popup.js`)

1.  **Create the `popup.js` file.** This script controls the popup's behavior.
2.  **Get DOM References:** On script load, get references to the key HTML elements using their IDs (`itemListInput`, `startButton`, `statusList`).
3.  **Add Event Listener:** Attach a `click` event listener to the `startButton`. This listener should trigger the main item processing function.
4.  **Main Processing Function (e.g., `processItems`):**
    *   Declare this function as `async` as it will involve asynchronous operations (`chrome.tabs.update`, `chrome.scripting.executeScript`, delays).
    *   **Get Input:** Read the value from the `itemListInput` textarea. Trim whitespace.
    *   **Clear Status:** Clear any previous content from the `statusList` element (`innerHTML = ''`).
    *   **Parse and Validate Input:**
        *   Split the input text into lines. Filter out empty lines.
        *   Create an empty array to hold the structured item data (e.g., `items`).
        *   Loop through each line:
            *   Trim the line.
            *   Split the line into parts based on whitespace to separate the URL and quantity. Handle potential spaces within the URL itself (assume quantity is the last part).
            *   Validate the URL (basic check for `http://` or `https://`).
            *   Validate the quantity (parse as an integer, check if it's a positive number).
            *   If validation fails for any line, display an error message in the popup (e.g., in a dedicated status div or by modifying the `statusList`) and `return` from the function.
            *   If valid, create an object `{ id: 'item-' + index, url: parsedUrl, quantity: parsedQuantity, status: 'waiting' }` and add it to the `items` array.
            *   Dynamically create an `<li>` element for this item.
            *   Set a unique `id` on the `li` (e.g., `item-0`, `item-1`) corresponding to the item's `id`.
            *   Set the `innerHTML` of the `li` to display the item URL (potentially truncated), quantity, and an initial status message (`<span class="status status-waiting">Wait for buying</span>`).
            *   Append the new `li` to the `statusList`.
    *   **Disable Start Button:** Set `startButton.disabled = true` to prevent multiple clicks while processing.
    *   **Get Active Tab:** Use `await chrome.tabs.query({ active: true, currentWindow: true })` to get information about the currently active tab. Handle potential errors if no active tab is found. Store the `tabId`.
    *   **Sequential Processing Loop:**
        *   Use a `for...of` loop to iterate through the `items` array sequentially.
        *   **Inside the loop (for each `item`):**
            *   **Update UI:** Find the corresponding `li` element in `statusList` using its `id`. Update its status span's text and class to "Processing..." (`status-processing`).
            *   **Navigate Tab:** Use `await chrome.tabs.update(tabId, { url: item.url })` to navigate the active tab to the item's URL.
            *   **Wait for Page Load:** Implement a reliable wait. **Do not rely solely on `setTimeout`**. Use `chrome.tabs.onUpdated.addListener` to listen for the `status === 'complete'` event for the correct `tabId`. Wrap this listener logic in a Promise. Remove the listener once the event fires or after a timeout. Add a small, additional fixed delay (e.g., `await sleep(1500)`) after the 'complete' status fires to allow dynamic content on the page to potentially finish loading. Create a helper `sleep(ms)` function using `setTimeout` inside a Promise.
            *   **Inject Content Script:** Use `await chrome.scripting.executeScript`.
                *   `target`: `{ tabId: tabId }`.
                *   `func`: The name of the function to execute on the page (defined in Step 4).
                *   `args`: `[item.quantity]` (pass the quantity as an argument to the injected function).
            *   **Process Results:**
                *   The `executeScript` call returns an array of results. Access the result from the main frame (usually `results[0].result`).
                *   Check the `result` object returned by the injected function (e.g., `{ success: true }` or `{ success: false, error: '...' }`).
                *   **Update UI:** Based on the `success` flag, update the item's `li` status span in `statusList` to "Added into Cart" (`status-added`) or "Error: [error message]" (`status-error`).
                *   **Error Handling:** Decide whether to stop the entire process on the first error or continue with the next item. Log errors to the console (`console.error`).
            *   **Delay:** Add a short `await sleep(1000)` between processing items to be polite to the server and avoid potential issues.
    *   **Wrap in Try/Catch/Finally:** Enclose the tab query and processing loop in a `try...catch` block to handle errors gracefully (e.g., navigation errors, script injection failures). Display overall error messages in the popup.
    *   **Finally Block:** Use a `finally` block to ensure the `startButton` is re-enabled (`startButton.disabled = false`) regardless of success or failure.
    *   **Completion Message:** If the loop completes without stopping due to errors, display an overall success message in the popup.
5.  **Helper Functions:**
    *   Create a function `updateItemStatus(itemId, message, cssClass)` to simplify updating the status `<span>` within a specific `<li>`.
    *   Create the `sleep(ms)` function.
    *   Create a robust `waitForTabLoad(tabId)` function using the `chrome.tabs.onUpdated` listener approach described above.

---

### Step 4: Implement the Content Script Logic (Injected Function)

1.  **Define the Function:** Define a function within `popup.js` that will be injected into the target page. Let's call it `addItemToCartOnPage`. This function *will not* have access to variables or functions outside its own scope *except* for the arguments passed to it via `executeScript`. It *will* have access to the target page's `document` and `window`.
2.  **Accept Arguments:** The function should accept the `quantity` as an argument.
3.  **Find Elements:**
    *   **Crucial:** Define variables containing CSS selectors for the quantity input field and the "Add to Cart" button. **These selectors are placeholders and MUST be determined by inspecting the actual grocery website using browser developer tools (Right-click -> Inspect).** Examples: `input[name="quantity"]`, `button.add-to-cart-button`, `#product-details-add-to-cart-btn`.
    *   Use `document.querySelector()` with these selectors to find the actual elements on the page.
4.  **Element Validation:**
    *   Check if the quantity input element was found. If not, `return { success: false, error: 'Quantity input not found' }`.
    *   Check if the "Add to Cart" button was found. If not, `return { success: false, error: 'Add to Cart button not found' }`.
    *   Check if the "Add to Cart" button is disabled. If yes, `return { success: false, error: 'Add to Cart button is disabled' }`.
5.  **Set Quantity:**
    *   Set the `value` property of the quantity input element to the passed-in `quantity`.
    *   **Dispatch Events:** To ensure frameworks (like React, Vue, Angular) running on the site recognize the change, dispatch `input` and `change` events on the quantity input element after setting its value:
        *   `quantityInput.dispatchEvent(new Event('input', { bubbles: true }));`
        *   `quantityInput.dispatchEvent(new Event('change', { bubbles: true }));`
6.  **Click Button:** Call the `click()` method on the "Add to Cart" button element.
7.  **Return Result:** If all steps succeeded, `return { success: true }`.
8.  **Error Handling:** Wrap the element finding and interaction logic in a `try...catch` block. In the `catch` block, log the error (`console.error`) and `return { success: false, error: error.message }`.

---

### Step 5: Manual "Purchased" Status

*   Acknowledge that the "Purchased" status mentioned in the original request is **outside the scope** of this automated "add to cart" tool.
*   This status would likely be managed manually by an admin *after* the user has reviewed the cart on the website and completed the checkout process normally. The extension's job finishes once items are added (or attempted to be added) to the cart.
