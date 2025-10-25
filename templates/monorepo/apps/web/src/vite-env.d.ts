/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CHAIN_DEFAULT?: string;
  readonly VITE_TARGET_CHAIN?: string;
  readonly VITE_CHAIN_TYPE?: string;
  readonly VITE_EVM_CHAIN_ID?: string;
  readonly VITE_EVM_RPC_URL?: string;
  readonly VITE_PYUSD_ADDRESS?: string;
  readonly VITE_SOLANA_RPC_URL?: string;
  readonly VITE_PYUSD_MINT?: string;
  readonly VITE_LOCAL_CHAIN_ENABLED?: string;
  readonly VITE_LOCAL_CHAIN_ID?: string;
  readonly VITE_LOCAL_RPC_URL?: string;
  readonly VITE_LOCAL_PYUSD_ADDRESS?: string;
  readonly VITE_MARKET_ADDRESS?: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
