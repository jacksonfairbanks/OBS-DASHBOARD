// Dashboard JavaScript for OBS Overlay Management

let tickers = [];
let nameTags = [];

// Load from localStorage
function loadSettings() {
    const savedTickers = localStorage.getItem('obs-tickers');
    const savedHeader = localStorage.getItem('obs-header');
    const savedNameTags = localStorage.getItem('obs-nametags');
    const savedTickerSpeed = localStorage.getItem('obs-ticker-speed');
    
    if (savedTickers) {
        tickers = JSON.parse(savedTickers);
    } else {
        // Default tickers (with $ prefix - will be stripped for API calls)
        tickers = ['$ASST', '$SATA', '$MSTR', '$STRC', '$STRF', '$STRK', '$STRD', '$MTPLF', '$MARA', '$RIOT', '$COIN', 'BTC', 'GLD', '$DXY', '$TLT', '$QQQ', '$SPY'];
    }
    
    if (savedHeader) {
        document.getElementById('header-text').value = savedHeader;
    } else {
        document.getElementById('header-text').value = 'TRUE NORTH';
    }
    
    if (savedNameTags) {
        nameTags = JSON.parse(savedNameTags);
        // Ensure we have at least 6 slots and populate VDO.Ninja links if missing
        ensureVdoNinjaLinks();
    } else {
        // Initialize with default camera slots (6 cameras with VDO.Ninja links)
        nameTags = initializeNameTagsWithVdoNinja();
    }
    
    // Load ticker speed
    if (savedTickerSpeed) {
        document.getElementById('ticker-speed').value = savedTickerSpeed;
    } else {
        document.getElementById('ticker-speed').value = 50; // Default speed
    }
    
    renderTickers();
    renderNameTags();
    updateObsUrls();
    
    // Sync existing name tags to API on load
    syncNameTagsToAPI();
    
    // Sync existing header to API on load
    syncHeaderToAPI();
}

function saveTickers() {
    localStorage.setItem('obs-tickers', JSON.stringify(tickers));
    // Don't re-render on every save - only when needed
}

function renderTickers() {
    const list = document.getElementById('ticker-list');
    list.innerHTML = '';
    
    if (tickers.length === 0) {
        list.innerHTML = '<div class="empty-state">No tickers added yet. Click "Add Ticker" to get started.</div>';
        return;
    }
    
    tickers.forEach((ticker, index) => {
        const item = document.createElement('div');
        item.className = 'ticker-item';
        item.innerHTML = `
            <div class="logo-preview" id="logo-${index}">
                <span>Loading...</span>
            </div>
            <input type="text" id="ticker-input-${index}" value="${ticker}" 
                   onchange="updateTicker(${index}, this.value)"
                   placeholder="Ticker symbol (e.g., BTC, MSTR)">
            <input type="file" accept="image/*" 
                   onchange="uploadLogo(${index}, this)"
                   style="display: none;" id="logo-upload-${index}">
            <button class="btn btn-secondary" onclick="document.getElementById('logo-upload-${index}').click()">
                Upload Logo
            </button>
            <button class="btn btn-danger" onclick="removeTicker(${index})">Remove</button>
        `;
        list.appendChild(item);
        
        // Fetch logo from API
        if (ticker) {
            fetchLogo(ticker, index);
        }
    });
}

async function fetchLogo(ticker, index) {
    if (!ticker) return;
    
    const logoEl = document.getElementById(`logo-${index}`);
    if (!logoEl) return;
    
    // Strip $ prefix for logo filename
    const logoName = ticker.replace(/^\$/, '');
    
    // Priority 1: Check for local logo file in logos/ folder
    const localLogoUrl = `logos/${logoName}.png`;
    const localLogo = new Image();
    localLogo.onload = function() {
        logoEl.innerHTML = `<img src="${localLogoUrl}" alt="${ticker}">`;
    };
    localLogo.onerror = function() {
        // Priority 2: Check for custom uploaded logo in localStorage
        const customLogos = JSON.parse(localStorage.getItem('obs-custom-logos') || '{}');
        if (customLogos[ticker]) {
            logoEl.innerHTML = `<img src="${customLogos[ticker]}" alt="${ticker}">`;
        } else {
            // Priority 3: Fetch from API
            fetchLogoFromAPI(ticker, index);
        }
    };
    localLogo.src = localLogoUrl;
}

