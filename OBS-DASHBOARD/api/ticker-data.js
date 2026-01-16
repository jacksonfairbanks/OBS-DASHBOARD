// Vercel Serverless Function - Fetches ticker data and logos from MASSIVE API
// Proxies requests to protect API key and handle CORS

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=60'); // Cache for 1 minute
  
  const MASSIVE_API_KEY = process.env.MASSIVE_API_KEY;
  const { ticker } = req.query;
  
  if (!MASSIVE_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }
  
  if (!ticker) {
    return res.status(400).json({ error: 'Ticker symbol required' });
  }
  
  try {
    // For crypto (BTC), use CoinGecko for real-time prices
    // Also handle GLD (Gold ETF) - can use stock API or special handling
    const isCrypto = ticker === 'BTC' || ticker.startsWith('X:');
    
    if (isCrypto) {
      // Fetch crypto quote from CoinGecko (more reliable for real-time)
      const cryptoId = ticker === 'BTC' ? 'bitcoin' : ticker.toLowerCase();
      const cryptoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd&include_24hr_change=true`;
      const cryptoRes = await fetch(cryptoUrl);
      
      let cryptoData = null;
      let currentPrice = 0;
      let percentChange = 0;
      
      if (cryptoRes.ok) {
        cryptoData = await cryptoRes.json();
        const priceData = cryptoData[cryptoId];
        if (priceData) {
          currentPrice = priceData.usd || 0;
          percentChange = priceData.usd_24h_change || 0;
        }
      }
      
      // Use CoinGecko for BTC logo
      const logoUrl = ticker === 'BTC' 
        ? 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
        : null;
      
      const change = currentPrice * (percentChange / 100);
      
      return res.status(200).json({
        ticker: ticker,
        price: currentPrice,
        change: change,
        percentChange: percentChange,
        logoUrl: logoUrl,
        name: ticker === 'BTC' ? 'Bitcoin' : ticker,
        lastUpdated: new Date().toISOString()
      });
    }
    
    // For stocks and ETFs (including GLD, DXY, TLT, QQQ, SPY), fetch ticker overview (includes branding/logo)
    const overviewUrl = `https://api.massive.com/v3/reference/tickers/${ticker}?apiKey=${MASSIVE_API_KEY}`;
    const overviewRes = await fetch(overviewUrl);
    
    let overviewData = null;
    if (overviewRes.ok) {
      overviewData = await overviewRes.json();
    }
    
    // Fetch last trade for current price
    const lastTradeUrl = `https://api.massive.com/v2/last/trade/${ticker}?apiKey=${MASSIVE_API_KEY}`;
    const lastTradeRes = await fetch(lastTradeUrl);
    
    // Also fetch previous day's close for comparison
    const prevUrl = `https://api.massive.com/v2/aggs/ticker/${ticker}/prev?apiKey=${MASSIVE_API_KEY}`;
    const prevRes = await fetch(prevUrl);
    
    let currentPrice = 0;
    let prevClose = 0;
    
    // Get current price from last trade
    if (lastTradeRes.ok) {
      const lastTradeData = await lastTradeRes.json();
      currentPrice = lastTradeData?.results?.p || 0;
    }
    
    // Get previous close
    if (prevRes.ok) {
      const prevData = await prevRes.json();
      prevClose = prevData?.results?.[0]?.c || 0;
    }
    
    // Fallback to overview data if needed
    if (!currentPrice && overviewData?.results?.market?.last_quote?.last?.price) {
      currentPrice = overviewData.results.market.last_quote.last.price;
    }
    if (!prevClose && currentPrice) {
      prevClose = currentPrice; // If no prev close, use current as baseline
    }
    
    // Extract logo from branding
    const logoUrl = overviewData?.results?.branding?.logo_url || 
                   overviewData?.results?.branding?.icon_url || 
                   null;
    
    // Calculate price change
    const change = currentPrice - prevClose;
    const percentChange = prevClose ? (change / prevClose) * 100 : 0;
    
    res.status(200).json({
      ticker: ticker,
      price: currentPrice,
      change: change,
      percentChange: percentChange,
      logoUrl: logoUrl,
      name: overviewData?.results?.name || ticker,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('API Error:', error.message);
    
    // Fallback - try to get logo from alternative services
    let fallbackLogoUrl = null;
    
    // Try Logo.dev as fallback
    try {
      // For stocks, try domain-based lookup
      if (ticker.length <= 5 && !ticker.includes(':')) {
        fallbackLogoUrl = `https://logo.clearbit.com/${ticker.toLowerCase()}.com`;
      }
    } catch (e) {
      // Ignore fallback errors
    }
    
    res.status(200).json({
      ticker: ticker,
      price: 0,
      change: 0,
      percentChange: 0,
      logoUrl: fallbackLogoUrl,
      error: error.message,
      fallback: true
    });
  }
}

