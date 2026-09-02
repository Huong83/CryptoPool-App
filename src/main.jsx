import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  createAppKit,
  AppKitButton,
  useAppKitAccount
} from "@reown/appkit/react";

import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";

import {
  sepolia
} from "@reown/appkit/networks";

import {
  WagmiProvider,
  useAccount,
  useBalance,
  useChainId
} from "wagmi";

import {
  QueryClient,
  QueryClientProvider
} from "@tanstack/react-query";

import "./style.css";

/* =========================================================
   CRYPTOPOOL 2.1
   PC + ANDROID + IOS
   ETHEREUM SEPOLIA TESTNET
   ========================================================= */

/*
  IMPORTANT:
  Replace this value with your Reown Project ID.

  Do NOT put a seed phrase or private key here.
*/
const projectId = "PROJECT_ID_ff3f925ac7d1161fbe3707bc77b3d9fe";

const queryClient = new QueryClient();

/* =========================================================
   NETWORK
   ========================================================= */

const networks = [sepolia];

const metadata = {
  name: "CryptoPool",
  description: "CryptoPool 2.1 Testnet",
  url: "https://huong83.github.io/CryptoPool-App/",
  icons: [
    "https://avatars.githubusercontent.com/u/179229932"
  ]
};

/* =========================================================
   WAGMI ADAPTER
   ========================================================= */

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true
});

/* =========================================================
   APPKIT
   ========================================================= */

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: false
  }
});

/* =========================================================
   FALLBACK MARKET DATA
   ========================================================= */

const FALLBACK = [
  {
    rank: 1,
    symbol: "BTC",
    name: "Bitcoin",
    price: 65000,
    change: 2.15
  },
  {
    rank: 2,
    symbol: "ETH",
    name: "Ethereum",
    price: 3400,
    change: 1.82
  },
  {
    rank: 3,
    symbol: "USDT",
    name: "Tether",
    price: 1,
    change: 0.01
  },
  {
    rank: 4,
    symbol: "BNB",
    name: "BNB",
    price: 580,
    change: -0.52
  },
  {
    rank: 5,
    symbol: "SOL",
    name: "Solana",
    price: 145,
    change: 3.42
  },
  {
    rank: 6,
    symbol: "USDC",
    name: "USD Coin",
    price: 1,
    change: -0.01
  }
];

const CMC_API =
  "https://pro-api.coinmarketcap.com/public-api";

/* =========================================================
   WALLET PANEL
   ========================================================= */

