(() => {
  const RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
  const EXPLORER = 'https://sepolia.etherscan.io/address/';
  const root = document.createElement('div');
  root.id = 'cp-balance-checker';
  root.innerHTML = `
    <button id="cp-balance-open" type="button" aria-label="Kiểm tra số dư ví">🔎 Kiểm tra ví</button>
    <section id="cp-balance-panel" hidden>
      <div class="cp-bc-head"><div><strong>Kiểm tra số dư ví</strong><small>Ethereum Sepolia · đọc công khai trên blockchain</small></div><button id="cp-balance-close" type="button" aria-label="Đóng">×</button></div>
      <label>Địa chỉ ví</label>
      <input id="cp-balance-address" inputmode="text" autocomplete="off" placeholder="0x…" />
      <div class="cp-bc-actions"><button id="cp-balance-check" type="button">Đọc số dư</button><button id="cp-balance-clear" type="button">Xóa</button></div>
      <div id="cp-balance-status" class="cp-bc-status">Nhập địa chỉ 0x… để kiểm tra.</div>
      <div id="cp-balance-result" class="cp-bc-result" hidden></div>
    </section>`;
  document.body.appendChild(root);

  const style = document.createElement('style');
  style.textContent = `
    #cp-balance-checker{position:fixed;right:18px;bottom:88px;z-index:99999;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#eef4ff}
    #cp-balance-open{border:1px solid rgba(130,170,255,.45);background:#111a2a;color:#fff;border-radius:14px;padding:11px 15px;font-weight:800;cursor:pointer;box-shadow:0 12px 35px rgba(0,0,0,.35)}
    #cp-balance-panel{width:min(390px,calc(100vw - 28px));background:#0b111c;border:1px solid rgba(130,170,255,.28);border-radius:20px;padding:16px;box-shadow:0 18px 60px rgba(0,0,0,.55)}
    .cp-bc-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:14px}.cp-bc-head strong{display:block;font-size:17px}.cp-bc-head small{display:block;margin-top:4px;color:#91a0b7;font-size:11px;line-height:1.35}
    #cp-balance-close{border:0;background:transparent;color:#aebbd0;font-size:25px;line-height:1;cursor:pointer}
    #cp-balance-panel label{display:block;color:#9eabc0;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;margin:10px 0 7px}
    #cp-balance-address{box-sizing:border-box;width:100%;height:50px;border-radius:12px;border:1px solid #34445e;background:#101927;color:#fff;padding:0 13px;outline:none;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
    #cp-balance-address:focus{border-color:#7898ff;box-shadow:0 0 0 3px rgba(120,152,255,.12)}
    .cp-bc-actions{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}.cp-bc-actions button{height:44px;border-radius:11px;border:1px solid #34445e;background:#162235;color:#fff;font-weight:800;cursor:pointer}.cp-bc-actions button:first-child{background:#315be8;border-color:#315be8}.cp-bc-actions button:disabled{opacity:.55;cursor:wait}
    .cp-bc-status{margin-top:12px;color:#98a7bd;font-size:12px;line-height:1.45}.cp-bc-result{margin-top:10px;padding:13px;border-radius:13px;background:#101927;border:1px solid #26364f}.cp-bc-result .cp-bc-balance{font-size:25px;font-weight:900;letter-spacing:-.03em}.cp-bc-result small{display:block;color:#8e9db4;margin-top:5px}.cp-bc-result a{display:inline-block;margin-top:10px;color:#9fb7ff;font-size:12px;font-weight:800;text-decoration:none}.cp-bc-error{color:#ff9f9f}
    @media(max-width:600px){#cp-balance-checker{right:10px;bottom:76px}.cp-bc-actions{grid-template-columns:1fr 72px}#cp-balance-open{padding:10px 12px;font-size:12px}}
  `;
  document.head.appendChild(style);

  const $ = id => document.getElementById(id);
  const panel = $('cp-balance-panel');
  const addressInput = $('cp-balance-address');
  const status = $('cp-balance-status');
  const result = $('cp-balance-result');
  const open = () => { panel.hidden = false; $('cp-balance-open').hidden = true; addressInput.focus(); };
  $('cp-balance-open').addEventListener('click', open);
  $('cp-balance-close').addEventListener('click', () => { panel.hidden = true; $('cp-balance-open').hidden = false; });
  $('cp-balance-clear').addEventListener('click', () => { addressInput.value = ''; result.hidden = true; status.className = 'cp-bc-status'; status.textContent = 'Nhập địa chỉ 0x… để kiểm tra.'; addressInput.focus(); });

  function validAddress(value) { return /^0x[a-fA-F0-9]{40}$/.test(value.trim()); }
  async function rpc(method, params) {
    const response = await fetch(RPC, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({jsonrpc:'2.0',id:Date.now(),method,params}) });
    if (!response.ok) throw new Error('RPC không phản hồi.');
    const json = await response.json();
    if (json.error) throw new Error(json.error.message || 'Không đọc được blockchain.');
    return json.result;
  }
  async function check() {
    const address = addressInput.value.trim();
    result.hidden = true;
    status.className = 'cp-bc-status';
    if (!validAddress(address)) { status.className = 'cp-bc-status cp-bc-error'; status.textContent = 'Địa chỉ phải có đúng 42 ký tự và bắt đầu bằng 0x.'; return; }
    const button = $('cp-balance-check'); button.disabled = true; button.textContent = 'Đang đọc…'; status.textContent = 'Đang đọc số dư trực tiếp từ Ethereum Sepolia…';
    try {
      const hex = await rpc('eth_getBalance', [address, 'latest']);
      const wei = BigInt(hex);
      const whole = wei / 1000000000000000000n;
      const frac = (wei % 1000000000000000000n).toString().padStart(18,'0').slice(0,8).replace(/0+$/,'');
      const display = frac ? `${whole}.${frac} ETH` : `${whole} ETH`;
      result.innerHTML = `<div class="cp-bc-balance">${display}</div><small>Số dư ETH Sepolia hiện tại của địa chỉ này.</small><a target="_blank" rel="noopener noreferrer" href="${EXPLORER}${address}">Mở địa chỉ trên Sepolia Etherscan ↗</a>`;
      result.hidden = false;
      status.textContent = '✓ Đã đọc thành công từ blockchain. Không cần kết nối ví để xem.';
    } catch (error) {
      status.className = 'cp-bc-status cp-bc-error'; status.textContent = error?.message || 'Không thể đọc số dư lúc này. Hãy thử lại.';
    } finally { button.disabled = false; button.textContent = 'Đọc số dư'; }
  }
  $('cp-balance-check').addEventListener('click', check);
  addressInput.addEventListener('keydown', event => { if (event.key === 'Enter') check(); });
})();
