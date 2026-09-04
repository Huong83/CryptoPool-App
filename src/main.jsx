import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { createAppKit, AppKitButton, useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia } from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useBalance } from "wagmi";
import { formatEther } from "viem";
import "./style.css";

const PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID || "ff3f925ac7d1161fbe3707bc77b3d9fe";
const SEPOLIA_ID = 11155111;
const queryClient = new QueryClient();
const networks = [sepolia];
const metadata = { name: "CryptoPool PRO", description: "CryptoPool PRO — real-time crypto market dashboard and Ethereum Sepolia testnet", url: "https://huong83.github.io/CryptoPool-App/", icons: ["https://huong83.github.io/CryptoPool-App/icon.svg"] };
const adapter = new WagmiAdapter({ networks, projectId: PROJECT_ID, ssr: true });
createAppKit({ adapters: [adapter], networks, projectId: PROJECT_ID, metadata, defaultNetwork: sepolia, allWallets: "SHOW", features: { analytics: false, email: true, socials: ["google"], emailShowWallets: true }, themeMode: "dark" });

const ASSETS = [
  { symbol: "BTC", name: "Bitcoin", binance: "btcusdt", cg: "bitcoin", tone: "orange" },
  { symbol: "ETH", name: "Ethereum", binance: "ethusdt", cg: "ethereum", tone: "purple" },
  { symbol: "BNB", name: "BNB", binance: "bnbusdt", cg: "binancecoin", tone: "gold" },
  { symbol: "SOL", name: "Solana", binance: "solusdt", cg: "solana", tone: "green" },
  { symbol: "XRP", name: "XRP", binance: "xrpusdt", cg: "ripple", tone: "blue" },
  { symbol: "ADA", name: "Cardano", binance: "adausdt", cg: "cardano", tone: "cyan" },
  { symbol: "DOGE", name: "Dogecoin", binance: "dogeusdt", cg: "dogecoin", tone: "yellow" },
  { symbol: "AVAX", name: "Avalanche", binance: "avaxusdt", cg: "avalanche-2", tone: "red" },
  { symbol: "LINK", name: "Chainlink", binance: "linkusdt", cg: "chainlink", tone: "indigo" },
  { symbol: "UNI", name: "Uniswap", binance: "uniusdt", cg: "uniswap", tone: "pink" }
];
const FALLBACK = { BTC: 100000, ETH: 4000, BNB: 650, SOL: 180, XRP: 2.2, ADA: .8, DOGE: .2, AVAX: 35, LINK: 25, UNI: 10 };
const INTERVALS = [
  { label: "1p", api: "1m", limit: 120, ms: 60000 },
  { label: "15p", api: "15m", limit: 96, ms: 900000 },
  { label: "1h", api: "1h", limit: 72, ms: 3600000 },
  { label: "4h", api: "4h", limit: 72, ms: 14400000 },
  { label: "12h", api: "12h", limit: 60, ms: 43200000 },
  { label: "1d", api: "1d", limit: 60, ms: 86400000 },
  { label: "7d", api: "1d", limit: 7, ms: 604800000 }
];
const POOLS = ASSETS.map((asset, index) => ({ asset, name: `${asset.name} Pool`, risk: index < 3 ? "Core" : index < 7 ? "Balanced" : "Growth" }));