function WalletStatus() {
  const { address, isConnected } = useAccount();

  const chainId = useChainId();

  const { data: balance } = useBalance({
    address
  });

  if (!isConnected) {
    return (
      <div className="wallet-card">
        <div className="wallet-card-title">
          Wallet
        </div>

        <div className="wallet-disconnected">
          <div className="wallet-icon">
            👛
          </div>

          <div>
            <strong>Chưa kết nối ví</strong>
            <p>
              Hỗ trợ PC, Android và iOS
            </p>
          </div>
        </div>

        <div className="wallet-connect-large">
          <AppKitButton />
        </div>
      </div>
    );
  }

  const shortAddress =
    address
      ? `${address.slice(0, 6)}...${address.slice(-4)}`
      : "";

  const balanceText =
    balance
      ? `${Number(balance.formatted).toFixed(5)} ${balance.symbol}`
      : "Đang tải...";

  return (
    <div className="wallet-card connected">
      <div className="wallet-card-title">
        Wallet Connected
      </div>

      <div className="wallet-address">
        <span className="status-dot"></span>

        <strong>{shortAddress}</strong>
      </div>

      <div className="wallet-info-grid">
        <div>
          <span>Network</span>
          <strong>
            {chainId === 11155111
              ? "Sepolia"
              : `Chain ${chainId}`}
          </strong>
        </div>

        <div>
          <span>Balance</span>
          <strong>{balanceText}</strong>
        </div>
      </div>

      <AppKitButton />
    </div>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard({
  coins,
  loading,
  error,
  onRefresh,
  onTrade
}) {
  const topCoins = coins.slice(0, 6);

  return (
    <div className="page">
      <div className="hero">
        <div>
          <div className="eyebrow">
            CRYPTOPOOL 2.1
          </div>

          <h1>
            Crypto investing
            <br />
            <span>Testnet platform</span>
          </h1>

          <p>
            Kết nối ví thật trên PC, Android và iOS
            để thử nghiệm CryptoPool trên Ethereum
            Sepolia Testnet.
          </p>

          <div className="hero-actions">
            <AppKitButton />

            <button
              className="secondary-button"
              onClick={onRefresh}
            >
              {loading ? "Đang tải..." : "↻ Market"}
            </button>
          </div>
        </div>

        <div className="hero-badge">
          <div className="pulse"></div>

          <strong>TESTNET</strong>

          <span>
            Ethereum Sepolia
          </span>
        </div>
      </div>

      {error && (
        <div className="alert">
          ⚠️ {error}
        </div>
      )}

      <WalletStatus />

      <div className="section-heading">
        <div>
          <h2>Market</h2>
          <p>Dữ liệu thị trường tham khảo</p>
        </div>
      </div>

      <div className="coin-grid">
        {topCoins.map((coin) => (
          <div
            className="coin-card"
            key={coin.symbol}
          >
            <div className="coin-top">
              <div className="coin-avatar">
                {coin.symbol.slice(0, 1)}
              </div>

              <div>
                <strong>{coin.name}</strong>
                <span>{coin.symbol}</span>
              </div>
            </div>

            <div className="coin-price">
              ${formatPrice(coin.price)}
            </div>

            <div
              className={
                coin.change >= 0
                  ? "positive"
                  : "negative"
              }
            >
              {coin.change >= 0 ? "+" : ""}
              {coin.change.toFixed(2)}%
            </div>

            <button
              className="trade-small"
              onClick={() => onTrade(coin)}
            >
              Trade Testnet
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   MARKETS
   ========================================================= */

function Markets({ coins, onTrade }) {
  const [search, setSearch] = useState("");

  const filtered = coins.filter((coin) => {
    const value =
      `${coin.name} ${coin.symbol}`.toLowerCase();

    return value.includes(search.toLowerCase());
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            MARKET
          </div>

          <h1>Crypto Markets</h1>

          <p>
            Theo dõi tài sản crypto trước khi
            thực hiện giao dịch testnet.
          </p>
        </div>
      </div>

      <div className="search-box">
        🔎

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Tìm Bitcoin, Ethereum..."
        />
      </div>

      <div className="market-table">
        <div className="market-row market-header">
          <span>#</span>
          <span>Asset</span>
          <span>Price</span>
          <span>24h</span>
          <span></span>
        </div>

        {filtered.map((coin) => (
          <div
            className="market-row"
            key={coin.symbol}
          >
            <span>{coin.rank}</span>

            <div className="asset-name">
              <div className="coin-avatar small">
                {coin.symbol.slice(0, 1)}
              </div>

              <div>
                <strong>{coin.name}</strong>
                <span>{coin.symbol}</span>
              </div>
            </div>

            <strong>
              ${formatPrice(coin.price)}
            </strong>

            <span
              className={
                coin.change >= 0
                  ? "positive"
                  : "negative"
              }
            >
              {coin.change >= 0 ? "+" : ""}
              {coin.change.toFixed(2)}%
            </span>

            <button
              className="table-button"
              onClick={() => onTrade(coin)}
            >
              Trade
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   TRADE
   ========================================================= */

function Trade({ selectedCoin }) {
  const [amount, setAmount] = useState("");

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            TESTNET TRADE
          </div>

          <h1>Trade</h1>

          <p>
            Mô phỏng giao dịch trên Sepolia.
            Chưa sử dụng tiền thật.
          </p>
        </div>
      </div>

      <div className="trade-layout">
        <div className="trade-panel">
          <div className="trade-panel-head">
            <div>
              <span>Swap from</span>
              <strong>ETH</strong>
            </div>

            <div className="token-icon">
              Ξ
            </div>
          </div>

          <input
            className="amount-input"
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value)
            }
            placeholder="0.00"
            inputMode="decimal"
          />

          <div className="swap-arrow">
            ↓
          </div>

          <div className="trade-panel-head">
            <div>
              <span>Swap to</span>
              <strong>
                {selectedCoin?.symbol || "USDC"}
              </strong>
            </div>

            <div className="token-icon">
              $
            </div>
          </div>

          <div className="amount-output">
            {amount
              ? "Testnet quote"
              : "0.00"}
          </div>

          <AppKitButton />

          <div className="trade-warning">
            🧪 TESTNET ONLY
            <br />
            Giao dịch thật chưa được kích hoạt.
          </div>
        </div>

        <div className="trade-info">
          <h2>Pre-transaction checks</h2>

          <CheckItem
            title="Wallet"
            value="Kiểm tra trước giao dịch"
          />

          <CheckItem
            title="Network"
            value="Ethereum Sepolia"
          />

          <CheckItem
            title="Gas"
            value="Testnet ETH"
          />

          <CheckItem
            title="Slippage"
            value="Sẽ được kiểm tra trước khi ký"
          />

          <CheckItem
            title="Simulation"
            value="Sẽ được bổ sung trước swap thật"
          />
        </div>
      </div>
    </div>
  );
}

function CheckItem({ title, value }) {
  return (
    <div className="check-item">
      <div className="check-icon">
        ✓
      </div>

      <div>
        <strong>{title}</strong>
        <span>{value}</span>
      </div>
    </div>
  );
}

/* =========================================================
   PORTFOLIO
   ========================================================= */

function Portfolio() {
  const { address } = useAccount();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            PORTFOLIO
          </div>

          <h1>Your Portfolio</h1>

          <p>
            Ví testnet được kết nối trực tiếp,
            không lưu private key.
          </p>
        </div>
      </div>

      {!address ? (
        <div className="empty-state">
          <div>👛</div>

          <h2>Connect your wallet</h2>

          <p>
            Kết nối ví để xem số dư Sepolia.
          </p>

          <AppKitButton />
        </div>
      ) : (
        <div className="portfolio-card">
          <WalletStatus />

          <div className="portfolio-notice">
            🛡️ CryptoPool không có quyền lấy
            private key hoặc seed phrase của bạn.
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   ORDERS
   ========================================================= */

function Orders() {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            TRANSACTIONS
          </div>

          <h1>Orders</h1>

          <p>
            Lịch sử giao dịch testnet sẽ xuất hiện
            tại đây.
          </p>
        </div>
      </div>

      <div className="empty-state">
        <div>📋</div>

        <h2>No testnet orders</h2>

        <p>
          Chưa có giao dịch testnet nào.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   APP
   ========================================================= */

function App() {
  const [page, setPage] =
    useState("Dashboard");

  const [coins, setCoins] =
    useState(FALLBACK);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [dark, setDark] =
    useState(true);

  const [selectedCoin, setSelectedCoin] =
    useState(null);

  async function loadMarket() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${CMC_API}/v3/cryptocurrency/listings/latest?start=1&limit=100&convert=USD`
      );

      if (!response.ok) {
        throw new Error(
          "Market API không phản hồi."
        );
      }

      const json = await response.json();

      const data =
        json?.data?.map((item) => ({
          rank: item.cmc_rank,
          symbol: item.symbol,
          name: item.name,
          price:
            item.quote?.USD?.price || 0,
          change:
            item.quote?.USD?.percent_change_24h ||
            0
        })) || [];

      if (data.length) {
        setCoins(data);
      }
    } catch (err) {
      setError(
        "Không lấy được dữ liệu thị trường. Đang sử dụng dữ liệu dự phòng."
      );

      setCoins(FALLBACK);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMarket();

    const timer = setInterval(
      loadMarket,
      60000
    );

    return () => clearInterval(timer);
  }, []);

  const openTrade = (coin) => {
    setSelectedCoin(coin);
    setPage("Trade");
  };

  const menu = [
    {
      name: "Dashboard",
      icon: "⌂"
    },
    {
      name: "Markets",
      icon: "◈"
    },
    {
      name: "Trade",
      icon: "⇄"
    },
    {
      name: "Portfolio",
      icon: "◫"
    },
    {
      name: "Orders",
      icon: "☷"
    }
  ];

  return (
    <div
      className={
        dark
          ? "app dark"
          : "app light"
      }
    >
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            C
          </div>

          <div>
            <strong>CryptoPool</strong>
            <span>2.1 TESTNET</span>
          </div>
        </div>

        <div className="top-actions">
          <div className="network-pill">
            <span></span>
            Sepolia
          </div>

          <button
            className="theme-button"
            onClick={() =>
              setDark(!dark)
            }
          >
            {dark ? "☀" : "☾"}
          </button>

          <AppKitButton />
        </div>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <nav>
            {menu.map((item) => (
              <button
                key={item.name}
                className={
                  page === item.name
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  setPage(item.name)
                }
              >
                <span>{item.icon}</span>
                {item.name}
              </button>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <div className="testnet-box">
              <div className="testnet-status">
                <span></span>
                TESTNET MODE
              </div>

              <p>
                Ethereum Sepolia
              </p>

              <small>
                No real funds
              </small>
            </div>
          </div>
        </aside>

        <main>
          {page === "Dashboard" && (
            <Dashboard
              coins={coins}
              loading={loading}
              error={error}
              onRefresh={loadMarket}
              onTrade={openTrade}
            />
          )}

          {page === "Markets" && (
            <Markets
              coins={coins}
              onTrade={openTrade}
            />
          )}

          {page === "Trade" && (
            <Trade
              selectedCoin={selectedCoin}
            />
          )}

          {page === "Portfolio" && (
            <Portfolio />
          )}

          {page === "Orders" && (
            <Orders />
          )}
        </main>
      </div>

      <footer className="footer">
        CryptoPool 2.1 · Ethereum Sepolia
        Testnet · No guaranteed returns
      </footer>
    </div>
  );
}

/* =========================================================
   HELPERS
   ========================================================= */

function formatPrice(value) {
  if (!Number.isFinite(value)) {
    return "0.00";
  }

  if (value >= 1000) {
    return value.toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 2
      }
    );
  }

  if (value >= 1) {
    return value.toFixed(2);
  }

  return value.toFixed(6);
}

/* =========================================================
   PROVIDERS
   ========================================================= */

function Root() {
  return (
    <WagmiProvider
      config={wagmiAdapter.wagmiConfig}
    >
      <QueryClientProvider
        client={queryClient}
      >
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
