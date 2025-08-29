// Background service worker for BurritoBuyer extension

// Storage keys (same as popup.js)
const STORAGE_KEYS = {
    PRIZED_ITEMS: 'prizedItems',
    ACTIVE_ITEM: 'activeItem'
};

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        console.log('BurritoBuyer extension installed');
        
        // Set up default data if needed
        const result = await chrome.storage.sync.get([STORAGE_KEYS.PRIZED_ITEMS]);
        if (!result[STORAGE_KEYS.PRIZED_ITEMS]) {
            await chrome.storage.sync.set({ 
                [STORAGE_KEYS.PRIZED_ITEMS]: [],
                [STORAGE_KEYS.ACTIVE_ITEM]: null
            });
        }
    }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getActiveItem') {
        getActiveItem().then(sendResponse);
        return true; // Will respond asynchronously
    }
    
    if (request.action === 'getPrizedItems') {
        getPrizedItems().then(sendResponse);
        return true; // Will respond asynchronously
    }
});

// Helper functions
async function getActiveItem() {
    try {
        const result = await chrome.storage.sync.get([STORAGE_KEYS.ACTIVE_ITEM]);
        return result[STORAGE_KEYS.ACTIVE_ITEM] || null;
    } catch (error) {
        console.error('Error getting active item:', error);
        return null;
    }
}

async function getPrizedItems() {
    try {
        const result = await chrome.storage.sync.get([STORAGE_KEYS.PRIZED_ITEMS]);
        return result[STORAGE_KEYS.PRIZED_ITEMS] || [];
    } catch (error) {
        console.error('Error getting prized items:', error);
        return [];
    }
}

// Listen for storage changes and notify content scripts
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && (changes[STORAGE_KEYS.ACTIVE_ITEM] || changes[STORAGE_KEYS.PRIZED_ITEMS])) {
        // Notify all content scripts about the change
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                if (tab.url && (tab.url.includes('amazon.com') || tab.url.includes('amazon.ca') || tab.url.includes('amazon.co.uk'))) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'activeItemChanged',
                        activeItem: changes[STORAGE_KEYS.ACTIVE_ITEM]?.newValue || null
                    }).catch(() => {
                        // Ignore errors for tabs that don't have content script loaded
                    });
                }
            });
        });
    }
});

// Handle tab updates to refresh price conversions
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && 
        (tab.url.includes('amazon.com') || tab.url.includes('amazon.ca') || tab.url.includes('amazon.co.uk'))) {
        
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
            chrome.tabs.sendMessage(tabId, {
                action: 'refreshPrices'
            }).catch(() => {
                // Ignore errors for tabs that don't have content script loaded
            });
        }, 1000);
    }
});
