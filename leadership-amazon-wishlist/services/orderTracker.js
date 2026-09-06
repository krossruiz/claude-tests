const Request = require('../models/Request');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

/**
 * Fetch a URL and return its text content, stripping HTML to reduce token usage.
 */
async function fetchPageContent(url) {
  const fetch = (await import('node-fetch')).default;
  const cheerio = await import('cheerio');

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9'
    },
    redirect: 'follow',
    timeout: 15000
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove scripts, styles, and nav elements to reduce noise
  $('script, style, nav, footer, header, iframe, noscript').remove();

  // Extract meaningful text
  const text = $('body').text()
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 8000); // Limit to avoid overwhelming the model

  return text;
}

/**
 * Send page content to Ollama and extract order information.
 */
async function extractOrderInfo(trackingUrl) {
  const fetch = (await import('node-fetch')).default;

  let pageContent;
  try {
    pageContent = await fetchPageContent(trackingUrl);
  } catch (err) {
    console.error(`Failed to fetch tracking page: ${err.message}`);
    return null;
  }

  if (!pageContent || pageContent.length < 20) {
    console.error('Page content too short or empty');
    return null;
  }

  const prompt = `You are analyzing a web page from an order tracking URL. Extract the following information from the page content and return ONLY a valid JSON object with no additional text:

{
  "itemName": "the name of the item ordered, or null if not found",
  "price": "the price as a string like '$29.99', or null if not found",
  "orderStatus": "one of: ordered, shipped, out_for_delivery, delivered, cancelled, returned — or null if unclear",
  "deliveryEstimate": "the estimated delivery date in ISO 8601 format (YYYY-MM-DD), or null if not found",
  "carrier": "the shipping carrier name, or null if not found",
  "rawSummary": "a brief 1-2 sentence summary of the order status"
}

Page content:
${pageContent}`;

  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          num_predict: 500
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const data = await response.json();
    const text = data.response || '';

    // Extract JSON from the response (handle cases where model adds extra text)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Ollama response');
      return null;
    }

    const info = JSON.parse(jsonMatch[0]);

    // Validate and normalize the orderStatus field
    const validStatuses = ['ordered', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'];
    if (info.orderStatus && !validStatuses.includes(info.orderStatus)) {
      info.orderStatus = null;
    }

    return info;
  } catch (err) {
    console.error(`Ollama extraction error: ${err.message}`);
    return null;
  }
}

/**
 * Background job: check all items that have tracking URLs and are not yet delivered.
 */
async function checkAllOrders() {
  const activeStatuses = ['ordered', 'shipped', 'out_for_delivery'];

  try {
    const requests = await Request.find({
      'items.trackingUrl': { $ne: null },
      'items.orderStatus': { $in: activeStatuses }
    });

    for (const request of requests) {
      for (const item of request.items) {
        if (!item.trackingUrl || !activeStatuses.includes(item.orderStatus)) {
          continue;
        }

        console.log(`Checking order status for item ${item._id} (${item.trackingUrl})`);

        try {
          const info = await extractOrderInfo(item.trackingUrl);
          if (info) {
            if (info.itemName) item.extractedInfo.itemName = info.itemName;
            if (info.price) item.extractedInfo.price = info.price;
            if (info.carrier) item.extractedInfo.carrier = info.carrier;
            if (info.rawSummary) item.extractedInfo.rawSummary = info.rawSummary;
            item.extractedInfo.lastChecked = new Date();

            if (info.deliveryEstimate) {
              item.deliveryEstimate = new Date(info.deliveryEstimate);
            }
            if (info.orderStatus) {
              item.orderStatus = info.orderStatus;
            }
          }
        } catch (err) {
          console.error(`Error checking item ${item._id}:`, err.message);
        }
      }
      await request.save();
    }

    console.log(`Order check complete. Checked ${requests.length} requests.`);
  } catch (err) {
    console.error('Background order check failed:', err.message);
  }
}

/**
 * Start the background polling loop.
 */
function startOrderTracking() {
  const interval = parseInt(process.env.ORDER_CHECK_INTERVAL_MS) || 300000; // 5 minutes default
  console.log(`Order tracking started. Checking every ${interval / 1000}s`);
  setInterval(checkAllOrders, interval);
}

module.exports = { extractOrderInfo, startOrderTracking };
