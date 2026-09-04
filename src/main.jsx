import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { createAppKit, AppKitButton, useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia } from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useBalance, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, isAddress, parseEther } from "viem";
import "./style.css";

const PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID || "ff3f925ac7d1161fbe3707bc77b3d9fe";
const SEPOLIA_ID = 11155111;
const BASE = "/CryptoPool-App/";
const queryClient = new QueryClient();
const networks = [sepolia];
const metadata = { name: "CryptoPool PRO", description: "CryptoPool PRO — real-time crypto market and Ethereum Sepolia testnet dashboard", url: "https://huong83.github.io/CryptoPool-App/", icons: ["https://huong83.github.io/CryptoPool-App/icon.svg"] };
const adapter = new WagmiAdapter({ networks, projectId: PROJECT_ID, ssr: true });
createAppKit({ adapters: [adapter], networks, projectId: PROJECT_ID, metadata, defaultNetwork: sepolia, allWallets: "SHOW", features: { analytics: false, email: true, socials: ["google"], emailShowWallets: true }, themeMode: "dark" });

const ASSETS = [
  { symbol: "BTC", name: "Bitcoin", binance: "btcusdt", tone: "orange", cg: "bitcoin" },
  { symbol: "ETH", name: "Ethereum", binance: "ethusdt", tone: "purple", cg: "ethereum" },
  { symbol: "BNB", name: "BNB", binance: "bnbusdt", tone: "gold", cg: "binancecoin" },
  { symbol: "SOL", name: "Solana", binance: "solusdt", tone: "green", cg: "solana" },
  { symbol: "XRP", name: "XRP", binance: "xrpusdt", tone: "blue", cg: "ripple" },
  { symbol: "ADA", name: "Cardano", binance: "adausdt", tone: "cyan", cg: "cardano" },
  { symbol: "DOGE", name: "Dogecoin", binance: "dogeusdt", tone: "yellow", cg: "dogecoin" },
  { symbol: "AVAX", name: "Avalanche", binance: "avaxusdt", tone: "red", cg: "avalanche-2" },
  { symbol: "LINK", name: "Chainlink", binance: "linkusdt", tone: "indigo", cg: "chainlink" },
  { symbol: "UNI", name: "Uniswap", binance: "uniusdt", tone: "pink", cg: "uniswap" }
];
const FALLBACK = { BTC: 100000, ETH: 4000, BNB: 650, SOL: 180, XRP: 2.2, ADA: .8, DOGE: .2, AVAX: 35, LINK: 25, UNI: 10 };
const FALLBACK_CHANGE = { BTC: 0, ETH: 0, BNB: 0, SOL: 0, XRP: 0, ADA: 0, DOGE: 0, AVAX: 0, LINK: 0, UNI: 0 };
const POOLS = [
  { name: "Core BTC", tag: "Conservative", assets: "BTC", note: "Capital preservation demo" },
  { name: "ETH Growth", tag: "Balanced", assets: "ETH", note: "Ethereum ecosystem demo" },
  { name: "Multi Asset", tag: "Balanced", assets: "BTC · ETH · SOL", note: "Diversified demo basket" },
  { name: "Stable Reserve", tag: "Low volatility", assets: "USDC", note: "Stablecoin demo allocation" }
];

