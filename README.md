# BurritoBuyer Chrome Extension

A Chrome extension that converts online product prices into terms of your most "prized items".

## Features

- **Subtle Price Conversion**: Shows price equivalents next to product prices in a non-intrusive way
- **Customizable Prized Items**: Add, remove, and switch between different prized items

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. The BurritoBuyer extension should now appear in your extensions

## Usage

1. **Add a Prized Item**: Click the extension icon and add your favorite item with its price (e.g., "Cabo Bob's Burrito" - $10.00)
2. **Visit Amazon**: Go to any Amazon product detail page (URLs containing `/dp/`)
3. **See the Magic**: You'll see subtle text next to the main price showing the equivalent in your prized items
4. **Switch Items**: Use the popup to switch between different prized items or add new ones

## Example

If you set "Burrito" as your prized item at $10.00, then a $89.99 product will show:
```
$89.99 (9 Burritos)
```

## Technical Details

- **Manifest Version**: 3 (latest Chrome extension standard)
- **Permissions**: Storage (for saving prized items), ActiveTab (for Amazon pages)
- **Target Sites**: Amazon.com, Amazon.ca, Amazon.co.uk, (more COMING SOON)
- **Storage**: Uses Chrome's sync storage to keep items across devices

## Files Structure

- `manifest.json` - Extension configuration
- `popup.html/css/js` - Settings interface
- `content.js` - Main price detection and conversion logic
- `background.js` - Service worker for storage management
- `styles.css` - Subtle styling for price conversions
- `test-amazon-page.html` - Test page for development

## Privacy

This extension:
- Only runs on Amazon product pages
- Stores prized items locally in your browser
- Does not collect or transmit any personal data
- Does not track your browsing or purchases

## Development

To test the extension:
1. Load the test page: `test-amazon-page.html`
2. Add a prized item through the extension popup
3. Refresh the test page to see the conversion in action

## Version History

- **v1.0**: Initial release with subtle price conversion for Amazon product pages

---
