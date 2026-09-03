from pathlib import Path
import re

p = Path('src/main.jsx')
s = p.read_text(encoding='utf-8')

trade = r'''function Trade() {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useBalance({ address, chainId: SEPOLIA_ID, query: { enabled: Boolean(address) } });
  const { data: hash, error: sendError, isPending, sendTransaction } = useSendTransaction();
  const { isLoading: confirming, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash, confirmations: 1 });
  const { writeContractAsync, error: tokenError, isPending: tokenPending } = useWriteContract();
  const [ethAmount, setEthAmount] = useState("");
  const [ethRecipient, setEthRecipient] = useState(DEFAULT_TEST_RECIPIENT);
  const [tokenAddress, setTokenAddress] = useState(DEFAULT_TEST_TOKEN);
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenHash, setTokenHash] = useState("");
  const [tokenSending, setTokenSending] = useState(false);
  const [tokenMessage, setTokenMessage] = useState("");
  const goodNetwork = Number(chainId) === SEPOLIA_ID;
  const balanceEth = balance ? Number(formatEther(balance.value)) : 0;
  const ethValue = Number(ethAmount);
  const validEthRecipient = isAddress(ethRecipient);
  const validToken = isAddress(tokenAddress);
  const gasReserve = 0.0005;
  const enoughEth = Boolean(balance) && ethValue > 0 && ethValue + gasReserve < balanceEth;
  const { data: tokenDecimals, isLoading: tokenDecimalsLoading } = useReadContract({ address: validToken ? tokenAddress : undefined, abi: ERC20_ABI, functionName: "decimals", chainId: SEPOLIA_ID, query: { enabled: validToken } });
  const { data: tokenSymbol } = useReadContract({ address: validToken ? tokenAddress : undefined, abi: ERC20_ABI, functionName: "symbol", chainId: SEPOLIA_ID, query: { enabled: validToken } });
  const { data: tokenBalance } = useReadContract({ address: validToken ? tokenAddress : undefined, abi: ERC20_ABI, functionName: "balanceOf", args: address ? [address] : undefined, chainId: SEPOLIA_ID, query: { enabled: Boolean(address && validToken && goodNetwork) } });

  useEffect(() => { if (confirmed) refetchBalance(); }, [confirmed, refetchBalance]);

  async function sendEth() {
    if (!isConnected || !goodNetwork || !validEthRecipient || !enoughEth || isPending || confirming) return;
    setTokenMessage("");
    sendTransaction({ to: ethRecipient, value: parseEther(ethAmount), chainId: SEPOLIA_ID });
  }

  async function sendToken() {
    if (!isConnected || !goodNetwork || !validToken || !validEthRecipient || !tokenAmount || tokenSending || typeof tokenDecimals !== "number") return;
    setTokenSending(true);
    setTokenHash("");
    setTokenMessage("");
    try {
      const h = await writeContractAsync({ address: tokenAddress, abi: ERC20_ABI, functionName: "transfer", args: [ethRecipient, parseUnits(tokenAmount, tokenDecimals)], chainId: SEPOLIA_ID });
      setTokenHash(h);
      setTokenMessage("Đã gửi yêu cầu giao dịch token. Hãy chờ blockchain xác nhận.");
    } catch (e) {
      setTokenMessage(e?.shortMessage || e?.message || "Giao dịch token bị hủy hoặc thất bại.");
    } finally {
      setTokenSending(false);
    }
  }

  const errorText = sendError?.shortMessage || sendError?.message || tokenError?.shortMessage || tokenError?.message || "";
  const tokenDisplay = typeof tokenBalance === "bigint" && typeof tokenDecimals === "number" ? formatUnits(tokenBalance, tokenDecimals) : "—";

  return <div className="page">
    <PageHeader eyebrow="SEPOLIA TRANSACTION" title="Gửi tài sản testnet" text="ETH và ERC-20 được gửi bằng giao dịch blockchain thật trên Ethereum Sepolia. Bạn tự xác nhận trong ví." action={<AppKitButton/>}/>
    <div className="trade-layout">
      <div className="trade-box">
        <div className="trade-label">GỬI ETH</div>
        <div className="balance-box"><strong>{balanceLoading ? "Đang đọc…" : balance ? `${balanceEth.toFixed(6)} ETH` : "—"}</strong><button type="button" onClick={() => refetchBalance()} disabled={!address}>↻</button></div>
        <div className="trade-label">SỐ LƯỢNG ETH</div>
        <input className="amount" inputMode="decimal" min="0" step="any" value={ethAmount} onChange={e => setEthAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.001" aria-label="Số lượng ETH Sepolia"/>
        <div className="trade-label">ĐỊA CHỈ NHẬN ETH</div>
        <div className="input-with-action"><input className="recipient-input large-address-input" value={ethRecipient} onChange={e => setEthRecipient(e.target.value)} placeholder="0x…" aria-label="Địa chỉ nhận ETH"/><button type="button" onClick={() => setEthRecipient("")}>Xóa</button></div>
        <button className="primary-button" disabled={!isConnected || !goodNetwork || !enoughEth || !validEthRecipient || isPending || confirming} onClick={sendEth}>{confirmed ? "✓ Giao dịch ETH đã xác nhận" : confirming ? "Đang chờ blockchain…" : isPending ? "Đang chờ ví…" : !isConnected ? "Kết nối ví để gửi" : !goodNetwork ? "Chuyển sang Sepolia" : !validEthRecipient ? "Địa chỉ nhận không hợp lệ" : !enoughEth ? `Cần chừa khoảng ${gasReserve} ETH phí gas` : "Gửi ETH Sepolia"}</button>

        <div className="trade-divider">ERC-20 TESTNET</div>
        <div className="trade-token-card">
          <div className="trade-label">TOKEN GỬI</div>
          <input className="recipient-input large-address-input" value={tokenAddress} onChange={e => setTokenAddress(e.target.value.trim())} placeholder="Token contract 0x…" aria-label="Địa chỉ token ERC-20"/>
          <div className="token-summary"><span>{tokenSymbol ? String(tokenSymbol) : "Token"}</span><strong>{tokenDecimalsLoading ? "Đang đọc…" : tokenDisplay}</strong></div>
          <div className="trade-label">SỐ LƯỢNG TOKEN</div>
          <input className="amount token-amount-input" inputMode="decimal" min="0" step="any" value={tokenAmount} onChange={e => setTokenAmount(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.1" aria-label="Số lượng token ERC-20"/>
          <button className="primary-button" disabled={!isConnected || !goodNetwork || !validToken || !validEthRecipient || !tokenAmount || tokenSending || typeof tokenDecimals !== "number"} onClick={sendToken}>{tokenSending ? "Đang chờ ví…" : !isConnected ? "Kết nối ví để gửi token" : !goodNetwork ? "Chuyển sang Sepolia" : !validToken ? "Token contract không hợp lệ" : typeof tokenDecimals !== "number" ? "Đang đọc token…" : "Gửi token ERC-20"}</button>
          {tokenHash && <div className="tx-result"><b>Token Transaction</b><a href={`https://sepolia.etherscan.io/tx/${tokenHash}`} target="_blank" rel="noreferrer">{shorten(tokenHash)} ↗</a></div>}
          {tokenMessage && <div className="tx-error">{tokenMessage}</div>}
          <div className="token-help">Số dư hiển thị ở trên là số dư thật của ví đối với contract này trên Sepolia. Nếu là 0 thì ví chưa có token đó.</div>
        </div>
        {hash && <div className="tx-result"><b>ETH Transaction</b><a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noreferrer">{shorten(hash)} ↗</a></div>}
        {errorText && <div className="tx-error">{errorText}</div>}
        <div className="inline-warning">Testnet only · Không gửi ETH thật · Không cung cấp seed phrase/private key</div>
      </div>
      <div className="checks"><h3>Transaction checks</h3><Check label="Wallet" value={isConnected ? shorten(address) : "Not connected"} good={isConnected}/><Check label="Network" value={goodNetwork ? "Ethereum Sepolia · 11155111" : `Chain ${chainId || "?"}`} good={goodNetwork}/><Check label="Balance" value={balance ? `${balanceEth.toFixed(6)} ETH` : "Chưa đọc được"} good={Boolean(balance)}/><Check label="Recipient" value={validEthRecipient ? shorten(ethRecipient) : "Địa chỉ chưa hợp lệ"} good={validEthRecipient}/><Check label="Gas reserve" value={`${gasReserve} ETH reserved`} good={enoughEth}/><Check label="Execution" value={confirmed ? "Confirmed on-chain" : "Requires wallet confirmation"} good={true}/></div>
    </div>
  </div>;
}'''

