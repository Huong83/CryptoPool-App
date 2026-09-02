import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const pools = [
  {
    name: "BTC Core",
    symbol: "BTC",
    risk: "Thấp",
    apy: "—",
    tvl: "$1.24M",
    fee: "1% quản lý",
    color: "#f7931a",
    desc: "Chiến lược tập trung Bitcoin với ưu tiên quản trị rủi ro và biến động tương đối thấp hơn nhóm altcoin."
  },
  {
    name: "ETH Growth",
    symbol: "ETH",
    risk: "Trung bình",
    apy: "—",
    tvl: "$860K",
    fee: "10% hiệu suất",
    color: "#8b7cff",
    desc: "Danh mục xoay quanh hệ sinh thái Ethereum. Hiệu suất thực tế phụ thuộc hoàn toàn vào thị trường."
  },
  {
    name: "Multi-Asset",
    symbol: "MA",
    risk: "Cao",
    apy: "—",
    tvl: "$420K",
    fee: "15% hiệu suất",
    color: "#35d9d0",
    desc: "Phân bổ nhiều tài sản crypto với mức biến động cao hơn và cần quản trị rủi ro chặt chẽ."
  },
  {
    name: "Stable Yield",
    symbol: "USD",
    risk: "Thấp",
    apy: "—",
    tvl: "$315K",
    fee: "8% hiệu suất",
    color: "#43d99b",
    desc: "Pool định hướng tài sản ổn định. Không phải tiền gửi ngân hàng và không có lợi nhuận đảm bảo."
  },
  {
    name: "DeFi Bluechip",
    symbol: "DEFI",
    risk: "Cao",
    apy: "—",
    tvl: "$275K",
    fee: "12% hiệu suất",
    color: "#ec6ca4",
    desc: "Theo dõi các giao thức DeFi lớn; rủi ro smart contract và thị trường vẫn tồn tại."
  },
  {
    name: "Index 10",
    symbol: "IDX",
    risk: "Trung bình",
    apy: "—",
    tvl: "$198K",
    fee: "1.5% quản lý",
    color: "#4e9cff",
    desc: "Mô phỏng danh mục chỉ số gồm nhiều tài sản lớn nhằm giảm phụ thuộc vào một token."
  },
  {
    name: "BTC + ETH",
    symbol: "B&E",
    risk: "Trung bình",
    apy: "—",
    tvl: "$164K",
    fee: "1% quản lý",
    color: "#e8b84a",
    desc: "Phân bổ cân bằng giữa Bitcoin và Ethereum trong một danh mục đơn giản."
  },
  {
    name: "Experimental",
    symbol: "EXP",
    risk: "Rất cao",
    apy: "—",
    tvl: "$92K",
    fee: "20% hiệu suất",
    color: "#ff6262",
    desc: "Khu vực thử nghiệm cho chiến lược mới. Chỉ dành cho người hiểu rõ rủi ro."
  }
];

const nav = ["Dashboard", "Pools", "Portfolio", "Transactions"];