function money(v) {
  if (!Number.isFinite(Number(v))) return "—";
  const n = Number(v);
  if (n < .01) return n.toFixed(6);
  if (n < 2) return n.toFixed(4);
  if (n < 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
function shorten(v) { return v ? `${v.slice(0, 6)}…${v.slice(-4)}` : ""; }
function timeLabel(ts) { return ts ? new Date(ts).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"; }
function fallbackPoints(price) { const end = Number(price) || 1; return Array.from({ length: 30 }, (_, i) => end * (0.997 + i * .0001 + Math.sin(i * 1.3) * .002)); }

function useRealtimeMarket() {
  const [data, setData] = useState(() => Object.fromEntries(ASSETS.map(a => [a.symbol, { ...a, price: FALLBACK[a.symbol], change: 0, updatedAt: 0, source: "fallback" }])));
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);
  const socketRef = useRef(null);
  const retryRef = useRef(null);
  const apply = useCallback((symbol, price, change, source) => {
    setData(prev => ({ ...prev, [symbol]: { ...prev[symbol], price, change, updatedAt: Date.now(), source } }));
    setLastUpdate(Date.now());
  }, []);
  useEffect(() => {
    let alive = true;
    const connect = () => {
      if (!alive) return;
      try {
        const streams = ASSETS.map(a => `${a.binance}@ticker`).join("/");
        const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
        socketRef.current = ws;
        ws.onopen = () => alive && setConnected(true);
        ws.onmessage = e => { try { const x = JSON.parse(e.data)?.data; const a = ASSETS.find(v => v.binance === x?.s?.toLowerCase()); if (a) apply(a.symbol, Number(x.c), Number(x.P), "LIVE MARKET"); } catch {} };
        ws.onerror = () => { try { ws.close(); } catch {} };
        ws.onclose = () => { if (alive) { setConnected(false); retryRef.current = setTimeout(connect, 4000); } };
      } catch { setConnected(false); retryRef.current = setTimeout(connect, 4000); }
    };
    connect();
    return () => { alive = false; clearTimeout(retryRef.current); try { socketRef.current?.close(); } catch {} };
  }, [apply]);
  useEffect(() => {
    let cancelled = false;
    const fallback = async () => {
      try {
        const ids = ASSETS.map(a => a.cg).join(",");
        const r = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=24h`);
        if (!r.ok) return;
        const rows = await r.json();
        if (cancelled) return;
        rows.forEach(x => { const a = ASSETS.find(v => v.cg === x.id); if (a) apply(a.symbol, Number(x.current_price), Number(x.price_change_percentage_24h), "Market fallback"); });
      } catch {}
    };
    fallback();
    const id = setInterval(fallback, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [apply]);
  return { data, connected, lastUpdate };
}

function useChart(asset, interval) {
  const [points, setPoints] = useState(() => fallbackPoints(asset.price));
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const cfg = INTERVALS.find(v => v.label === interval) || INTERVALS[2];
    setLoading(true);
    fetch(`https://api.binance.com/api/v3/klines?symbol=${asset.binance.toUpperCase()}&interval=${cfg.api}&limit=${cfg.limit}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(rows => { if (!cancelled && Array.isArray(rows) && rows.length) setPoints(rows.map(x => Number(x[4]))); })
      .catch(() => { if (!cancelled) setPoints(fallbackPoints(asset.price)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [asset.binance, asset.price, interval]);
  return { points, loading };
}

function MiniChart({ points, large = false }) {
  const w = large ? 900 : 180, h = large ? 300 : 54, pad = large ? 12 : 3;
  const min = Math.min(...points), max = Math.max(...points), range = max - min || 1;
  const d = points.map((p, i) => `${i ? "L" : "M"}${pad + i * ((w - pad * 2) / Math.max(points.length - 1, 1))},${h - pad - ((p - min) / range) * (h - pad * 2)}`).join(" ");
  return <svg className={large ? "chart-large" : "chart-mini"} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-label="price chart"><path d={d} fill="none" stroke="currentColor" strokeWidth={large ? 2.5 : 2} vectorEffect="non-scaling-stroke" /></svg>;
}

function AssetCard({ asset, onOpen }) {
  const rising = Number(asset.change) >= 0;
  return <button className="asset-card asset-click" onClick={() => onOpen(asset)}><div className="asset-head"><div className={`asset-icon ${asset.tone}`}>{asset.symbol[0]}</div><div><strong>{asset.symbol}</strong><span>{asset.name}</span></div><span className={rising ? "change positive" : "change negative"}>{rising ? "+" : ""}{Number(asset.change || 0).toFixed(2)}%</span></div><div className="asset-price">${money(asset.price)}</div><MiniChart points={fallbackPoints(asset.price)} /><div className="asset-live"><span className={asset.source === "LIVE MARKET" ? "live-pulse" : ""}>{asset.source === "LIVE MARKET" ? "LIVE MARKET" : "MARKET"}</span><small>{timeLabel(asset.updatedAt)}</small></div></button>;
}
function Header({ title, text, action }) { return <div className="page-header"><div><div className="kicker">CRYPTOPool PRO</div><h1>{title}</h1><p>{text}</p></div>{action}</div>; }
function SectionTitle({ title, action, onClick }) { return <div className="section-title"><h2>{title}</h2>{action && <button onClick={onClick}>{action} <span>→</span></button>}</div>; }

function ChartModal({ asset, onClose }) {
  const [interval, setIntervalValue] = useState("1h");
  const { points, loading } = useChart(asset, interval);
  const current = points[points.length - 1] || asset.price, first = points[0] || current;
  const delta = first ? ((current - first) / first) * 100 : 0;
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="chart-modal" role="dialog" aria-modal="true"><div className="modal-head"><div><div className="kicker">{asset.symbol} / USDT</div><h2>{asset.name}</h2><div className="modal-price">${money(asset.price)} <span className={asset.change >= 0 ? "positive" : "negative"}>{asset.change >= 0 ? "+" : ""}{Number(asset.change || 0).toFixed(2)}% 24H</span></div></div><button className="icon-button" onClick={onClose}>×</button></div><div className="chart-tabs" role="tablist">{INTERVALS.map(v => <button key={v.label} className={interval === v.label ? "active" : ""} onClick={() => setIntervalValue(v.label)}>{v.label}</button>)}</div><div className="chart-wrap"><MiniChart points={points} large={true}/>{loading && <span className="chart-loading">Đang tải dữ liệu thật…</span>}</div><div className="chart-meta"><span>Khung {interval}</span><strong className={delta >= 0 ? "positive" : "negative"}>{delta >= 0 ? "+" : ""}{delta.toFixed(2)}%</strong><span>{asset.source === "LIVE MARKET" ? "LIVE MARKET" : "MARKET FALLBACK"}</span></div><div className="alert-panel"><strong>Cảnh báo giá</strong><span className={asset.change >= 3 ? "positive" : asset.change <= -3 ? "negative" : "muted"}>{asset.change >= 3 ? "▲ Tăng mạnh" : asset.change <= -3 ? "▼ Giảm mạnh" : "● Biến động bình thường"}</span><small>Đây là cảnh báo thị trường theo biến động 24H, không phải khuyến nghị đầu tư.</small></div></section></div>;
}

function WalletBalance({ asset }) {
  const { address } = useAppKitAccount();
  const enabled = asset.symbol === "ETH";
  const { data } = useBalance({ address, chainId: SEPOLIA_ID, query: { enabled: Boolean(address) && enabled } });
  if (!address) return <span className="muted">Chưa kết nối ví</span>;
  if (enabled) return <strong>{data ? `${Number(formatEther(data.value)).toFixed(6)} ETH` : "Đang đọc…"}</strong>;
  return <span className="muted">Token Sepolia chưa cấu hình</span>;
}

function PoolRow({ pool, selected, onSelect }) {
  const { address } = useAppKitAccount();
  return <button className={`pool-row ${selected ? "selected" : ""}`} onClick={() => onSelect(pool)}><div className={`asset-icon ${pool.asset.tone}`}>{pool.asset.symbol[0]}</div><div className="pool-row-main"><strong>{pool.name}</strong><span>{pool.asset.symbol} · {pool.risk}</span></div><div className="pool-wallet"><small>Ví kết nối</small><WalletBalance asset={pool.asset}/></div><div className="pool-apy"><small>APY on-chain</small><strong>Chưa triển khai</strong></div><span className="pool-arrow">→</span></button>;
}

function Pools() {
  const [selected, setSelected] = useState(null);
  const { address } = useAppKitAccount();
  return <div className="page"><Header title="Pools" text="10 pool theo từng tài sản. Số dư ví hiển thị từ Ethereum Sepolia; APY chỉ hiển thị khi có vault/strategy on-chain thật." action={<AppKitButton/>}/><div className="pool-summary"><div><span>Assets</span><strong>10</strong></div><div><span>Wallet</span><strong>{address ? shorten(address) : "Chưa kết nối"}</strong></div><div><span>Yield</span><strong>On-chain only</strong></div></div><div className="pool-list">{POOLS.map(p => <PoolRow key={p.asset.symbol} pool={p} selected={selected?.asset.symbol === p.asset.symbol} onSelect={setSelected}/>)}</div>{selected && <section className="pool-detail"><div><div className="kicker">POOL DETAIL</div><h2>{selected.name}</h2><p>Ví đang kết nối: {address ? shorten(address) : "chưa kết nối"}</p></div><div className="pool-detail-grid"><div><span>Tài sản ví</span><strong><WalletBalance asset={selected.asset}/></strong></div><div><span>APY thực</span><strong>Chưa có vault</strong></div><div><span>Deposit</span><button className="primary-button" disabled>Chờ smart contract</button></div></div><div className="notice"><span>◉</span><div><strong>Không hiển thị APY giả</strong><p>Để có lãi suất thực, CryptoPool phải có smart contract vault/strategy đã triển khai, có nguồn yield và địa chỉ contract xác minh. Bản giao diện này không tự tạo hoặc hứa lợi nhuận.</p></div></div></section>}</div>;
}

function Dashboard({ market, go, openAsset }) { const { address } = useAppKitAccount(); return <div className="page"><section className="hero-card-main"><div className="hero-copy"><div className="kicker"><span className="live-dot"/> LIVE MARKET</div><h1>Quản lý tài sản số<br/><em>một cách chuyên nghiệp.</em></h1><p>CryptoPool PRO theo dõi 10 tài sản với giá thị trường cập nhật trực tiếp, biểu đồ đa khung thời gian và cảnh báo biến động. Ví hoạt động trên Ethereum Sepolia testnet.</p><div className="hero-actions"><AppKitButton/><button className="ghost-button" onClick={() => go("markets")}>Xem thị trường <span>→</span></button></div><div className="trust-row"><span>✓ Non-custodial</span><span>✓ 10 assets</span><span>✓ Testnet only</span></div></div><div className="hero-visual"><div className="orb orb-a"/><div className="orb orb-b"/><div className="portfolio-float"><span>LIVE MARKET</span><strong>{market.connected ? "CONNECTED" : "CONNECTING"}</strong><small>Real-time market stream</small></div><div className="mini-bars"><i/><i/><i/><i/><i/><i/><i/><i/></div></div></section><section className="stats-row"><div><span>Market feed</span><strong><i className={`live-dot ${market.connected ? "" : "offline"}`}/> {market.connected ? "Live Market" : "Fallback"}</strong></div><div><span>Assets tracked</span><strong>10 <small>crypto assets</small></strong></div><div><span>Wallet</span><strong>{address ? shorten(address) : "Not connected"}</strong></div></section><SectionTitle title="Thị trường" action="Xem tất cả" onClick={() => go("markets")}/><div className="asset-grid">{Object.values(market.data).slice(0, 6).map(a => <AssetCard key={a.symbol} asset={a} onOpen={openAsset}/>)}</div><SectionTitle title="Pools" action="Khám phá" onClick={() => go("pools")}/><div className="pool-grid">{POOLS.slice(0, 4).map(p => <article className="pool-card" key={p.asset.symbol}><div className={`pool-icon ${p.asset.tone}`}>{p.asset.symbol[0]}</div><div className="pool-content"><div className="pool-line"><h3>{p.name}</h3><span>{p.risk}</span></div><p>Pool theo tài sản · số dư ví đọc on-chain khi kết nối.</p><div className="pool-meta"><span>{p.asset.symbol}</span><strong>ON-CHAIN</strong></div></div></article>)}</div><div className="notice"><span>◉</span><div><strong>LIVE MARKET không phải thương hiệu sàn</strong><p>CryptoPool PRO chỉ hiển thị nguồn dữ liệu thị trường; không đại diện cho Binance hay bất kỳ sàn giao dịch nào.</p></div></div></div>; }

function Markets({ market, openAsset, go }) { const [q, setQ] = useState(""); const list = Object.values(market.data).filter(a => `${a.symbol} ${a.name}`.toLowerCase().includes(q.toLowerCase())); return <div className="page"><Header title="Tài sản crypto" text={`10 tài sản · ${market.connected ? "giá đang cập nhật trực tiếp" : "nguồn dự phòng"} · cập nhật ${timeLabel(market.lastUpdate)}`} action={<button className="ghost-button" onClick={() => go("pools")}>Pools →</button>}/><div className="toolbar"><label className="search"><span>⌕</span><input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm BTC, ETH…"/></label><span className={market.connected ? "feed-ok" : "muted"}>{market.connected ? "● LIVE MARKET" : "○ FALLBACK"}</span></div><div className="asset-grid markets-grid">{list.map(a => <AssetCard key={a.symbol} asset={a} onOpen={openAsset}/>)}</div></div>; }

function Wallet() { const { address, isConnected } = useAppKitAccount(); const { chainId } = useAppKitNetwork(); const { data } = useBalance({ address, chainId: SEPOLIA_ID, query: { enabled: Boolean(address) } }); return <div className="page"><Header title="Wallet" text="Ví non-custodial trên Ethereum Sepolia." action={<AppKitButton/>}/><div className="wallet-page-card">{isConnected ? <><div className="connected-banner"><span className="big-check">✓</span><div><strong>Ví đã kết nối</strong><small>{shorten(address)}</small></div></div><div className="wallet-grid"><div><span>Network</span><strong>{Number(chainId) === SEPOLIA_ID ? "Ethereum Sepolia" : `Chain ${chainId ?? "—"}`}</strong></div><div><span>ETH balance</span><strong>{data ? `${Number(formatEther(data.value)).toFixed(6)} ETH` : "Đang đọc…"}</strong></div><div><span>Security</span><strong>Không lưu seed phrase</strong></div></div></> : <div className="empty-wallet"><div className="wallet-symbol">◈</div><h2>Kết nối ví của bạn</h2><p>CryptoPool PRO không yêu cầu seed phrase hoặc private key.</p><AppKitButton/></div>}</div></div>; }
function Portfolio({ market }) { const { address } = useAppKitAccount(); return <div className="page"><Header title="Portfolio" text="Theo dõi tài sản ví và thị trường." action={<AppKitButton/>}/><div className="portfolio-hero"><span>LIVE MARKET</span><strong>{market.connected ? "CONNECTED" : "FALLBACK"}</strong><small>{address ? `Ví ${shorten(address)} trên Sepolia` : "Kết nối ví để xem số dư on-chain"}</small></div><div className="portfolio-grid"><div><span>ETH wallet</span><strong><WalletBalance asset={ASSETS[1]}/></strong></div><div><span>Assets tracked</span><strong>10</strong></div><div><span>Pool yield</span><strong>On-chain only</strong></div></div></div>; }
function Trade() { return <div className="page"><Header title="Trade" text="Giao dịch ETH trên Ethereum Sepolia testnet." action={<AppKitButton/>}/><div className="notice"><span>◉</span><div><strong>Giao dịch testnet</strong><p>Hãy dùng tính năng Trade hiện có để tự ký giao dịch Sepolia trong ví. CryptoPool PRO không giữ private key.</p></div></div></div>; }

function App() { const [page, setPage] = useState("dashboard"); const [selected, setSelected] = useState(null); const market = useRealtimeMarket(); const go = useCallback(next => { setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); }, []); useEffect(() => { document.title = "CryptoPool PRO"; }, []); const nav = [{ id: "dashboard", icon: "⌂", label: "Dashboard" }, { id: "markets", icon: "◌", label: "Markets" }, { id: "pools", icon: "◈", label: "Pools" }, { id: "portfolio", icon: "▣", label: "Portfolio" }, { id: "trade", icon: "↗", label: "Trade" }, { id: "wallet", icon: "◎", label: "Wallet" }]; return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">C</div><div><strong>CryptoPool</strong><span>PRO · WEB3 / DEFI</span></div></div><span className="nav-label">PLATFORM</span><nav>{nav.map(n => <button key={n.id} className={page === n.id ? "active" : ""} onClick={() => go(n.id)}><span>{n.icon}</span>{n.label}</button>)}</nav><div className="sidebar-bottom"><div className="wallet-mini"><div className="wallet-mini-top"><span className={`status-dot ${market.connected ? "on" : ""}`}/>{market.connected ? "Live Market" : "Market reconnecting"}</div><strong>Ethereum Sepolia</strong><p>Testnet environment</p><span className="network-tag good">10 assets</span></div></div></aside><main><header className="topbar"><div className="mobile-brand"><div className="brand-mark">C</div><div><strong>CryptoPool PRO</strong><span>WEB3 / DEFI</span></div></div><span className="network-chip"><i/> {market.connected ? "LIVE MARKET" : "CONNECTING"}</span><AppKitButton/></header>{page === "dashboard" && <Dashboard market={market} go={go} openAsset={setSelected}/>} {page === "markets" && <Markets market={market} openAsset={setSelected} go={go}/>} {page === "pools" && <Pools/>} {page === "portfolio" && <Portfolio market={market}/>} {page === "trade" && <Trade/>} {page === "wallet" && <Wallet/>}</main>{selected && <ChartModal asset={selected} onClose={() => setSelected(null)}/>}<nav className="mobile-nav">{nav.map(n => <button key={n.id} className={page === n.id ? "active" : ""} onClick={() => go(n.id)}><span>{n.icon}</span><small>{n.label}</small></button>)}</nav></div>; }

ReactDOM.createRoot(document.getElementById("root")).render(<WagmiProvider config={adapter.wagmiConfig}><QueryClientProvider client={queryClient}><App/></QueryClientProvider></WagmiProvider>);