async function fetchLogoFromAPI(ticker, index) {
    try {
        // Strip $ prefix for API calls
        const apiTicker = ticker.replace(/^\$/, '');
        // API path - works from root
        const apiUrl = `api/ticker-data?ticker=${apiTicker}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        const logoEl = document.getElementById(`logo-${index}`);
        if (logoEl) {
            if (data.error) {
                logoEl.innerHTML = '<span style="color: #f44336; font-size: 11px;">API Error</span>';
            } else if (data.logoUrl) {
                logoEl.innerHTML = `<img src="${data.logoUrl}" alt="${ticker}" onerror="this.parentElement.innerHTML='<span>No logo</span>'">`;
            } else {
                logoEl.innerHTML = '<span>No logo</span>';
            }
        }
    } catch (error) {
        console.error('Error fetching logo:', error);
        const logoEl = document.getElementById(`logo-${index}`);
        if (logoEl) {
            logoEl.innerHTML = '<span style="color: #f44336; font-size: 11px;">Error</span>';
        }
    }
}

function addTicker() {
    tickers.push('');
    saveTickers();
    renderTickers();
    // Focus on the new input
    setTimeout(() => {
        const inputs = document.querySelectorAll('.ticker-item input[type="text"]');
        if (inputs.length > 0) {
            inputs[inputs.length - 1].focus();
        }
    }, 100);
}

function updateTicker(index, value) {
    const oldTicker = tickers[index];
    // Preserve $ prefix if user types it, otherwise keep as-is
    tickers[index] = value.trim();
    saveTickers();
    
    // If ticker changed, fetch new logo (only on blur/change, not every keystroke)
    if (tickers[index] && tickers[index] !== oldTicker) {
        fetchLogo(tickers[index], index);
    }
}

function removeTicker(index) {
    const ticker = tickers[index];
    tickers.splice(index, 1);
    
    // Remove custom logo if exists
    const customLogos = JSON.parse(localStorage.getItem('obs-custom-logos') || '{}');
    if (customLogos[ticker]) {
        delete customLogos[ticker];
        localStorage.setItem('obs-custom-logos', JSON.stringify(customLogos));
    }
    
    saveTickers();
    renderTickers();
}

function uploadLogo(index, input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Image file too large. Please use an image smaller than 2MB.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        // Store custom logo in localStorage (base64)
        const customLogos = JSON.parse(localStorage.getItem('obs-custom-logos') || '{}');
        customLogos[tickers[index]] = e.target.result;
        localStorage.setItem('obs-custom-logos', JSON.stringify(customLogos));
        
        // Update preview
        const logoEl = document.getElementById(`logo-${index}`);
        logoEl.innerHTML = `<img src="${e.target.result}" alt="${tickers[index]}">`;
    };
    reader.onerror = function() {
        alert('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
}

function saveHeader() {
    const text = document.getElementById('header-text').value;
    localStorage.setItem('obs-header', text);
    
    // Save to API endpoint for cross-computer and OBS auto-update support
    saveHeaderToAPI(text);
}

async function saveHeaderToAPI(text) {
    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}api/header-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text || 'TRUE NORTH'
            })
        });
        
        if (!response.ok) {
            console.warn('Failed to save header to API:', response.statusText);
        }
    } catch (error) {
        // Silently fail - API is optional, localStorage is primary
        console.warn('API save failed (this is okay):', error);
    }
}

function saveTickerSpeed() {
    const speed = parseInt(document.getElementById('ticker-speed').value) || 50;
    localStorage.setItem('obs-ticker-speed', speed.toString());
    
    // Trigger storage event so ticker component can update
    window.dispatchEvent(new StorageEvent('storage', {
        key: 'obs-ticker-speed',
        newValue: speed.toString()
    }));
    
    // Also update if ticker is in same window (for testing)
    if (window.tickerUpdateSpeed) {
        window.tickerUpdateSpeed();
    }
}

function applyTickerSpeed() {
    const btn = document.getElementById('apply-speed-btn');
    const originalText = btn.textContent;
    
    // Save the speed
    saveTickerSpeed();
    
    // Update the ticker URL with new speed and cache-busting timestamp
    const speed = parseInt(document.getElementById('ticker-speed').value) || 50;
    const baseUrl = getBaseUrl();
    const timestamp = Date.now();
    document.getElementById('ticker-url').textContent = baseUrl + `components/ticker.html?speed=${speed}&t=${timestamp}`;
    
    // Show visual feedback
    btn.textContent = '✓ Applied!';
    btn.style.background = '#4CAF50';
    
    // Force update by dispatching a custom event that ticker.js listens to
    window.dispatchEvent(new CustomEvent('ticker-speed-update', {
        detail: { speed: speed }
    }));
    
    // Reset button after 2 seconds
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 2000);
}

function initializeNameTagsWithVdoNinja() {
    const nameTags = [];
    const camKeys = ['cam1', 'cam2', 'cam3', 'cam4', 'cam5', 'cam6'];
    
    camKeys.forEach((camKey, index) => {
        const vdoConfig = typeof VDO_NINJA_ROOMS !== 'undefined' ? VDO_NINJA_ROOMS[camKey] : null;
        nameTags.push({
            name: '',
            subtext: vdoConfig ? vdoConfig.label : '',
            humanLink: vdoConfig ? vdoConfig.humanLink : '',
            obsLink: vdoConfig ? vdoConfig.obsLink : '',
            obsScreenshareLink: vdoConfig && vdoConfig.obsScreenshareLink ? vdoConfig.obsScreenshareLink : ''
        });
    });
    
    return nameTags;
}

function ensureVdoNinjaLinks() {
    // Ensure we have 6 slots
    while (nameTags.length < 6) {
        nameTags.push({ name: '', subtext: '', humanLink: '', obsLink: '', obsScreenshareLink: '' });
    }
    
    // Populate missing VDO.Ninja links from config
    if (typeof VDO_NINJA_ROOMS !== 'undefined') {
        const camKeys = ['cam1', 'cam2', 'cam3', 'cam4', 'cam5', 'cam6'];
        camKeys.forEach((camKey, index) => {
            if (index < nameTags.length) {
                const vdoConfig = VDO_NINJA_ROOMS[camKey];
                if (vdoConfig) {
                    // Only populate if empty (don't overwrite existing)
                    if (!nameTags[index].humanLink) {
                        nameTags[index].humanLink = vdoConfig.humanLink;
                    }
                    if (!nameTags[index].obsLink) {
                        nameTags[index].obsLink = vdoConfig.obsLink;
                    }
                    if (vdoConfig.obsScreenshareLink && !nameTags[index].obsScreenshareLink) {
                        nameTags[index].obsScreenshareLink = vdoConfig.obsScreenshareLink;
                    }
                    if (!nameTags[index].subtext && vdoConfig.label) {
                        nameTags[index].subtext = vdoConfig.label;
                    }
                }
            }
        });
    }
}

function renderNameTags() {
    const list = document.getElementById('nametag-list');
    list.innerHTML = '';
    
    nameTags.forEach((tag, index) => {
        const item = document.createElement('div');
        item.className = 'section nametag-item';
        const isHost = index === 0; // Cam 1 is Host
        const screenshareHtml = isHost ? `
            <label style="display: block; margin-bottom: 5px; color: #ccc; font-size: 14px;">OBS Screenshare Link (Host only):</label>
            <input type="text" id="nametag-screenshare-${index}" value="${tag.obsScreenshareLink || ''}" 
                   placeholder="https://vdo.ninja/?view=CAM_A:s&solo&room=TrueNorth1"
                   style="width: 100%; padding: 10px; margin-bottom: 15px; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 4px; font-size: 14px; font-family: monospace;">
        ` : '';
        
        item.innerHTML = `
            <h3>Cam ${index + 1}${isHost ? ' (Host)' : ''}</h3>
            <label style="display: block; margin-bottom: 5px; color: #ccc; font-size: 14px;">Name:</label>
            <input type="text" id="nametag-name-${index}" value="${tag.name || ''}" 
                   placeholder="Name (e.g., John Doe)" 
                   style="width: 100%; padding: 10px; margin-bottom: 15px; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 4px; font-size: 14px;">
            <label style="display: block; margin-bottom: 5px; color: #ccc; font-size: 14px;">Subtext:</label>
            <input type="text" id="nametag-subtext-${index}" value="${tag.subtext || ''}" 
                   placeholder="Subtext (e.g., Host, CEO, etc.)"
                   style="width: 100%; padding: 10px; margin-bottom: 15px; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 4px; font-size: 14px;">
            <label style="display: block; margin-bottom: 5px; color: #ccc; font-size: 14px;">Human Link (VDO.Ninja - for person to join):</label>
            <input type="text" id="nametag-human-${index}" value="${tag.humanLink || ''}" 
                   placeholder="https://..."
                   style="width: 100%; padding: 10px; margin-bottom: 15px; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 4px; font-size: 14px; font-family: monospace;">
            <label style="display: block; margin-bottom: 5px; color: #ccc; font-size: 14px;">VDO.Ninja OBS Link (for video feed):</label>
            <input type="text" id="nametag-obs-${index}" value="${tag.obsLink || ''}" 
                   placeholder="https://vdo.ninja/?view=..."
                   style="width: 100%; padding: 10px; margin-bottom: 15px; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 4px; font-size: 14px; font-family: monospace;">
            ${screenshareHtml}
            <div style="display: flex; gap: 10px; margin-top: 10px;">
                <button class="btn" onclick="saveNameTag(${index})" style="flex: 1;">Save Cam ${index + 1}</button>
                <button class="btn" onclick="refreshNameTagInOBS(${index})" id="refresh-nametag-btn-${index}" style="flex: 0 0 auto; padding: 10px 15px; background: #2196F3;">
                    🔄 Refresh
                </button>
            </div>
            <div class="obs-link" style="margin-top: 20px; padding: 15px; background: #1a1a1a; border-radius: 6px; border: 2px solid #4CAF50;">
                <div class="obs-link-label" style="color: #4CAF50; font-weight: bold; margin-bottom: 10px; font-size: 16px;">📺 Name Tag Component - OBS Browser Source URL:</div>
                <div class="obs-link-url" id="nametag-component-url-${index}" onclick="copyToClipboard(this)" style="font-size: 14px; word-break: break-all; cursor: pointer; padding: 10px; background: #2a2a2a; border-radius: 4px;">${getBaseUrl()}components/nametag.html?id=${index}&name=${encodeURIComponent(tag.name || 'Name')}&subtext=${encodeURIComponent(tag.subtext || 'Subtext')}&t=${Date.now()}</div>
                <div style="margin-top: 8px; font-size: 12px; color: #999;">Click to copy - Use this URL in OBS Browser Source for the name tag overlay. URL updates automatically when you save.</div>
            </div>
            <div class="obs-link" style="margin-top: 15px; padding: 12px; background: #1a1a1a; border-radius: 6px; border: 2px solid #2196F3;">
                <div class="obs-link-label" style="color: #2196F3; font-weight: bold; margin-bottom: 8px; font-size: 14px;">🔄 Auto-Update URL (Set Once, Never Change):</div>
                <div class="obs-link-url" id="nametag-auto-url-${index}" onclick="copyToClipboard(this)" style="font-size: 13px; word-break: break-all; cursor: pointer; padding: 8px; background: #2a2a2a; border-radius: 4px;">${getBaseUrl()}components/nametag-auto.html?id=${index}</div>
                <div style="margin-top: 6px; font-size: 11px; color: #999;">Set this URL once in OBS (unique per camera via id). Click "🔄 Refresh" button above to update this specific name tag. Works across computers!</div>
            </div>
            <div class="obs-link" style="margin-top: 15px;">
                <div class="obs-link-label">VDO.Ninja OBS URL (for video feed):</div>
                <div class="obs-link-url" id="nametag-vdo-url-${index}" onclick="copyToClipboard(this)">${tag.obsLink || 'Not set'}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function addNameTag() {
    const index = nameTags.length;
    const camKey = `cam${index + 1}`;
    const vdoConfig = typeof VDO_NINJA_ROOMS !== 'undefined' && VDO_NINJA_ROOMS[camKey] ? VDO_NINJA_ROOMS[camKey] : null;
    
    nameTags.push({
        name: '',
        subtext: vdoConfig ? vdoConfig.label : '',
        humanLink: vdoConfig ? vdoConfig.humanLink : '',
        obsLink: vdoConfig ? vdoConfig.obsLink : '',
        obsScreenshareLink: vdoConfig && vdoConfig.obsScreenshareLink ? vdoConfig.obsScreenshareLink : ''
    });
    saveNameTags();
    renderNameTags();
}

function saveNameTag(index) {
    const name = document.getElementById(`nametag-name-${index}`).value;
    const subtext = document.getElementById(`nametag-subtext-${index}`).value;
    const humanLink = document.getElementById(`nametag-human-${index}`).value;
    const obsLink = document.getElementById(`nametag-obs-${index}`).value;
    const screenshareLinkEl = document.getElementById(`nametag-screenshare-${index}`);
    const obsScreenshareLink = screenshareLinkEl ? screenshareLinkEl.value : '';
    
    nameTags[index] = {
        name: name,
        subtext: subtext,
        humanLink: humanLink,
        obsLink: obsLink,
        obsScreenshareLink: obsScreenshareLink
    };
    
    saveNameTags();
    
    // Save to API endpoint for cross-computer and OBS auto-update support
    saveNameTagToAPI(index, name, subtext, humanLink, obsLink, obsScreenshareLink);
    
    // Set timestamp to trigger updates in OBS browser sources
    localStorage.setItem('obs-nametags-timestamp', Date.now().toString());
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('nametag-update', { detail: { index } }));
    
    // Trigger storage event (for cross-window updates)
    window.dispatchEvent(new StorageEvent('storage', {
        key: 'obs-nametags',
        newValue: JSON.stringify(nameTags)
    }));
    
    // Update the displayed URLs with cache-busting timestamp and data in URL
    const componentUrlEl = document.getElementById(`nametag-component-url-${index}`);
    if (componentUrlEl) {
        // Add name and subtext directly in URL for OBS compatibility
        const timestamp = Date.now();
        const encodedName = encodeURIComponent(name || 'Name');
        const encodedSubtext = encodeURIComponent(subtext || 'Subtext');
        componentUrlEl.textContent = getBaseUrl() + `components/nametag.html?id=${index}&name=${encodedName}&subtext=${encodedSubtext}&t=${timestamp}`;
    }
    const vdoUrlEl = document.getElementById(`nametag-vdo-url-${index}`);
    if (vdoUrlEl) {
        vdoUrlEl.textContent = obsLink || 'Not set';
    }
    
    // Show confirmation
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '✓ Saved!';
    btn.style.background = '#4CAF50';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
    }, 2000);
}

