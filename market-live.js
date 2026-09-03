(() => {
  'use strict';

  // CryptoPool live market layer. No exchange API key is required for public market data.
  // Spot prices are streamed from Binance WebSocket and historical candles come from REST.
  const API = 'https://api.binance.com';
  const WS = 'wss://stream.binance.com:9443/stream?streams=';
  const COINS = [
    ['BTC','Bitcoin','BTCUSDT'], ['ETH','Ethereum','ETHUSDT'], ['BNB','BNB','BNBUSDT'],
    ['SOL','Solana','SOLUSDT'], ['XRP','XRP','XRPUSDT'], ['ADA','Cardano','ADAUSDT'],
    ['DOGE','Dogecoin','DOGEUSDT'], ['USDC','USD Coin','USDCUSDT'], ['LINK','Chainlink','LINKUSDT'],
    ['UNI','Uniswap','UNIUSDT'], ['AVAX','Avalanche','AVAXUSDT'], ['DOT','Polkadot','DOTUSDT']
  ];
  const bySymbol = Object.fromEntries(COINS.map(([s,n,p]) => [s,{symbol:s,name:n,pair:p}]));
  const state = new Map();
  const subscribers = new Set();
  let socket;
  let reconnectTimer;

  const fmt = n => {
    n = Number(n);
    if (!Number.isFinite(n)) return '—';
    if (n >= 1000) return n.toLocaleString('en-US',{maximumFractionDigits:2});
    if (n >= 1) return n.toLocaleString('en-US',{maximumFractionDigits:4});
    return n.toLocaleString('en-US',{maximumFractionDigits:6});
  };
  const pct = n => `${Number(n) >= 0 ? '+' : ''}${Number(n).toFixed(2)}%`;
  const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function css(){
    if(document.getElementById('cp-live-css')) return;
    const s=document.createElement('style'); s.id='cp-live-css'; s.textContent=`
      .cp-live-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#31d17c;box-shadow:0 0 10px #31d17c;margin-right:6px}
      .cp-live-status{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;opacity:.75;margin:0 0 12px}
      .cp-row-live{cursor:pointer;transition:background .15s,transform .15s}.cp-row-live:hover{background:rgba(255,255,255,.045);transform:translateY(-1px)}
      .cp-clickable{cursor:pointer}.cp-live-price{font-variant-numeric:tabular-nums}.cp-live-change.up{color:#39d98a}.cp-live-change.down{color:#ff657a}
      .cp-modal{position:fixed;inset:0;z-index:100000;background:rgba(3,6,10,.78);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;padding:18px}
      .cp-modal-card{width:min(900px,100%);max-height:92vh;overflow:auto;background:#0c131d;border:1px solid #263445;border-radius:22px;box-shadow:0 30px 100px #000b;color:#eef3f8;padding:20px}
      .cp-modal-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.cp-modal-head h2{margin:0 0 4px}.cp-modal-head p{margin:0;opacity:.65}
      .cp-close{border:1px solid #344253;background:#151e29;color:#fff;border-radius:10px;padding:8px 11px;cursor:pointer}
      .cp-chart{width:100%;height:330px;display:block;background:#081019;border-radius:14px;margin:18px 0 12px}
      .cp-periods{display:flex;gap:7px;flex-wrap:wrap}.cp-periods button,.cp-alert-btn{border:1px solid #334255;background:#131d29;color:#dfe8f2;border-radius:9px;padding:8px 12px;cursor:pointer;font-weight:700}.cp-periods button.active,.cp-alert-btn:hover{background:#243244}
      .cp-alert{border-top:1px solid #263445;margin-top:18px;padding-top:16px}.cp-alert-grid{display:grid;grid-template-columns:1fr 1fr auto;gap:8px}.cp-alert input{min-width:0;border:1px solid #334255;background:#0a1119;color:#fff;border-radius:9px;padding:10px}.cp-alert-list{margin-top:10px;display:grid;gap:6px}.cp-alert-item{display:flex;justify-content:space-between;gap:10px;background:#111a25;border-radius:9px;padding:8px 10px;font-size:13px}.cp-alert-item button{border:0;background:transparent;color:#ff8796;cursor:pointer}.cp-note{font-size:12px;opacity:.6;margin-top:8px}
      @media(max-width:600px){.cp-modal{padding:8px}.cp-modal-card{border-radius:16px;padding:14px}.cp-chart{height:250px}.cp-alert-grid{grid-template-columns:1fr 1fr}.cp-alert-grid .cp-alert-btn{grid-column:1/-1}}
    `; document.head.appendChild(s);
  }

  async function seed(){
    try{
      const r=await fetch(API+'/api/v3/ticker/24hr?symbols='+encodeURIComponent(JSON.stringify(COINS.map(x=>x[2]))),{cache:'no-store'});
      if(!r.ok) throw new Error('market api');
      const rows=await r.json();
      rows.forEach(x=>state.set(x.symbol,{price:Number(x.lastPrice),change:Number(x.priceChangePercent),open:Number(x.openPrice),high:Number(x.highPrice),low:Number(x.lowPrice),volume:Number(x.quoteVolume)}));
      subscribers.forEach(fn=>fn());
    }catch(e){ console.warn('CryptoPool market seed unavailable',e); }
  }

  function connect(){
    clearTimeout(reconnectTimer);
    try{ socket?.close(); }catch{}
    socket=new WebSocket(WS+COINS.map(x=>x[2].toLowerCase()+'@miniTicker').join('/'));
    socket.onmessage=e=>{
      try{const x=JSON.parse(e.data).data; const old=state.get(x.s)||{}; state.set(x.s,{...old,price:Number(x.c),open:Number(x.o),high:Number(x.h),low:Number(x.l),volume:Number(x.q),change:old.open?((Number(x.c)-Number(x.o))/Number(x.o))*100:old.change}); subscribers.forEach(fn=>fn());}catch{}
    };
    socket.onclose=()=>{reconnectTimer=setTimeout(connect,2500)};
    socket.onerror=()=>{try{socket.close()}catch{}};
  }

  function data(symbol){return state.get(bySymbol[symbol]?.pair)||{};}

  function installModal(){
    if(document.getElementById('cp-modal')) return;
    const m=document.createElement('div');m.id='cp-modal';m.className='cp-modal';m.hidden=true;
    m.innerHTML=`<div class="cp-modal-card" role="dialog" aria-modal="true"><div class="cp-modal-head"><div><div class="cp-live-status"><span class="cp-live-dot"></span> Live market</div><h2 id="cp-title">—</h2><p id="cp-meta">—</p></div><button class="cp-close" aria-label="Đóng">Đóng</button></div><canvas id="cp-chart" class="cp-chart"></canvas><div class="cp-periods"><button data-period="1h">1H</button><button data-period="24h" class="active">24H</button><button data-period="7d">7D</button><button data-period="30d">30D</button></div><div class="cp-alert"><strong>🔔 Cảnh báo giá</strong><div class="cp-alert-grid"><input id="cp-alert-price" inputmode="decimal" placeholder="Giá mục tiêu"><select id="cp-alert-op" class="cp-alert-btn"><option value="above">Khi giá ≥</option><option value="below">Khi giá ≤</option></select><button id="cp-add-alert" class="cp-alert-btn">Thêm cảnh báo</button></div><div class="cp-alert-list" id="cp-alert-list"></div><div class="cp-note">Cảnh báo được lưu trên thiết bị này. Khi điều kiện đạt, CryptoPool sẽ thông báo trong ứng dụng.</div></div></div>`;
    document.body.appendChild(m);
    m.querySelector('.cp-close').onclick=()=>m.hidden=true;
    m.onclick=e=>{if(e.target===m)m.hidden=true};
    m.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>loadChart(window.__cpCoin,b.dataset.period,b));
    document.getElementById('cp-add-alert').onclick=addAlert;
  }

  function openCoin(symbol){
    installModal(); window.__cpCoin=symbol; const a=bySymbol[symbol],d=data(symbol); const m=document.getElementById('cp-modal');
    document.getElementById('cp-title').textContent=`${a.name} (${a.symbol})`;
    document.getElementById('cp-meta').textContent=d.price?`$${fmt(d.price)} · ${pct(d.change)} 24h · High $${fmt(d.high)} · Low $${fmt(d.low)}`:'Đang tải dữ liệu…';
    m.hidden=false; renderAlerts(); loadChart(symbol,'24h',m.querySelector('[data-period="24h"]'));
  }

  async function loadChart(symbol,period,button){
    if(!symbol)return; document.querySelectorAll('.cp-periods button').forEach(b=>b.classList.toggle('active',b===button));
    const mins={ '1h':'1m','24h':'15m','7d':'1h','30d':'4h'}; const limit={'1h':60,'24h':96,'7d':168,'30d':180};
    const interval=mins[period]||'15m'; const lim=limit[period]||96; const pair=bySymbol[symbol].pair;
    try{const r=await fetch(`${API}/api/v3/klines?symbol=${pair}&interval=${interval}&limit=${lim}`,{cache:'no-store'}); const rows=await r.json(); drawChart(rows.map(x=>({t:x[0],p:Number(x[4])})),symbol);}
    catch(e){drawChart([],symbol)}
  }

  function drawChart(rows,symbol){
    const c=document.getElementById('cp-chart'); if(!c)return; const dpr=Math.max(1,devicePixelRatio||1),w=c.clientWidth||800,h=c.clientHeight||330;c.width=w*dpr;c.height=h*dpr;const x=c.getContext('2d');x.scale(dpr,dpr);x.clearRect(0,0,w,h);
    if(!rows.length){x.fillStyle='#7f8c9b';x.font='14px system-ui';x.fillText('Không tải được dữ liệu biểu đồ. Thử lại sau.',20,40);return}
    const vals=rows.map(r=>r.p),min=Math.min(...vals),max=Math.max(...vals),pad=(max-min||max*.01)*.12;const lo=min-pad,hi=max+pad;const px=i=>20+i*(w-40)/Math.max(1,rows.length-1),py=v=>h-24-(v-lo)*(h-48)/(hi-lo);
    x.strokeStyle='rgba(255,255,255,.07)';x.lineWidth=1;for(let i=1;i<5;i++){const yy=24+i*(h-48)/5;x.beginPath();x.moveTo(20,yy);x.lineTo(w-20,yy);x.stroke()}
    x.beginPath();rows.forEach((r,i)=>i?x.lineTo(px(i),py(r.p)):x.moveTo(px(i),py(r.p)));x.strokeStyle='#5ee6a3';x.lineWidth=2;x.stroke();
    x.lineTo(w-20,h-24);x.lineTo(20,h-24);x.closePath();x.fillStyle='rgba(94,230,163,.08)';x.fill();
    x.fillStyle='#93a0af';x.font='11px system-ui';x.fillText('$'+fmt(max),20,16);x.fillText('$'+fmt(min),20,h-7);x.fillText('$'+fmt(vals[vals.length-1]),w-100,16);
  }

  function alerts(){try{return JSON.parse(localStorage.getItem('cp-price-alerts')||'[]')}catch{return[]}}
  function saveAlerts(a){localStorage.setItem('cp-price-alerts',JSON.stringify(a))}
  function addAlert(){const symbol=window.__cpCoin,p=Number(document.getElementById('cp-alert-price').value),op=document.getElementById('cp-alert-op').value;if(!symbol||!Number.isFinite(p)||p<=0)return;const a=alerts();a.push({id:Date.now(),symbol,op,price:p,created:Date.now()});saveAlerts(a);document.getElementById('cp-alert-price').value='';renderAlerts()}
  function renderAlerts(){const el=document.getElementById('cp-alert-list');if(!el)return;const list=alerts().filter(a=>a.symbol===window.__cpCoin);el.innerHTML=list.length?list.map(a=>`<div class="cp-alert-item"><span>${a.op==='above'?'≥':'≤'} $${fmt(a.price)}</span><button data-id="${a.id}">Xóa</button></div>`).join(''):'<div class="cp-note">Chưa có cảnh báo cho coin này.</div>';el.querySelectorAll('button').forEach(b=>b.onclick=()=>{saveAlerts(alerts().filter(a=>String(a.id)!==b.dataset.id));renderAlerts()})}

  let lastAlertCheck=0;
  function checkAlerts(){const now=Date.now();if(now-lastAlertCheck<1000)return;lastAlertCheck=now;let changed=false;const list=alerts().filter(a=>{const d=data(a.symbol), hit=a.op==='above'?d.price>=a.price:d.price<=a.price;if(hit){changed=true;try{if('Notification'in window&&Notification.permission==='granted')new Notification(`CryptoPool: ${a.symbol} cảnh báo`,{body:`Giá hiện tại $${fmt(d.price)} đã ${a.op==='above'?'>=':'<='} $${fmt(a.price)}.`});}catch{} return false}return true});if(changed)saveAlerts(list)}

  function enhance(){
    css();
    document.querySelectorAll('.market-table .market-row:not(.header)').forEach(row=>{
      if(row.dataset.cpEnhanced)return; const sym=row.querySelector('.asset-cell b')?.textContent?.trim().toUpperCase();if(!bySymbol[sym])return;row.dataset.cpEnhanced='1';row.classList.add('cp-row-live');row.onclick=()=>openCoin(sym);
    });
    document.querySelectorAll('.asset-card').forEach(card=>{
      if(card.dataset.cpEnhanced)return;const sym=card.querySelector('strong')?.textContent?.trim().toUpperCase();if(!bySymbol[sym])return;card.dataset.cpEnhanced='1';card.classList.add('cp-clickable');card.onclick=()=>openCoin(sym);
    });
    updateDom();
  }

  function updateDom(){
    document.querySelectorAll('.asset-card').forEach(card=>{const sym=card.querySelector('strong')?.textContent?.trim().toUpperCase(),d=data(sym);if(!d.price)return;const p=card.querySelector('.asset-price'),ch=card.querySelector('.change');if(p)p.textContent='$'+fmt(d.price);if(ch){ch.textContent=pct(d.change);ch.className='change '+(d.change>=0?'positive':'negative')}});
    document.querySelectorAll('.market-table .market-row:not(.header)').forEach(row=>{const sym=row.querySelector('.asset-cell b')?.textContent?.trim().toUpperCase(),d=data(sym);if(!d.price)return;const cells=row.children;if(cells[1])cells[1].innerHTML=`<strong class="cp-live-price">$${fmt(d.price)}</strong>`;if(cells[2])cells[2].innerHTML=`<span class="cp-live-change ${d.change>=0?'up':'down'}">${pct(d.change)}</span>`;if(cells[3])cells[3].innerHTML='<span class="table-status"><span class="cp-live-dot"></span>Live</span>'});checkAlerts();
  }

  const observer=new MutationObserver(()=>setTimeout(enhance,50));
  function init(){css();installModal();seed();connect();subscribers.add(updateDom);observer.observe(document.body,{childList:true,subtree:true});setTimeout(enhance,300);setTimeout(enhance,1200);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
