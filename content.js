// Content script for BurritoBuyer extension
// Simple approach: find price, add conversion text, done.

let activeItem = null;

// Simple price extraction pattern
const PRICE_PATTERN = /\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/;

// Initialize the extension
function init() {    
    // Only run on Amazon product detail pages (/dp/)
    if (!window.location.pathname.includes('/dp/')) {
        return;
    }
    
    // Get active item from storage
    chrome.runtime.sendMessage({ action: 'getActiveItem' }, (response) => {
        if (response) {
            activeItem = response;
            addConversion();
        }
    });
}

// Listen for active item changes
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'activeItemChanged') {
        activeItem = request.activeItem;
        removeExistingConversion();
        if (activeItem) {
            addConversion();
        }
    }
});

// Simple function to add conversion
function addConversion() {
    if (!activeItem) return;
    
    // Find the main price element - try multiple selectors for reliability
    const selectors = [
        '#corePriceDisplay_desktop_feature_div .a-price',
        '.a-price.a-text-price.a-size-medium.apexPriceToPay',
        '.a-price-current',
        '#priceblock_dealprice',
        '#priceblock_ourprice'
    ];
    
    let priceElement = null;
    for (const selector of selectors) {
        priceElement = document.querySelector(selector);
        if (priceElement) break;
    }
    
    if (!priceElement) return;
    
    // Extract price
    const priceText = priceElement.textContent.trim();
    const match = priceText.match(PRICE_PATTERN);
    if (!match) return;
    
    const price = parseFloat(match[1].replace(/,/g, ''));
    if (isNaN(price) || price <= 0) return;
    
    // Calculate conversion
    const quantity = Math.round((price / activeItem.price) * 10) / 10;
    const displayText = quantity === 1 
        ? `1 ${activeItem.name.toLowerCase()}`
        : `${quantity} ${activeItem.name.toLowerCase()}s`;
    
    // Create conversion element
    const conversionEl = document.createElement('div');
    conversionEl.className = 'burrito-buyer-conversion';
    conversionEl.textContent = displayText;
    
    // Insert after price element
    priceElement.parentNode.insertBefore(conversionEl, priceElement.nextSibling);
}

// Remove existing conversion
function removeExistingConversion() {
    const existing = document.querySelector('.burrito-buyer-conversion');
    if (existing) {
        existing.remove();
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
