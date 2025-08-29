// Storage keys
const STORAGE_KEYS = {
    PRIZED_ITEMS: 'prizedItems',
    ACTIVE_ITEM: 'activeItem'
};

// DOM elements
let elements = {};

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    loadPrizedItems();
    setupEventListeners();
});

function initializeElements() {
    elements = {
        activeItemText: document.getElementById('activeItemText'),
        activeItem: document.getElementById('activeItem'),
        addItemForm: document.getElementById('addItemForm'),
        itemName: document.getElementById('itemName'),
        itemPrice: document.getElementById('itemPrice'),
        itemsContainer: document.getElementById('itemsContainer'),
        noItems: document.getElementById('noItems')
    };
}

function setupEventListeners() {
    // Add item form submission
    elements.addItemForm.addEventListener('submit', handleAddItem);
    
    // Add event delegation for dynamically created buttons
    elements.itemsContainer.addEventListener('click', handleButtonClick);
}

function handleButtonClick(event) {
    if (event.target.classList.contains('btn-delete')) {
        const itemId = event.target.closest('.item-row').dataset.itemId;
        deleteItem(itemId);
    } else if (event.target.classList.contains('btn-activate')) {
        const itemId = event.target.closest('.item-row').dataset.itemId;
        activateItem(itemId);
    }
}

async function handleAddItem(event) {
    event.preventDefault();
    
    const name = elements.itemName.value.trim();
    const price = parseFloat(elements.itemPrice.value);
    
    if (!name || !price || price <= 0) {
        alert('Please enter a valid item name and price.');
        return;
    }
    
    if (name.length > 20) {
        alert('Item name must be 20 characters or less to keep the display subtle.');
        return;
    }
    
    try {
        await addPrizedItem(name, price);
        elements.itemName.value = '';
        elements.itemPrice.value = '';
        await loadPrizedItems();
    } catch (error) {
        console.error('Error adding item:', error);
        alert('Error adding item. Please try again.');
    }
}

async function addPrizedItem(name, price) {
    const items = await getPrizedItems();
    
    // Check if item with same name already exists
    if (items.some(item => item.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('Item with this name already exists');
    }
    
    const newItem = {
        id: Date.now().toString(),
        name: name,
        price: price,
        createdAt: new Date().toISOString()
    };
    
    items.push(newItem);
    await chrome.storage.sync.set({ [STORAGE_KEYS.PRIZED_ITEMS]: items });
    
    // If this is the first item, make it active
    const activeItem = await getActiveItem();
    if (!activeItem) {
        await setActiveItem(newItem);
    }
}

async function getPrizedItems() {
    const result = await chrome.storage.sync.get([STORAGE_KEYS.PRIZED_ITEMS]);
    return result[STORAGE_KEYS.PRIZED_ITEMS] || [];
}

async function getActiveItem() {
    const result = await chrome.storage.sync.get([STORAGE_KEYS.ACTIVE_ITEM]);
    return result[STORAGE_KEYS.ACTIVE_ITEM] || null;
}

async function setActiveItem(item) {
    await chrome.storage.sync.set({ [STORAGE_KEYS.ACTIVE_ITEM]: item });
    updateActiveItemDisplay(item);
}

async function deletePrizedItem(itemId) {
    const items = await getPrizedItems();
    const filteredItems = items.filter(item => item.id !== itemId);
    await chrome.storage.sync.set({ [STORAGE_KEYS.PRIZED_ITEMS]: filteredItems });
    
    // If the deleted item was active, clear active item or set new one
    const activeItem = await getActiveItem();
    if (activeItem && activeItem.id === itemId) {
        const newActiveItem = filteredItems.length > 0 ? filteredItems[0] : null;
        await chrome.storage.sync.set({ [STORAGE_KEYS.ACTIVE_ITEM]: newActiveItem });
    }
    
    await loadPrizedItems();
}

async function loadPrizedItems() {
    try {
        const [items, activeItem] = await Promise.all([
            getPrizedItems(),
            getActiveItem()
        ]);
        
        updateActiveItemDisplay(activeItem);
        renderPrizedItems(items, activeItem);
    } catch (error) {
        console.error('Error loading prized items:', error);
    }
}

function updateActiveItemDisplay(activeItem) {
    if (activeItem) {
        elements.activeItemText.textContent = `${activeItem.name} ($${activeItem.price.toFixed(2)})`;
        elements.activeItem.classList.remove('no-item');
    } else {
        elements.activeItemText.textContent = 'No prized item set';
        elements.activeItem.classList.add('no-item');
    }
}

function renderPrizedItems(items, activeItem) {
    if (items.length === 0) {
        elements.noItems.style.display = 'block';
        elements.itemsContainer.innerHTML = '<p class="no-items" id="noItems">No prized items yet. Add one above!</p>';
        return;
    }
    
    elements.noItems.style.display = 'none';
    
    const itemsHTML = items.map(item => {
        const isActive = activeItem && activeItem.id === item.id;
        return `
            <div class="item-row ${isActive ? 'active' : ''}" data-item-id="${item.id}">
                <div class="item-info">
                    <div class="item-name">${escapeHtml(item.name)}</div>
                    <div class="item-price">$${item.price.toFixed(2)}</div>
                </div>
                <div class="item-actions">
                    ${!isActive ? `<button class="btn-activate">Use</button>` : '<span style="color: #28a745; font-size: 12px; font-weight: 500;">Active</span>'}
                    <button class="btn-delete">Delete</button>
                </div>
            </div>
        `;
    }).join('');
    
    elements.itemsContainer.innerHTML = itemsHTML;
}

// Local functions for button clicks (called by event delegation)
async function activateItem(itemId) {
    try {
        const items = await getPrizedItems();
        const item = items.find(i => i.id === itemId);
        if (item) {
            await setActiveItem(item);
            await loadPrizedItems();
        }
    } catch (error) {
        console.error('Error activating item:', error);
        alert('Error activating item. Please try again.');
    }
}

async function deleteItem(itemId) {
    if (confirm('Are you sure you want to delete this prized item?')) {
        try {
            await deletePrizedItem(itemId);
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Error deleting item. Please try again.');
        }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Listen for storage changes to update UI
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && (changes[STORAGE_KEYS.PRIZED_ITEMS] || changes[STORAGE_KEYS.ACTIVE_ITEM])) {
        loadPrizedItems();
    }
});
