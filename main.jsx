import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import { createAppKit, AppKitButton, useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia } from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import "./style.css";

// Reown Project ID is a public frontend identifier. Never place private keys here.
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID || "ff3f925ac7d1161fbe3707bc77b3d9fe";
const networks = [sepolia];
const metadata = {
  name: "CryptoPool",
  description: "CryptoPool digital asset dashboard — Ethereum Sepolia testnet",
  url: "https://huong83.github.io/CryptoPool-App/",
  icons: ["https://huong83.github.io/CryptoPool-App/icon.svg"],
};

const wagmiAdapter = new WagmiAdapter({ networks, projectId, ssr: true });
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  defaultNetwork: sepolia,
  allWallets: "SHOW",
  features: { analytics: false, email: true, socials: ["google"], emailShowWallets: true },
  themeMode: "dark",
});
const queryClient = new QueryClient();

const assets = [
  { symbol: "BTC", name: "Bitcoin", price: 64280.12, change: 2.14, tone: "orange" },
  { symbol: "ETH", name: "Ethereum", price: 2487.42, change: 1.73, tone: "purple" },
  { symbol: "USDC", name: "USD Coin", price: 1, change: 0.01, tone: "blue" },
  { symbol: "SOL", name: "Solana", price: 151.36, change: 3.91, tone: "green" },
  { symbol: "LINK", name: "Chainlink", price: 23.42, change: -0.62, tone: "blue" },
  { symbol: "UNI", name: "Uniswap", price: 7.91, change: 1.22, tone: "pink" },
];

const pools = [
  { name: "Core BTC", tag: "Conservative", assets: "BTC", icon: "₿", note: "Capital preservation focus" },
  { name: "ETH Growth", tag: "Balanced", assets: "ETH", icon: "Ξ", note: "Ethereum ecosystem exposure" },
  { name: "Multi Asset", tag: "Balanced", assets: "BTC · ETH · SOL", icon: "◈", note: "Diversified demo basket" },
  { name: "Stable Reserve", tag: "Low volatility", assets: "USDC", icon: "$", note: "Stablecoin demo allocation" },
];

function shorten(value) {
  return value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "";
}
function money(value) {
  return value >= 1000 ? value.toLocaleString("en-US", { maximumFractionDigits: 2 }) : value.toFixed(value < 2 ? 4 : 2);
}

function WalletMini() {
  const { address, isConnected, status } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const good = Number(chainId) === 11155111;
  return (
    <div className="wallet-mini">
      <div className="wallet-mini-top"><span className={`status-dot ${isConnected ? "on" : ""}`} /><span>{isConnected ? "Wallet connected" : "Wallet not connected"}</span></div>
      {status === "connecting" && <div className="wallet-muted">Đang mở kết nối…</div>}
      {isConnected ? (
        <>
          <strong>{shorten(address)}</strong>
          <span className={`network-tag ${good ? "good" : "bad"}`}>{good ? "Sepolia" : `Chain ${chainId || "?"}`}</span>
        </>
      ) : <p>Kết nối ví để xem tài khoản testnet.</p>}
      <div className="wallet-mini-button"><AppKitButton /></div>
    </div>
  );
}

function Dashboard({ onNavigate }) {
  const { isConnected } = useAppKitAccount();
  return <div className="page">
    <section className="hero-card-main">
      <div className="hero-copy">
        <div className="kicker"><span className="live-dot" /> DIGITAL ASSET PLATFORM</div>
        <h1>Quản lý tài sản số<br /><em>một cách chuyên nghiệp.</em></h1>
        <p>CryptoPool là giao diện quản lý danh mục và thử nghiệm tài sản số trên Ethereum Sepolia. Kết nối ví trên máy tính hoặc điện thoại trong vài giây.</p>
        <div className="hero-actions"><AppKitButton /><button className="ghost-button" onClick={() => onNavigate("markets")}>Xem thị trường <span>→</span></button></div>
        <div className="trust-row"><span>✓ Non-custodial</span><span>✓ Testnet only</span><span>✓ Không lưu seed phrase</span></div>
      </div>
      <div className="hero-visual">
        <div className="orb orb-a" /><div className="orb orb-b" />
        <div className="portfolio-float"><span>DEMO PORTFOLIO VALUE</span><strong>$10,248.60</strong><small>+4.82% <b>24H</b></small></div>
        <div className="mini-bars"><i/><i/><i/><i/><i/><i/><i/><i/></div>
      </div>
    </section>

    <section className="stats-row">
      <div><span>Network</span><strong><i className="live-dot"/> Ethereum Sepolia</strong></div>
      <div><span>Assets tracked</span><strong>6 <small>crypto assets</small></strong></div>
      <div><span>MVP status</span><strong>● Testnet demo</strong></div>
    </section>

    <SectionTitle eyebrow="MARKET" title="Thị trường" action="Xem tất cả" onClick={() => onNavigate("markets")} />
    <div className="asset-grid">{assets.map((a) => <AssetCard key={a.symbol} asset={a} />)}</div>

    <SectionTitle eyebrow="CRYPTOPool" title="Pool mẫu" action="Khám phá" onClick={() => onNavigate("pools")} />
    <div className="pool-grid">{pools.map((p) => <PoolCard key={p.name} pool={p} />)}</div>

    <div className="notice"><span>◉</span><div><strong>Chế độ thử nghiệm</strong><p>Đây là sản phẩm demo trên Sepolia. Không có cam kết lợi nhuận và chưa kích hoạt đầu tư bằng tiền thật.</p></div></div>
  </div>;
}