function saveNameTags() {
    localStorage.setItem('obs-nametags', JSON.stringify(nameTags));
}

async function saveNameTagToAPI(index, name, subtext, humanLink, obsLink, obsScreenshareLink) {
    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}api/nametag-data?id=${index}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                subtext: subtext,
                humanLink: humanLink,
                obsLink: obsLink,
                obsScreenshareLink: obsScreenshareLink
            })
        });
        
        if (!response.ok) {
            console.warn('Failed to save name tag to API:', response.statusText);
        }
    } catch (error) {
        // Silently fail - API is optional, localStorage is primary
        console.warn('API save failed (this is okay):', error);
    }
}

async function syncNameTagsToAPI() {
    // Sync all existing name tags to API on page load
    nameTags.forEach((tag, index) => {
        saveNameTagToAPI(
            index,
            tag.name || 'Name',
            tag.subtext || 'Subtext',
            tag.humanLink || '',
            tag.obsLink || '',
            tag.obsScreenshareLink || ''
        );
    });
}

async function refreshNameTagInOBS(id) {
    try {
        const baseUrl = getBaseUrl();
        
        // Refresh specific name tag
        const response = await fetch(`${baseUrl}api/nametag-data?id=${id}`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            const btn = document.getElementById(`refresh-nametag-btn-${id}`);
            const originalText = btn.textContent;
            btn.textContent = '✓ Refreshed!';
            btn.style.background = '#4CAF50';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        } else {
            throw new Error('API request failed');
        }
    } catch (error) {
        console.warn('Failed to refresh name tag:', error);
        const btn = document.getElementById(`refresh-nametag-btn-${id}`);
        const originalText = btn.textContent;
        btn.textContent = '✗ Failed';
        btn.style.background = '#f44336';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }
}

