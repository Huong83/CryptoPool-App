import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API =
  "https://pro-api.coinmarketcap.com/public-api";

const SEPOLIA_CHAIN_ID = "0xaa36a7";
const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;

const FALLBACK = [
  {
    id: 1,
    name: "Bitcoin",
    symbol: "BTC",
    quote: { USD: { price: 76000, percent_change_24h: 1.2 } },
  },
  {
    id: 1027,
    name: "Ethereum",
    symbol: "ETH",
    quote: { USD: { price: 2370, percent_change_24h: 0.8 } },
  },
  {
    id: 825,
    name: "Tether",
    symbol: "USDT",
    quote: { USD: { price: 1, percent_change_24h: 0.01 } },
  },
  {
    id: 1839,
    name: "BNB",
    symbol: "BNB",
    quote: { USD: { price: 690, percent_change_24h: -0.4 } },
  },
  {
    id: 52,
    name: "XRP",
    symbol: "XRP",
    quote: { USD: { price: 2.9, percent_change_24h: 2.1 } },
  },
];

const INITIAL_PORTFOLIO = [
  {
    symbol: "ETH",
    amount: 0,
    value: 0,
  },
];

const DEXES = [
  {
    name: "Uniswap",
    description: "Decentralized exchange",
  },
  {
    name: "PancakeSwap",
    description: "Decentralized exchange",
  },
  {
    name: "Curve",
    description: "Liquidity-focused DEX",
  },
];

