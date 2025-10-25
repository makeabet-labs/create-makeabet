# Implementation Plan

This implementation plan breaks down the scaffold enhancements into discrete, actionable coding tasks. Each task builds incrementally on previous work, ensuring the system remains functional throughout development.

## Task List

- [x] 1. Upgrade to Hardhat 3 and update contract infrastructure
  - Update Hardhat and related dependencies to version 3.0.0+
  - Update hardhat.config.ts for Hardhat 3 compatibility
  - Verify compilation and existing tests pass
  - Update deployment scripts for Hardhat 3 API changes
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [-] 2. Enhance local deployment automation
  - [x] 2.1 Update deploy-local.ts script to seed faucet with more tokens
    - Modify script to mint 10000 ETH and 1000000 PYUSD to faucet signer
    - Add timestamp and chainId to deployment artifacts
    - Ensure deployment artifacts are written to deployments/local.json
    - _Requirements: 2.2, 2.3, 5.1_

  - [x] 2.2 Enhance sync-local-env.mjs script
    - Read deployment artifacts from apps/contracts/deployments/local.json
    - Update root .env.local with deployed addresses
    - Update apps/api/.env.local with chain configuration
    - Update apps/worker/.env.local with chain configuration
    - Update apps/web/.env.local with frontend-specific variables
    - Add error handling for missing deployment file
    - _Requirements: 2.4, 6.4_

  - [x] 2.3 Verify pnpm dev workflow
    - Test that `pnpm chain` starts Hardhat node on 0.0.0.0:8545
    - Test that `pnpm deploy:local` deploys contracts and writes artifacts
    - Test that `pnpm sync:local-env` updates environment files
    - Test that `pnpm dev` orchestrates all steps correctly
    - Verify concurrently and wait-on work as expected
    - _Requirements: 2.1, 2.5, 2.6_

- [ ] 3. Enhance ChainProvider with runtime configuration
  - [ ] 3.1 Update ChainProvider to load local chain config from env vars
    - Read VITE_LOCAL_CHAIN_ENABLED, VITE_LOCAL_PYUSD_ADDRESS from import.meta.env
    - Update CHAIN_METADATA['local-hardhat'] with runtime values
    - Add isLocalChain computed property
    - Add isFaucetAvailable computed property
    - _Requirements: 1.1, 1.2_

  - [ ] 3.2 Add block explorer URL helper method
    - Implement getExplorerUrl(type: 'address' | 'tx', value: string) method
    - Use blockExplorerAddressTemplate from chain metadata
    - Return null for local chain (no explorer)
    - Export helper function for use in components
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ] 3.3 Update ChainProvider context interface
    - Add isLocalChain boolean to context value
    - Add isFaucetAvailable boolean to context value
    - Add getExplorerUrl method to context value
    - Update TypeScript interface definition
    - _Requirements: 1.2, 4.4_

- [ ] 4. Create ChainSwitcher UI component
  - [ ] 4.1 Implement ChainSwitcher component with Mantine Select
    - Create apps/web/src/components/ChainSwitcher.tsx
    - Use Mantine Menu component for dropdown
    - Display chain icon, name, and type (EVM/Solana)
    - Show checkmark for current chain
    - Disable local chain option if not available
    - _Requirements: 1.3, 12.1, 12.2_

  - [ ] 4.2 Add chain switching logic and loading states
    - Call ChainProvider's setChain method on selection
    - Show loading indicator during switch
    - Handle chain switch errors with notifications
    - Store selected chain in localStorage
    - _Requirements: 1.4, 12.3, 12.4, 12.5_

  - [ ] 4.3 Style ChainSwitcher component
    - Apply Mantine theme styling
    - Add chain icons/emojis
    - Ensure responsive design
    - Add hover and focus states
    - _Requirements: 12.1_

- [ ] 5. Implement balance display hooks
  - [ ] 5.1 Create useNativeBalance hook for EVM chains
    - Use wagmi's useBalance hook for EVM chains
    - Format balance with proper decimals
    - Handle loading and error states
    - Auto-refresh on chain change
    - _Requirements: 3.1, 3.3, 3.4_

  - [ ] 5.2 Create usePYUSDBalance hook for EVM chains
    - Use wagmi's useReadContract hook to call balanceOf
    - Read PYUSD contract address from chain metadata
    - Format balance with 6 decimals
    - Handle loading and error states
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ] 5.3 Add Solana balance support
    - Implement native SOL balance query using @solana/web3.js
    - Implement PYUSD SPL token balance query
    - Use same interface as EVM hooks
    - Handle Solana-specific errors
    - _Requirements: 3.1, 3.2, 3.5_

  - [ ] 5.4 Add balance refresh on transaction completion
    - Expose refetch method from hooks
    - Call refetch after successful transactions
    - Debounce multiple refetch calls
    - _Requirements: 3.5_

