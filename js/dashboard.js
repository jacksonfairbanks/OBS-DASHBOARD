// Dashboard JavaScript for OBS Overlay Management

let tickers = [];
let nameTags = [];

// Load from localStorage
function loadSettings() {
    const savedTickers = localStorage.getItem('obs-tickers');
    const savedHeader = localStorage.getItem('obs-header');
    const savedNameTags = localStorage.getItem('obs-nametags');
    
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
    } else {
        // Initialize with default camera slots
        nameTags = [
            { name: '', subtext: '', humanLink: '', obsLink: '' },
            { name: '', subtext: '', humanLink: '', obsLink: '' }
        ];
    }
    
    renderTickers();
    renderNameTags();
    updateObsUrls();
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
}

function renderNameTags() {
    const list = document.getElementById('nametag-list');
    list.innerHTML = '';
    
    nameTags.forEach((tag, index) => {
        const item = document.createElement('div');
        item.className = 'section nametag-item';
        item.innerHTML = `
            <h3>Cam ${index + 1}</h3>
            <label style="display: block; margin-bottom: 5px; color: #ccc; font-size: 14px;">Name:</label>
            <input type="text" id="nametag-name-${index}" value="${tag.name || ''}" 
                   placeholder="Name (e.g., John Doe)" 
                   style="width: 100%; padding: 10px; margin-bottom: 15px; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 4px; font-size: 14px;">
            <label style="display: block; margin-bottom: 5px; color: #ccc; font-size: 14px;">Subtext:</label>
            <input type="text" id="nametag-subtext-${index}" value="${tag.subtext || ''}" 
                   placeholder="Subtext (e.g., Host, CEO, etc.)"
                   style="width: 100%; padding: 10px; margin-bottom: 15px; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 4px; font-size: 14px;">
            <label style="display: block; margin-bottom: 5px; color: #ccc; font-size: 14px;">Human Link (for person to join):</label>
            <input type="text" id="nametag-human-${index}" value="${tag.humanLink || ''}" 
                   placeholder="https://..."
                   style="width: 100%; padding: 10px; margin-bottom: 15px; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 4px; font-size: 14px; font-family: monospace;">
            <label style="display: block; margin-bottom: 5px; color: #ccc; font-size: 14px;">OBS Browser Source Link:</label>
            <input type="text" id="nametag-obs-${index}" value="${tag.obsLink || ''}" 
                   placeholder="components/nametag.html?id=${index}"
                   style="width: 100%; padding: 10px; margin-bottom: 15px; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 4px; font-size: 14px; font-family: monospace;">
            <button class="btn" onclick="saveNameTag(${index})" style="width: 100%;">Save Cam ${index + 1}</button>
            <div class="obs-link" style="margin-top: 15px;">
                <div class="obs-link-label">Current OBS Browser Source URL:</div>
                <div class="obs-link-url" id="nametag-url-${index}" onclick="copyToClipboard(this)">${tag.obsLink || `components/nametag.html?id=${index}`}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function addNameTag() {
    nameTags.push({ name: '', subtext: '', humanLink: '', obsLink: '' });
    saveNameTags();
    renderNameTags();
}

function saveNameTag(index) {
    const name = document.getElementById(`nametag-name-${index}`).value;
    const subtext = document.getElementById(`nametag-subtext-${index}`).value;
    const humanLink = document.getElementById(`nametag-human-${index}`).value;
    const obsLink = document.getElementById(`nametag-obs-${index}`).value;
    
    nameTags[index] = {
        name: name,
        subtext: subtext,
        humanLink: humanLink,
        obsLink: obsLink
    };
    
    saveNameTags();
    
    // Update the displayed URL
    const urlEl = document.getElementById(`nametag-url-${index}`);
    if (urlEl) {
        urlEl.textContent = obsLink || `components/nametag.html?id=${index}`;
    }
    
    // Show confirmation
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = '✓ Saved!';
    btn.style.background = '#4CAF50';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '#4CAF50';
    }, 2000);
}

function saveNameTags() {
    localStorage.setItem('obs-nametags', JSON.stringify(nameTags));
}

function updateObsUrls() {
    const baseUrl = window.location.origin + window.location.pathname.replace('dashboard.html', '');
    document.getElementById('ticker-url').textContent = baseUrl + 'components/ticker.html';
    document.getElementById('header-url').textContent = baseUrl + 'components/header.html';
}

function resetToDefaults() {
    if (confirm('Reset all tickers to defaults? This will clear your current list and custom logos.')) {
        localStorage.removeItem('obs-tickers');
        localStorage.removeItem('obs-custom-logos');
        tickers = ['$ASST', '$SATA', '$MSTR', '$STRC', '$STRF', '$STRK', '$STRD', '$MTPLF', '$MARA', '$RIOT', '$COIN', 'BTC', 'GLD', '$DXY', '$TLT', '$QQQ', '$SPY'];
        saveTickers();
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