function money(v) {
  if (!Number.isFinite(v)) return "—";
  if (v < 0.01) return v.toFixed(6);
  if (v < 2) return v.toFixed(4);
  if (v < 1000) return v.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return v.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
function shorten(v) { return v ? `${v.slice(0, 6)}…${v.slice(-4)}` : ""; }
function timeLabel(ts) { return ts ? new Date(ts).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"; }
function seededPoints(price, change) {
  const end = Number(price) || 1;
  const drift = Number(change) || 0;
  return Array.from({ length: 28 }, (_, i) => end * (1 - drift / 100 * (1 - i / 27)) * (1 + Math.sin(i * 1.7) * 0.003 + Math.cos(i * .63) * 0.002));
}

function useRealtimeMarket() {
  const [data, setData] = useState(() => Object.fromEntries(ASSETS.map(a => [a.symbol, { ...a, price: FALLBACK[a.symbol], change: FALLBACK_CHANGE[a.symbol], previous: FALLBACK[a.symbol], updatedAt: 0, source: "fallback" }])));
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);
  const socketRef = useRef(null);
  const retryRef = useRef(null);

  const apply = useCallback((symbol, price, change, source = "Binance WebSocket") => {
    setData(prev => ({ ...prev, [symbol]: { ...prev[symbol], price, previous: prev[symbol]?.price ?? price, change: Number.isFinite(change) ? change : prev[symbol]?.change ?? 0, updatedAt: Date.now(), source } }));
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
        ws.onmessage = event => {
          try {
            const x = JSON.parse(event.data)?.data;
            const asset = ASSETS.find(a => a.binance === x?.s?.toLowerCase());
            if (!asset) return;
            apply(asset.symbol, Number(x.c), Number(x.P), "Binance WebSocket");
          } catch {}
        };
        ws.onerror = () => { try { ws.close(); } catch {} };
        ws.onclose = () => { if (alive) { setConnected(false); retryRef.current = setTimeout(connect, 4000); } };
      } catch { setConnected(false); retryRef.current = setTimeout(connect, 4000); }
    };
    connect();
    return () => { alive = false; clearTimeout(retryRef.current); try { socketRef.current?.close(); } catch {} };
  }, [apply]);

  useEffect(() => {
    let cancelled = false;
    const loadFallback = async () => {
      try {
        const ids = ASSETS.map(a => a.cg).join(",");
        const r = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=24h`, { headers: { accept: "application/json" } });
        if (!r.ok) return;
        const rows = await r.json();
        if (cancelled) return;
        rows.forEach(x => {
          const a = ASSETS.find(v => v.cg === x.id);
          if (a) apply(a.symbol, Number(x.current_price), Number(x.price_change_percentage_24h), "CoinGecko");
        });
      } catch {}
    };
    loadFallback();
    const id = setInterval(loadFallback, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [apply]);
  return { data, connected, lastUpdate };
}

function useChart(asset) {
  const [points, setPoints] = useState(() => seededPoints(asset.price, asset.change));
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`https://api.binance.com/api/v3/klines?symbol=${asset.binance.toUpperCase()}&interval=1h&limit=48`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(rows => { if (!cancelled) setPoints(rows.map(x => Number(x[4]))); })
      .catch(() => { if (!cancelled) setPoints(seededPoints(asset.price, asset.change)); })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [asset.binance, asset.price, asset.change]);
  return { points, loading };
}

function MiniChart({ points, large = false }) {
  const w = large ? 760 : 180, h = large ? 260 : 52, pad = large ? 12 : 3;
  const min = Math.min(...points), max = Math.max(...points), range = max - min || 1;
  const d = points.map((p, i) => `${i ? "L" : "M"}${pad + i * ((w - pad * 2) / Math.max(points.length - 1, 1))},${h - pad - ((p - min) / range) * (h - pad * 2)}`).join(" ");
  return <svg className={large ? "chart-large" : "chart-mini"} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-label="price chart"><path d={d} fill="none" stroke="currentColor" strokeWidth={large ? 2.5 : 2} vectorEffect="non-scaling-stroke" /></svg>;
}

function AssetCard({ asset, onOpen }) {
  const rising = asset.change >= 0;
  return <button className="asset-card asset-click" onClick={() => onOpen(asset)} aria-label={`Mở biểu đồ ${asset.name}`}><div className="asset-head"><div className={`asset-icon ${asset.tone}`}>{asset.symbol[0]}</div><div><strong>{asset.symbol}</strong><span>{asset.name}</span></div><span className={rising ? "change positive" : "change negative"}>{rising ? "+" : ""}{Number(asset.change || 0).toFixed(2)}%</span></div><div className="asset-price">${money(asset.price)}</div><MiniChart points={seededPoints(asset.price, asset.change)} /><div className="asset-live"><span className={asset.source?.includes("WebSocket") ? "live-pulse" : ""}>{asset.source?.includes("WebSocket") ? "LIVE" : "Market"}</span><small>{timeLabel(asset.updatedAt)}</small></div></button>;
}

function Header({ title, text, action }) { return <div className="page-header"><div><div className="kicker">CRYPTOPool PRO</div><h1>{title}</h1><p>{text}</p></div>{action}</div>; }
function SectionTitle({ title, action, onClick }) { return <div className="section-title"><h2>{title}</h2>{action && <button onClick={onClick}>{action} <span>→</span></button>}</div>; }
function PoolCard({ pool }) { return <article className="pool-card"><div className="pool-icon">◈</div><div className="pool-content"><div className="pool-line"><h3>{pool.name}</h3><span>{pool.tag}</span></div><p>{pool.note}</p><div className="pool-meta"><span>{pool.assets}</span><strong>DEMO</strong></div></div></article>; }

function Dashboard({ market, go, openAsset }) {
  const { address } = useAppKitAccount();
  const liveAssets = Object.values(market.data);
  return <div className="page"><section className="hero-card-main"><div className="hero-copy"><div className="kicker"><span className="live-dot"/> DIGITAL ASSET PLATFORM</div><h1>Quản lý tài sản số<br/><em>một cách chuyên nghiệp.</em></h1><p>CryptoPool PRO theo dõi 10 tài sản crypto với dữ liệu thị trường cập nhật trực tiếp, biểu đồ và tín hiệu tăng/giảm. Ví vẫn hoạt động trên Ethereum Sepolia testnet.</p><div className="hero-actions"><AppKitButton/><button className="ghost-button" onClick={() => go("markets")}>Xem thị trường <span>→</span></button></div><div className="trust-row"><span>✓ Non-custodial</span><span>✓ 10 assets live</span><span>✓ Testnet only</span></div></div><div className="hero-visual"><div className="orb orb-a"/><div className="orb orb-b"/><div className="portfolio-float"><span>MARKET STREAM</span><strong>{market.connected ? "LIVE" : "CONNECTING"}</strong><small>{market.connected ? "Binance WebSocket" : "Đang tìm nguồn dữ liệu"}</small></div><div className="mini-bars"><i/><i/><i/><i/><i/><i/><i/><i/></div></div></section><section className="stats-row"><div><span>Market feed</span><strong><i className={`live-dot ${market.connected ? "" : "offline"}`}/> {market.connected ? "Live" : "Fallback"}</strong></div><div><span>Assets tracked</span><strong>10 <small>crypto assets</small></strong></div><div><span>Wallet</span><strong>{address ? shorten(address) : "Not connected"}</strong></div></section><SectionTitle title="Thị trường" action="Xem tất cả" onClick={() => go("markets")}/><div className="asset-grid">{liveAssets.slice(0, 6).map(a => <AssetCard key={a.symbol} asset={a} onOpen={openAsset}/>)}</div><SectionTitle title="Pool mẫu" action="Khám phá" onClick={() => go("pools")}/><div className="pool-grid">{POOLS.map(p => <PoolCard key={p.name} pool={p}/>)}</div><div className="notice"><span>◉</span><div><strong>Dữ liệu thị trường trực tiếp</strong><p>Giá thị trường được lấy từ nguồn dữ liệu bên ngoài. Tính năng đầu tư/lợi nhuận vẫn là demo và không phải lời hứa lợi nhuận.</p></div></div></div>;
}

function Markets({ market, openAsset, go }) {
  const [q, setQ] = useState("");
  const list = Object.values(market.data).filter(a => `${a.symbol} ${a.name}`.toLowerCase().includes(q.toLowerCase()));
  return <div className="page"><Header title="Tài sản crypto" text={`10 tài sản • ${market.connected ? "giá đang cập nhật trực tiếp" : "đang dùng nguồn dự phòng"} • cập nhật ${timeLabel(market.lastUpdate)}`} action={<button className="ghost-button" onClick={() => go("trade")}>Mở Trade →</button>}/><div className="toolbar"><label className="search"><span>⌕</span><input aria-label="Tìm tài sản" value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm BTC, ETH…"/></label><span className={market.connected ? "feed-ok" : "muted"}>{market.connected ? "● LIVE" : "○ FALLBACK"}</span></div><div className="asset-grid markets-grid">{list.map(a => <AssetCard key={a.symbol} asset={a} onOpen={openAsset}/>)}</div></div>;
}

function ChartModal({ asset, onClose }) {
  const { points, loading } = useChart(asset);
  const current = points[points.length - 1] || asset.price;
  const first = points[0] || current;
  const chartChange = first ? ((current - first) / first) * 100 : 0;
  return <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="chart-modal" role="dialog" aria-modal="true" aria-label={`${asset.name} chart`}><div className="modal-head"><div><div className="kicker">{asset.symbol} / USDT</div><h2>{asset.name}</h2><div className="modal-price">${money(asset.price)} <span className={asset.change >= 0 ? "positive" : "negative"}>{asset.change >= 0 ? "+" : ""}{Number(asset.change || 0).toFixed(2)}% 24H</span></div></div><button className="icon-button" onClick={onClose} aria-label="Đóng">×</button></div><div className="chart-wrap"><MiniChart points={points} large={true}/>{loading && <span className="chart-loading">Đang tải lịch sử…</span>}</div><div className="chart-meta"><span>48 giờ</span><strong className={chartChange >= 0 ? "positive" : "negative"}>{chartChange >= 0 ? "+" : ""}{chartChange.toFixed(2)}%</strong><span>Cập nhật {timeLabel(asset.updatedAt)}</span></div><div className="alert-panel"><strong>Cảnh báo giá</strong><span className={asset.change >= 3 ? "positive" : asset.change <= -3 ? "negative" : "muted"}>{asset.change >= 3 ? "▲ Tăng mạnh" : asset.change <= -3 ? "▼ Giảm mạnh" : "● Biến động bình thường"}</span><small>Ngưỡng hiển thị nhanh: ±3% trong 24H.</small></div></section></div>;
}

function Wallet({ go }) {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { data: balance } = useBalance({ address, chainId: SEPOLIA_ID, query: { enabled: Boolean(address) } });
  return <div className="page"><Header title="Wallet" text="Kết nối ví non-custodial để kiểm tra số dư Ethereum Sepolia." action={<AppKitButton/>}/><div className="wallet-page-card">{isConnected ? <><div className="connected-banner"><span className="big-check">✓</span><div><strong>Ví đã kết nối</strong><small>{shorten(address)}</small></div></div><div className="wallet-grid"><div><span>Network</span><strong>{Number(chainId) === SEPOLIA_ID ? "Ethereum Sepolia" : `Chain ${chainId ?? "—"}`}</strong></div><div><span>ETH balance</span><strong>{balance ? `${Number(formatEther(balance.value)).toFixed(6)} ETH` : "Đang đọc…"}</strong></div><div><span>Security</span><strong>Không lưu seed phrase</strong></div></div><button className="ghost-button" onClick={() => go("trade")}>Kiểm thử giao dịch →</button></> : <div className="empty-wallet"><div className="wallet-symbol">◈</div><h2>Kết nối ví của bạn</h2><p>CryptoPool PRO không yêu cầu seed phrase hoặc private key.</p><AppKitButton/></div>}</div></div>;
}

function Trade() {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const goodNetwork = Number(chainId) === SEPOLIA_ID;
  const { data: balance, refetch } = useBalance({ address, chainId: SEPOLIA_ID, query: { enabled: Boolean(address) } });
  const { data: hash, error, isPending, sendTransactionAsync } = useSendTransaction();
  const { isLoading: confirming, isSuccess } = useWaitForTransactionReceipt({ hash, confirmations: 1 });
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("0x9BB4aBC72f2c4818F66C895Cd1a9de2c827C5C06");
  const valid = isAddress(recipient);
  const numeric = Number(amount);
  const eth = balance ? Number(formatEther(balance.value)) : 0;
  const enough = numeric > 0 && numeric + 0.0005 < eth;
  const send = async () => { if (!isConnected || !goodNetwork || !valid || !enough || isPending || confirming) return; try { await sendTransactionAsync({ to: recipient, value: parseEther(amount), chainId: SEPOLIA_ID }); await refetch(); } catch {} };
  return <div className="page"><Header title="Giao dịch testnet" text="Gửi ETH thật trên Ethereum Sepolia. Bạn tự kiểm tra và ký giao dịch trong ví." action={<AppKitButton/>}/><div className="trade-layout"><div className="trade-box"><div className="trade-label">SỐ DƯ ETH SEPOLIA</div><div className="balance-box"><strong>{balance ? `${eth.toFixed(6)} ETH` : "—"}</strong><button onClick={() => refetch()} disabled={!address}>↻</button></div><div className="trade-label">SỐ LƯỢNG</div><input className="amount" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.001"/><div className="trade-label">ĐỊA CHỈ NHẬN</div><div className="input-with-action"><input className="recipient-input large-address-input" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="0x…"/><button onClick={() => setRecipient("")}>Xóa</button></div><button className="primary-button" disabled={!isConnected || !goodNetwork || !valid || !enough || isPending || confirming} onClick={send}>{isSuccess ? "✓ Giao dịch đã xác nhận" : confirming ? "Đang xác nhận…" : isPending ? "Đang mở/xác nhận trong ví…" : !isConnected ? "Kết nối ví để gửi" : !goodNetwork ? "Chuyển sang Sepolia" : !valid ? "Địa chỉ nhận không hợp lệ" : !enough ? "Không đủ ETH sau gas" : "Gửi ETH Sepolia"}</button>{hash && <div className="tx-result"><b>Transaction</b><a target="_blank" rel="noreferrer" href={`https://sepolia.etherscan.io/tx/${hash}`}>{shorten(hash)}</a></div>}{error && <div className="inline-warning">{error.shortMessage || "Giao dịch bị hủy hoặc thất bại."}</div>}</div><aside className="checks"><h3>Kiểm tra trước khi gửi</h3><div className="check"><span className={isConnected ? "check-good" : "check-bad"}>{isConnected ? "✓" : "!"}</span><div><b>Wallet</b><small>{isConnected ? shorten(address) : "Chưa kết nối"}</small></div></div><div className="check"><span className={goodNetwork ? "check-good" : "check-bad"}>{goodNetwork ? "✓" : "!"}</span><div><b>Network</b><small>{goodNetwork ? "Ethereum Sepolia" : "Cần Sepolia"}</small></div></div><div className="check"><span className={valid ? "check-good" : "check-bad"}>{valid ? "✓" : "!"}</span><div><b>Recipient</b><small>{valid ? "Địa chỉ hợp lệ" : "Địa chỉ không hợp lệ"}</small></div></div><div className="check"><span className="check-good">✓</span><div><b>Execution</b><small>Blockchain testnet thật</small></div></div></aside></div></div>;
}

function Portfolio({ market }) {
  const { address } = useAppKitAccount();
  const eth = market.data.ETH?.price || 0;
  return <div className="page"><Header title="Portfolio" text="Tổng quan tài sản mẫu và dữ liệu thị trường hiện tại." action={<AppKitButton/>}/><div className="portfolio-hero"><span>DEMO PORTFOLIO VALUE</span><strong>$10,248.60</strong><small>{address ? `Ví ${shorten(address)} • ETH market $${money(eth)}` : "Kết nối ví để hiển thị số dư testnet"}</small></div><div className="portfolio-grid"><div><span>Available</span><strong>$8,540.20</strong></div><div><span>Allocated</span><strong>$1,708.40</strong></div><div><span>Assets tracked</span><strong>10</strong></div></div><div className="notice"><span>◉</span><div><strong>Lưu ý</strong><p>Giá crypto là dữ liệu thị trường; giá trị portfolio trên trang này vẫn là số liệu demo, không phải số dư đầu tư thật.</p></div></div></div>;
}
function Pools({ go }) { return <div className="page"><Header title="Pools" text="Các pool minh họa cho kiến trúc sản phẩm tương lai." action={<button className="ghost-button" onClick={() => go("markets")}>Xem tài sản →</button>}/><div className="pool-grid">{POOLS.map(p => <PoolCard key={p.name} pool={p}/>)}</div><div className="notice"><span>◉</span><div><strong>Chưa phải DeFi production</strong><p>Smart contract, vault, yield strategy và audit production chưa được kích hoạt trong bản PRO hiện tại.</p></div></div></div>; }

function App() {
  const [page, setPage] = useState("dashboard");
  const [selected, setSelected] = useState(null);
  const market = useRealtimeMarket();
  useEffect(() => { document.title = "CryptoPool PRO"; }, []);
  const go = useCallback(next => { setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  const nav = [{ id: "dashboard", icon: "⌂", label: "Dashboard" }, { id: "markets", icon: "◌", label: "Markets" }, { id: "pools", icon: "◈", label: "Pools" }, { id: "portfolio", icon: "▣", label: "Portfolio" }, { id: "trade", icon: "↗", label: "Trade" }, { id: "wallet", icon: "◎", label: "Wallet" }];
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">C</div><div><strong>CryptoPool</strong><span>PRO • WEB3 / DEFI</span></div></div><span className="nav-label">PLATFORM</span><nav>{nav.map(n => <button key={n.id} className={page === n.id ? "active" : ""} onClick={() => go(n.id)}><span>{n.icon}</span>{n.label}</button>)}</nav><div className="sidebar-bottom"><div className="wallet-mini"><div className="wallet-mini-top"><span className={`status-dot ${market.connected ? "on" : ""}`}/>{market.connected ? "Market live" : "Market reconnecting"}</div><strong>Ethereum Sepolia</strong><p>Testnet environment</p><span className="network-tag good">10 assets</span></div><button className="theme-switch" onClick={() => document.documentElement.classList.toggle("light")}>◐ Theme</button></div></aside><main><header className="topbar"><div className="mobile-brand"><div className="brand-mark">C</div><div><strong>CryptoPool PRO</strong><span>WEB3 / DEFI</span></div></div><span className="network-chip"><i/> {market.connected ? "Live Market" : "Connecting"}</span><AppKitButton/></header>{page === "dashboard" && <Dashboard market={market} go={go} openAsset={setSelected}/>} {page === "markets" && <Markets market={market} openAsset={setSelected} go={go}/>} {page === "pools" && <Pools go={go}/>} {page === "portfolio" && <Portfolio market={market}/>} {page === "trade" && <Trade/>} {page === "wallet" && <Wallet go={go}/>} </main>{selected && <ChartModal asset={selected} onClose={() => setSelected(null)}/>}<nav className="mobile-nav">{nav.map(n => <button key={n.id} className={page === n.id ? "active" : ""} onClick={() => go(n.id)}><span>{n.icon}</span><small>{n.label}</small></button>)}</nav></div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<WagmiProvider config={adapter.wagmiConfig}><QueryClientProvider client={queryClient}><App/></QueryClientProvider></WagmiProvider>);
