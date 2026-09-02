import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API =
  "https://pro-api.coinmarketcap.com/public-api";

const DEXES = [
  {
    name: "Uniswap",
    icon: "🦄",
    network: "Ethereum / Base / Arbitrum",
    description: "DEX đa mạng với thanh khoản lớn.",
  },
  {
    name: "PancakeSwap",
    icon: "🥞",
    network: "BNB Chain / Ethereum / Base",
    description: "Smart Router tối ưu đường giao dịch.",
  },
  {
    name: "Curve",
    icon: "🌊",
    network: "Ethereum / nhiều mạng",
    description: "Mạnh về stablecoin và tài sản tương quan.",
  },
];

const INITIAL_PORTFOLIO = {
  USD: 10000,
  BTC: 0,
  ETH: 0,
  BNB: 0,
  SOL: 0,
  USDT: 0,
};

const FALLBACK = [
  {
    rank: 1,
    name: "Bitcoin",
    symbol: "BTC",
    price: 0,
    change: 0,
    marketCap: 0,
    volume: 0,
  },
  {
    rank: 2,
    name: "Ethereum",
    symbol: "ETH",
    price: 0,
    change: 0,
    marketCap: 0,
    volume: 0,
  },
  {
    rank: 4,
    name: "BNB",
    symbol: "BNB",
    price: 0,
    change: 0,
    marketCap: 0,
    volume: 0,
  },
  {
    rank: 5,
    name: "Solana",
    symbol: "SOL",
    price: 0,
    change: 0,
    marketCap: 0,
    volume: 0,
  },
];

