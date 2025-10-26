#!/usr/bin/env node

import { ethers } from 'ethers';

const RPC_URL = 'http://127.0.0.1:8545';
const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const RECIPIENT = '0xc5a132C1C3E82097421C958da6D600C24612EDFd';

async function main() {
  console.log('🧪 Testing direct ETH transfer...\n');
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('Wallet address:', wallet.address);
  console.log('Recipient:', RECIPIENT);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log('Wallet balance:', ethers.formatEther(balance), 'ETH');
  
  // Check nonce
  const nonce = await provider.getTransactionCount(wallet.address, 'latest');
  console.log('Current nonce:', nonce);
  
  const pendingNonce = await provider.getTransactionCount(wallet.address, 'pending');
  console.log('Pending nonce:', pendingNonce);
  
  if (nonce !== pendingNonce) {
    console.log('⚠️  Warning: Nonce mismatch! There are pending transactions.');
  }
  
  console.log('\n📤 Sending 1 ETH...');
  
  try {
    const tx = await wallet.sendTransaction({
      to: RECIPIENT,
      value: ethers.parseEther('1'),
    });
    
    console.log('✅ Transaction sent!');
    console.log('Hash:', tx.hash);
    console.log('Nonce:', tx.nonce);
    
    console.log('\n⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    
    console.log('✅ Transaction confirmed!');
    console.log('Block:', receipt.blockNumber);
    console.log('Gas used:', receipt.gasUsed.toString());
    
    // Check new balance
    const newBalance = await provider.getBalance(RECIPIENT);
    console.log('\n💰 Recipient balance:', ethers.formatEther(newBalance), 'ETH');
    
  } catch (error) {
    console.error('\n❌ Transaction failed!');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