function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatUSD(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatNumber(value, digits = 4) {
  return Number(value || 0).toLocaleString("en-US", {
    maximumFractionDigits: digits,
  });
}

function App() {
  const [page, setPage] = useState("Dashboard");

  const [coins, setCoins] = useState(FALLBACK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [dark, setDark] = useState(true);

  // Testnet wallet state
  const [wallet, setWallet] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [walletBalance, setWalletBalance] = useState("0");
  const [walletError, setWalletError] = useState("");
  const [walletLoading, setWalletLoading] = useState(false);

  const [portfolio, setPortfolio] =
    useState(INITIAL_PORTFOLIO);

  const [orders, setOrders] = useState([]);

  const [selectedCoin, setSelectedCoin] = useState(null);
  const [search, setSearch] = useState("");

  const [selectedDex, setSelectedDex] =
    useState("Uniswap");

  const [tradeAmount, setTradeAmount] = useState("");

  /*
   * ----------------------------------------
   * MARKET DATA
   * ----------------------------------------
   */

  async function loadMarket() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API}/v3/cryptocurrency/listings/latest?start=1&limit=100&convert=USD`
      );

      if (!response.ok) {
        throw new Error("Market API unavailable");
      }

      const json = await response.json();

      if (json?.data?.length) {
        setCoins(json.data);
      } else {
        throw new Error("No market data");
      }
    } catch (err) {
      console.log("Using fallback market data:", err);
      setError(
        "Live market data is temporarily unavailable. Showing fallback data."
      );
      setCoins(FALLBACK);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMarket();

    const timer = setInterval(() => {
      loadMarket();
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  /*
   * ----------------------------------------
   * WALLET / TESTNET
   * ----------------------------------------
   */

  const ethereum =
    typeof window !== "undefined"
      ? window.ethereum
      : null;

  async function readWalletState(addressOverride = null) {
    if (!ethereum) {
      setWallet(false);
      setWalletError(
        "No compatible browser wallet was detected."
      );
      return;
    }

    try {
      const accounts =
        await ethereum.request({
          method: "eth_accounts",
        });

      const address =
        addressOverride || accounts?.[0];

      const currentChain =
        await ethereum.request({
          method: "eth_chainId",
        });

      setChainId(currentChain || "");

      if (!address) {
        setWallet(false);
        setWalletAddress("");
        setWalletBalance("0");
        return;
      }

      setWallet(true);
      setWalletAddress(address);

      const balanceHex =
        await ethereum.request({
          method: "eth_getBalance",
          params: [address, "latest"],
        });

      const balanceWei = BigInt(balanceHex || "0x0");

      const whole =
        balanceWei / 1000000000000000000n;

      const fraction =
        balanceWei % 1000000000000000000n;

      const fractionText =
        fraction
          .toString()
          .padStart(18, "0")
          .slice(0, 6);

      setWalletBalance(
        `${whole.toString()}.${fractionText}`
      );

      if (currentChain !== SEPOLIA_CHAIN_ID) {
        setWalletError(
          "Wallet connected, but it is not on Sepolia Testnet."
        );
      } else {
        setWalletError("");
      }
    } catch (err) {
      console.error(err);
      setWalletError(
        "Unable to read wallet information."
      );
    }
  }

  async function connectWallet() {
    setWalletError("");

    if (!ethereum) {
      setWalletError(
        "Please install or open a compatible Web3 wallet such as MetaMask."
      );
      return;
    }

    setWalletLoading(true);

    try {
      const accounts =
        await ethereum.request({
          method: "eth_requestAccounts",
        });

      const address = accounts?.[0];

      if (!address) {
        throw new Error("No wallet account selected.");
      }

      setWalletAddress(address);
      setWallet(true);

      await switchToSepolia();
      await readWalletState(address);
    } catch (err) {
      console.error(err);

      if (err?.code === 4001) {
        setWalletError(
          "Wallet connection was cancelled."
        );
      } else {
        setWalletError(
          err?.message ||
            "Unable to connect wallet."
        );
      }
    } finally {
      setWalletLoading(false);
    }
  }

  async function switchToSepolia() {
    if (!ethereum) return false;

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [
          {
            chainId: SEPOLIA_CHAIN_ID,
          },
        ],
      });

      setChainId(SEPOLIA_CHAIN_ID);
      return true;
    } catch (err) {
      console.error(err);

      if (err?.code === 4902) {
        setWalletError(
          "Sepolia is not available in this wallet. Please add Ethereum Sepolia Testnet manually."
        );
      } else if (err?.code === 4001) {
        setWalletError(
          "Network switch was cancelled."
        );
      } else {
        setWalletError(
          err?.message ||
            "Unable to switch to Sepolia."
        );
      }

      return false;
    }
  }

  async function disconnectWallet() {
    /*
     * Browser wallets normally do not expose
     * a programmatic disconnect method.
     *
     * We simply clear CryptoPool's local UI state.
     * The wallet itself remains controlled by the user.
     */

    setWallet(false);
    setWalletAddress("");
    setWalletBalance("0");
    setChainId("");
    setWalletError("");
  }

  useEffect(() => {
    if (!ethereum) return;

    readWalletState();

    const handleAccountsChanged = (accounts) => {
      const address = accounts?.[0] || "";

      if (!address) {
        setWallet(false);
        setWalletAddress("");
        setWalletBalance("0");
        return;
      }

      readWalletState(address);
    };

    const handleChainChanged = (newChainId) => {
      setChainId(newChainId);

      if (walletAddress) {
        readWalletState(walletAddress);
      }
    };

    ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    ethereum.on(
      "chainChanged",
      handleChainChanged
    );

    return () => {
      ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );

      ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );
    };
  }, [ethereum, walletAddress]);

  /*
   * ----------------------------------------
   * MARKET FILTER
   * ----------------------------------------
   */

  const filteredCoins = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    if (!query) return coins;

    return coins.filter((coin) =>
      `${coin.name} ${coin.symbol}`
        .toLowerCase()
        .includes(query)
    );
  }, [coins, search]);

  /*
   * ----------------------------------------
   * PORTFOLIO
   * ----------------------------------------
   */

  const portfolioValue = useMemo(() => {
    return portfolio.reduce(
      (total, item) => {
        const coin = coins.find(
          (c) =>
            c.symbol.toUpperCase() ===
            item.symbol.toUpperCase()
        );

        if (!coin) return total;

        const price =
          coin.quote?.USD?.price || 0;

        return (
          total +
          Number(item.amount || 0) * price
        );
      },
      0
    );
  }, [portfolio, coins]);

  /*
   * ----------------------------------------
   * NAVIGATION
   * ----------------------------------------
   */

  function navigate(destination) {
    setPage(destination);
  }

  /*
   * ----------------------------------------
   * TRADE DEMO PLACEHOLDER
   * ----------------------------------------
   *
   * IMPORTANT:
   * This is intentionally NOT a blockchain
   * transaction yet.
   *
   * The next 2.1B stage will replace this with
   * an actual testnet swap after contracts,
   * token addresses, quote and transaction
   * simulation are verified.
   */

  function openTrade(coin) {
    setSelectedCoin(coin);
    setPage("Trade");
  }

  function executeDemoTrade() {
    if (!selectedCoin) {
      setWalletError(
        "Select a token before creating an order."
      );
      return;
    }

    const amount =
      Number(tradeAmount || 0);

    if (amount <= 0) {
      setWalletError(
        "Enter a valid test amount."
      );
      return;
    }

    const newOrder = {
      id: Date.now(),
      type: "TESTNET PREVIEW",
      dex: selectedDex,
      symbol: selectedCoin.symbol,
      amount,
      status: "Preview",
      time: new Date().toLocaleString(),
    };

    setOrders((current) => [
      newOrder,
      ...current,
    ]);

    setTradeAmount("");

    alert(
      "Testnet preview created. No blockchain transaction was sent."
    );
  }

  /*
   * ----------------------------------------
   * RISK SCORE
   * ----------------------------------------
   */

  function getRiskScore(coin) {
    const change =
      Math.abs(
        Number(
          coin?.quote?.USD?.percent_change_24h ||
            0
        )
      );

    if (change >= 10) {
      return {
        label: "High",
        score: 80,
      };
    }

    if (change >= 5) {
      return {
        label: "Medium",
        score: 55,
      };
    }

    return {
      label: "Lower",
      score: 30,
    };
  }

  /*
   * ----------------------------------------
   * UI
   * ----------------------------------------
   */

  return (
    <div
      className={
        dark
          ? "app dark"
          : "app"
      }
    >
      <header className="topbar">
        <div className="brand">
          <div className="logo">
            CP
          </div>

          <div>
            <strong>
              CryptoPool
            </strong>

            <span>
              Web3 Portfolio Platform
            </span>
          </div>
        </div>

        <div className="top-actions">
          <div className="network-badge">
            🧪 SEPOLIA TESTNET
          </div>

          <button
            className="theme-button"
            onClick={() =>
              setDark((value) => !value)
            }
          >
            {dark ? "☀️" : "🌙"}
          </button>

          {!wallet ? (
            <button
              className="primary-button"
              onClick={connectWallet}
              disabled={walletLoading}
            >
              {walletLoading
                ? "Connecting..."
                : "Connect Wallet"}
            </button>
          ) : (
            <button
              className="wallet-button"
              onClick={disconnectWallet}
            >
              🟢 {shortAddress(walletAddress)}
            </button>
          )}
        </div>
      </header>

      <div className="testnet-banner">
        <strong>
          🧪 TESTNET MODE
        </strong>

        <span>
          CryptoPool is currently connected to
          Ethereum Sepolia. Do not use real funds.
        </span>

        <span>
          Chain ID: {SEPOLIA_CHAIN_ID_DECIMAL}
        </span>
      </div>

      {walletError && (
        <div className="alert-box">
          ⚠️ {walletError}
        </div>
      )}

      <div className="layout">
        <aside className="sidebar">
          <button
            className={
              page === "Dashboard"
                ? "nav active"
                : "nav"
            }
            onClick={() =>
              navigate("Dashboard")
            }
          >
            🏠 Dashboard
          </button>

          <button
            className={
              page === "Markets"
                ? "nav active"
                : "nav"
            }
            onClick={() =>
              navigate("Markets")
            }
          >
            📈 Markets
          </button>

          <button
            className={
              page === "Trade"
                ? "nav active"
                : "nav"
            }
            onClick={() =>
              navigate("Trade")
            }
          >
            🔄 Trade
          </button>

          <button
            className={
              page === "Portfolio"
                ? "nav active"
                : "nav"
            }
            onClick={() =>
              navigate("Portfolio")
            }
          >
            💼 Portfolio
          </button>

          <button
            className={
              page === "Orders"
                ? "nav active"
                : "nav"
            }
            onClick={() =>
              navigate("Orders")
            }
          >
            📋 Orders
          </button>

          <div className="sidebar-bottom">
            <div className="security-card">
              <strong>
                🔐 Non-custodial
              </strong>

              <p>
                CryptoPool never asks for your
                seed phrase or private key.
              </p>
            </div>
          </div>
        </aside>

        <main className="content">
          {page === "Dashboard" && (
            <>
              <section className="hero">
                <div>
                  <div className="eyebrow">
                    CRYPTOPOOL 2.1
                  </div>

                  <h1>
                    Testnet Web3
                    <br />
                    Trading Infrastructure
                  </h1>

                  <p>
                    Connect your wallet and test
                    CryptoPool safely on Sepolia
                    before any mainnet integration.
                  </p>

                  <button
                    className="primary-button large"
                    onClick={() =>
                      navigate("Trade")
                    }
                  >
                    Open Testnet Trade
                  </button>
                </div>

                <div className="hero-card">
                  <div className="hero-card-title">
                    Wallet Status
                  </div>

                  <div className="hero-number">
                    {wallet
                      ? "CONNECTED"
                      : "NOT CONNECTED"}
                  </div>

                  <div className="hero-sub">
                    {wallet
                      ? shortAddress(
                          walletAddress
                        )
                      : "Connect a Web3 wallet"}
                  </div>
                </div>
              </section>

              <section className="stats-grid">
                <div className="stat-card">
                  <span>
                    Wallet
                  </span>

                  <strong>
                    {wallet
                      ? shortAddress(
                          walletAddress
                        )
                      : "Not connected"}
                  </strong>
                </div>

                <div className="stat-card">
                  <span>
                    Network
                  </span>

                  <strong>
                    {chainId ===
                    SEPOLIA_CHAIN_ID
                      ? "Sepolia"
                      : "Wrong / Unknown"}
                  </strong>
                </div>

                <div className="stat-card">
                  <span>
                    Sepolia ETH
                  </span>

                  <strong>
                    {formatNumber(
                      walletBalance,
                      6
                    )}
                  </strong>
                </div>

                <div className="stat-card">
                  <span>
                    Portfolio
                  </span>

                  <strong>
                    {formatUSD(
                      portfolioValue
                    )}
                  </strong>
                </div>
              </section>

              <section className="section">
                <div className="section-header">
                  <div>
                    <h2>
                      Market Intelligence
                    </h2>

                    <p>
                      Live crypto market data
                      with a simple volatility
                      indicator.
                    </p>
                  </div>

                  <button
                    className="secondary-button"
                    onClick={loadMarket}
                  >
                    {loading
                      ? "Updating..."
                      : "Refresh"}
                  </button>
                </div>

                {error && (
                  <div className="muted-note">
                    {error}
                  </div>
                )}

                <div className="coin-grid">
                  {coins
                    .slice(0, 6)
                    .map((coin) => {
                      const risk =
                        getRiskScore(coin);

                      const change =
                        Number(
                          coin.quote?.USD
                            ?.percent_change_24h ||
                            0
                        );

                      return (
                        <button
                          key={coin.id}
                          className="coin-card"
                          onClick={() =>
                            openTrade(
                              coin
                            )
                          }
                        >
                          <div className="coin-top">
                            <div>
                              <strong>
                                {coin.symbol}
                              </strong>

                              <span>
                                {coin.name}
                              </span>
                            </div>

                            <div className="risk-pill">
                              {risk.label}
                            </div>
                          </div>

                          <div className="coin-price">
                            {formatUSD(
                              coin
                                .quote?.USD
                                ?.price
                            )}
                          </div>

                          <div
                            className={
                              change >= 0
                                ? "positive"
                                : "negative"
                            }
                          >
                            {change >= 0
                              ? "+"
                              : ""}
                            {change.toFixed(
                              2
                            )}
                            %
                          </div>
                        </button>
                      );
                    })}
                </div>
              </section>
            </>
          )}

          {page === "Markets" && (
            <section className="section">
              <div className="section-header">
                <div>
                  <h1>
                    Top Crypto Markets
                  </h1>

                  <p>
                    Market data from
                    CoinMarketCap public API.
                  </p>
                </div>

                <button
                  className="secondary-button"
                  onClick={loadMarket}
                >
                  Refresh
                </button>
              </div>

              <input
                className="search"
                placeholder="Search Bitcoin, ETH, SOL..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Asset</th>
                      <th>Price</th>
                      <th>24h</th>
                      <th>Risk</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCoins.map(
                      (coin, index) => {
                        const risk =
                          getRiskScore(
                            coin
                          );

                        const change =
                          Number(
                            coin.quote?.USD
                              ?.percent_change_24h ||
                              0
                          );

                        return (
                          <tr
                            key={
                              coin.id
                            }
                          >
                            <td>
                              {index + 1}
                            </td>

                            <td>
                              <strong>
                                {
                                  coin
                                    .symbol
                                }
                              </strong>

                              <span className="table-name">
                                {
                                  coin
                                    .name
                                }
                              </span>
                            </td>

                            <td>
                              {formatUSD(
                                coin
                                  .quote
                                  ?.USD
                                  ?.price
                              )}
                            </td>

                            <td
                              className={
                                change >=
                                0
                                  ? "positive"
                                  : "negative"
                              }
                            >
                              {change >=
                              0
                                ? "+"
                                : ""}
                              {change.toFixed(
                                2
                              )}
                              %
                            </td>

                            <td>
                              <span className="risk-pill">
                                {
                                  risk.label
                                }
                              </span>
                            </td>

                            <td>
                              <button
                                className="small-button"
                                onClick={() =>
                                  openTrade(
                                    coin
                                  )
                                }
                              >
                                Trade
                              </button>
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {page === "Trade" && (
            <section className="section">
              <div className="section-header">
                <div>
                  <h1>
                    Testnet Trade
                  </h1>

                  <p>
                    Prepare your testnet
                    transaction.
                  </p>
                </div>

                <div className="network-badge">
                  🧪 Sepolia
                </div>
              </div>

              <div className="trade-layout">
                <div className="trade-card">
                  <label>
                    Select Asset
                  </label>

                  <select
                    value={
                      selectedCoin?.symbol ||
                      ""
                    }
                    onChange={(event) => {
                      const coin =
                        coins.find(
                          (item) =>
                            item.symbol ===
                            event.target
                              .value
                        );

                      setSelectedCoin(
                        coin || null
                      );
                    }}
                  >
                    <option value="">
                      Select token
                    </option>

                    {coins
                      .slice(0, 20)
                      .map((coin) => (
                        <option
                          key={coin.id}
                          value={
                            coin.symbol
                          }
                        >
                          {coin.symbol} —{" "}
                          {coin.name}
                        </option>
                      ))}
                  </select>

                  <label>
                    Test Amount
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={
                      tradeAmount
                    }
                    onChange={(event) =>
                      setTradeAmount(
                        event.target
                          .value
                      )
                    }
                  />

                  <label>
                    DEX
                  </label>

                  <div className="dex-grid">
                    {DEXES.map(
                      (dex) => (
                        <button
                          key={
                            dex.name
                          }
                          className={
                            selectedDex ===
                            dex.name
                              ? "dex-card selected"
                              : "dex-card"
                          }
                          onClick={() =>
                            setSelectedDex(
                              dex.name
                            )
                          }
                        >
                          <strong>
                            {
                              dex.name
                            }
                          </strong>

                          <span>
                            {
                              dex.description
                            }
                          </span>
                        </button>
                      )
                    )}
                  </div>

                  <button
                    className="primary-button full"
                    onClick={
                      executeDemoTrade
                    }
                  >
                    Create Testnet
                    Preview
                  </button>

                  <div className="warning-card">
                    ⚠️ This button currently
                    creates a transaction
                    preview only. It does NOT
                    send a blockchain transaction.
                  </div>
                </div>

                <div className="info-card">
                  <h3>
                    Transaction Safety
                  </h3>

                  <div className="check">
                    <span>✓</span>
                    Wallet connection
                  </div>

                  <div className="check">
                    <span>✓</span>
                    Sepolia network
                  </div>

                  <div className="check">
                    <span>✓</span>
                    Non-custodial wallet
                  </div>

                  <div className="check pending">
                    <span>○</span>
                    Token verification
                  </div>

                  <div className="check pending">
                    <span>○</span>
                    Quote
                  </div>

                  <div className="check pending">
                    <span>○</span>
                    Slippage check
                  </div>

                  <div className="check pending">
                    <span>○</span>
                    Gas estimation
                  </div>

                  <div className="check pending">
                    <span>○</span>
                    Transaction simulation
                  </div>

                  <p className="muted-note">
                    These remaining checks
                    will be implemented before
                    CryptoPool sends an actual
                    testnet swap.
                  </p>
                </div>
              </div>
            </section>
          )}

          {page === "Portfolio" && (
            <section className="section">
              <div className="section-header">
                <div>
                  <h1>
                    Portfolio
                  </h1>

                  <p>
                    Non-custodial portfolio
                    overview.
                  </p>
                </div>
              </div>

              <div className="portfolio-summary">
                <span>
                  Estimated value
                </span>

                <strong>
                  {formatUSD(
                    portfolioValue
                  )}
                </strong>
              </div>

              <div className="wallet-panel">
                <h3>
                  Connected Wallet
                </h3>

                {wallet ? (
                  <>
                    <div className="address">
                      {walletAddress}
                    </div>

                    <div className="wallet-row">
                      <span>
                        Network
                      </span>

                      <strong>
                        {chainId ===
                        SEPOLIA_CHAIN_ID
                          ? "Ethereum Sepolia"
                          : "Wrong network"}
                      </strong>
                    </div>

                    <div className="wallet-row">
                      <span>
                        ETH Balance
                      </span>

                      <strong>
                        {formatNumber(
                          walletBalance,
                          6
                        )}{" "}
                        ETH
                      </strong>
                    </div>
                  </>
                ) : (
                  <p>
                    Connect your wallet to
                    view testnet information.
                  </p>
                )}
              </div>

              <div className="empty-card">
                <div className="empty-icon">
                  💼
                </div>

                <h3>
                  Testnet portfolio
                </h3>

                <p>
                  Real token balances will be
                  displayed here after the
                  testnet swap module is
                  implemented.
                </p>
              </div>
            </section>
          )}

          {page === "Orders" && (
            <section className="section">
              <div className="section-header">
                <div>
                  <h1>
                    Orders
                  </h1>

                  <p>
                    CryptoPool testnet
                    transaction previews.
                  </p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="empty-card">
                  <div className="empty-icon">
                    📋
                  </div>

                  <h3>
                    No testnet orders
                  </h3>

                  <p>
                    Your testnet transaction
                    previews will appear here.
                  </p>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map(
                    (order) => (
                      <div
                        className="order-card"
                        key={order.id}
                      >
                        <div>
                          <strong>
                            {
                              order
                                .symbol
                            }
                          </strong>

                          <span>
                            {
                              order
                                .dex
                            }
                          </span>
                        </div>

                        <div>
                          {
                            order
                              .amount
                          }
                        </div>

                        <div>
                          {
                            order
                              .status
                          }
                        </div>

                        <div>
                          {
                            order
                              .time
                          }
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <footer className="footer">
        <span>
          CryptoPool 2.1A
        </span>

        <span>
          🧪 Sepolia Testnet
        </span>

        <span>
          No private keys stored
        </span>

        <span>
          No guaranteed returns
        </span>
      </footer>
    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(
  <App />
);