function SectionTitle({ eyebrow, title, action, onClick }) { return <div className="section-title"><div><div className="kicker">{eyebrow}</div><h2>{title}</h2></div>{action && <button onClick={onClick}>{action} <span>→</span></button>}</div>; }
function AssetCard({ asset }) { return <article className="asset-card"><div className="asset-head"><div className={`asset-icon ${asset.tone}`}>{asset.symbol[0]}</div><div><strong>{asset.symbol}</strong><span>{asset.name}</span></div><span className={asset.change >= 0 ? "change positive" : "change negative"}>{asset.change >= 0 ? "+" : ""}{asset.change.toFixed(2)}%</span></div><div className="asset-price">${money(asset.price)}</div><div className="spark"><span/><span/><span/><span/><span/><span/><span/></div></article>; }
function PoolCard({ pool }) { return <article className="pool-card"><div className="pool-icon">{pool.icon}</div><div className="pool-content"><div className="pool-line"><h3>{pool.name}</h3><span>{pool.tag}</span></div><p>{pool.note}</p><div className="pool-meta"><span>{pool.assets}</span><strong>DEMO</strong></div></div></article>; }

function Markets({ onNavigate }) {
  const [q, setQ] = useState("");
  const filtered = assets.filter((a) => `${a.symbol} ${a.name}`.toLowerCase().includes(q.toLowerCase()));
  return <div className="page"><PageHeader eyebrow="MARKETS" title="Tài sản crypto" text="Theo dõi giá tham khảo trước khi sử dụng các tính năng testnet." action={<button className="ghost-button" onClick={() => onNavigate("trade")}>Mở Trade →</button>} />
    <div className="toolbar"><div className="search"><span>⌕</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm tài sản…" /></div><span className="muted">Dữ liệu demo</span></div>
    <div className="market-table"><div className="market-row header"><span>Asset</span><span>Price</span><span>24h</span><span>Status</span></div>{filtered.map((a) => <div className="market-row" key={a.symbol}><span className="asset-cell"><b>{a.symbol}</b><small>{a.name}</small></span><strong>${money(a.price)}</strong><span className={a.change >= 0 ? "positive" : "negative"}>{a.change >= 0 ? "+" : ""}{a.change.toFixed(2)}%</span><span className="table-status">Tracked</span></div>)}</div>
  </div>;
}

function Trade() {
  const { isConnected } = useAppKitAccount(); const [amount, setAmount] = useState(""); const [done, setDone] = useState(false);
  const submit = () => { if (!isConnected || !amount) return; setDone(true); setTimeout(() => setDone(false), 2200); };
  return <div className="page"><PageHeader eyebrow="TESTNET TRADE" title="Trade" text="Mô phỏng giao dịch để kiểm thử luồng sản phẩm. Không gửi transaction thật." action={<AppKitButton />} />
    <div className="trade-layout"><div className="trade-box"><div className="trade-label">FROM</div><div className="token-row"><div><strong>ETH</strong><span>Ethereum</span></div><b>Ξ</b></div><input className="amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /><div className="swap-mark">↓</div><div className="trade-label">TO</div><div className="token-row"><div><strong>USDC</strong><span>USD Coin</span></div><b>$</b></div><div className="quote">Estimated output <strong>{amount ? "Demo quote" : "0.00 USDC"}</strong></div><button className="primary-button" disabled={!isConnected || !amount} onClick={submit}>{done ? "✓ Demo order created" : isConnected ? "Tạo lệnh demo" : "Kết nối ví để tiếp tục"}</button><div className="inline-warning">Testnet only · Không gửi giao dịch blockchain</div></div><div className="checks"><h3>Pre-trade checks</h3><Check label="Wallet" value={isConnected ? "Connected" : "Not connected"} good={isConnected}/><Check label="Network" value="Ethereum Sepolia" good/><Check label="Gas" value="Testnet ETH" good/><Check label="Execution" value="Simulation only" good/></div></div>
  </div>;
}
function Check({ label, value, good }) { return <div className="check"><span className={good ? "check-good" : "check-bad"}>{good ? "✓" : "!"}</span><div><b>{label}</b><small>{value}</small></div></div>; }

