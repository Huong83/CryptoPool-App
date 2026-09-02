
import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const pools = [
  { name:"BTC Core", symbol:"BTC", risk:"Thấp", apy:"—", tvl:"$1.24M", fee:"1% quản lý", color:"orange", desc:"Chiến lược tập trung Bitcoin với ưu tiên bảo toàn vốn tương đối và biến động thấp hơn nhóm altcoin." },
  { name:"ETH Growth", symbol:"ETH", risk:"Trung bình", apy:"—", tvl:"$860K", fee:"10% hiệu suất", color:"violet", desc:"Danh mục xoay quanh hệ sinh thái Ethereum. Hiệu suất thực tế phụ thuộc thị trường." },
  { name:"Multi-Asset", symbol:"MA", risk:"Cao", apy:"—", tvl:"$420K", fee:"15% hiệu suất", color:"cyan", desc:"Phân bổ nhiều tài sản crypto với mức biến động cao hơn." },
  { name:"Stable Yield", symbol:"USD", risk:"Thấp", apy:"—", tvl:"$315K", fee:"8% hiệu suất", color:"green", desc:"Pool định hướng tài sản ổn định. Không phải tiền gửi ngân hàng và không có lợi nhuận đảm bảo." },
  { name:"DeFi Bluechip", symbol:"DEFI", risk:"Cao", apy:"—", tvl:"$275K", fee:"12% hiệu suất", color:"pink", desc:"Theo dõi các giao thức DeFi lớn; rủi ro smart contract và thị trường vẫn tồn tại." },
  { name:"Index 10", symbol:"IDX", risk:"Trung bình", apy:"—", tvl:"$198K", fee:"1.5% quản lý", color:"blue", desc:"Mô phỏng danh mục chỉ số gồm nhiều tài sản lớn, giúp giảm phụ thuộc vào một token." },
  { name:"BTC + ETH", symbol:"B&E", risk:"Trung bình", apy:"—", tvl:"$164K", fee:"1% quản lý", color:"gold", desc:"Phân bổ cân bằng giữa Bitcoin và Ethereum." },
  { name:"Experimental", symbol:"EXP", risk:"Rất cao", apy:"—", tvl:"$92K", fee:"20% hiệu suất", color:"red", desc:"Khu vực thử nghiệm cho chiến lược mới. Chỉ dành cho người hiểu rõ rủi ro." },
];

