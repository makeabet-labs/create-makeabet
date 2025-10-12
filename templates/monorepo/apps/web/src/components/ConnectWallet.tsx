import { ConnectButton } from '@rainbow-me/rainbowkit';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import type { ChainType } from '../providers/WalletProvider';

interface ConnectWalletProps {
  chainType: ChainType;
}

export function ConnectWallet({ chainType }: ConnectWalletProps) {
  if (chainType === 'solana') {
    return <WalletMultiButton className="wallet-button" />;
  }

  return <ConnectButton accountStatus="summary" chainStatus="icon" showBalance={false} />;
}
