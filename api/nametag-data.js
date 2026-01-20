// Vercel Serverless Function - Stores and retrieves name tag data
// Allows cross-computer and OBS browser source access
// Uses in-memory storage (for production, consider Vercel KV or database)

// In-memory store (persists during serverless function execution)
// Note: This resets on each deployment. For persistence, use Vercel KV or a database.
let nameTagStore = {};
let refreshTimestamps = {}; // Track refresh requests per ID
let savedTimestamps = {}; // Track when data was actually saved (not generated on GET)

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Don't cache name tag data
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { id } = req.query;
  const nameTagId = parseInt(id) || 0;
  
  // GET: Retrieve name tag data
  if (req.method === 'GET') {
    const nameTag = nameTagStore[nameTagId] || {
      name: 'Name',
      subtext: 'Subtext',
      humanLink: '',
      obsLink: '',
      obsScreenshareLink: ''
    };
    
    // Check if this is default/empty data
    const isDefault = !nameTagStore[nameTagId] || 
                     (nameTag.name === 'Name' && nameTag.subtext === 'Subtext' && 
                      !nameTag.humanLink && !nameTag.obsLink);
    
    return res.status(200).json({
      id: nameTagId,
      ...nameTag,
      timestamp: savedTimestamps[nameTagId] || 0, // Use saved timestamp, not new one
      refreshTimestamp: refreshTimestamps[nameTagId] || 0,
      isDefault: isDefault // Flag to indicate if this is default data
    });
  }
  
  // POST: Save name tag data
  if (req.method === 'POST') {
    try {
      const { name, subtext, humanLink, obsLink, obsScreenshareLink } = req.body;
      
      // Only save if we have actual data (not just defaults)
      const hasData = name && name !== 'Name' || subtext && subtext !== 'Subtext' || 
                      humanLink || obsLink || obsScreenshareLink;
      
      if (hasData) {
        nameTagStore[nameTagId] = {
          name: name || 'Name',
          subtext: subtext || 'Subtext',
          humanLink: humanLink || '',
          obsLink: obsLink || '',
          obsScreenshareLink: obsScreenshareLink || ''
        };
        
        // Save the timestamp when data is actually saved
        savedTimestamps[nameTagId] = Date.now();
      }
      
      return res.status(200).json({
        success: true,
        id: nameTagId,
        timestamp: savedTimestamps[nameTagId] || Date.now()
      });
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid request body',
        message: error.message
      });
    }
  }
  
  // PUT: Trigger refresh for name tag(s) - also re-save data if available
  if (req.method === 'PUT') {
    // If id is 'all' or not provided, refresh all name tags (0-5)
    if (req.query.id === 'all' || !req.query.id) {
      // Refresh all name tags (0-5)
      const now = Date.now();
      for (let i = 0; i < 6; i++) {
        refreshTimestamps[i] = now;
        // If we have saved data, update its timestamp to keep it fresh
        if (savedTimestamps[i]) {
          savedTimestamps[i] = now;
        }
      }
      return res.status(200).json({
        success: true,
        message: 'All name tags refreshed',
        refreshTimestamp: now
      });
    } else {
      // Refresh specific name tag
      const now = Date.now();
      refreshTimestamps[nameTagId] = now;
      // If we have saved data, update its timestamp to keep it fresh
      if (savedTimestamps[nameTagId]) {
        savedTimestamps[nameTagId] = now;
      }
      return res.status(200).json({
        success: true,
        id: nameTagId,
        refreshTimestamp: refreshTimestamps[nameTagId]
      });
    }
  }
  
  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}