- [ ] 6. Create WalletSummary component
  - [ ] 6.1 Implement WalletSummary component structure
    - Create apps/web/src/components/WalletSummary.tsx
    - Use Mantine Card, Group, Text components
    - Display connected wallet address with copy button
    - Show native token balance with loading skeleton
    - Show PYUSD balance with loading skeleton
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 6.2 Add block explorer links
    - Use ChainProvider's getExplorerUrl method
    - Add link icon next to address
    - Open explorer in new tab
    - Hide link for local chain
    - _Requirements: 4.1, 4.3, 4.4_

  - [ ] 6.3 Integrate balance hooks
    - Use useNativeBalance hook
    - Use usePYUSDBalance hook
    - Display formatted balances
    - Show error messages when balance fetch fails
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 6.4 Add conditional faucet button
    - Show "Request Faucet" button only on local chain
    - Check ChainProvider's isFaucetAvailable flag
    - Integrate with Faucet component
    - _Requirements: 5.6_

- [ ] 7. Implement Faucet component and API integration
  - [ ] 7.1 Create Faucet component
    - Create apps/web/src/components/Faucet.tsx
    - Implement button with loading state
    - Call /api/faucet endpoint with connected address
    - Show toast notification on success/error
    - Display transaction hashes on success
    - _Requirements: 5.6, 5.7_

  - [ ] 7.2 Add faucet request function
    - Implement requestFaucet API call
    - Handle fetch errors
    - Parse response JSON
    - Type response with FaucetResponse interface
    - _Requirements: 5.3, 5.4_

  - [ ] 7.3 Implement client-side rate limiting
    - Store last request timestamp in localStorage
    - Calculate cooldown remaining
    - Disable button during cooldown
    - Show countdown timer
    - _Requirements: 5.7_

  - [ ] 7.4 Enhance API faucet endpoint with rate limiting
    - Add in-memory rate limiter Map in apps/api/src/router.ts
    - Check last request time per address
    - Return 429 status code if within cooldown period
    - Set cooldown to 5 minutes
    - _Requirements: 5.3, 5.5_

  - [ ] 7.5 Add configurable faucet amounts
    - Read LOCAL_FAUCET_ETH_AMOUNT from environment (default: 1)
    - Read LOCAL_FAUCET_PYUSD_AMOUNT from environment (default: 100)
    - Update transfer logic to use configured amounts
    - _Requirements: 5.3, 5.4_

  - [ ] 7.6 Improve faucet error handling and logging
    - Add detailed error logging with context
    - Improve error messages for common failures
    - Handle nonce errors gracefully
    - Handle insufficient balance errors
    - _Requirements: 5.4, 5.5_

- [ ] 8. Enhance API config endpoint
  - [ ] 8.1 Add local chain information to /api/config
    - Add localChainEnabled boolean field
    - Add faucetAvailable boolean field
    - Add explorerUrl string field
    - Add marketAddress string field
    - _Requirements: 6.1, 6.2, 10.5_

  - [ ] 8.2 Update config response TypeScript interface
    - Define ConfigResponse interface in shared-core
    - Export interface for frontend use
    - Update API response to match interface
    - _Requirements: 6.1_

- [ ] 9. Update environment configuration files
  - [ ] 9.1 Update root .env.example
    - Add LOCAL_FAUCET_ETH_AMOUNT variable
    - Add LOCAL_FAUCET_PYUSD_AMOUNT variable
    - Document all local chain variables
    - Add comments explaining each variable
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 9.2 Update apps/web/.env.example
    - Add all VITE_LOCAL_* variables
    - Add VITE_API_URL variable
    - Document frontend-specific variables
    - Add comments explaining usage
    - _Requirements: 6.3_

  - [ ] 9.3 Update apps/api/.env.example
    - Add backend-specific variables
    - Document faucet configuration
    - Add RPC URL variables
    - _Requirements: 6.1, 6.2_

  - [ ] 9.4 Update .gitignore to exclude deployment artifacts
    - Add apps/contracts/deployments/local.json to .gitignore
    - Add .env.local to .gitignore (if not already)
    - Ensure deployment artifacts are not committed
    - _Requirements: 6.5_

- [ ] 10. Update documentation
  - [ ] 10.1 Update README.md with new workflow
    - Document `pnpm dev` single-command workflow
    - Explain what happens behind the scenes
    - Add chain switching instructions
    - Add faucet usage instructions
    - Update Railway deployment section
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 10.2 Update README_TW.md with Chinese translations
    - Translate all new sections to Traditional Chinese
    - Ensure consistency with English README
    - Update examples and commands
    - _Requirements: 11.6_

  - [ ] 10.3 Add Hardhat 3 documentation
    - Document Hardhat 3 features used
    - Add example Solidity test file
    - Document testing workflow
    - Highlight Hardhat 3 benefits
    - _Requirements: 7.5, 11.1_

  - [ ] 10.4 Document PYUSD integration
    - List PYUSD contract addresses for all chains
    - Document balance checking methods
    - Document transfer methods
    - Add code examples
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 10.5 Document Pyth oracle integration
    - Document pull oracle pattern
    - Add code examples for fetching from Hermes
    - Add code examples for updating on-chain
    - Add code examples for consuming prices
    - Document price feed IDs
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ] 10.6 Update hackathon briefing templates
    - Update docs/templates/Hardhat.md with Hardhat 3 features
    - Update docs/templates/PYUSD.md with integration details
    - Update docs/templates/Pyth.md with oracle usage
    - Add demo video script suggestions
    - _Requirements: 11.7_