wallet = r'''function ERC20Balance() {
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const [tokenAddress, setTokenAddress] = useState(DEFAULT_TEST_TOKEN);
  const validToken = isAddress(tokenAddress);
  const enabled = Boolean(address && validToken && Number(chainId) === SEPOLIA_ID);
  const balanceQuery = useReadContract({ address: validToken ? tokenAddress : undefined, abi: ERC20_ABI, functionName: "balanceOf", args: address ? [address] : undefined, chainId: SEPOLIA_ID, query: { enabled } });
  const decimalsQuery = useReadContract({ address: validToken ? tokenAddress : undefined, abi: ERC20_ABI, functionName: "decimals", chainId: SEPOLIA_ID, query: { enabled } });
  const symbolQuery = useReadContract({ address: validToken ? tokenAddress : undefined, abi: ERC20_ABI, functionName: "symbol", chainId: SEPOLIA_ID, query: { enabled } });
  const actualBalance = typeof balanceQuery.data === "bigint" && typeof decimalsQuery.data === "number" ? formatUnits(balanceQuery.data, decimalsQuery.data) : null;
  const error = balanceQuery.error || decimalsQuery.error || symbolQuery.error;
  return <div className="token-wallet-panel">
    <div className="token-panel-head"><div><div className="trade-label">TOKEN BALANCE</div><strong>Số dư ERC-20 trên Sepolia</strong></div><span className="network-tag good">Sepolia</span></div>
    <p>Token mẫu được điền sẵn để bạn kiểm tra. Bạn có thể xóa và nhập contract ERC-20 khác.</p>
    <input className="recipient-input large-address-input" value={tokenAddress} onChange={e => setTokenAddress(e.target.value.trim())} placeholder="Token contract 0x…" aria-label="Địa chỉ hợp đồng ERC-20"/>
    {isConnected && Number(chainId) === SEPOLIA_ID && validToken && <div className="wallet-info token-wallet-info"><div><span>Token</span><strong>{symbolQuery.data ? String(symbolQuery.data) : "Đang đọc…"}</strong></div><div><span>Số dư</span><strong>{balanceQuery.isLoading || decimalsQuery.isLoading ? "Đang đọc…" : actualBalance ?? "0"}</strong></div><div><span>Contract</span><strong>{shorten(tokenAddress)}</strong></div></div>}
    {!isConnected && <small>Kết nối ví trước để đọc số dư.</small>}
    {isConnected && Number(chainId) !== SEPOLIA_ID && <small>Chuyển ví sang Ethereum Sepolia trước.</small>}
    {error && <small className="negative token-error-note">Không đọc được contract này trên Sepolia. Kiểm tra địa chỉ token.</small>}
  </div>;
}

function WalletPage() {
  const { address, isConnected, status } = useAppKitAccount();
  const { chainId } = useAppKitNetwork();
  const { data: balance, refetch } = useBalance({ address, chainId: SEPOLIA_ID, query: { enabled: Boolean(address) } });
  const [copied, setCopied] = useState(false);
  const good = Number(chainId) === SEPOLIA_ID;
  async function copy() { if (!address) return; try { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }
  return <div className="page"><PageHeader eyebrow="WALLET" title="Ví của bạn" text="Kết nối không lưu ký. Private key và seed phrase không được yêu cầu." action={<AppKitButton/>}/><div className="wallet-page-card">{isConnected ? <>
    <div className="connected-banner"><span className="big-check">✓</span><div><strong>Wallet connected</strong><span>{status === "connected" ? "Đã kết nối thành công" : "Đang đồng bộ…"}</span></div></div>
    <div className="address-line wallet-address-large"><span>{address}</span><button type="button" onClick={copy}>{copied ? "Đã copy" : "Copy"}</button></div>
    <div className="wallet-info"><div><span>Network</span><strong className={good ? "positive" : "negative"}>{good ? "Ethereum Sepolia" : `Chain ${chainId || "?"}`}</strong></div><div><span>Chain ID</span><strong>{chainId || "—"}</strong></div><div><span>Sepolia ETH</span><strong>{balance ? `${Number(formatEther(balance.value)).toFixed(6)} ETH` : "—"}</strong></div></div>
    <button className="ghost-button" type="button" onClick={() => refetch()}>↻ Cập nhật số dư</button>
    {!good && <div className="network-warning">⚠️ Vui lòng chuyển ví sang Ethereum Sepolia.</div>}
    <ERC20Balance/>
    <div className="notice"><span>◎</span><div><strong>Gửi token</strong><p>Vào mục Trade để chọn token, nhập số lượng và tự xác nhận giao dịch trong ví.</p></div></div>
  </> : <div className="empty-wallet"><div className="wallet-symbol">◎</div><h2>Kết nối ví để bắt đầu</h2><p>Chọn MetaMask, Trust Wallet, WalletConnect hoặc phương thức được hỗ trợ trong AppKit.</p><AppKitButton/><div className="wallet-features"><span>✓ Mobile friendly</span><span>✓ Non-custodial</span><span>✓ Sepolia testnet</span></div></div>}</div></div>;
}'''

