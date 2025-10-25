import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Tabs } from '@mantine/core';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { BettingExperience } from './components/BettingExperience';
import { ChainSwitcher } from './components/ChainSwitcher';
import { WalletSummary } from './components/WalletSummary';
import { useChain } from './providers/ChainProvider';
import { useTranslation } from './i18n';
const TAB_STORAGE_KEY = 'makeabet:app-tab';
export function App() {
    const { t } = useTranslation();
    useEffect(() => {
        document.body.classList.remove('landing-page-root');
    }, []);
    const { chain } = useChain();
    const [activeTab, setActiveTab] = useState(() => {
        if (typeof window === 'undefined') {
            return 'overview';
        }
        const stored = window.localStorage.getItem(TAB_STORAGE_KEY);
        return stored === 'scaffold' ? 'scaffold' : 'overview';
    });
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(TAB_STORAGE_KEY, activeTab);
        }
    }, [activeTab]);
    const { data, isLoading } = useQuery({
        queryKey: ['config'],
        queryFn: async () => {
            const { data: config } = await axios.get('/api/config');
            return config;
        },
    });
    const chainType = chain.chainType;
    const displayChainName = chain.name;
    const displayChainId = chain.chainId;
    const explorerTemplate = chain.blockExplorerAddressTemplate;
    const isLocalChain = chain.key === 'local-hardhat';
    const pyusdFromConfig = chainType === 'solana' ? data?.pyusdMint : data?.pyusdAddress;
    const displayPyusd = chainType === 'solana'
        ? pyusdFromConfig || chain.pyusdMint
        : pyusdFromConfig || chain.pyusdAddress;
    const displayRpc = data?.rpcUrl && data.rpcUrl.length > 0 ? data.rpcUrl : chain.rpcUrl;
    const pythEndpoint = data?.pythEndpoint || 'https://hermes.pyth.network';
    const { address, isConnected } = useAccount();
    const { publicKey } = useWallet();
    const { connection } = useConnection();
    const evmChainId = useMemo(() => {
        if (chainType !== 'evm')
            return undefined;
        if (chain.chainId)
            return Number(chain.chainId);
        if (data?.targetChain === 'sepolia')
            return 11155111;
        if (data?.targetChain === 'arbitrum-sepolia')
            return 421614;
        return undefined;
    }, [chainType, chain.chainId, data?.targetChain]);
    const nativeSymbol = chain.nativeSymbol || (chainType === 'solana' ? 'SOL' : 'ETH');
    const stableSymbol = chain.stableSymbol || 'PYUSD';
    const pyusdDecimals = 6;
    const { data: nativeBalance } = useBalance({
        address,
        chainId: evmChainId,
        query: {
            enabled: chainType === 'evm' && !!address,
        },
    });
    const { data: pyusdBalance } = useReadContract({
        address: chainType === 'evm' && displayPyusd && displayPyusd.startsWith('0x')
            ? displayPyusd
            : undefined,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        chainId: evmChainId,
        query: {
            enabled: chainType === 'evm' && !!address && !!displayPyusd && displayPyusd.startsWith('0x'),
        },
    });
    const [solanaNative, setSolanaNative] = useState('尚未連線');
    const [solanaPyusd, setSolanaPyusd] = useState('尚未連線');
    useEffect(() => {
        if (chainType !== 'solana')
            return;
        if (!publicKey) {
            setSolanaNative('尚未連線');
            setSolanaPyusd('尚未連線');
            return;
        }
        let cancelled = false;
        const fetchBalances = async () => {
            try {
                const lamports = await connection.getBalance(publicKey);
                if (!cancelled) {
                    setSolanaNative((lamports / LAMPORTS_PER_SOL).toFixed(4));
                }
                if (displayPyusd) {
                    const mintKey = new PublicKey(displayPyusd);
                    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                        mint: mintKey,
                    });
                    const tokenInfo = tokenAccounts.value?.[0]?.account?.data?.parsed?.info?.tokenAmount;
                    if (!cancelled) {
                        if (tokenInfo) {
                            const amount = Number(tokenInfo.amount ?? 0);
                            const decimals = tokenInfo.decimals ?? pyusdDecimals;
                            const formatted = amount / Math.pow(10, decimals);
                            setSolanaPyusd(formatted.toFixed(2));
                        }
                        else {
                            setSolanaPyusd('0.00');
                        }
                    }
                }
                else if (!cancelled) {
                    setSolanaPyusd('未設定');
                }
            }
            catch (error) {
                if (!cancelled) {
                    setSolanaNative('錯誤');
                    setSolanaPyusd('錯誤');
                }
            }
        };
        fetchBalances();
        return () => {
            cancelled = true;
        };
    }, [chainType, connection, displayPyusd, publicKey]);
    const formattedNativeBalance = useMemo(() => {
        if (chainType === 'solana')
            return solanaNative;
        if (!isConnected || !address)
            return '尚未連線';
        if (!nativeBalance)
            return '載入中';
        return Number(formatUnits(nativeBalance.value, nativeBalance.decimals)).toFixed(4);
    }, [address, chainType, isConnected, nativeBalance, solanaNative]);
    const formattedStableBalance = useMemo(() => {
        if (chainType === 'solana')
            return solanaPyusd;
        if (!isConnected || !address)
            return '尚未連線';
        if (!pyusdBalance)
            return '載入中';
        return Number(formatUnits(pyusdBalance, pyusdDecimals)).toFixed(2);
    }, [address, chainType, isConnected, pyusdBalance, solanaPyusd]);
    const addressExplorerLink = useMemo(() => {
        if (!explorerTemplate)
            return undefined;
        if (!address && !publicKey)
            return undefined;
        const explorerAddress = chainType === 'solana' ? publicKey?.toBase58() : address;
        if (!explorerAddress)
            return undefined;
        return explorerTemplate.replace('{address}', explorerAddress);
    }, [address, chainType, explorerTemplate, publicKey]);
    const faucetMutation = useMutation({
        mutationFn: async () => {
            if (!address)
                throw new Error('請先連線 EVM 錢包');
            const { data: response } = await axios.post('/api/faucet', { address });
            if (!response.ok) {
                throw new Error(response.error ?? '請稍後重試');
            }
            return response.transactions ?? [];
        },
    });
    const displayedWallet = chainType === 'solana' ? publicKey?.toBase58() : (address ?? undefined);
    const formattedWallet = displayedWallet ? formatAddress(displayedWallet) : undefined;
    if (isLoading) {
        return _jsx("p", { className: "status", children: "\u8F09\u5165\u8A2D\u5B9A\u4E2D..." });
    }
    return (_jsxs(Tabs, { className: "app-tabs", value: activeTab, onChange: (value) => setActiveTab(value ?? 'overview'), children: [_jsxs(Tabs.List, { className: "app-tabs__list", children: [_jsx(Tabs.Tab, { className: "app-tabs__tab", value: "overview", children: t('tabs.overview') }), _jsx(Tabs.Tab, { className: "app-tabs__tab", value: "scaffold", children: t('tabs.scaffold') })] }), _jsx(Tabs.Panel, { value: "overview", className: "app-tabs__panel", children: _jsxs("div", { className: "dashboard", children: [_jsxs("header", { className: "dashboard-header", children: [_jsxs("div", { className: "dashboard-header__meta", children: [_jsx("h1", { children: "Wallet & Stack Overview" }), _jsx("p", { children: "Monitor balances, RPC endpoints, and local Hardhat automation." })] }), _jsxs("div", { className: "dashboard-header__actions", children: [_jsx(ChainSwitcher, {}), _jsx(ConnectWallet, { chainType: chainType })] })] }), _jsx(WalletSummary, {}), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "\u74B0\u5883\u8A2D\u5B9A" }), _jsxs("dl", { children: [_jsx("dt", { children: "PayPal Client ID" }), _jsx("dd", { children: data?.paypalClientId || '尚未設定' }), _jsx("dt", { children: "Pyth Hermes Endpoint" }), _jsx("dd", { children: pythEndpoint }), _jsx("dt", { children: "\u76EE\u6A19\u93C8\u5225" }), _jsx("dd", { children: displayChainName }), displayChainId && (_jsxs(_Fragment, { children: [_jsx("dt", { children: "Chain ID" }), _jsx("dd", { children: displayChainId })] }))] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "\u93C8\u8207\u9322\u5305\u8A2D\u5B9A" }), _jsxs("dl", { children: [_jsx("dt", { children: "\u93C8\u985E\u578B" }), _jsx("dd", { children: chainType === 'solana'
                                                ? 'Solana (Solana Wallet Adapter)'
                                                : 'EVM (RainbowKit + WalletConnect)' }), _jsx("dt", { children: chainType === 'solana' ? 'PYUSD Mint Address' : 'PYUSD Contract Address' }), _jsx("dd", { children: displayPyusd || '未設定' }), _jsx("dt", { children: chainType === 'solana' ? 'Solana RPC' : 'EVM RPC' }), _jsx("dd", { children: displayRpc || '設定於 .env' }), chainType === 'evm' && (_jsxs(_Fragment, { children: [_jsx("dt", { children: "WalletConnect Project ID" }), _jsx("dd", { children: walletConnectLabel() })] })), addressExplorerLink && (_jsxs(_Fragment, { children: [_jsx("dt", { children: "Explorer" }), _jsx("dd", { children: _jsx("a", { href: addressExplorerLink, target: "_blank", rel: "noreferrer", className: "link", children: "\u67E5\u770B\u5730\u5740" }) })] }))] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "\u8CC7\u7522\u6982\u89BD" }), _jsxs("dl", { children: [_jsx("dt", { children: "Native Asset" }), _jsxs("dd", { className: "asset-row", children: [_jsx("span", { className: "asset-symbol", children: nativeSymbol }), _jsx("span", { className: "asset-value", children: formattedNativeBalance })] }), _jsx("dt", { children: "Stablecoin" }), _jsxs("dd", { className: "asset-row", children: [_jsx("span", { className: "asset-symbol", children: stableSymbol }), _jsx("span", { className: "asset-value", children: formattedStableBalance })] })] }), isLocalChain && chainType === 'evm' && (_jsxs("div", { className: "faucet", children: [_jsx("button", { type: "button", className: "button", disabled: faucetMutation.isPending || !isConnected || !address, onClick: () => faucetMutation.mutate(), children: faucetMutation.isPending ? '發送中...' : '領取本地測試資產' }), faucetMutation.isSuccess && (_jsxs("p", { className: "status-success", children: ["\u5DF2\u767C\u9001 1 ETH / 100 PYUSD", faucetMutation.data?.length ? ` (tx: ${faucetMutation.data[0]})` : ''] })), faucetMutation.isError && (_jsx("p", { className: "status-error", children: faucetMutation.error.message ?? '請稍後重試' }))] }))] }), _jsxs("section", { className: "card", children: [_jsx("h2", { children: "\u4E0B\u4E00\u6B65" }), _jsxs("ol", { children: [_jsx("li", { children: "\u586B\u5165 PayPal Sandbox OAuth\u3001PYUSD\u3001Pyth\u3001RPC \u8A2D\u5B9A\u65BC `.env`\u3002" }), _jsx("li", { children: chainType === 'solana'
                                                ? '整合 Solana Program / Anchor，串接 PYUSD Mint 與 Pyth Price Feeds。'
                                                : '使用 Hardhat 部署合約並設定 Pyth Price Feed。' }), _jsx("li", { children: "\u90E8\u7F72 API / Worker \u81F3 Railway\uFF0C\u524D\u7AEF\u81F3 Vercel \u6216 Railway Static\u3002" })] })] })] }) }), _jsx(Tabs.Panel, { value: "scaffold", className: "app-tabs__panel", children: _jsx(BettingExperience, { chainName: chain.name, chainSwitcher: _jsx(ChainSwitcher, {}), connectWallet: _jsx(ConnectWallet, { chainType: chainType }), displayedWallet: displayedWallet, formattedWallet: formattedWallet }) })] }));
    function walletConnectLabel() {
        return (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
            '請於 apps/web/.env 設定 VITE_WALLETCONNECT_PROJECT_ID');
    }
}
function ConnectWallet({ chainType }) {
    if (chainType === 'solana') {
        return _jsx(WalletMultiButton, { className: "wallet-button" });
    }
    return _jsx(ConnectButton, { accountStatus: "summary", chainStatus: "icon", showBalance: false });
}
function formatAddress(value) {
    if (value.length <= 12) {
        return value;
    }
    return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
