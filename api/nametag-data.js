// Vercel Serverless Function - Stores and retrieves name tag data
// Allows cross-computer and OBS browser source access
// Uses in-memory storage (for production, consider Vercel KV or database)

// In-memory store (persists during serverless function execution)
// Note: This resets on each deployment. For persistence, use Vercel KV or a database.
let nameTagStore = {};
let refreshTimestamps = {}; // Track refresh requests per ID

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
    
    return res.status(200).json({
      id: nameTagId,
      ...nameTag,
      timestamp: Date.now(),
      refreshTimestamp: refreshTimestamps[nameTagId] || 0
    });
  }
  
  // POST: Save name tag data
  if (req.method === 'POST') {
    try {
      const { name, subtext, humanLink, obsLink, obsScreenshareLink } = req.body;
      
      nameTagStore[nameTagId] = {
        name: name || 'Name',
        subtext: subtext || 'Subtext',
        humanLink: humanLink || '',
        obsLink: obsLink || '',
        obsScreenshareLink: obsScreenshareLink || ''
      };
      
      return res.status(200).json({
        success: true,
        id: nameTagId,
        timestamp: Date.now()
      });
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid request body',
        message: error.message
      });
    }
  }
  
  // PUT: Trigger refresh for name tag(s)
  if (req.method === 'PUT') {
    // If id is 'all' or not provided, refresh all name tags (0-5)
    if (req.query.id === 'all' || !req.query.id) {
      // Refresh all name tags (0-5)
      const now = Date.now();
      for (let i = 0; i < 6; i++) {
        refreshTimestamps[i] = now;
      }
      return res.status(200).json({
        success: true,
        message: 'All name tags refreshed',
        refreshTimestamp: now
      });
    } else {
      // Refresh specific name tag
      refreshTimestamps[nameTagId] = Date.now();
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

