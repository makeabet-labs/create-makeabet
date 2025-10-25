export const CHAIN_METADATA = {
    'local-hardhat': {
        key: 'local-hardhat',
        name: 'Local Hardhat',
        chainType: 'evm',
        nativeSymbol: 'ETH',
        stableSymbol: 'PYUSD',
        chainId: import.meta.env.VITE_LOCAL_CHAIN_ID || '31337',
        rpcUrl: import.meta.env.VITE_LOCAL_RPC_URL || 'http://127.0.0.1:8545',
        explorerUrl: undefined,
        blockExplorerAddressTemplate: undefined,
        pyusdAddress: import.meta.env.VITE_LOCAL_PYUSD_ADDRESS || '',
        faucetUrl: undefined,
    },
    sepolia: {
        key: 'sepolia',
        name: 'Ethereum Sepolia',
        chainType: 'evm',
        nativeSymbol: 'ETH',
        stableSymbol: 'PYUSD',
        chainId: '11155111',
        rpcUrl: 'https://ethereum-sepolia.publicnode.com',
        explorerUrl: 'https://sepolia.etherscan.io',
        blockExplorerAddressTemplate: 'https://sepolia.etherscan.io/address/{address}',
        pyusdAddress: '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9',
        faucetUrl: 'https://www.infura.io/faucet/sepolia',
    },
    'arbitrum-sepolia': {
        key: 'arbitrum-sepolia',
        name: 'Arbitrum Sepolia',
        chainType: 'evm',
        nativeSymbol: 'ETH',
        stableSymbol: 'PYUSD',
        chainId: '421614',
        rpcUrl: 'https://arbitrum-sepolia.publicnode.com',
        explorerUrl: 'https://sepolia.arbiscan.io',
        blockExplorerAddressTemplate: 'https://sepolia.arbiscan.io/address/{address}',
        pyusdAddress: '0xc6006A919685EA081697613373C50B6b46cd6F11',
        faucetUrl: 'https://faucet.quicknode.com/arbitrum/sepolia',
    },
    'solana-devnet': {
        key: 'solana-devnet',
        name: 'Solana Devnet',
        chainType: 'solana',
        nativeSymbol: 'SOL',
        stableSymbol: 'PYUSD',
        rpcUrl: 'https://api.devnet.solana.com',
        explorerUrl: 'https://explorer.solana.com',
        blockExplorerAddressTemplate: 'https://explorer.solana.com/address/{address}?cluster=devnet',
        pyusdMint: 'CXk2AMBfi3TwaEL2468s6zP8xq9NxTXjp9gjMgzeUynM',
        faucetUrl: 'https://faucet.solana.com/',
    },
};
export const DEFAULT_CHAIN_KEY = import.meta.env.VITE_CHAIN_DEFAULT ?? 'sepolia';
export function getChainMetadata(chainKey) {
    return CHAIN_METADATA[chainKey] ?? CHAIN_METADATA.sepolia;
}
/**
 * Helper function to generate block explorer URLs for addresses and transactions
 * @param chainKey - The chain to generate the URL for
 * @param type - Type of URL to generate ('address' or 'tx')
 * @param value - The address or transaction hash
 * @returns The explorer URL or null if not available
 */
export function getExplorerUrl(chainKey, type, value) {
    const chain = CHAIN_METADATA[chainKey];
    // Local chain has no block explorer
    if (chainKey === 'local-hardhat') {
        return null;
    }
    if (type === 'address' && chain.blockExplorerAddressTemplate) {
        return chain.blockExplorerAddressTemplate.replace('{address}', value);
    }
    if (type === 'tx' && chain.explorerUrl) {
        return `${chain.explorerUrl}/tx/${value}`;
    }
    return null;
}