async function refreshAllNameTagsInOBS() {
    try {
        const baseUrl = getBaseUrl();
        
        // Refresh all name tags
        const nameTagsResponse = await fetch(`${baseUrl}api/nametag-data?id=all`, {
            method: 'PUT'
        });
        
        // Also refresh header
        const headerResponse = await fetch(`${baseUrl}api/header-data`, {
            method: 'PUT'
        });
        
        if (nameTagsResponse.ok && headerResponse.ok) {
            const btn = document.getElementById('refresh-all-btn');
            const originalText = btn.textContent;
            btn.textContent = '✓ All Refreshed!';
            btn.style.background = '#4CAF50';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        } else {
            throw new Error('API request failed');
        }
    } catch (error) {
        console.warn('Failed to refresh:', error);
        const btn = document.getElementById('refresh-all-btn');
        const originalText = btn.textContent;
        btn.textContent = '✗ Failed - Check Connection';
        btn.style.background = '#f44336';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }
}

async function refreshHeaderInOBS() {
    try {
        const baseUrl = getBaseUrl();
        const response = await fetch(`${baseUrl}api/header-data`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            const btn = document.getElementById('refresh-header-btn');
            const originalText = btn.textContent;
            btn.textContent = '✓ Refreshed!';
            btn.style.background = '#4CAF50';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '';
            }, 2000);
        } else {
            throw new Error('API request failed');
        }
    } catch (error) {
        console.warn('Failed to refresh header:', error);
        const btn = document.getElementById('refresh-header-btn');
        const originalText = btn.textContent;
        btn.textContent = '✗ Failed - Check Connection';
        btn.style.background = '#f44336';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }
}