function WalletPage() {
  const { address, isConnected } = useAppKitAccount(); const { chainId } = useAppKitNetwork(); const [copied, setCopied] = useState(false);
  async function copy() { if (!address) return; try { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }
  return <div className="page"><PageHeader eyebrow="WALLET" title="Ví của bạn" text="Kết nối không lưu ký. Private key và seed phrase không được yêu cầu." action={<AppKitButton />} />
    <div className="wallet-page-card">{isConnected ? <><div className="connected-banner"><span className="big-check">✓</span><div><strong>Wallet connected</strong><span>Đã kết nối thành công</span></div></div><div className="address-line"><span>{address}</span><button onClick={copy}>{copied ? "Đã copy" : "Copy"}</button></div><div className="wallet-info"><div><span>Network</span><strong>{Number(chainId) === 11155111 ? "Ethereum Sepolia" : `Chain ${chainId}`}</strong></div><div><span>Chain ID</span><strong>{chainId}</strong></div><div><span>Mode</span><strong>Testnet</strong></div></div></> : <div className="empty-wallet"><div className="wallet-symbol">◎</div><h2>Kết nối ví để bắt đầu</h2><p>Chọn MetaMask, Trust Wallet, WalletConnect hoặc phương thức được hỗ trợ trong AppKit.</p><AppKitButton /><div className="wallet-features"><span>✓ Mobile friendly</span><span>✓ Non-custodial</span><span>✓ Sepolia testnet</span></div></div>}</div>
  </div>;
}

function Portfolio() { const { address, isConnected } = useAppKitAccount(); return <div className="page"><PageHeader eyebrow="PORTFOLIO" title="Danh mục" text="Tổng quan tài sản mô phỏng gắn với ví đang kết nối." action={<AppKitButton />} /><div className="portfolio-hero"><div><span>Total demo value</span><strong>$10,248.60</strong><b className="positive">+4.82% <small>24h</small></b></div><div className="portfolio-chart"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div><div className="portfolio-grid"><div><span>Available balance</span><strong>$8,540.20</strong></div><div><span>Allocated</span><strong>$1,708.40</strong></div><div><span>Wallet</span><strong>{isConnected ? shorten(address) : "Not connected"}</strong></div></div></div>; }
function Pools() { return <div className="page"><PageHeader eyebrow="CRYPTOPool" title="Pool mẫu" text="Các chiến lược minh họa cho sản phẩm; chưa có tiền thật." /><div className="pool-grid large">{pools.map((p) => <PoolCard key={p.name} pool={p} />)}</div></div>; }
function PageHeader({ eyebrow, title, text, action }) { return <div className="page-header"><div><div className="kicker">{eyebrow}</div><h1>{title}</h1><p>{text}</p></div>{action}</div>; }

function App() {
  const [tab, setTab] = useState("dashboard"); const [theme, setTheme] = useState("dark");
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const content = useMemo(() => {
    const nav = (id) => setTab(id);
    if (tab === "markets") return <Markets onNavigate={nav}/>;
    if (tab === "trade") return <Trade/>;
    if (tab === "portfolio") return <Portfolio/>;
    if (tab === "wallet") return <WalletPage/>;
    if (tab === "pools") return <Pools/>;
    return <Dashboard onNavigate={nav}/>;
  }, [tab]);
  const items = [["dashboard","⌂","Tổng quan"],["markets","◈","Thị trường"],["pools","◇","Pools"],["trade","⇄","Trade"],["portfolio","▣","Danh mục"],["wallet","◎","Ví"]];
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark">C</div><div><strong>CryptoPool</strong><span>Digital Assets</span></div></div><div className="sidebar-section"><span className="nav-label">WORKSPACE</span><nav>{items.map(([id, icon, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><span>{icon}</span>{label}</button>)}</nav></div><div className="sidebar-bottom"><WalletMini/><button className="theme-switch" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? "☼  Light mode" : "☾  Dark mode"}</button></div></aside><main><header className="topbar"><div className="mobile-brand"><div className="brand-mark">C</div><div><strong>CryptoPool</strong><span>Digital Assets</span></div></div><div className="topbar-actions"><span className="network-chip"><i/> Sepolia</span><button className="icon-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">{theme === "dark" ? "☼" : "☾"}</button><AppKitButton/></div></header>{content}<footer>CryptoPool · Ethereum Sepolia · Testnet demo</footer></main><nav className="mobile-nav">{items.slice(0,5).map(([id, icon, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><span>{icon}</span><small>{label}</small></button>)}</nav></div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><WagmiProvider config={wagmiAdapter.wagmiConfig}><QueryClientProvider client={queryClient}><App/></QueryClientProvider></WagmiProvider></React.StrictMode>);
