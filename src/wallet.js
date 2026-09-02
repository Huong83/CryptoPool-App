// CryptoPool 2.1A.2
// Multi-Wallet Connector
// EIP-6963 + EIP-1193
//
// Security:
// - Never requests private keys
// - Never requests seed phrases
// - Never stores wallet credentials
// - Only requests account/network information

const ANNOUNCE_EVENT = "eip6963:announceProvider";
const REQUEST_EVENT = "eip6963:requestProvider";

export const SEPOLIA_CHAIN_ID = "0xaa36a7";
export const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;

function normalizeProvider(detail) {
  if (!detail?.provider) return null;

  return {
    provider: detail.provider,
    info: {
      uuid:
        detail.info?.uuid ||
        `provider-${Math.random()}`,
      name:
        detail.info?.name ||
        "Web3 Wallet",
      icon:
        detail.info?.icon ||
        "",
      rdns:
        detail.info?.rdns ||
        "",
    },
  };
}

export function discoverWallets(timeout = 800) {
  return new Promise((resolve) => {
    if (
      typeof window === "undefined"
    ) {
      resolve([]);
      return;
    }

    const discovered = new Map();

    function handleAnnouncement(event) {
      const wallet =
        normalizeProvider(event.detail);

      if (!wallet) return;

      const key =
        wallet.info.uuid ||
        wallet.info.rdns ||
        wallet.info.name;

      discovered.set(key, wallet);
    }

    window.addEventListener(
      ANNOUNCE_EVENT,
      handleAnnouncement
    );

    // Ask installed wallets to announce themselves.
    window.dispatchEvent(
      new Event(REQUEST_EVENT)
    );

    // Fallback for wallets using window.ethereum.
    const injected =
      window.ethereum;

    if (injected) {
      const fallback = normalizeProvider({
        provider: injected,
        info: {
          uuid:
            "legacy-injected-provider",
          name:
            injected.isMetaMask
              ? "MetaMask"
              : "Browser Wallet",
          icon: "",
          rdns:
            injected.isMetaMask
              ? "io.metamask"
              : "unknown",
        },
      });

      if (fallback) {
        discovered.set(
          fallback.info.uuid,
          fallback
        );
      }
    }

    setTimeout(() => {
      window.removeEventListener(
        ANNOUNCE_EVENT,
        handleAnnouncement
      );

      resolve(
        Array.from(
          discovered.values()
        )
      );
    }, timeout);
  });
}

export async function getAccounts(
  provider
) {
  if (!provider) return [];

  return provider.request({
    method: "eth_accounts",
  });
}

export async function requestAccounts(
  provider
) {
  if (!provider) {
    throw new Error(
      "Wallet provider not found."
    );
  }

  return provider.request({
    method:
      "eth_requestAccounts",
  });
}

export async function getChainId(
  provider
) {
  if (!provider) return "";

  return provider.request({
    method: "eth_chainId",
  });
}

export async function getBalance(
  provider,
  address
) {
  if (!provider || !address) {
    return "0";
  }

  const hex =
    await provider.request({
      method:
        "eth_getBalance",
      params: [
        address,
        "latest",
      ],
    });

  try {
    const wei = BigInt(
      hex || "0x0"
    );

    const whole =
      wei /
      1000000000000000000n;

    const fraction =
      wei %
      1000000000000000000n;

    const fractionText =
      fraction
        .toString()
        .padStart(18, "0")
        .slice(0, 8);

    return `${whole}.${fractionText}`;
  } catch {
    return "0";
  }
}

export async function switchToSepolia(
  provider
) {
  if (!provider) {
    throw new Error(
      "Wallet provider not found."
    );
  }

  return provider.request({
    method:
      "wallet_switchEthereumChain",
    params: [
      {
        chainId:
          SEPOLIA_CHAIN_ID,
      },
    ],
  });
}

export function isSepolia(
  chainId
) {
  return (
    String(chainId).toLowerCase() ===
    SEPOLIA_CHAIN_ID
  );
}

export function walletErrorMessage(
  error
) {
  if (!error) {
    return "Unknown wallet error.";
  }

  if (error.code === 4001) {
    return "Bạn đã hủy yêu cầu trong ví.";
  }

  if (error.code === 4902) {
    return "Ví chưa có mạng Sepolia. Hãy thêm Ethereum Sepolia Testnet vào ví.";
  }

  if (
    error.code === -32002
  ) {
    return "Ví đang có một yêu cầu kết nối đang chờ xử lý. Hãy mở ví và hoàn tất yêu cầu đó.";
  }

  if (
    error.message
  ) {
    return error.message;
  }

  return "Không thể kết nối ví.";
}