function App() {
  const [tab, setTab] = useState("Dashboard");
  const [filter, setFilter] = useState("Tất cả");
  const [connected, setConnected] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dark, setDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const visiblePools = useMemo(
    () =>
      filter === "Tất cả"
        ? pools
        : pools.filter((pool) => pool.risk === filter),
    [filter]
  );

  const goTo = (page) => {
    setTab(page);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const connectWallet = () => {
    setConnected((value) => !value);
  };

  return (
    <div className={dark ? "app dark" : "app light"}>
      <header className="topbar">
        <div className="brand" onClick={() => goTo("Dashboard")}>
          <span className="brandMark">CP</span>
          <span>
            Crypto<span className="accent">Pool</span>
          </span>
        </div>

        <nav className={menuOpen ? "mobileNav open" : "mobileNav"}>
          {nav.map((item) => (
            <button
              key={item}
              className={tab === item ? "nav active" : "nav"}
              onClick={() => goTo(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="actions">
          <button
            className="iconBtn"
            aria-label="Đổi giao diện"
            onClick={() => setDark((value) => !value)}
          >
            {dark ? "☀" : "☾"}
          </button>

          <button className="wallet" onClick={connectWallet}>
            <span className="dot"></span>
            {connected ? "0x71...9A2F" : "Kết nối ví"}
          </button>

          <button
            className="menuToggle"
            aria-label="Mở menu"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? "×" : "☰"}
          </button>
        </div>
      </header>

      <main>
        {tab === "Dashboard" && (
          <>
            <section className="hero">
              <div>
                <div className="eyebrow">CRYPTOPool 1.0 · DIGITAL ASSET PLATFORM</div>

                <h1>
                  Crypto đơn giản.
                  <br />
                  <span>Minh bạch hơn.</span>
                </h1>

                <p className="sub">
                  Khám phá các chiến lược tài sản số, theo dõi dữ liệu và
                  quản lý danh mục trong một giao diện hiện đại.
                </p>

                <div className="heroBtns">
                  <button className="primary" onClick={() => goTo("Pools")}>
                    Khám phá Pools →
                  </button>

                  <button className="secondary" onClick={connectWallet}>
                    {connected ? "✓ Ví đã kết nối" : "Kết nối ví"}
                  </button>
                </div>

                <div className="heroTrust">
                  <span>● Không lưu private key</span>
                  <span>● Dữ liệu demo</span>
                  <span>● Minh bạch rủi ro</span>
                </div>
              </div>

              <div className="heroCard">
                <div className="cardGlow"></div>

                <div className="miniLabel">TỔNG TÀI SẢN</div>

                <div className="bigNumber">$0.00</div>

                <div className="muted">
                  {connected
                    ? "Ví mô phỏng đã kết nối · chưa có dữ liệu giao dịch"
                    : "Kết nối ví để xem danh mục"}
                </div>

                <div className="chartHeader">
                  <span>Portfolio overview</span>
                  <span>DEMO</span>
                </div>

                <div className="spark">
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                </div>

                <div className="chartFooter">
                  <span>24H</span>
                  <span>7D</span>
                  <span>30D</span>
                  <span>ALL</span>
                </div>
              </div>
            </section>

            <section className="stats">
              <Stat
                label="Tổng TVL demo"
                value="$3.56M"
                note="Dữ liệu giao diện mẫu"
              />

              <Stat
                label="Investment Pools"
                value="08"
                note="Nhiều mức rủi ro"
              />

              <Stat
                label="Giao dịch"
                value="—"
                note="Chờ blockchain/API"
              />

              <Stat
                label="Trạng thái"
                value="MVP"
                note="Prototype an toàn"
              />
            </section>

            <section className="section quickSection">
              <div className="sectionHead">
                <div>
                  <div className="eyebrow">EXPLORE</div>
                  <h2>Khám phá CryptoPool</h2>
                  <p>
                    Một nền tảng được thiết kế để dữ liệu và rủi ro được trình
                    bày rõ ràng trước khi triển khai chức năng tài chính thật.
                  </p>
                </div>
              </div>

              <div className="featureGrid">
                <Feature
                  icon="◈"
                  title="Đa chiến lược"
                  text="Theo dõi nhiều nhóm tài sản và mức rủi ro trong một giao diện."
                />

                <Feature
                  icon="↗"
                  title="Dữ liệu minh bạch"
                  text="Thiết kế sẵn cho việc tích hợp dữ liệu thị trường và on-chain."
                />

                <Feature
                  icon="◇"
                  title="An toàn trước tiên"
                  text="Phiên bản hiện tại không nhận tiền và không yêu cầu private key."
                />
              </div>
            </section>
          </>
        )}

        {tab === "Pools" && (
          <section className="section">
            <div className="sectionHead">
              <div>
                <div className="eyebrow">STRATEGIES</div>
                <h2>Investment Pools</h2>
                <p>
                  Khám phá các chiến lược theo mức rủi ro. Các chỉ số hiệu suất
                  thực tế sẽ chỉ được hiển thị sau khi tích hợp nguồn dữ liệu
                  xác thực.
                </p>
              </div>

              <div className="filters">
                {["Tất cả", "Thấp", "Trung bình", "Cao", "Rất cao"].map(
                  (item) => (
                    <button
                      key={item}
                      className={filter === item ? "filter active" : "filter"}
                      onClick={() => setFilter(item)}
                    >
                      {item}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="poolGrid">
              {visiblePools.map((pool) => (
                <article
                  className="poolCard"
                  key={pool.name}
                  style={{ "--pool": pool.color }}
                >
                  <div className="poolHeader">
                    <div className="coin">{pool.symbol}</div>
                    <span className="risk">{pool.risk}</span>
                  </div>

                  <h3>{pool.name}</h3>

                  <p className="desc">{pool.desc}</p>

                  <div className="metric">
                    <span>Hiệu suất</span>
                    <strong>{pool.apy}</strong>
                  </div>

                  <div className="rows">
                    <div>
                      <span>TVL</span>
                      <b>{pool.tvl}</b>
                    </div>

                    <div>
                      <span>Phí</span>
                      <b>{pool.fee}</b>
                    </div>
                  </div>

                  <button
                    className="outline"
                    onClick={() => setSelected(pool)}
                  >
                    Xem chi tiết →
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "Portfolio" && (
          <Placeholder
            title="Portfolio"
            text={
              connected
                ? "Ví mô phỏng đã kết nối. Chưa có dữ liệu tài sản thật để hiển thị."
                : "Kết nối ví để xem portfolio. CryptoPool không lưu seed phrase hoặc private key."
            }
          />
        )}

        {tab === "Transactions" && (
          <Placeholder
            title="Transactions"
            text="Lịch sử giao dịch sẽ được tích hợp từ blockchain/API trong phiên bản backend tiếp theo."
          />
        )}
      </main>

      <footer>
        <span>CryptoPool · MVP 1.0</span>
        <span>Không cam kết lợi nhuận · Dữ liệu demo</span>
      </footer>

      {selected && (
        <div
          className="modalBg"
          onClick={() => setSelected(null)}
        >
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close"
              onClick={() => setSelected(null)}
              aria-label="Đóng"
            >
              ×
            </button>

            <div className="coin large">{selected.symbol}</div>

            <div className="eyebrow">
              {selected.risk.toUpperCase()} RISK
            </div>

            <h2>{selected.name}</h2>

            <p>{selected.desc}</p>

            <div className="modalGrid">
              <div>
                <small>TVL demo</small>
                <b>{selected.tvl}</b>
              </div>

              <div>
                <small>Phí</small>
                <b>{selected.fee}</b>
              </div>

              <div>
                <small>APY</small>
                <b>{selected.apy}</b>
              </div>
            </div>

            <div className="warning">
              ⚠ Đây là giao diện MVP. Chưa có giao dịch đầu tư thật.
              Không xem các con số demo là lợi nhuận hoặc cam kết tài chính.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, note }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="featureCard">
      <div className="featureIcon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function Placeholder({ title, text }) {
  return (
    <section className="empty">
      <div className="emptyIcon">◈</div>
      <div className="eyebrow">COMING NEXT</div>
      <h2>{title}</h2>
      <p>{text}</p>
    </section>
  );
}

createRoot(document.getElementById("root")).render(<App />);
