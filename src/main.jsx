import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import { createAppKit, AppKitAccountButton, AppKitButton, useAppKit, useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia } from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, useBalance, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { formatEther, isAddress, parseEther } from "viem";
import "./style.css";

const PROJECT_ID = import.meta.env.VITE_REOWN_PROJECT_ID || "ff3f925ac7d1161fbe3707bc77b3d9fe";
const SEPOLIA_ID = 11155111;
const queryClient = new QueryClient();
const networks = [sepolia];
const metadata = { name: "CryptoPool PRO", description: "CryptoPool PRO — live crypto market and Ethereum Sepolia testnet", url: "https://huong83.github.io/CryptoPool-App/", icons: ["https://huong83.github.io/CryptoPool-App/icon.svg"] };
const adapter = new WagmiAdapter({ networks, projectId: PROJECT_ID, ssr: true });
createAppKit({ adapters: [adapter], networks, projectId: PROJECT_ID, metadata, defaultNetwork: sepolia, allWallets: "SHOW", featuredWalletIds: ["c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", "8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4"], features: { analytics: false, email: true, socials: ["google"], emailShowWallets: true }, themeMode: "dark" });

const BINANCE_API = "https://data-api.binance.vision/api/v3";
const BINANCE_WS = "wss://stream.binance.com:9443/stream?streams=";
const COINGECKO_API = "https://api.coingecko.com/api/v3";
const ASSETS = [
  { symbol: "BTC", name: "Bitcoin", binance: "btcusdt", cg: "bitcoin", tone: "orange" },
  { symbol: "ETH", name: "Ethereum", binance: "ethusdt", cg: "ethereum", tone: "purple" },
  { symbol: "SOL", name: "Solana", binance: "solusdt", cg: "solana", tone: "green" },
  { symbol: "BNB", name: "BNB", binance: "bnbusdt", cg: "binancecoin", tone: "gold" },
  { symbol: "LINK", name: "Chainlink", binance: "linkusdt", cg: "chainlink", tone: "indigo" },
  { symbol: "XRP", name: "XRP", binance: "xrpusdt", cg: "ripple", tone: "blue" },
  { symbol: "ADA", name: "Cardano", binance: "adausdt", cg: "cardano", tone: "cyan" },
  { symbol: "PI", name: "Pi Network", binance: null, cg: "pi-network", tone: "violet" },
  { symbol: "SDA", name: "SDA", binance: null, cg: null, tone: "slate" },
  { symbol: "UNI", name: "Uniswap", binance: "uniusdt", cg: "uniswap", tone: "pink" }
];
const INTERVALS = [
  { label: "1P", api: "1m", limit: 120 },
  { label: "15P", api: "15m", limit: 96 },
  { label: "1H", api: "1h", limit: 72 },
  { label: "4H", api: "4h", limit: 72 },
  { label: "12H", api: "12h", limit: 60 },
  { label: "1D", api: "1d", limit: 60 },
  { label: "7D", api: "1d", limit: 7 }
];
const POOLS = ASSETS.map((asset, i) => ({ asset, name: `${asset.name} Pool`, risk: i < 3 ? "Core" : i < 7 ? "Balanced" : "Growth" }));

