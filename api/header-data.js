// Vercel Serverless Function - Stores and retrieves header text data
// Allows cross-computer and OBS browser source access
// Uses in-memory storage (for production, consider Vercel KV or database)

// In-memory store (persists during serverless function execution)
// Note: This resets on each deployment. For persistence, use Vercel KV or a database.
let headerStore = {
    text: 'TRUE NORTH'
};
let headerRefreshTimestamp = 0; // Track refresh requests

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // Don't cache header data
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // GET: Retrieve header data
  if (req.method === 'GET') {
    return res.status(200).json({
      text: headerStore.text || 'TRUE NORTH',
      timestamp: Date.now(),
      refreshTimestamp: headerRefreshTimestamp
    });
  }
  
  // POST: Save header data
  if (req.method === 'POST') {
    try {
      const { text } = req.body;
      
      headerStore.text = text || 'TRUE NORTH';
      
      return res.status(200).json({
        success: true,
        text: headerStore.text,
        timestamp: Date.now()
      });
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid request body',
        message: error.message
      });
    }
  }
  
  // PUT: Trigger refresh
  if (req.method === 'PUT') {
    headerRefreshTimestamp = Date.now();
    return res.status(200).json({
      success: true,
      message: 'Header refreshed',
      refreshTimestamp: headerRefreshTimestamp
    });
  }
  
  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}


