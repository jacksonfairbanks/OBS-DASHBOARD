// Ticker Component JavaScript
// Fetches ticker data and displays scrolling ticker tape

let tickers = [];
let customLogos = {};
let updateInterval = null;
let isInitialLoad = true;
let currentAnimationDuration = 30;
let tickerSpeed = 50; // pixels per second

// Get speed from URL parameter (works in OBS isolated contexts)
const urlParams = new URLSearchParams(window.location.search);
const urlSpeed = urlParams.get('speed');

function loadTickers() {
    // Priority 1: Check URL parameter for speed (works in OBS)
    if (urlSpeed !== null) {
        tickerSpeed = parseInt(urlSpeed) || 50;
    }
    
    // Try to load from parent window's localStorage (if in iframe)
    try {
        if (window.parent !== window && window.parent.localStorage) {
            const saved = window.parent.localStorage.getItem('obs-tickers');
            const savedLogos = window.parent.localStorage.getItem('obs-custom-logos');
            if (saved) tickers = JSON.parse(saved);
            if (savedLogos) customLogos = JSON.parse(savedLogos);
            // Only use localStorage speed if URL doesn't have it
            if (urlSpeed === null) {
                const savedSpeed = window.parent.localStorage.getItem('obs-ticker-speed');
                if (savedSpeed) tickerSpeed = parseInt(savedSpeed) || 50;
            }
        }
    } catch (e) {
        console.log('Cannot access parent localStorage, using own');
    }
    
    // Fallback to own localStorage
    if (tickers.length === 0) {
        const saved = localStorage.getItem('obs-tickers');
        const savedLogos = localStorage.getItem('obs-custom-logos');
        if (saved) {
            tickers = JSON.parse(saved);
        } else {
            // Default tickers (with $ prefix - will be stripped for API calls)
            tickers = ['$ASST', '$SATA', '$MSTR', '$STRC', '$STRF', '$STRK', '$STRD', '$MTPLF', '$MARA', '$RIOT', '$COIN', 'BTC', 'GLD', '$DXY', '$TLT', '$QQQ', '$SPY'];
        }
        if (savedLogos) {
            customLogos = JSON.parse(savedLogos);
        }
        // Only use localStorage speed if URL doesn't have it
        if (urlSpeed === null) {
            const savedSpeed = localStorage.getItem('obs-ticker-speed');
            if (savedSpeed) {
                tickerSpeed = parseInt(savedSpeed) || 50;
            }
        }
    }
    
    updateTicker();
    
    // Update every minute
    if (updateInterval) clearInterval(updateInterval);
    updateInterval = setInterval(updateTicker, 60000);
    
    // Also listen for storage changes (if dashboard updates)
    window.addEventListener('storage', (e) => {
        if (e.key === 'obs-ticker-speed') {
            tickerSpeed = parseInt(e.newValue) || 50;
            updateTickerSpeed();
        } else {
            loadTickers();
        }
    });
    
    // Listen for custom speed update event (from Apply Speed button)
    window.addEventListener('ticker-speed-update', (e) => {
        tickerSpeed = e.detail.speed || 50;
        updateTickerSpeed();
    });
    
    // Also poll localStorage periodically for speed changes (for cross-window updates)
    setInterval(() => {
        try {
            let savedSpeed;
            if (window.parent !== window && window.parent.localStorage) {
                savedSpeed = window.parent.localStorage.getItem('obs-ticker-speed');
            } else {
                savedSpeed = localStorage.getItem('obs-ticker-speed');
            }
            if (savedSpeed) {
                const newSpeed = parseInt(savedSpeed) || 50;
                if (newSpeed !== tickerSpeed) {
                    tickerSpeed = newSpeed;
                    updateTickerSpeed();
                }
            }
        } catch (e) {
            // Ignore cross-origin errors
        }
    }, 500); // Check every 500ms for speed changes
    
    // Expose function for same-window updates
    window.tickerUpdateSpeed = updateTickerSpeed;
}

