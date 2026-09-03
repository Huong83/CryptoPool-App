(() => {
  const COINS = {
    BTC: { id: "bitcoin", pair: "BTCUSDT", name: "Bitcoin" },
    ETH: { id: "ethereum", pair: "ETHUSDT", name: "Ethereum" },
    USDC: { id: "usd-coin", pair: "USDCUSDT", name: "USD Coin" },
    SOL: { id: "solana", pair: "SOLUSDT", name: "Solana" },
    LINK: { id: "chainlink", pair: "LINKUSDT", name: "Chainlink" },
    UNI: { id: "uniswap", pair: "UNIUSDT", name: "Uniswap" }
  };
  const state = { data: {}, source: "", updated: 0, loading: false };
  const money = n => Number.isFinite(n) ? (n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : n < 2 ? n.toFixed(4) : n.toFixed(2)) : "—";
  const pct = n => Number.isFinite(n) ? `${n >= 0 ? "+" : ""}${n.toFixed(2)}%` : "—";

  function injectStyle() {
    if (document.getElementById("market-live-style")) return;
    const s = document.createElement("style"); s.id = "market-live-style";
    s.textContent = `
      .market-live-row{cursor:pointer;transition:.18s background,.18s transform}.market-live-row:hover{background:rgba(255,255,255,.045);transform:translateY(-1px)}
      .market-live-badge{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;color:#9fe7bd}.market-live-dot{width:7px;height:7px;border-radius:50%;background:#56d68b;box-shadow:0 0 12px #56d68b}.market-live-time{font-size:11px;color:#8e9aaa}
      .market-detail-backdrop{position:fixed;inset:0;z-index:10000;background:rgba(3,7,12,.76);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:18px}
      .market-detail{width:min(760px,100%);max-height:90vh;overflow:auto;border:1px solid #293646;border-radius:22px;background:#0b1119;color:#eef3f8;box-shadow:0 30px 90px #000b;padding:22px}.market-detail-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.market-detail-title{display:flex;gap:12px;align-items:center}.market-detail-icon{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:#151f2c;font-weight:900;font-size:18px}.market-detail h2{margin:0;font-size:27px}.market-detail small{color:#8996a6}.market-close{border:1px solid #344253;background:#151e29;color:#eef2f7;border-radius:10px;width:40px;height:40px;font-size:20px;cursor:pointer}.market-detail-price{font-size:34px;font-weight:900;margin:22px 0 4px}.market-detail-change{font-weight:800}.market-chart{margin-top:20px;border:1px solid #253243;border-radius:16px;padding:12px;background:#080d14}.market-chart svg{display:block;width:100%;height:230px}.market-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}.market-metric{border:1px solid #253243;border-radius:13px;padding:12px;background:#0e1620}.market-metric span{display:block;color:#8491a1;font-size:10px;text-transform:uppercase;font-weight:800}.market-metric strong{display:block;margin-top:5px;font-size:15px}.market-detail-actions{display:flex;gap:10px;margin-top:16px}.market-detail-actions button{flex:1;border:1px solid #344253;background:#151e29;color:#eef2f7;border-radius:11px;padding:12px;font-weight:800;cursor:pointer}.market-detail-actions button:first-child{background:#eef3f8;color:#071018;border-color:#eef3f8}@media(max-width:600px){.market-grid{grid-template-columns:repeat(2,1fr)}.market-detail{padding:16px;border-radius:18px}.market-detail-price{font-size:28px}}
    `; document.head.appendChild(s);
  }

  async function getCoinGecko() {
    const ids = Object.values(COINS).map(x => x.id).join(",");
    const u = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`;
    const r = await fetch(u, { cache: "no-store" }); if (!r.ok) throw new Error("CoinGecko ${r.status}");
    const j = await r.json(); const out = {};
    for (const [symbol, c] of Object.entries(COINS)) if (j[c.id]) out[symbol] = { price: Number(j[c.id].usd), change: Number(j[c.id].usd_24h_change), updated: Number(j[c.id].last_updated_at) * 1000 };
    if (Object.keys(out).length < 4) throw new Error("market data incomplete");
    return out;
  }

  async function getBinance() {
    const out = {};
    await Promise.all(Object.entries(COINS).map(async ([symbol, c]) => {
      try { const r = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${c.pair}`, { cache: "no-store" }); if (!r.ok) return; const j = await r.json(); out[symbol] = { price: Number(j.lastPrice), change: Number(j.priceChangePercent), updated: Date.now() }; } catch {}
    }));
    if (Object.keys(out).length < 4) throw new Error("Binance data incomplete");
    return out;
  }

  async function loadMarket() {
    if (state.loading) return; state.loading = true;
    try { state.data = await getCoinGecko(); state.source = "CoinGecko"; }
    catch { try { state.data = await getBinance(); state.source = "Binance"; } catch { state.source = "Offline"; } }
    state.updated = Date.now(); state.loading = false; render();
  }

  function findMarketRows() { return [...document.querySelectorAll(".market-row:not(.header)")]; }
  function render() {
    if (!Object.keys(state.data).length) return;
    const rows = findMarketRows();
    rows.forEach(row => {
      const sym = row.querySelector(".asset-cell b")?.textContent?.trim().toUpperCase(); const d = state.data[sym]; if (!d) return;
      const cells = row.children; if (cells[1]) cells[1].textContent = `$${money(d.price)}`; if (cells[2]) { cells[2].textContent = pct(d.change); cells[2].className = d.change >= 0 ? "positive" : "negative"; }
      if (cells[3]) { cells[3].innerHTML = `<span class="market-live-badge"><i class="market-live-dot"></i> LIVE</span>`; }
      row.classList.add("market-live-row"); row.dataset.symbol = sym;
      row.onclick = () => openDetail(sym);
    });
    document.querySelectorAll(".toolbar .muted").forEach(el => { el.innerHTML = `<span class="market-live-badge"><i class="market-live-dot"></i> LIVE</span> ${state.source} · ${new Date(state.updated).toLocaleTimeString("vi-VN")}`; });
  }

  async function chart(symbol) {
    const c = COINS[symbol];
    try { const r = await fetch(`https://api.coingecko.com/api/v3/coins/${c.id}/market_chart?vs_currency=usd&days=1&interval=hourly`, { cache: "no-store" }); if (!r.ok) throw 0; const j = await r.json(); return j.prices || []; } catch { return []; }
  }

  function openDetail(symbol) {
    const d = state.data[symbol]; if (!d) return; injectStyle();
    const backdrop = document.createElement("div"); backdrop.className = "market-detail-backdrop"; backdrop.innerHTML = `<section class="market-detail" role="dialog" aria-modal="true" aria-label="Chi tiết ${symbol}"><div class="market-detail-head"><div class="market-detail-title"><div class="market-detail-icon">${symbol[0]}</div><div><h2>${COINS[symbol].name}</h2><small>${symbol}/USD · dữ liệu thị trường</small></div></div><button class="market-close" aria-label="Đóng">×</button></div><div class="market-detail-price">$${money(d.price)}</div><div class="market-detail-change ${d.change >= 0 ? "positive" : "negative"}">${pct(d.change)} · 24h</div><div class="market-chart"><div class="muted">Đang tải biểu đồ 24h…</div></div><div class="market-grid"><div class="market-metric"><span>Giá hiện tại</span><strong>$${money(d.price)}</strong></div><div class="market-metric"><span>Thay đổi 24h</span><strong>${pct(d.change)}</strong></div><div class="market-metric"><span>Thời gian cập nhật</span><strong>${new Date(state.updated).toLocaleTimeString("vi-VN")}</strong></div><div class="market-metric"><span>Nguồn</span><strong>${state.source}</strong></div></div><div class="market-detail-actions"><button class="go-trade">Mở Trade testnet</button><button class="go-close">Đóng</button></div></section>`;
    document.body.appendChild(backdrop);
    const close = () => backdrop.remove(); backdrop.querySelector(".market-close").onclick = close; backdrop.querySelector(".go-close").onclick = close; backdrop.onclick = e => { if (e.target === backdrop) close(); }; document.addEventListener("keydown", function esc(e){ if(e.key === "Escape"){close();document.removeEventListener("keydown",esc);} });
    backdrop.querySelector(".go-trade").onclick = () => { close(); document.querySelectorAll("button").forEach(b => { if (b.textContent.includes("Trade")) b.click(); }); };
    chart(symbol).then(points => {
      const box = backdrop.querySelector(".market-chart"); if (!points.length) { box.innerHTML = `<div class="muted">Biểu đồ tạm thời không khả dụng. Giá live vẫn đang được cập nhật.</div>`; return; }
      const vals = points.map(p => Number(p[1])).filter(Number.isFinite); const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1; const w=720,h=220,pad=8; const pts=vals.map((v,i)=>`${pad+(i/(vals.length-1))* (w-pad*2)},${h-pad-((v-min)/range)*(h-pad*2)}`).join(" ");
      box.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-label="Biểu đồ giá 24 giờ"><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="3" vector-effect="non-scaling-stroke"/><text x="8" y="18" fill="currentColor" opacity=".55" font-size="12">24H</text><text x="8" y="${h-8}" fill="currentColor" opacity=".55" font-size="12">$${money(min)}</text><text x="${w-90}" y="18" fill="currentColor" opacity=".55" font-size="12">$${money(max)}</text></svg>`;
    });
  }

  function boot() { injectStyle(); loadMarket(); setInterval(loadMarket, 15000); const observer = new MutationObserver(() => render()); observer.observe(document.getElementById("root") || document.body, { childList: true, subtree: true }); setTimeout(render, 800); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
