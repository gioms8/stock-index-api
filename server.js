const express = require("express");
const axios = require("axios");

const app = express();

/* =========================
   CORS 완전 허용 (아임웹 대응)
========================= */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

/* =========================
   Yahoo Finance 데이터 수집
========================= */
async function fetchYahoo(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

  const response = await axios.get(url, {
    timeout: 8000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      "Accept": "application/json",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });

  const meta = response.data.chart.result[0].meta;

  const price = meta.regularMarketPrice;
  const prev = meta.previousClose;
  const rate = (((price - prev) / prev) * 100).toFixed(2);

  return {
    price: Number(price.toFixed(2)),
    rate: Number(rate)
  };
}

/* =========================
   API 엔드포인트
========================= */
app.get("/api/indices", async (req, res) => {
  try {
    const data = {
      KOSPI: await fetchYahoo("^KS11"),
      KOSDAQ: await fetchYahoo("^KQ11"),
      NASDAQ: await fetchYahoo("^IXIC"),
      "Dow Jones": await fetchYahoo("^DJI")
    };

    res.json({
      updatedAt: new Date().toISOString(),
      data
    });
  } catch (error) {
    console.error("DATA FETCH ERROR:", error.message);
    res.status(500).json({ error: "data fetch failed" });
  }
});

/* =========================
   서버 실행
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