function money(value) {
  const n = Number(value || 0);

  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(2)}K`;

  if (n >= 1) {
    return `$${n.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })}`;
  }

  return `$${n.toLocaleString("en-US", {
    maximumFractionDigits: 8,
  })}`;
}

function percent(value) {
  const n = Number(value || 0);
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function App() {
  const [page, setPage] = useState("Dashboard");
  const [coins, setCoins] = useState(FALLBACK);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(true);

  const [wallet, setWallet] = useState(false);

  const [portfolio, setPortfolio] =
    useState(INITIAL_PORTFOLIO);

  const [orders, setOrders] = useState([]);

  const [search, setSearch] = useState("");

  const [selectedCoin, setSelectedCoin] =
    useState(null);

  const [tradeSide, setTradeSide] = useState("BUY");

  const [tradeAmount, setTradeAmount] =
    useState("");

  const [selectedDex, setSelectedDex] =
    useState("Uniswap");

  const [notice, setNotice] = useState("");

  async function loadMarket() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/v3/cryptocurrency/listings/latest?start=1&limit=100&convert=USD`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = await response.json();

      if (!Array.isArray(json.data)) {
        throw new Error("Invalid API response");
      }

      const data = json.data.map((coin) => ({
        rank: coin.cmc_rank,
        name: coin.name,
        symbol: coin.symbol,
        price: coin.quote?.USD?.price || 0,
        change:
          coin.quote?.USD?.percent_change_24h || 0,
        marketCap:
          coin.quote?.USD?.market_cap || 0,
        volume:
          coin.quote?.USD?.volume_24h || 0,
      }));

      setCoins(data);
    } catch (err) {
      console.error(err);
      setError(
        "Không thể tải dữ liệu thị trường. Đang sử dụng dữ liệu dự phòng."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMarket();

    const timer = setInterval(
      loadMarket,
      60 * 1000
    );

    return () => clearInterval(timer);
  }, []);

  const filteredCoins = useMemo(() => {
    if (!search.trim()) return coins;

    const q = search.toLowerCase();

    return coins.filter(
      (coin) =>
        coin.name.toLowerCase().includes(q) ||
        coin.symbol.toLowerCase().includes(q)
    );
  }, [coins, search]);

  const portfolioValue = useMemo(() => {
    let total = Number(portfolio.USD || 0);

    Object.entries(portfolio).forEach(
      ([symbol, amount]) => {
        if (symbol === "USD") return;

        const coin = coins.find(
          (item) => item.symbol === symbol
        );

        if (coin) {
          total +=
            Number(amount || 0) *
            Number(coin.price || 0);
        }
      }
    );

    return total;
  }, [portfolio, coins]);

  function navigate(target) {
    setPage(target);
    setNotice("");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function connectWallet() {
    setWallet((value) => !value);

    setNotice(
      wallet
        ? "Ví Demo đã được ngắt kết nối."
        : "Ví Demo đã kết nối. Không có private key nào được lưu."
    );
  }

  function openTrade(coin) {
    setSelectedCoin(coin);
    setTradeSide("BUY");
    setTradeAmount("");
    setPage("Trade");
  }

  function executeDemoTrade() {
    if (!selectedCoin) {
      setNotice("Hãy chọn một tài sản trước.");
      return;
    }

    const amount = Number(tradeAmount);

    if (!amount || amount <= 0) {
      setNotice("Hãy nhập số tiền giao dịch hợp lệ.");
      return;
    }

    const price = Number(selectedCoin.price);

    if (!price) {
      setNotice(
        "Giá tài sản hiện chưa có dữ liệu."
      );
      return;
    }

    const symbol = selectedCoin.symbol;
    const quantity = amount / price;

    if (tradeSide === "BUY") {
      if (portfolio.USD < amount) {
        setNotice(
          "Số dư Demo USD không đủ cho lệnh này."
        );
        return;
      }

      setPortfolio((old) => ({
        ...old,
        USD: old.USD - amount,
        [symbol]:
          Number(old[symbol] || 0) +
          quantity,
      }));
    } else {
      const owned = Number(
        portfolio[symbol] || 0
      );

      if (owned < quantity) {
        setNotice(
          `Bạn không có đủ ${symbol} trong Portfolio Demo.`
        );
        return;
      }

      setPortfolio((old) => ({
        ...old,
        USD: Number(old.USD || 0) + amount,
        [symbol]: owned - quantity,
      }));
    }

    const order = {
      id: Date.now(),
      time: new Date().toLocaleString("vi-VN"),
      side: tradeSide,
      symbol,
      quantity,
      price,
      value: amount,
      dex: selectedDex,
      status: "Demo Filled",
    };

    setOrders((old) => [
      order,
      ...old,
    ]);

    setTradeAmount("");

    setNotice(
      `${tradeSide === "BUY" ? "Mua" : "Bán"} Demo ${quantity.toFixed(
        6
      )} ${symbol} thành công qua ${selectedDex}.`
    );
  }

  return (
    <div className={dark ? "app dark" : "app"}>
      <header className="header">
        <div
          className="brand"
          onClick={() => navigate("Dashboard")}
        >
          <div className="brandMark">₿</div>

          <div>
            <strong>CryptoPool</strong>
            <span>Digital Asset Platform</span>
          </div>
        </div>

        <nav className="nav">
          {[
            "Dashboard",
            "Markets",
            "Trade",
            "Portfolio",
            "Orders",
          ].map((item) => (
            <button
              key={item}
              className={
                page === item ? "active" : ""
              }
              onClick={() => navigate(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="headerActions">
          <button
            className="iconButton"
            onClick={() =>
              setDark((value) => !value)
            }
          >
            {dark ? "☀" : "☾"}
          </button>

          <button
            className="walletButton"
            onClick={connectWallet}
          >
            {wallet
              ? "Wallet Connected"
              : "Connect Wallet"}
          </button>
        </div>
      </header>

      <main>
        {notice && (
          <div className="notice globalNotice">
            {notice}
          </div>
        )}

        {page === "Dashboard" && (
          <Dashboard
            coins={coins}
            portfolioValue={portfolioValue}
            wallet={wallet}
            navigate={navigate}
            openTrade={openTrade}
          />
        )}

        {page === "Markets" && (
          <section className="pageSection">
            <div className="sectionHeading">
              <div>
                <span className="eyebrow">
                  LIVE MARKET
                </span>
                <h2>Crypto Markets</h2>
                <p>
                  Top 100 tài sản theo Market Cap.
                </p>
              </div>

              <button
                className="primaryButton"
                onClick={loadMarket}
                disabled={loading}
              >
                {loading
                  ? "Đang tải..."
                  : "↻ Cập nhật"}
              </button>
            </div>

            {error && (
              <div className="notice">
                {error}
              </div>
            )}

            <div className="marketControls">
              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="🔍 Tìm coin..."
              />
            </div>

            <div className="coinGrid">
              {filteredCoins.map((coin) => (
                <CoinCard
                  key={coin.symbol}
                  coin={coin}
                  onTrade={() =>
                    openTrade(coin)
                  }
                />
              ))}
            </div>
          </section>
        )}

        {page === "Trade" && (
          <TradePage
            coins={coins}
            selectedCoin={selectedCoin}
            setSelectedCoin={setSelectedCoin}
            side={tradeSide}
            setSide={setTradeSide}
            amount={tradeAmount}
            setAmount={setTradeAmount}
            dex={selectedDex}
            setDex={setSelectedDex}
            execute={executeDemoTrade}
          />
        )}

        {page === "Portfolio" && (
          <PortfolioPage
            portfolio={portfolio}
            coins={coins}
            total={portfolioValue}
            navigate={navigate}
          />
        )}

        {page === "Orders" && (
          <OrdersPage orders={orders} />
        )}
      </main>

      <footer className="footer">
        <div>
          <strong>CryptoPool 2.0</strong>
          <span>
            Market Data · Demo Trading · DeFi
          </span>
        </div>

        <p>
          Uniswap · PancakeSwap · Curve
          <br />
          Demo trading only. Không lưu private key.
        </p>
      </footer>
    </div>
  );
}

function Dashboard({
  coins,
  portfolioValue,
  wallet,
  navigate,
  openTrade,
}) {
  return (
    <>
      <section className="hero">
        <div className="heroText">
          <span className="eyebrow">
            CRYPTOPOOL 2.0
          </span>

          <h1>
            Crypto đơn giản.
            <br />
            <span>Minh bạch hơn.</span>
          </h1>

          <p>
            Theo dõi thị trường, thử nghiệm giao dịch
            và quản lý Portfolio trong một nền tảng
            DeFi hiện đại.
          </p>

          <div className="heroButtons">
            <button
              className="primaryButton"
              onClick={() => navigate("Markets")}
            >
              Khám phá thị trường →
            </button>

            <button
              className="secondaryButton"
              onClick={() => navigate("Trade")}
            >
              Trade Demo
            </button>
          </div>

          <div className="trustRow">
            <span>✓ Non-custodial design</span>
            <span>✓ No private keys</span>
            <span>✓ Demo trading</span>
          </div>
        </div>

        <div className="heroCard">
          <div className="cardTop">
            <span>PORTFOLIO DEMO</span>
            <span className="liveDot">
              ● ACTIVE
            </span>
          </div>

          <div className="heroPrice">
            {money(portfolioValue)}
          </div>

          <small>
            {wallet
              ? "Wallet Demo connected"
              : "Demo account"}
          </small>

          <div className="miniBars">
            {coins.slice(0, 12).map(
              (coin) => (
                <div
                  key={coin.symbol}
                  className="miniBar"
                  style={{
                    height: `${Math.max(
                      20,
                      Math.min(
                        100,
                        Math.abs(
                          coin.change
                        ) * 10 + 25
                      )
                    )}%`,
                  }}
                />
              )
            )}
          </div>
        </div>
      </section>

      <section className="statsGrid">
        <Stat
          title="Crypto Assets"
          value={coins.length}
          subtitle="Top Market Cap"
        />

        <Stat
          title="Demo Portfolio"
          value={money(portfolioValue)}
          subtitle="Virtual balance"
        />

        <Stat
          title="DEX"
          value="03"
          subtitle="Integrated UI"
        />

        <Stat
          title="Trading"
          value="DEMO"
          subtitle="No real funds"
        />
      </section>

      <section className="section">
        <div className="sectionHeading">
          <div>
            <span className="eyebrow">
              MARKET
            </span>
            <h2>Top Assets</h2>
          </div>

          <button
            className="secondaryButton"
            onClick={() =>
              navigate("Markets")
            }
          >
            Xem tất cả →
          </button>
        </div>

        <div className="coinGrid">
          {coins
            .slice(0, 8)
            .map((coin) => (
              <CoinCard
                key={coin.symbol}
                coin={coin}
                onTrade={() =>
                  openTrade(coin)
                }
              />
            ))}
        </div>
      </section>

      <section className="featureGrid">
        <Feature
          icon="◈"
          title="Live Markets"
          text="Theo dõi dữ liệu thị trường crypto."
        />

        <Feature
          icon="↔"
          title="Demo Trading"
          text="Thử Buy/Sell mà không sử dụng tiền thật."
        />

        <Feature
          icon="◇"
          title="DeFi Ready"
          text="Kiến trúc chuẩn bị cho kết nối DEX và ví."
        />
      </section>
    </>
  );
}

function TradePage({
  coins,
  selectedCoin,
  setSelectedCoin,
  side,
  setSide,
  amount,
  setAmount,
  dex,
  setDex,
  execute,
}) {
  const coin =
    selectedCoin || coins[0];

  const estimated =
    coin && amount
      ? Number(amount) /
        Number(coin.price || 1)
      : 0;

  return (
    <section className="pageSection">
      <div className="sectionHeading">
        <div>
          <span className="eyebrow">
            TRADE
          </span>

          <h2>Swap Crypto</h2>

          <p>
            Giao dịch mô phỏng — chưa gửi
            transaction lên blockchain.
          </p>
        </div>
      </div>

      <div className="tradeLayout">
        <div className="tradePanel">
          <div className="tradeMode">
            <button
              className={
                side === "BUY"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSide("BUY")
              }
            >
              BUY
            </button>

            <button
              className={
                side === "SELL"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setSide("SELL")
              }
            >
              SELL
            </button>
          </div>

          <label>
            Tài sản
            <select
              value={coin?.symbol || ""}
              onChange={(e) => {
                const found = coins.find(
                  (item) =>
                    item.symbol ===
                    e.target.value
                );

                setSelectedCoin(found);
              }}
            >
              {coins
                .slice(0, 100)
                .map((item) => (
                  <option
                    key={item.symbol}
                    value={item.symbol}
                  >
                    {item.symbol} —{" "}
                    {item.name}
                  </option>
                ))}
            </select>
          </label>

          <label>
            Số tiền USD
            <input
              type="number"
              min="0"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              placeholder="100"
            />
          </label>

          <div className="tradeQuote">
            <span>Giá hiện tại</span>
            <strong>
              {money(coin?.price)}
            </strong>
          </div>

          <div className="tradeQuote">
            <span>Ước tính</span>
            <strong>
              {estimated
                ? `${estimated.toFixed(
                    8
                  )} ${coin?.symbol}`
                : "—"}
            </strong>
          </div>

          <button
            className="primaryButton fullButton"
            onClick={execute}
          >
            {side === "BUY"
              ? "Mua Demo"
              : "Bán Demo"}
          </button>

          <div className="demoWarning">
            ⚠️ DEMO ONLY — Không có tiền thật
            được chuyển và không có giao dịch
            blockchain nào được ký.
          </div>
        </div>

        <div className="dexPanel">
          <span className="eyebrow">
            DEX ROUTER
          </span>

          <h3>Chọn DEX</h3>

          {DEXES.map((item) => (
            <button
              key={item.name}
              className={
                dex === item.name
                  ? "dexCard selected"
                  : "dexCard"
              }
              onClick={() =>
                setDex(item.name)
              }
            >
              <span className="dexIcon">
                {item.icon}
              </span>

              <span>
                <strong>
                  {item.name}
                </strong>
                <small>
                  {item.network}
                </small>
                <small>
                  {item.description}
                </small>
              </span>

              {dex === item.name && (
                <b>✓</b>
              )}
            </button>
          ))}

          <p className="smallText">
            Trong phiên bản hiện tại, DEX chỉ
            xác định tuyến mô phỏng. Chưa có
            transaction thật.
          </p>
        </div>
      </div>
    </section>
  );
}

function PortfolioPage({
  portfolio,
  coins,
  total,
  navigate,
}) {
  const assets = Object.entries(
    portfolio
  ).filter(
    ([symbol, amount]) =>
      symbol === "USD" ||
      Number(amount) > 0
  );

  return (
    <section className="pageSection">
      <div className="sectionHeading">
        <div>
          <span className="eyebrow">
            PORTFOLIO
          </span>
          <h2>{money(total)}</h2>
          <p>
            Giá trị Portfolio Demo hiện tại.
          </p>
        </div>

        <button
          className="primaryButton"
          onClick={() =>
            navigate("Trade")
          }
        >
          Trade →
        </button>
      </div>

      <div className="portfolioGrid">
        {assets.map(
          ([symbol, amount]) => {
            const coin =
              coins.find(
                (item) =>
                  item.symbol ===
                  symbol
              );

            const value =
              symbol === "USD"
                ? Number(amount)
                : Number(amount) *
                  Number(
                    coin?.price || 0
                  );

            return (
              <div
                className="portfolioCard"
                key={symbol}
              >
                <span>
                  {symbol}
                </span>

                <strong>
                  {symbol === "USD"
                    ? money(amount)
                    : Number(
                        amount
                      ).toFixed(8)}
                </strong>

                <small>
                  {money(value)}
                </small>
              </div>
            );
          }
        )}
      </div>

      <div className="demoWarning">
        Portfolio này chỉ là dữ liệu mô phỏng
        lưu trong trình duyệt. Không phải tài
        khoản ngân hàng và không đại diện cho
        tài sản thật.
      </div>
    </section>
  );
}

function OrdersPage({ orders }) {
  return (
    <section className="pageSection">
      <div className="sectionHeading">
        <div>
          <span className="eyebrow">
            ORDERS
          </span>
          <h2>Lịch sử giao dịch</h2>
          <p>
            Các lệnh Demo được thực hiện trên
            CryptoPool.
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="placeholder">
          <div className="placeholderIcon">
            ◫
          </div>

          <span className="eyebrow">
            NO ORDERS
          </span>

          <h2>Chưa có giao dịch</h2>

          <p>
            Các lệnh Buy/Sell Demo sẽ xuất hiện
            ở đây.
          </p>
        </div>
      ) : (
        <div className="ordersTable">
          <div className="orderHeader">
            <span>Thời gian</span>
            <span>Side</span>
            <span>Asset</span>
            <span>Amount</span>
            <span>DEX</span>
            <span>Status</span>
          </div>

          {orders.map((order) => (
            <div
              className="orderRow"
              key={order.id}
            >
              <span>{order.time}</span>

              <strong
                className={
                  order.side === "BUY"
                    ? "positive"
                    : "negative"
                }
              >
                {order.side}
              </strong>

              <span>
                {order.symbol}
              </span>

              <span>
                {money(order.value)}
              </span>

              <span>
                {order.dex}
              </span>

              <span>
                {order.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CoinCard({ coin, onTrade }) {
  return (
    <div className="coinCard">
      <div className="coinTop">
        <div className="coinIdentity">
          <span className="coinIcon">
            {coin.symbol.slice(0, 1)}
          </span>

          <div>
            <strong>
              {coin.name}
            </strong>

            <small>
              {coin.symbol}
            </small>
          </div>
        </div>

        <span className="rank">
          #{coin.rank}
        </span>
      </div>

      <div className="coinPrice">
        {money(coin.price)}
      </div>

      <div className="coinBottom">
        <span
          className={
            coin.change >= 0
              ? "change positive"
              : "change negative"
          }
        >
          {percent(coin.change)}
        </span>

        <span>
          {money(coin.marketCap)}
        </span>
      </div>

      <button
        className="tradeSmallButton"
        onClick={onTrade}
      >
        Trade Demo
      </button>
    </div>
  );
}

function Stat({
  title,
  value,
  subtitle,
}) {
  return (
    <div className="statCard">
      <span>{title}</span>
      <strong>{value}</strong>
      <small>{subtitle}</small>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}) {
  return (
    <div className="featureCard">
      <div className="featureIcon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{text}</p>
    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(<App />);
