#!/usr/bin/env node
const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3456;
const CACHE_TTL = 60000; // 1 min cache

const cache = {};

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'crypto-ticker-api/1.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('Invalid JSON')); }
      });
    }).on('error', reject);
  });
}

function cached(key, ttl, fn) {
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < ttl) return Promise.resolve(entry.data);
  return fn().then(data => { cache[key] = { data, ts: Date.now() }; return data; });
}

async function getPrices(ids, vs) {
  const key = `prices:${ids}:${vs}`;
  return cached(key, CACHE_TTL, () =>
    fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs}&include_24hr_change=true&include_market_cap=true`)
  );
}

async function getTrending() {
  return cached('trending', CACHE_TTL * 5, () =>
    fetch('https://api.coingecko.com/api/v3/search/trending')
  );
}

async function getGas() {
  return cached('gas', CACHE_TTL, async () => {
    const results = {};
    const chains = [
      { name: 'ethereum', url: 'https://api.etherscan.io/api?module=gastracker&action=gasoracle' },
    ];
    for (const chain of chains) {
      try {
        const d = await fetch(chain.url);
        results[chain.name] = d.result || d;
      } catch { results[chain.name] = { error: 'unavailable' }; }
    }
    return results;
  });
}

const routes = {
  '/': () => ({
    name: 'crypto-ticker-api',
    version: '1.0.0',
    endpoints: ['/prices', '/prices?ids=bitcoin,ethereum&vs=usd', '/trending', '/gas', '/health']
  }),
  '/health': () => ({ status: 'ok', uptime: process.uptime(), cached: Object.keys(cache).length }),
  '/prices': async (params) => {
    const ids = params.get('ids') || 'bitcoin,ethereum,solana';
    const vs = params.get('vs') || 'usd';
    return getPrices(ids, vs);
  },
  '/trending': () => getTrending(),
  '/gas': () => getGas(),
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const handler = routes[url.pathname];

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!handler) {
    res.writeHead(404);
    return res.end(JSON.stringify({ error: 'Not found', endpoints: Object.keys(routes) }));
  }

  try {
    const data = await handler(url.searchParams);
    res.writeHead(200);
    res.end(JSON.stringify(data, null, 2));
  } catch (err) {
    res.writeHead(502);
    res.end(JSON.stringify({ error: 'Upstream error', message: err.message }));
  }
});

server.listen(PORT, () => console.log(`crypto-ticker-api running on http://localhost:${PORT}`));