s, n1 = re.subn(r'function Trade\(\) \{.*?\n\}\n\nfunction ERC20Balance\(\)', trade + '\n\nfunction ERC20Balance()', s, flags=re.S)
s, n2 = re.subn(r'function ERC20Balance\(\) \{.*?\n\}\n\nfunction WalletPage\(\)', wallet + '\n\nfunction Portfolio()', s, flags=re.S)
if n1 != 1 or n2 != 1:
    raise SystemExit(f'patch mismatch trade={n1} wallet={n2}')
p.write_text(s, encoding='utf-8')

css = Path('src/style.css')
extra = r'''
/* Wallet/Trade repair: large readable address fields, no white input blocks, mobile friendly. */
.input-with-action{display:flex;gap:10px;align-items:stretch;margin:8px 0 14px}.input-with-action .recipient-input{flex:1;min-width:0}.input-with-action button{border:1px solid #334052;background:#151d27;color:#dbe3ec;border-radius:11px;padding:0 16px;font-weight:750}.input-with-action button:hover{background:#1b2633}.large-address-input{min-height:54px!important;font-size:14px!important;letter-spacing:.1px;background:#0a1017!important;color:#f2f5f8!important;border:1px solid #334052!important;border-radius:12px!important;padding:14px 15px!important;box-shadow:none!important}.large-address-input::placeholder{color:#68778a!important}.amount{background:#0a1017!important;border:1px solid #334052!important;border-radius:12px!important;padding:13px 15px!important;font-size:28px!important}.token-amount-input{margin:8px 0 12px}.trade-token-card{margin-top:15px;padding:18px;border:1px solid #273342;border-radius:15px;background:#0b121a}.trade-divider{margin:24px 0 12px;padding-top:18px;border-top:1px solid #26313f;font-size:9px;letter-spacing:1.8px;color:#8190a4;font-weight:850}.token-summary{display:flex;justify-content:space-between;align-items:center;margin:10px 0 14px;padding:12px 13px;border:1px solid #26313f;border-radius:11px;background:#0a1017}.token-summary span{color:#8c99aa;font-size:11px}.token-summary strong{font-size:14px}.token-help{margin-top:9px;color:#69778a;font-size:9px;line-height:1.55}.tx-result{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:12px;padding:11px 13px;border:1px solid #26313f;border-radius:11px;background:#0a1017;font-size:10px}.tx-result a{color:#9eb5ff;text-decoration:none}.tx-error{margin-top:10px;padding:10px 12px;border:1px solid #5a302d;background:#241615;color:#ffb0aa;border-radius:10px;font-size:10px;line-height:1.5}.token-wallet-panel{margin-top:18px;padding:18px;border:1px solid #273342;border-radius:15px;background:#0b121a}.token-panel-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.token-panel-head strong{font-size:14px}.token-wallet-panel>p{color:#718095;font-size:10px;line-height:1.6;margin:7px 0 12px}.token-wallet-info{margin-top:12px}.token-error-note{display:block;margin-top:9px}.wallet-address-large{min-height:58px;margin:16px 0}.wallet-address-large span{font-size:13px;word-break:break-all;line-height:1.5}.wallet-address-large button{min-width:74px}.wallet-page-card .notice{background:#0b121a}.trade-box .recipient-input,.token-wallet-panel .recipient-input{background:#0a1017!important}
@media (max-width:760px){.page{padding:22px 14px 92px}.page-header{align-items:flex-start;flex-direction:column;padding:10px 0 22px}.page-header h1{font-size:31px}.trade-layout{grid-template-columns:1fr}.trade-box{padding:15px}.checks{padding:15px}.large-address-input{min-height:58px!important;font-size:13px!important}.input-with-action{gap:7px}.input-with-action button{padding:0 11px}.amount{font-size:25px!important}.wallet-page-card{padding:15px}.wallet-address-large{align-items:stretch}.wallet-address-large span{font-size:12px}.token-panel-head{align-items:flex-start}.topbar{padding:0 14px}.network-chip{display:none}}
'''
text = css.read_text(encoding='utf-8')
if 'Wallet/Trade repair:' not in text:
    css.write_text(text + '\n' + extra, encoding='utf-8')
Path('scripts/repair-wallet-ui.py').unlink()
''