async function updateTicker() {
    const track = document.getElementById('ticker-track');
    if (!track) return;
    
    const items = [];
    
    // Filter out empty tickers
    const validTickers = tickers.filter(t => t && t.trim());
    
    if (validTickers.length === 0) {
        track.innerHTML = '<div class="ticker-item"><span class="ticker-symbol">No tickers configured</span></div>';
        return;
    }
    
    // Fetch data for all tickers in parallel
    const promises = validTickers.map(ticker => fetchTickerData(ticker));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
            const data = result.value;
            items.push(createTickerItem(data));
        } else {
            // Show ticker even if fetch failed
            const ticker = validTickers[index];
            items.push(createTickerItem({
                ticker: ticker,
                price: 0,
                change: 0,
                percentChange: 0,
                logoUrl: customLogos[ticker] || null
            }));
        }
    });
    
    if (items.length === 0) {
        track.innerHTML = '<div class="ticker-item"><span class="ticker-symbol">Error loading tickers</span></div>';
        return;
    }
    
    // Duplicate for seamless scroll (3 copies for perfect looping)
    const html = items.join('') + items.join('') + items.join('');
    track.innerHTML = html;
    
    // Only reset animation on initial load
    if (isInitialLoad) {
        // Calculate scroll duration based on content width
        // Use requestAnimationFrame for accurate measurements
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                updateTickerSpeed();
                isInitialLoad = false;
            });
        });
    } else {
        // On updates, preserve animation - just update content
        // The animation will continue seamlessly since we have 3 copies
        // But update speed if it changed
        updateTickerSpeed();
    }
}

function updateTickerSpeed() {
    const track = document.getElementById('ticker-track');
    if (!track) return;
    
    // Reload speed from localStorage in case it changed
    try {
        if (window.parent !== window && window.parent.localStorage) {
            const savedSpeed = window.parent.localStorage.getItem('obs-ticker-speed');
            if (savedSpeed) tickerSpeed = parseInt(savedSpeed) || 50;
        } else {
            const savedSpeed = localStorage.getItem('obs-ticker-speed');
            if (savedSpeed) tickerSpeed = parseInt(savedSpeed) || 50;
        }
    } catch (e) {
        // Use current tickerSpeed value
    }
    
    // Calculate scroll duration based on content width and speed
    requestAnimationFrame(() => {
        const singleSetWidth = track.scrollWidth / 3; // Divide by 3 since we have 3 copies
        const duration = Math.max(10, singleSetWidth / tickerSpeed); // Minimum 10s, adjust based on speed
        currentAnimationDuration = duration;
        
        track.style.animation = `scroll ${duration}s linear infinite`;
    });
}

async function fetchTickerData(ticker) {
    try {
        // Strip $ prefix for API calls
        const apiTicker = ticker.replace(/^\$/, '');
        const response = await fetch(`../api/ticker-data?ticker=${apiTicker}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        
        // Restore original ticker with $ prefix for display
        data.ticker = ticker;
        
        // Store API logo as fallback
        const apiLogoUrl = data.logoUrl;
        
        // Priority 1: Check for custom uploaded logo in localStorage
        if (customLogos[ticker]) {
            data.logoUrl = customLogos[ticker];
            data.apiLogoUrl = apiLogoUrl; // Store for fallback
        } else {
            // Priority 2: Check for local logo file (will fallback to API logo if not found)
            const logoName = ticker.replace(/^\$/, '');
            const localLogoUrl = `../logos/${logoName}.png`;
            data.logoUrl = localLogoUrl;
            data.apiLogoUrl = apiLogoUrl; // Store for fallback
        }
        
        return data;
    } catch (error) {
        console.error(`Error fetching ${ticker}:`, error);
        return null;
    }
}

function createTickerItem(data) {
    const ticker = data.ticker;
    
    // Format price
    let price;
    if (ticker === 'BTC' || ticker.startsWith('X:')) {
        price = data.price.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    } else {
        price = data.price.toFixed(2);
    }
    
    // Format change
    const change = data.change.toFixed(2);
    const percent = Math.abs(data.percentChange).toFixed(2);
    const isUp = data.change >= 0;
    const sign = isUp ? '+' : '';
    
    // Logo HTML - try local/custom first, fallback to API logo if not found
    const logoHtml = data.logoUrl 
        ? `<img src="${data.logoUrl}" alt="${ticker}" class="ticker-logo" onerror="if(this.dataset.fallback && !this.dataset.triedFallback){this.src=this.dataset.fallback;this.dataset.triedFallback='true'}else{this.style.display='none'}" ${data.apiLogoUrl ? `data-fallback="${data.apiLogoUrl}"` : ''}>`
        : '';
    
    return `
        <div class="ticker-item">
            ${logoHtml}
            <span class="ticker-symbol">${ticker}</span>
            <span class="ticker-price">${price}</span>
            <span class="ticker-change ${isUp ? 'price-up' : 'price-down'}">
                ${sign}${change} (${sign}${percent}%)
            </span>
        </div>
    `;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTickers);
} else {
    loadTickers();
}

