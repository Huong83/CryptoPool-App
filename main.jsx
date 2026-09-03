import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  createAppKit,
  AppKitButton,
  useAppKitAccount,
  useAppKitNetwork,
} from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";

import "./style.css";

const projectId =
  import.meta.env.VITE_REOWN_PROJECT_ID ||
  "ff3f925ac7d1161fbe3707bc77b3d9fe";

const metadata = {
  name: "CryptoPool",
  description: "CryptoPool testnet portfolio dashboard",
  url: "https://huong83.github.io/CryptoPool-App/",
  icons: ["https://huong83.github.io/CryptoPool-App/icon.svg"],
};

const networks = [sepolia];

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false,
});

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  defaultNetwork: sepolia,
  allWallets: "SHOW",
  features: {
    analytics: false,
    email: true,
    socials: ["google"],
    emailShowWallets: true,
  },
  themeMode: "dark",
});

const queryClient = new QueryClient();

const coins = [
  ["BTC", "Bitcoin", 64280.12, "+2.14%"],
  ["ETH", "Ethereum", 2487.42, "+1.73%"],
  ["USDC", "USD Coin", 1.0, "+0.01%"],
  ["SOL", "Solana", 151.36, "+3.91%"],
  ["LINK", "Chainlink", 23.42, "-0.62%"],
  ["UNI", "Uniswap", 7.91, "+1.22%"],
];

const pools = [
  { name: "BTC Core", risk: "Low", apy: "Demo", assets: "BTC" },
  { name: "ETH Growth", risk: "Medium", apy: "Demo", assets: "ETH" },
  { name: "Multi-Asset", risk: "Medium", apy: "Demo", assets: "BTC · ETH · SOL" },
  { name: "Stable Yield", risk: "Low", apy: "Demo", assets: "USDC" },
];

