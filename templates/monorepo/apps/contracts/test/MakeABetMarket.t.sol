// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {MakeABetMarket} from "../contracts/MakeABetMarket.sol";
import {MockPYUSD} from "../contracts/MockPYUSD.sol";

/// @title MakeABetMarket Solidity Tests
/// @notice Demonstrates Hardhat 3 compatibility with Forge-style Solidity testing
/// @dev This file showcases Hardhat 3's expanded testing capabilities and serves as:
///      1. A reference implementation for Solidity testing patterns
///      2. Documentation for hackathon participants learning Hardhat 3
///      3. A migration path for projects moving between Hardhat and Foundry
///
/// @dev Key Hardhat 3 features demonstrated:
///      ✅ setUp() function for test initialization
///      ✅ Cheatcodes (vm.deal, vm.prank, vm.expectRevert, vm.expectEmit)
///      ✅ Assertions (assertEq, assertTrue, assertFalse)
///      ✅ Fuzz testing (testFuzz_* functions with random inputs)
///      ✅ Event testing with vm.expectEmit
///      ✅ Console logging for debugging
///      ✅ Gas profiling with gasleft()
///
/// @dev This demonstrates Hardhat 3's compatibility with the broader Ethereum
///      testing ecosystem and provides a familiar syntax for Foundry users.
contract MakeABetMarketTest is Test {
    MakeABetMarket public market;
    MockPYUSD public pyusd;
    address public admin;
    address public user1;
    address public user2;
    
    // Mock Pyth contract address for testing
    address public constant MOCK_PYTH = address(0x1);
    
    /// @notice Set up test environment before each test
    /// @dev Called automatically before each test function
    function setUp() public {
        admin = address(this);
        user1 = address(0x100);
        user2 = address(0x200);
        
        // Deploy PYUSD first
        pyusd = new MockPYUSD(admin, 1_000_000 * 10**6);
        
        // Deploy market with both Pyth and PYUSD addresses
        market = new MakeABetMarket(MOCK_PYTH, address(pyusd));
        
        // Fund test users with ETH using Hardhat cheatcode
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        
        // Mint PYUSD tokens to test users
        pyusd.mint(user1, 10_000 * 10**6);
        pyusd.mint(user2, 10_000 * 10**6);
    }
    
    // ============ MakeABetMarket Tests ============
    
    /// @notice Test contract deployment and initial state
    /// @dev Demonstrates basic assertions in Solidity tests
    function test_Deployment() public view {
        assertEq(address(market.pyth()), MOCK_PYTH, "Pyth address should match");
        assertEq(address(market.token()), address(pyusd), "PYUSD address should match");
        assertEq(market.admin(), admin, "Admin should be deployer");
        assertEq(market.nextMarketId(), 0, "Initial market ID should be 0");
        
        console.log("Market deployed at:", address(market));
        console.log("Admin address:", admin);
    }
    
    /// @notice Test market creation with event emission
    /// @dev Demonstrates vm.expectEmit for testing events
    function test_CreateMarket() public {
        string memory question = "Will ETH reach $5000?";
        bytes32 feedId = bytes32(uint256(1));
        int64 targetPrice = 5000 * 10**8; // $5000 in Pyth format
        uint64 expiry = uint64(block.timestamp + 1 days);
        
        // Expect the MarketCreated event to be emitted
        vm.expectEmit(true, false, false, true);
        emit MakeABetMarket.MarketCreated(0, question, feedId, targetPrice, expiry);
        
        uint256 marketId = market.createMarket(question, feedId, targetPrice, expiry);
        
        assertEq(marketId, 0, "First market ID should be 0");
        assertEq(market.nextMarketId(), 1, "Next market ID should increment");
        
        console.log("Market created with ID:", marketId);
    }
    
    /// @notice Test that market creation reverts with past expiry
    /// @dev Demonstrates vm.expectRevert for testing error conditions
    function test_CreateMarket_RevertsIfExpiryInPast() public {
        string memory question = "Past question";
        bytes32 feedId = bytes32(uint256(1));
        int64 targetPrice = 5000 * 10**8;
        uint64 expiry = uint64(block.timestamp - 1);
        
        vm.expectRevert("expiry must be future");
        market.createMarket(question, feedId, targetPrice, expiry);
    }
    
    /// @notice Test creating multiple markets
    /// @dev Demonstrates sequential operations and state changes
    function test_CreateMultipleMarkets() public {
        uint64 expiry = uint64(block.timestamp + 1 days);
        int64 targetPrice = 5000 * 10**8;
        
        uint256 marketId1 = market.createMarket("Question 1", bytes32(uint256(1)), targetPrice, expiry);
        uint256 marketId2 = market.createMarket("Question 2", bytes32(uint256(2)), targetPrice, expiry);
        uint256 marketId3 = market.createMarket("Question 3", bytes32(uint256(3)), targetPrice, expiry);
        
        assertEq(marketId1, 0, "First market ID");
        assertEq(marketId2, 1, "Second market ID");
        assertEq(marketId3, 2, "Third market ID");
        assertEq(market.nextMarketId(), 3, "Next market ID should be 3");
        
        console.log("Created 3 markets, next ID:", market.nextMarketId());
    }
    
    // ============ MockPYUSD Tests ============
    
    /// @notice Test MockPYUSD deployment and metadata
    /// @dev Verifies ERC20 token properties match PYUSD specifications
    function test_MockPYUSD_Deployment() public view {
        assertEq(pyusd.name(), "Mock PYUSD", "Token name should match");
        assertEq(pyusd.symbol(), "PYUSD", "Token symbol should match");
        assertEq(pyusd.decimals(), 6, "Token decimals should be 6");
        assertEq(pyusd.owner(), admin, "Owner should be admin");
        
        console.log("PYUSD deployed at:", address(pyusd));
        console.log("PYUSD decimals:", pyusd.decimals());
    }
    
    /// @notice Test initial token supply
    /// @dev Verifies admin receives initial supply on deployment
    function test_MockPYUSD_InitialSupply() public view {
        uint256 expectedSupply = 1_000_000 * 10**6;
        assertEq(pyusd.totalSupply(), expectedSupply, "Total supply should match");
        assertEq(pyusd.balanceOf(admin), expectedSupply, "Admin should have initial supply");
    }
    
    /// @notice Test minting new tokens
    /// @dev Demonstrates owner-only functionality
    function test_MockPYUSD_Mint() public {
        uint256 mintAmount = 1000 * 10**6;
        uint256 initialBalance = pyusd.balanceOf(user1);
        
        pyusd.mint(user1, mintAmount);
        
        assertEq(
            pyusd.balanceOf(user1),
            initialBalance + mintAmount,
            "Balance should increase by mint amount"
        );
        
        console.log("Minted", mintAmount, "PYUSD to user1");
    }
    
    /// @notice Test that non-owners cannot mint
    /// @dev Demonstrates vm.prank for impersonating addresses
    function test_MockPYUSD_MintRevertsForNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        pyusd.mint(user2, 1000 * 10**6);
    }
    
    /// @notice Test token transfers between users
    /// @dev Demonstrates vm.prank for testing as different users
    function test_MockPYUSD_Transfer() public {
        uint256 transferAmount = 500 * 10**6;
        
        vm.prank(user1);
        bool success = pyusd.transfer(user2, transferAmount);
        
        assertTrue(success, "Transfer should succeed");
        assertEq(pyusd.balanceOf(user1), 10_000 * 10**6 - transferAmount, "Sender balance");
        assertEq(pyusd.balanceOf(user2), 10_000 * 10**6 + transferAmount, "Receiver balance");
        
        console.log("Transferred", transferAmount, "PYUSD from user1 to user2");
    }
    
    // ============ Fuzz Tests ============
    
    /// @notice Fuzz test for market creation with random inputs
    /// @dev Demonstrates Hardhat 3's fuzz testing capabilities
    /// @dev The fuzzer will generate random values for question and timeOffset
    /// @param question Random string for market question
    /// @param timeOffset Random time offset for expiry
    function testFuzz_CreateMarket(string memory question, uint64 timeOffset) public {
        // Constrain inputs to valid ranges
        vm.assume(timeOffset > 0 && timeOffset < 365 days);
        
        bytes32 feedId = bytes32(uint256(1));
        int64 targetPrice = 5000 * 10**8;
        uint64 expiry = uint64(block.timestamp + timeOffset);
        
        uint256 marketId = market.createMarket(question, feedId, targetPrice, expiry);
        
        assertEq(marketId, 0, "First market ID should be 0");
    }
    
    /// @notice Fuzz test for PYUSD minting with random amounts
    /// @dev Tests minting with various recipient addresses and amounts
    /// @param recipient Random address to receive tokens
    /// @param amount Random amount to mint
    function testFuzz_MockPYUSD_Mint(address recipient, uint256 amount) public {
        // Constrain inputs to valid ranges
        vm.assume(recipient != address(0));
        vm.assume(amount > 0 && amount < type(uint128).max);
        
        uint256 initialBalance = pyusd.balanceOf(recipient);
        pyusd.mint(recipient, amount);
        
        assertEq(
            pyusd.balanceOf(recipient),
            initialBalance + amount,
            "Balance should increase"
        );
    }
    
    /// @notice Fuzz test for PYUSD transfers
    /// @dev Tests transfers with random amounts between users
    /// @param amount Random transfer amount
    function testFuzz_MockPYUSD_Transfer(uint256 amount) public {
        // Constrain amount to user1's balance
        vm.assume(amount > 0 && amount <= 10_000 * 10**6);
        
        uint256 user1BalanceBefore = pyusd.balanceOf(user1);
        uint256 user2BalanceBefore = pyusd.balanceOf(user2);
        
        vm.prank(user1);
        pyusd.transfer(user2, amount);
        
        assertEq(pyusd.balanceOf(user1), user1BalanceBefore - amount, "Sender balance decreased");
        assertEq(pyusd.balanceOf(user2), user2BalanceBefore + amount, "Receiver balance increased");
    }
    
    // ============ Gas Optimization Tests ============
    
    /// @notice Test gas usage for market creation
    /// @dev Useful for optimizing contract gas costs
    function test_Gas_CreateMarket() public {
        uint256 gasBefore = gasleft();
        
        market.createMarket(
            "Will ETH reach $5000?",
            bytes32(uint256(1)),
            5000 * 10**8,
            uint64(block.timestamp + 1 days)
        );
        
        uint256 gasUsed = gasBefore - gasleft();
        console.log("Gas used for createMarket:", gasUsed);
        
        // Assert reasonable gas usage (adjust threshold as needed)
        assertTrue(gasUsed < 300_000, "Gas usage should be reasonable");
    }
    
    /// @notice Test gas usage for PYUSD transfer
    /// @dev Compares gas costs for ERC20 operations
    function test_Gas_Transfer() public {
        uint256 gasBefore = gasleft();
        
        vm.prank(user1);
        pyusd.transfer(user2, 1000 * 10**6);
        
        uint256 gasUsed = gasBefore - gasleft();
        console.log("Gas used for PYUSD transfer:", gasUsed);
        
        assertTrue(gasUsed < 100_000, "Transfer gas should be reasonable");
    }
}
