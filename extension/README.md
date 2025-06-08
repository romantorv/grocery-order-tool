# Grocery Ordering Helper Extension - API Integration

This Chrome extension integrates with the Grocery Ordering Web Application to automatically process pending grocery orders by adding them to cart on grocery websites.

## Features

- **API Integration**: Fetches pending orders directly from the MongoDB database through the web application API
- **Sequential Processing**: Processes items one by one to avoid overwhelming the grocery website
- **Error Handling**: Continues processing even if individual items fail, with detailed error reporting
- **Status Tracking**: Real-time status updates for each item being processed
- **Automatic Backend Updates**: Marks successfully processed items as "ordered" in the database

## Setup

1. **Install the Extension**:
   - Load the extension in Chrome's developer mode
   - Point to the `/extension` folder

2. **Configure API URL**:
   - Open the extension popup
   - Set the API Base URL (default: `http://localhost:3000`)
   - The extension will remember this setting

3. **Start Your Web Application**:
   - Make sure your Next.js grocery ordering app is running
   - Ensure the database is connected and has pending items

## Usage

1. **Open Grocery Website**: Navigate to the target grocery website (e.g., kingfoodmart.com)

2. **Fetch Pending Items**:
   - Click the extension icon to open the popup
   - Click "Fetch Items" to load pending orders from the database
   - Review the list of items to be processed

3. **Start Processing**:
   - Click "Start Processing Items"
   - The extension will:
     - Navigate to each product URL
     - Set the correct quantity
     - Add the item to cart
     - Mark successful items as "ordered" in the backend
     - Display real-time status for each item

4. **Monitor Progress**:
   - Watch the status updates for each item
   - Failed items will show error messages but processing continues
   - Successfully processed items are automatically marked as ordered

## Error Handling

- If an item fails to process, the extension logs the error and continues with remaining items
- Common errors include:
  - Product page not loading
  - Quantity field not found
  - Add to cart button not found or disabled
  - Network errors

## API Integration

The extension uses these API endpoints:

- `GET /api/admin/pending-items` - Fetch pending orders
- `POST /api/admin/mark-ordered` - Mark items as ordered after successful processing

## Browser Compatibility

- **Chrome**: Fully supported (Manifest V3)
- **Edge**: Should work with minor adjustments
- **Firefox**: Requires conversion to Manifest V2

## Technical Details

### Content Script Injection
The extension injects scripts into grocery website pages to:
- Find quantity input fields
- Update quantities
- Click add-to-cart buttons

### Selectors (Customizable)
Current selectors are configured for specific grocery websites. You can modify these in `popup.js`:

```javascript
// Quantity selectors
const quantitySelectors = [
    'input[type="number"]',
];

// Add to cart button selectors
const addToCartSelectors = [
    'button:contains("Chọn ")',
];
```

### Processing Flow
1. Fetch pending items from API
2. Display items in extension popup
3. For each item sequentially:
   - Navigate to product URL
   - Wait for page load
   - Inject content script
   - Update quantity and add to cart
   - Handle success/error responses
4. Mark successful items as ordered in backend
5. Refresh pending items list

## Debugging

- Check browser console for detailed error logs
- Verify API endpoints are accessible
- Ensure proper permissions in manifest.json
- Test with individual items first

## Development

To modify the extension:

1. Edit `popup.html` for UI changes
2. Edit `popup.js` for logic changes
3. Edit `manifest.json` for permissions/configuration
4. Reload the extension in Chrome developer mode

The extension saves API URL settings using Chrome's storage API for persistence across sessions.