- [ ] 11. Update Railway deployment configuration
  - [ ] 11.1 Verify railway.json configuration
    - Ensure Postgres and Redis plugins are defined
    - Ensure API and worker services are defined
    - Verify environment variable mappings
    - _Requirements: 10.1, 10.2_

  - [ ] 11.2 Update Procfile
    - Verify web command starts API server
    - Verify worker command starts worker service
    - Ensure commands use correct package manager
    - _Requirements: 10.3_

  - [ ] 11.3 Add Railway deployment button to README
    - Add "Deploy on Railway" button with correct URL
    - Link to railway.json configuration
    - Document required environment variables
    - _Requirements: 10.4_

  - [ ] 11.4 Document Railway environment variables
    - List all required variables for Railway
    - Explain which variables are auto-injected
    - Provide example values
    - Add troubleshooting tips
    - _Requirements: 10.5_

  - [ ] 11.5 Test Railway deployment
    - Deploy to Railway test project
    - Verify Postgres and Redis provision correctly
    - Verify API and worker start successfully
    - Verify environment variables are injected
    - Test API endpoints
    - _Requirements: 10.6_

- [ ] 12. Integrate components into main application
  - [ ] 12.1 Add ChainSwitcher to AppLayout
    - Import ChainSwitcher component
    - Add to header/navigation area
    - Ensure proper positioning
    - Test chain switching flow
    - _Requirements: 1.3, 12.1_

  - [ ] 12.2 Add WalletSummary to dashboard
    - Import WalletSummary component
    - Add to main dashboard page
    - Ensure proper layout
    - Test balance display
    - _Requirements: 3.1, 3.2_

  - [ ] 12.3 Wire up Faucet component
    - Integrate Faucet into WalletSummary
    - Test faucet request flow
    - Verify balance updates after faucet
    - Test error handling
    - _Requirements: 5.6, 5.7_

  - [ ] 12.4 Test complete user flow
    - Start with `pnpm dev`
    - Connect wallet to local Hardhat
    - Verify balances display
    - Request faucet tokens
    - Verify balance increase
    - Switch to Sepolia
    - Verify wallet reconnects
    - Verify faucet button disappears
    - _Requirements: 1.3, 1.4, 1.5, 2.5, 3.4, 5.6_

- [ ] 13. Add example Solidity tests for Hardhat 3
  - Create test/MakeABetMarket.t.sol with Solidity tests
  - Demonstrate Hardhat 3 Solidity testing features
  - Test contract deployment
  - Test core contract functions
  - _Requirements: 7.4_

- [ ] 14. Add comprehensive integration tests
  - Write integration test for local development flow
  - Write integration test for chain switching
  - Write integration test for faucet end-to-end
  - Use Vitest for frontend tests
  - Use Hardhat for contract tests
  - _Requirements: 2.5, 3.4, 5.7_

- [ ] 15. Final validation and polish
  - [ ] 15.1 Run full test suite
    - Run `pnpm test` in all packages
    - Fix any failing tests
    - Ensure 100% of core functionality is tested
    - _Requirements: All_

  - [ ] 15.2 Test CLI generation
    - Build CLI with `pnpm --filter @makeabet/create build`
    - Generate new project with CLI
    - Verify all files are created correctly
    - Test generated project workflow
    - _Requirements: All_

  - [ ] 15.3 Verify all documentation is accurate
    - Review README.md for accuracy
    - Review README_TW.md for accuracy
    - Check all code examples work
    - Verify all links are valid
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [ ] 15.4 Performance optimization
    - Check bundle size
    - Optimize images and assets
    - Ensure fast initial load
    - Test on slow network
    - _Requirements: All_

  - [ ] 15.5 Security audit
    - Review faucet security
    - Check for exposed private keys
    - Verify input validation
    - Test rate limiting
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 15.6 Cross-browser testing
    - Test on Chrome
    - Test on Firefox
    - Test on Safari
    - Test on mobile browsers
    - _Requirements: All_

  - [ ] 15.7 Prepare demo video
    - Script demo video (2-4 minutes)
    - Record local development workflow
    - Record chain switching
    - Record faucet usage
    - Highlight Hardhat 3, PYUSD, Pyth features
    - _Requirements: 7.5, 8.5, 9.5_