function shorten(value) {
  if (!value) return "";
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function WalletStatus() {
  const { address, isConnected, status } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();

  const networkOk = Number(chainId) === 11155111;

  return (
    <div className="wallet-status">
      <div className="status-line">
        <span className={`status-dot ${isConnected ? "on" : ""}`} />
        {isConnected ? "Wallet đã kết nối" : "Wallet chưa kết nối"}
      </div>
      {isConnected && (
        <>
          <div className="wallet-address">{shorten(address)}</div>
          <div className={`network-pill ${networkOk ? "ok" : "bad"}`}>
            {networkOk ? "Ethereum Sepolia" : `Chain ${chainId || "?"}`}
          </div>
        </>
      )}
      {status === "connecting" && <div className="muted">Đang kết nối…</div>}
    </div>
  );
}

function Dashboard() {
  return (
    <div className="page">
      <div className="hero">
        <div>
          <div className="eyebrow">CRYPTOPool · TESTNET</div>
          <h1>Quản lý tài sản crypto, đơn giản hơn.</h1>
          <p>
            Kết nối ví trên PC hoặc điện thoại bằng AppKit/WalletConnect.
            Google và Email được tích hợp trong cùng một cửa sổ kết nối.
          </p>
          <div className="hero-actions">
            <AppKitButton />
            <span className="safe-badge">Không lưu seed phrase</span>
          </div>
        </div>
        <div className="hero-card">
          <div className="hero-card-label">Mạng thử nghiệm</div>
          <strong>Ethereum Sepolia</strong>
          <span>Chain ID 11155111</span>
        </div>
      </div>

      <section className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">MARKET</div>
            <h2>Thị trường</h2>
          </div>
          <span className="muted">Dữ liệu demo</span>
        </div>
        <div className="coin-grid">
          {coins.map(([symbol, name, price, change]) => (
            <div className="coin-card" key={symbol}>
              <div className="coin-top">
                <div className="coin-avatar">{symbol.slice(0, 1)}</div>
                <div>
                  <strong>{symbol}</strong>
                  <span>{name}</span>
                </div>
              </div>
              <div className="coin-price">${price.toLocaleString()}</div>
              <div className={change.startsWith("-") ? "negative" : "positive"}>{change}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">POOLS</div>
            <h2>CryptoPool Demo</h2>
          </div>
        </div>
        <div className="pool-grid">
          {pools.map((pool) => (
            <div className="pool-card" key={pool.name}>
              <div className="pool-top">
                <div>
                  <h3>{pool.name}</h3>
                  <span>{pool.assets}</span>
                </div>
                <span className="risk">{pool.risk}</span>
              </div>
              <div className="pool-bottom">
                <span>Return</span>
                <strong>{pool.apy}</strong>
              </div>
            </div>
          ))}
        </div>
        <div className="warning">
          Đây là giao diện test/demo. Không có cam kết lợi nhuận và chưa thực hiện
          giao dịch tiền thật.
        </div>
      </section>
    </div>
  );
}

function WalletPage() {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!address) return;
    await navigator.clipboard?.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">WALLET</div>
          <h1>Kết nối ví</h1>
          <p>AppKit hỗ trợ desktop và mobile wallet qua WalletConnect.</p>
        </div>
        <AppKitButton />
      </div>

      <div className="wallet-panel">
        <WalletStatus />
        {!isConnected ? (
          <div className="empty-state">
            <div className="big-icon">◎</div>
            <h2>Chọn ví hoặc Google / Email</h2>
            <p>
              Nhấn nút kết nối để mở danh sách wallet. Trên điện thoại, AppKit
              sẽ chuyển sang luồng WalletConnect phù hợp thay vì phụ thuộc
              vào <code>window.ethereum</code>.
            </p>
            <AppKitButton />
          </div>
        ) : (
          <div className="connected-box">
            <div className="check-icon">✓</div>
            <h2>Đã kết nối thành công</h2>
            <div className="address-box">
              <span>{address}</span>
              <button onClick={copy}>{copied ? "Đã copy" : "Copy"}</button>
            </div>
            <div className="info-grid">
              <div><span>Network</span><strong>{Number(chainId) === 11155111 ? "Sepolia" : chainId}</strong></div>
              <div><span>Chain ID</span><strong>{chainId}</strong></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Markets() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">MARKETS</div>
          <h1>Top assets</h1>
          <p>Dữ liệu giá mẫu để kiểm thử giao diện.</p>
        </div>
      </div>
      <div className="market-table">
        <div className="market-row market-header"><span>Asset</span><span>Price</span><span>24h</span></div>
        {coins.map(([symbol, name, price, change]) => (
          <div className="market-row" key={symbol}>
            <span><b>{symbol}</b> <small>{name}</small></span>
            <span>${price.toLocaleString()}</span>
            <span className={change.startsWith("-") ? "negative" : "positive"}>{change}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Trade() {
  const { isConnected } = useAppKitAccount();
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState(false);

  function demoTrade() {
    if (!isConnected) return;
    setDone(true);
    setTimeout(() => setDone(false), 2200);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">TESTNET TRADE</div>
          <h1>Trade</h1>
          <p>Chỉ mô phỏng. Không gửi transaction và không dùng tiền thật.</p>
        </div>
        <AppKitButton />
      </div>
      <div className="trade-panel">
        <label>Số tiền demo</label>
        <input
          className="amount-input"
          inputMode="decimal"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="trade-note">Wallet: {isConnected ? "Connected" : "Not connected"}</div>
        <button className="primary-button" disabled={!isConnected || !amount} onClick={demoTrade}>
          {done ? "✓ Demo order created" : "Tạo lệnh demo"}
        </button>
        <div className="warning">Không có giao dịch blockchain nào được gửi.</div>
      </div>
    </div>
  );
}

function Portfolio() {
  const { address, isConnected } = useAppKitAccount();
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">PORTFOLIO</div>
          <h1>Portfolio</h1>
          <p>Thông tin tài khoản demo.</p>
        </div>
      </div>
      <div className="portfolio-card">
        <span>Tổng giá trị demo</span>
        <strong>$10,000.00</strong>
        <div className="portfolio-notice">
          {isConnected ? `Ví ${shorten(address)} đã kết nối.` : "Kết nối ví để hiển thị địa chỉ."}
        </div>
      </div>
    </div>
  );
}

function App() {
  const [tab, setTab] = useState("dashboard");
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const content = useMemo(() => {
    if (tab === "markets") return <Markets />;
    if (tab === "trade") return <Trade />;
    if (tab === "portfolio") return <Portfolio />;
    if (tab === "wallet") return <WalletPage />;
    return <Dashboard />;
  }, [tab]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div><strong>CryptoPool</strong><span>TESTNET</span></div>
        </div>
        <nav>
          {[
            ["dashboard", "Dashboard"],
            ["markets", "Markets"],
            ["trade", "Trade"],
            ["portfolio", "Portfolio"],
            ["wallet", "Wallet"],
          ].map(([id, label]) => (
            <button className={tab === id ? "active" : ""} key={id} onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <WalletStatus />
          <button className="theme-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="mobile-brand">CryptoPool</div>
          <AppKitButton />
        </header>
        {content}
      </main>

      <nav className="mobile-nav">
        {[
          ["dashboard", "⌂", "Home"],
          ["markets", "◈", "Markets"],
          ["trade", "↕", "Trade"],
          ["portfolio", "▣", "Portfolio"],
          ["wallet", "◎", "Wallet"],
        ].map(([id, icon, label]) => (
          <button className={tab === id ? "active" : ""} key={id} onClick={() => setTab(id)}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </nav>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