function App() {
  const [tab, setTab] = useState("Pools");
  const [filter, setFilter] = useState("Tất cả");
  const [connected, setConnected] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dark, setDark] = useState(true);

  const visiblePools = useMemo(
    () => filter === "Tất cả" ? pools : pools.filter(p => p.risk === filter),
    [filter]
  );

  const nav = ["Dashboard", "Pools", "Portfolio", "Transactions"];

  return (
    <div className={dark ? "app dark" : "app light"}>
      <header className="topbar">
        <div className="brand" onClick={() => setTab("Dashboard")}>
          <span className="brandMark">CP</span>
          <span>Crypto<span className="accent">Pool</span></span>
        </div>
        <nav>
          {nav.map(n => <button key={n} className={tab === n ? "nav active" : "nav"} onClick={() => setTab(n)}>{n}</button>)}
        </nav>
        <div className="actions">
          <button className="iconBtn" onClick={() => setDark(!dark)}>{dark ? "☀" : "☾"}</button>
          <button className="wallet" onClick={() => setConnected(!connected)}>
            <span className="dot"></span>{connected ? "0x71...9A2F" : "Kết nối ví"}
          </button>
        </div>
      </header>

      <main>
        {tab === "Dashboard" && (
          <>
            <section className="hero">
              <div>
                <div className="eyebrow">TRANSPARENT CRYPTO INVESTING</div>
                <h1>Đầu tư crypto<br/><span>minh bạch hơn.</span></h1>
                <p className="sub">Khám phá nhiều chiến lược, theo dõi tài sản và kiểm chứng dữ liệu. CryptoPool không cam kết lợi nhuận.</p>
                <div className="heroBtns">
                  <button className="primary" onClick={() => setTab("Pools")}>Khám phá Pools →</button>
                  <button className="secondary" onClick={() => setConnected(!connected)}> {connected ? "Ví đã kết nối" : "Kết nối ví"} </button>
                </div>
              </div>
              <div className="heroCard">
                <div className="cardGlow"></div>
                <div className="miniLabel">TỔNG TÀI SẢN</div>
                <div className="bigNumber">{connected ? "$0.00" : "$0.00"}</div>
                <div className="muted">{connected ? "Địa chỉ đã kết nối · chưa có dữ liệu giao dịch" : "Chưa kết nối ví"}</div>
                <div className="spark"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
              </div>
            </section>

            <section className="stats">
              <Stat label="Tổng TVL demo" value="$3.56M" note="Dữ liệu giao diện mẫu" />
              <Stat label="Investment Pools" value="08" note="Có thể mở rộng" />
              <Stat label="Giao dịch" value="—" note="Chờ kết nối blockchain" />
              <Stat label="Trạng thái" value="MVP" note="Prototype an toàn" />
            </section>
          </>
        )}

        {tab === "Pools" && (
          <section className="section">
            <div className="sectionHead">
              <div>
                <div className="eyebrow">STRATEGIES</div>
                <h2>Investment Pools</h2>
                <p>Chọn theo mức rủi ro — hiệu suất thực tế sẽ được tích hợp từ dữ liệu on-chain ở bước tiếp theo.</p>
              </div>
              <div className="filters">
                {["Tất cả","Thấp","Trung bình","Cao","Rất cao"].map(x =>
                  <button key={x} className={filter===x ? "filter active" : "filter"} onClick={() => setFilter(x)}>{x}</button>
                )}
              </div>
            </div>
            <div className="poolGrid">
              {visiblePools.map((p, i) => (
                <article className="poolCard" key={p.name} style={{"--pool": p.color}}>
                  <div className="poolHeader">
                    <div className="coin">{p.symbol}</div>
                    <span className="risk">{p.risk}</span>
                  </div>
                  <h3>{p.name}</h3>
                  <p className="desc">{p.desc}</p>
                  <div className="metric"><span>Hiệu suất</span><strong>{p.apy}</strong></div>
                  <div className="rows"><div><span>TVL</span><b>{p.tvl}</b></div><div><span>Phí</span><b>{p.fee}</b></div></div>
                  <button className="outline" onClick={() => setSelected(p)}>Xem chi tiết</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "Portfolio" && <Placeholder title="Portfolio" text={connected ? "Ví đã kết nối. Chưa có dữ liệu tài sản để hiển thị." : "Kết nối ví để xem portfolio. CryptoPool không lưu seed phrase/private key."} />}
        {tab === "Transactions" && <Placeholder title="Transactions" text="Lịch sử giao dịch sẽ lấy từ blockchain/API ở phiên bản backend tiếp theo." />}
      </main>

      <footer>
        <span>CryptoPool MVP v0.2 · Prototype</span>
        <span>Không cam kết lợi nhuận · Dữ liệu demo</span>
      </footer>

      {selected && <div className="modalBg" onClick={() => setSelected(null)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <button className="close" onClick={() => setSelected(null)}>×</button>
          <div className="coin large">{selected.symbol}</div>
          <div className="eyebrow">{selected.risk.toUpperCase()} RISK</div>
          <h2>{selected.name}</h2>
          <p>{selected.desc}</p>
          <div className="modalGrid"><div><small>TVL demo</small><b>{selected.tvl}</b></div><div><small>Phí</small><b>{selected.fee}</b></div><div><small>APY</small><b>{selected.apy}</b></div></div>
          <div className="warning">⚠ Đây là giao diện MVP. Chưa có giao dịch đầu tư thật. Không xem các con số demo là lợi nhuận hoặc cam kết tài chính.</div>
        </div>
      </div>}
    </div>
  );
}

function Stat({label,value,note}) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}
function Placeholder({title,text}) {
  return <section className="empty"><div className="emptyIcon">◈</div><div className="eyebrow">COMING NEXT</div><h2>{title}</h2><p>{text}</p></section>;
}

createRoot(document.getElementById("root")).render(<App />);