async function syncHeaderToAPI() {
    // Sync existing header to API on page load
    const savedHeader = localStorage.getItem('obs-header');
    if (savedHeader) {
        saveHeaderToAPI(savedHeader);
    } else {
        saveHeaderToAPI('TRUE NORTH');
    }
}

function getBaseUrl() {
    // Get the current URL
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    
    // If we're at the root or index.html, use the origin directly
    if (pathname === '/' || pathname === '/index.html' || pathname.endsWith('/index.html')) {
        return origin + '/';
    }
    
    // If pathname ends with a slash, use it as-is
    if (pathname.endsWith('/')) {
        return origin + pathname;
    }
    
    // Otherwise, remove the filename and keep the directory with trailing slash
    const basePath = pathname.replace(/\/[^\/]*$/, '/');
    return origin + basePath;
}

function updateObsUrls() {
    const baseUrl = getBaseUrl();
    const tickerSpeed = parseInt(document.getElementById('ticker-speed').value) || 50;
    document.getElementById('ticker-url').textContent = baseUrl + `components/ticker.html?speed=${tickerSpeed}`;
    document.getElementById('header-url').textContent = baseUrl + 'components/header.html';
    
    // Update header auto-update URL
    const headerAutoUrlEl = document.getElementById('header-auto-url');
    if (headerAutoUrlEl) {
        headerAutoUrlEl.textContent = baseUrl + 'components/header-auto.html';
    }
    
    // Update name tag component URLs with cache-busting and data in URL
    nameTags.forEach((tag, index) => {
        const urlEl = document.getElementById(`nametag-component-url-${index}`);
        if (urlEl) {
            const timestamp = Date.now();
            const encodedName = encodeURIComponent(tag.name || 'Name');
            const encodedSubtext = encodeURIComponent(tag.subtext || 'Subtext');
            urlEl.textContent = baseUrl + `components/nametag.html?id=${index}&name=${encodedName}&subtext=${encodedSubtext}&t=${timestamp}`;
        }
    });
}

function resetToDefaults() {
    if (confirm('Reset all tickers to defaults? This will clear your current list and custom logos.')) {
        localStorage.removeItem('obs-tickers');
        localStorage.removeItem('obs-custom-logos');
        tickers = ['$ASST', '$SATA', '$MSTR', '$STRC', '$STRF', '$STRK', '$STRD', '$MTPLF', '$MARA', '$RIOT', '$COIN', 'BTC', 'GLD', '$DXY', '$TLT', '$QQQ', '$SPY'];
        saveTickers();
        // Reset speed to default
        document.getElementById('ticker-speed').value = 50;
        saveTickerSpeed();
        renderTickers();
    }
}

function copyToClipboard(element) {
    const text = element.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const original = element.textContent;
        element.textContent = '✓ Copied!';
        element.style.color = '#4CAF50';
        setTimeout(() => {
            element.textContent = original;
            element.style.color = '#4CAF50';
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            element.textContent = '✓ Copied!';
            setTimeout(() => {
                element.textContent = text;
            }, 2000);
        } catch (err) {
            alert('Failed to copy. Please select and copy manually.');
        }
        document.body.removeChild(textArea);
    });
}

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab + '-tab').classList.add('active');
    });
});

// Initialize
loadSettings();

