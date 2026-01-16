const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

const CACHE_TIME = 30 * 60 * 1000;
let cache = null;
let lastFetch = 0;

const indices = [
  { name: "KOSPI", symbol: "^KS11" },
  { name: "KOSDAQ", symbol: "^KQ11" },
  { name: "NASDAQ", symbol: "^IXIC" },
  { name: "Dow Jones", symbol: "^DJI" }
];

async function fetchIndex(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
  const { data } = await axios.get(url);
  const meta = data.chart.result[0].meta;

  const price = meta.regularMarketPrice;
  const prev = meta.previousClose;
  const rate = ((price - prev) / prev) * 100;

  return {
    price: Number(price.toFixed(2)),
    rate: Number(rate.toFixed(2))
  };
}

async function updateCache() {
  const result = {};
  for (const idx of indices) {
    result[idx.name] = await fetchIndex(idx.symbol);
  }
  cache = {
    updatedAt: new Date().toISOString(),
    data: result
  };
  lastFetch = Date.now();
}

app.get("/api/indices", async (req, res) => {
  try {
    if (!cache || Date.now() - lastFetch > CACHE_TIME) {
      await updateCache();
    }
    res.json(cache);
  } catch (e) {
    res.status(500).json({ error: "data fetch failed" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