function emptyMarket(asset) { return { ...asset, price: null, change: null, open: null, updatedAt: 0, source: "WAITING" }; }
function money(v) { const n = Number(v); if (!Number.isFinite(n)) return "—"; if (n < .01) return n.toFixed(6); if (n < 2) return n.toFixed(4); if (n < 1000) return n.toLocaleString("en-US", { maximumFractionDigits: 4 }); return n.toLocaleString("en-US", { maximumFractionDigits: 2 }); }
function shorten(v) { return v ? `${v.slice(0, 6)}…${v.slice(-4)}` : ""; }
function timeLabel(ts) { return ts ? new Date(ts).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—"; }

function ConnectWallet({ compact = false }) {
  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();
  if (isConnected) return compact ? <AppKitAccountButton balance="hide" /> : <AppKitButton />;
  return <button className={compact ? "wallet-connect compact" : "wallet-connect"} onClick={() => open({ view: "Connect" })}>Kết nối ví</button>;
}

function useRealtimeMarket() {
  const [data, setData] = useState(() => Object.fromEntries(ASSETS.map(a => [a.symbol, emptyMarket(a)])));
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(0);
  const socketRef = useRef(null);
  const retryRef = useRef(null);
  const retryCount = useRef(0);

  const apply = useCallback((symbol, price, change, source, open = null) => {
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) return;
    const c = Number(change);
    setData(prev => ({ ...prev, [symbol]: { ...prev[symbol], price: p, change: Number.isFinite(c) ? c : null, open: Number(open) || prev[symbol].open, updatedAt: Date.now(), source } }));
    setLastUpdate(Date.now());
  }, []);

  useEffect(() => {
    let alive = true;
    const connect = () => {
      if (!alive) return;
      try {
        const streams = ASSETS.filter(a => a.binance).map(a => `${a.binance}@ticker`).join("/");
        const ws = new WebSocket(`${BINANCE_WS}${streams}`);
        socketRef.current = ws;
        ws.onopen = () => { retryCount.current = 0; if (alive) setConnected(true); };
        ws.onmessage = event => {
          try {
            const x = JSON.parse(event.data)?.data;
            const asset = ASSETS.find(a => a.binance === x?.s?.toLowerCase());
            if (asset) apply(asset.symbol, x.c, x.P, "LIVE MARKET", x.o);
          } catch {}
        };
        ws.onerror = () => { try { ws.close(); } catch {} };
        ws.onclose = () => {
          if (!alive) return;
          setConnected(false);
          retryRef.current = setTimeout(connect, Math.min(15000, 2000 * ++retryCount.current));
        };
      } catch {
        setConnected(false);
        retryRef.current = setTimeout(connect, 5000);
      }
    };
    connect();
    return () => { alive = false; clearTimeout(retryRef.current); try { socketRef.current?.close(); } catch {} };
  }, [apply]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const symbols = ASSETS.filter(a => a.binance).map(a => a.binance.toUpperCase());
        const url = `${BINANCE_API}/ticker/24hr?symbols=${encodeURIComponent(JSON.stringify(symbols))}`;
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error("market request failed");
        const rows = await response.json();
        if (cancelled) return;
        rows.forEach(row => {
          const asset = ASSETS.find(a => a.binance?.toUpperCase() === row.symbol);
          if (asset) apply(asset.symbol, row.lastPrice, row.priceChangePercent, "LIVE MARKET", row.openPrice);
        });
      } catch {}
    };
    poll();
    const timer = setInterval(poll, 15000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [apply]);

  useEffect(() => {
    let cancelled = false;
    const loadPi = async () => {
      try {
        const response = await fetch(`${COINGECKO_API}/simple/price?ids=pi-network&vs_currencies=usd&include_24hr_change=true`, { cache: "no-store" });
        if (!response.ok) throw new Error();
        const row = await response.json();
        if (!cancelled && row["pi-network"]?.usd) apply("PI", row["pi-network"].usd, row["pi-network"].usd_24h_change, "COINGECKO");
      } catch {}
    };
    loadPi();
    const timer = setInterval(loadPi, 60000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [apply]);

  return { data, connected, lastUpdate };
}

function MiniChart({ points, large = false }) {
  if (!points?.length) return <div className={large ? "chart-empty large" : "chart-empty"}>Chưa có dữ liệu biểu đồ</div>;
  const w = large ? 900 : 180, h = large ? 300 : 54, pad = large ? 12 : 3;
  const min = Math.min(...points), max = Math.max(...points), range = max - min || 1;
  const d = points.map((p, i) => `${i ? "L" : "M"}${pad + i * ((w - pad * 2) / Math.max(points.length - 1, 1))},${h - pad - ((p - min) / range) * (h - pad * 2)}`).join(" ");
  return <svg className={large ? "chart-large" : "chart-mini"} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-label="price chart"><path d={d} fill="none" stroke="currentColor" strokeWidth={large ? 2.5 : 2} vectorEffect="non-scaling-stroke" /></svg>;
}

function AssetCard({ asset, onOpen }) {
  const rising = Number(asset.change) >= 0;
  const points = asset.open && asset.price ? [Number(asset.open), Number(asset.price)] : [];
  const available = Number.isFinite(Number(asset.price));
  return <button className="asset-card asset-click" onClick={() => onOpen(asset)}>
    <div className="asset-head"><div className={`asset-icon ${asset.tone}`}>{asset.symbol[0]}</div><div><strong>{asset.symbol}</strong><span>{asset.name}</span></div><span className={asset.change == null ? "change muted" : rising ? "change positive" : "change negative"}>{asset.change == null ? "—" : `${rising ? "+" : ""}${Number(asset.change).toFixed(2)}%`}</span></div>
    <div className="asset-price">{available ? `$${money(asset.price)}` : "Đang tải…"}</div>
    <MiniChart points={points} />
    <div className="asset-live"><span className={asset.source === "LIVE MARKET" ? "live-pulse" : ""}>{asset.source}</span><small>{timeLabel(asset.updatedAt)}</small></div>
  </button>;
}
function Header({ title, text, action }) { return <div className="page-header"><div><div className="kicker">CRYPTOPool PRO</div><h1>{title}</h1><p>{text}</p></div>{action}</div>; }

function useChart(asset, interval) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const cfg = INTERVALS.find(v => v.label === interval) || INTERVALS[2];
    const load = async () => {
      setLoading(true); setError(false); setPoints([]);
      try {
        if (asset.binance) {
          const response = await fetch(`${BINANCE_API}/klines?symbol=${asset.binance.toUpperCase()}&interval=${cfg.api}&limit=${cfg.limit}`, { cache: "no-store" });
          if (!response.ok) throw new Error();
          const rows = await response.json();
          if (!Array.isArray(rows) || !rows.length) throw new Error();
          if (!cancelled) setPoints(rows.map(row => Number(row[4])).filter(Number.isFinite));
        } else if (asset.cg) {
          const days = cfg.label === "7D" ? 7 : cfg.label === "1D" ? 1 : 1;
          const response = await fetch(`${COINGECKO_API}/coins/${asset.cg}/market_chart?vs_currency=usd&days=${days}&interval=${days <= 1 ? "hourly" : "daily"}`, { cache: "no-store" });
          if (!response.ok) throw new Error();
          const json = await response.json();
          const rows = (json.prices || []).map(x => Number(x[1])).filter(Number.isFinite);
          if (!rows.length) throw new Error();
          if (!cancelled) setPoints(rows.slice(-Math.max(cfg.limit, 24)));
        } else {
          throw new Error("no market source");
        }
      } catch {
        if (!cancelled) { setPoints([]); setError(true); }
      } finally { if (!cancelled) setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [asset.binance, asset.cg, interval]);
  return { points, loading, error };
}

function ChartModal({ asset, onClose }) {
  const [interval, setIntervalValue] = useState("1H");
  const { points, loading, error } = useChart(asset, interval);
  const current = points.at(-1) || asset.price;
  const first = points[0] || current;
  const delta = first && current ? ((current - first) / first) * 100 : null;
  useEffect(() => { const onKey = e => e.key === "Escape" && onClose(); window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><section className="chart-modal" role="dialog" aria-modal="true">
    <div className="modal-head"><div><div className="kicker">{asset.symbol}{asset.binance ? " / USDT" : " / USD"}</div><h2>{asset.name}</h2><div className="modal-price">{asset.price ? `$${money(asset.price)}` : "Đang tải…"} {asset.change != null && <span className={asset.change >= 0 ? "positive" : "negative"}>{asset.change >= 0 ? "+" : ""}{Number(asset.change).toFixed(2)}% 24H</span>}</div></div><button className="icon-button" onClick={onClose}>×</button></div>
    <div className="chart-tabs">{INTERVALS.map(v => <button key={v.label} className={interval === v.label ? "active" : ""} onClick={() => setIntervalValue(v.label)}>{v.label}</button>)}</div>
    <div className="chart-wrap"><MiniChart points={points} large />{loading && <span className="chart-loading">Đang tải dữ liệu thị trường…</span>}</div>
    <div className="chart-meta"><span>Khung {interval}</span><strong className={delta == null ? "muted" : delta >= 0 ? "positive" : "negative"}>{delta == null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}%`}</strong><span>{error ? "Không có nguồn dữ liệu cho khung này" : "LIVE MARKET DATA"}</span></div>
    <div className="alert-panel"><strong>Cảnh báo giá</strong><span className={asset.change >= 3 ? "positive" : asset.change <= -3 ? "negative" : "muted"}>{asset.change == null ? "Chưa có dữ liệu" : asset.change >= 3 ? "▲ Tăng mạnh" : asset.change <= -3 ? "▼ Giảm mạnh" : "● Biến động bình thường"}</span><small>Ngưỡng hiển thị nhanh ±3% theo biến động 24H.</small></div>
  </section></div>;
}

function WalletBalance({ asset }) { const { address } = useAppKitAccount(); const { data } = useBalance({ address, chainId: SEPOLIA_ID, query: { enabled: Boolean(address) && asset.symbol === "ETH" } }); if (!address) return <span className="muted">Chưa kết nối</span>; if (asset.symbol === "ETH") return <strong>{data ? `${Number(formatEther(data.value)).toFixed(6)} ETH` : "Đang đọc…"}</strong>; return <span className="muted">Token contract chưa cấu hình</span>; }
function PoolRow({ pool, selected, onSelect }) { return <button className={`pool-row ${selected ? "selected" : ""}`} onClick={() => onSelect(pool)}><div className={`asset-icon ${pool.asset.tone}`}>{pool.asset.symbol[0]}</div><div className="pool-row-main"><strong>{pool.name}</strong><span>{pool.asset.symbol} · {pool.risk}</span></div><div className="pool-wallet"><small>Ví kết nối</small><WalletBalance asset={pool.asset}/></div><div className="pool-apy"><small>APY thực</small><strong>Chưa có vault</strong></div><span className="pool-arrow">→</span></button>; }
function Pools() { const [selected, setSelected] = useState(null); const { address } = useAppKitAccount(); return <div className="page"><Header title="Pools" text="10 pool theo từng tài sản. Số dư ví đọc on-chain; APY chỉ hiển thị khi có vault/strategy thật." action={<ConnectWallet/>}/><div className="pool-summary"><div><span>Assets</span><strong>10</strong></div><div><span>Wallet</span><strong>{address ? shorten(address) : "Chưa kết nối"}</strong></div><div><span>Yield</span><strong>ON-CHAIN ONLY</strong></div></div><div className="pool-list">{POOLS.map(p => <PoolRow key={p.asset.symbol} pool={p} selected={selected?.asset.symbol === p.asset.symbol} onSelect={setSelected}/>)}</div>{selected && <section className="pool-detail"><div><div className="kicker">POOL DETAIL</div><h2>{selected.name}</h2><p>{address ? `Ví ${shorten(address)}` : "Chưa kết nối ví"}</p></div><div className="pool-detail-grid"><div><span>Tài sản ví</span><strong><WalletBalance asset={selected.asset}/></strong></div><div><span>APY thực</span><strong>Chưa triển khai</strong></div><div><span>Deposit</span><button className="primary-button" disabled>Chờ vault contract</button></div></div><div className="notice"><span>◉</span><div><strong>Không giả lập lợi nhuận</strong><p>Deposit/withdraw và APY thực chỉ bật sau khi vault smart contract, strategy, nguồn yield và địa chỉ contract được triển khai/xác minh.</p></div></div></section>}</div>; }

function Wallet() { const { address, isConnected } = useAppKitAccount(); const { chainId } = useAppKitNetwork(); const { data, refetch } = useBalance({ address, chainId: SEPOLIA_ID, query: { enabled: Boolean(address) } }); const good = Number(chainId) === SEPOLIA_ID; return <div className="page"><Header title="Wallet" text="Kết nối ví non-custodial trên Ethereum Sepolia." action={<ConnectWallet/>}/><div className="wallet-page-card">{isConnected ? <><div className="connected-banner"><span className="big-check">✓</span><div><strong>Ví đã kết nối</strong><small>{shorten(address)}</small></div></div><div className="wallet-grid"><div><span>Network</span><strong>{good ? "Ethereum Sepolia" : `Chain ${chainId ?? "—"}`}</strong></div><div><span>ETH balance</span><strong>{data ? `${Number(formatEther(data.value)).toFixed(6)} ETH` : "Đang đọc…"}</strong></div><div><span>Security</span><strong>Không lưu seed phrase</strong></div></div><button className="ghost-button" onClick={() => refetch()}>↻ Làm mới số dư</button></> : <div className="empty-wallet"><div className="wallet-symbol">◈</div><h2>Kết nối ví</h2><p>Nhấn nút để mở màn hình chọn ví. Ví sẽ tự hiển thị yêu cầu xác nhận kết nối.</p><ConnectWallet/></div>}</div></div>; }

function Trade() { const { address, isConnected } = useAppKitAccount(); const { chainId } = useAppKitNetwork(); const goodNetwork = Number(chainId) === SEPOLIA_ID; const { data: balance, refetch } = useBalance({ address, chainId: SEPOLIA_ID, query: { enabled: Boolean(address) } }); const { data: hash, error, isPending, sendTransactionAsync } = useSendTransaction(); const { isLoading: confirming } = useWaitForTransactionReceipt({ hash, confirmations: 1 }); const [amount, setAmount] = useState(""); const [recipient, setRecipient] = useState(""); const [message, setMessage] = useState(""); const eth = balance ? Number(formatEther(balance.value)) : 0; const valid = isAddress(recipient); const amountNumber = Number(amount); const enough = Number.isFinite(amountNumber) && amountNumber > 0 && amountNumber < eth; const send = async () => { setMessage(""); if (!isConnected || !goodNetwork || !valid || !enough || isPending || confirming) return; try { const txHash = await sendTransactionAsync({ to: recipient, value: parseEther(amount), chainId: SEPOLIA_ID }); setMessage(`Đã gửi yêu cầu ký giao dịch: ${shorten(txHash)}`); await refetch(); } catch (e) { setMessage(e?.shortMessage || "Giao dịch bị hủy hoặc ví không phản hồi."); } }; return <div className="page"><Header title="Trade" text="Giao dịch ETH trên Ethereum Sepolia. Bạn tự kiểm tra và ký trong ví." action={<ConnectWallet/>}/><div className="trade-layout"><div className="trade-box"><div className="trade-label">SỐ DƯ ETH SEPOLIA</div><div className="balance-box"><strong>{balance ? `${eth.toFixed(6)} ETH` : "—"}</strong><button onClick={() => refetch()} disabled={!address}>↻</button></div><div className="trade-label">SỐ LƯỢNG</div><input className="amount" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.001"/><div className="trade-label">ĐỊA CHỈ NHẬN</div><div className="input-with-action"><input className="recipient-input large-address-input" value={recipient} onChange={e => setRecipient(e.target.value.trim())} placeholder="0x…"/><button onClick={() => setRecipient("")}>Xóa</button></div><button className="primary-button" disabled={!isConnected || !goodNetwork || !valid || !enough || isPending || confirming} onClick={send}>{confirming ? "Đang chờ xác nhận blockchain…" : isPending ? "Đang chờ ví xác nhận…" : !isConnected ? "Kết nối ví" : !goodNetwork ? "Chuyển sang Sepolia" : !valid ? "Nhập địa chỉ nhận hợp lệ" : !enough ? "Không đủ ETH sau gas" : "Mở ví để ký giao dịch"}</button>{hash && <div className="tx-result"><b>Transaction</b><a target="_blank" rel="noreferrer" href={`https://sepolia.etherscan.io/tx/${hash}`}>{shorten(hash)}</a></div>}{message && <div className="inline-warning">{message}</div>}{error && <div className="inline-warning">{error.shortMessage || "Giao dịch thất bại."}</div>}</div><aside className="checks"><h3>Trạng thái</h3><div className="check"><span className={isConnected ? "check-good" : "check-bad"}>{isConnected ? "✓" : "!"}</span><div><b>Wallet</b><small>{isConnected ? shorten(address) : "Chưa kết nối"}</small></div></div><div className="check"><span className={goodNetwork ? "check-good" : "check-bad"}>{goodNetwork ? "✓" : "!"}</span><div><b>Network</b><small>{goodNetwork ? "Ethereum Sepolia" : "Cần Sepolia"}</small></div></div><div className="check"><span className={valid ? "check-good" : "check-bad"}>{valid ? "✓" : "!"}</span><div><b>Recipient</b><small>{valid ? "Địa chỉ hợp lệ" : "Chưa hợp lệ"}</small></div></div><div className="check"><span className="check-good">✓</span><div><b>Confirmation</b><small>Ví tự hiển thị màn hình ký; blockchain xác nhận sau đó.</small></div></div></aside></div></div>; }

function Dashboard({ market, go, openAsset }) { const { address } = useAppKitAccount(); return <div className="page"><section className="hero-card-main"><div className="hero-copy"><div className="kicker"><span className="live-dot"/> LIVE MARKET</div><h1>CryptoPool PRO<br/><em>tài sản số chuyên nghiệp.</em></h1><p>Theo dõi đủ 10 tài sản với dữ liệu thị trường trực tiếp, biểu đồ đa khung thời gian và cảnh báo biến động. Ví hoạt động trên Ethereum Sepolia testnet.</p><div className="hero-actions"><ConnectWallet/><button className="ghost-button" onClick={() => go("markets")}>Xem thị trường →</button></div><div className="trust-row"><span>✓ Non-custodial</span><span>✓ 10 assets</span><span>✓ Testnet only</span></div></div><div className="hero-visual"><div className="orb orb-a"/><div className="orb orb-b"/><div className="portfolio-float"><span>LIVE MARKET</span><strong>{market.connected ? "CONNECTED" : "CONNECTING"}</strong><small>Real-time market stream</small></div></div></section><section className="stats-row"><div><span>Market feed</span><strong><i className={`live-dot ${market.connected ? "" : "offline"}`}/> {market.connected ? "LIVE MARKET" : "Đang kết nối"}</strong></div><div><span>Assets tracked</span><strong>10 <small>crypto assets</small></strong></div><div><span>Wallet</span><strong>{address ? shorten(address) : "Not connected"}</strong></div></section><div className="section-title"><h2>10 tài sản</h2><button onClick={() => go("markets")}>Xem tất cả →</button></div><div className="asset-grid">{Object.values(market.data).map(a => <AssetCard key={a.symbol} asset={a} onOpen={openAsset}/>)}</div><div className="section-title"><h2>Pools</h2><button onClick={() => go("pools")}>Khám phá →</button></div><div className="pool-grid">{POOLS.slice(0, 4).map(p => <article className="pool-card" key={p.asset.symbol}><div className={`pool-icon ${p.asset.tone}`}>{p.asset.symbol[0]}</div><div className="pool-content"><div className="pool-line"><h3>{p.name}</h3><span>{p.risk}</span></div><p>Pool theo tài sản · APY on-chain only.</p><div className="pool-meta"><span>{p.asset.symbol}</span><strong>ON-CHAIN</strong></div></div></article>)}</div></div>; }
function Markets({ market, openAsset, go }) { const [q, setQ] = useState(""); const list = Object.values(market.data).filter(a => `${a.symbol} ${a.name}`.toLowerCase().includes(q.toLowerCase())); return <div className="page"><Header title="Tài sản crypto" text={`10 tài sản · ${market.connected ? "giá đang cập nhật trực tiếp" : "đang kết nối nguồn giá"} · cập nhật ${timeLabel(market.lastUpdate)}`} action={<button className="ghost-button" onClick={() => go("pools")}>Pools →</button>}/><div className="toolbar"><label className="search"><span>⌕</span><input value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm BTC, ETH…"/></label><span className={market.connected ? "feed-ok" : "muted"}>{market.connected ? "● LIVE MARKET" : "○ CONNECTING"}</span></div><div className="asset-grid markets-grid">{list.map(a => <AssetCard key={a.symbol} asset={a} onOpen={openAsset}/>)}</div>{!list.length && <div className="empty-wallet"><h2>Không tìm thấy tài sản</h2><p>Thử mã hoặc tên tài sản khác.</p></div>}</div>; }
function Portfolio({ market }) { const { address } = useAppKitAccount(); return <div className="page"><Header title="Portfolio" text="Theo dõi thị trường và số dư ví." action={<ConnectWallet/>}/><div className="portfolio-hero"><span>LIVE MARKET</span><strong>{market.connected ? "CONNECTED" : "CONNECTING"}</strong><small>{address ? `Ví ${shorten(address)} trên Sepolia` : "Kết nối ví để xem số dư on-chain"}</small></div><div className="portfolio-grid"><div><span>ETH wallet</span><strong><WalletBalance asset={ASSETS[1]}/></strong></div><div><span>Assets tracked</span><strong>10</strong></div><div><span>Pool yield</span><strong>ON-CHAIN ONLY</strong></div></div></div>; }

function App() { const [page, setPage] = useState("dashboard"); const [selected, setSelected] = useState(null); const market = useRealtimeMarket(); const go = useCallback(next => { setPage(next); window.scrollTo({ top: 0, behavior: "smooth" }); }, []); useEffect(() => { document.title = "CryptoPool PRO"; }, []); const nav = useMemo(() => [{ id: "dashboard", icon: "⌂", label: "Dashboard" }, { id: "markets", icon: "◌", label: "Markets" }, { id: "pools", icon: "◈", label: "Pools" }, { id: "portfolio", icon: "▣", label: "Portfolio" }, { id: "trade", icon: "↗", label: "Trade" }, { id: "wallet", icon: "◎", label: "Wallet" }], []); return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">C</div><div><strong>CryptoPool</strong><span>PRO · WEB3 / DEFI</span></div></div><span className="nav-label">PLATFORM</span><nav>{nav.map(n => <button key={n.id} className={page === n.id ? "active" : ""} onClick={() => go(n.id)}><span>{n.icon}</span>{n.label}</button>)}</nav><div className="sidebar-bottom"><div className="wallet-mini"><div className="wallet-mini-top"><span className={`status-dot ${market.connected ? "on" : ""}`}/>{market.connected ? "Live Market" : "Market connecting"}</div><strong>Ethereum Sepolia</strong><p>Testnet environment</p><span className="network-tag good">10 assets</span></div></div></aside><main><header className="topbar"><div className="mobile-brand"><div className="brand-mark">C</div><div><strong>CryptoPool PRO</strong><span>WEB3 / DEFI</span></div></div><span className="network-chip"><i/> {market.connected ? "LIVE MARKET" : "CONNECTING"}</span><ConnectWallet compact/></header>{page === "dashboard" && <Dashboard market={market} go={go} openAsset={setSelected}/>} {page === "markets" && <Markets market={market} openAsset={setSelected} go={go}/>} {page === "pools" && <Pools/>} {page === "portfolio" && <Portfolio market={market}/>} {page === "trade" && <Trade/>} {page === "wallet" && <Wallet/>}</main>{selected && <ChartModal asset={selected} onClose={() => setSelected(null)}/>}<nav className="mobile-nav">{nav.map(n => <button key={n.id} className={page === n.id ? "active" : ""} onClick={() => go(n.id)}><span>{n.icon}</span><small>{n.label}</small></button>)}</nav></div>; }
ReactDOM.createRoot(document.getElementById("root")).render(<WagmiProvider config={adapter.wagmiConfig}><QueryClientProvider client={queryClient}><App/></QueryClientProvider></WagmiProvider>);
