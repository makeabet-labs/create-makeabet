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
        
        // Deploy contracts
        market = new MakeABetMarket(MOCK_PYTH);
        pyusd = new MockPYUSD(admin, 1_000_000 * 10**6);
        
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
        assertEq(market.admin(), admin, "Admin should be deployer");
        assertEq(market.nextRoomId(), 0, "Initial room ID should be 0");
        
        console.log("Market deployed at:", address(market));
        console.log("Admin address:", admin);
    }
    
    /// @notice Test room creation with event emission
    /// @dev Demonstrates vm.expectEmit for testing events
    function test_CreateRoom() public {
        string memory question = "Will ETH reach $5000?";
        bytes32 feedId = bytes32(uint256(1));
        uint64 expiry = uint64(block.timestamp + 1 days);
        
        // Expect the RoomCreated event to be emitted
        vm.expectEmit(true, false, false, true);
        emit MakeABetMarket.RoomCreated(0, question, feedId, expiry);
        
        uint256 roomId = market.createRoom(question, feedId, expiry);
        
        assertEq(roomId, 0, "First room ID should be 0");
        assertEq(market.nextRoomId(), 1, "Next room ID should increment");
        
        // Verify room data
        (
            string memory q,
            bytes32 f,
            uint64 e,
            bool settled,
            bool outcome
        ) = market.rooms(roomId);
        
        assertEq(q, question, "Question should match");
        assertEq(f, feedId, "Feed ID should match");
        assertEq(e, expiry, "Expiry should match");
        assertFalse(settled, "Room should not be settled");
        assertFalse(outcome, "Outcome should be false initially");
        
        console.log("Room created with ID:", roomId);
    }
    
    /// @notice Test that room creation reverts with past expiry
    /// @dev Demonstrates vm.expectRevert for testing error conditions
    function test_CreateRoom_RevertsIfExpiryInPast() public {
        string memory question = "Past question";
        bytes32 feedId = bytes32(uint256(1));
        uint64 expiry = uint64(block.timestamp - 1);
        
        vm.expectRevert("expiry must be future");
        market.createRoom(question, feedId, expiry);
    }
    
    /// @notice Test creating multiple rooms
    /// @dev Demonstrates sequential operations and state changes
    function test_CreateMultipleRooms() public {
        uint64 expiry = uint64(block.timestamp + 1 days);
        
        uint256 roomId1 = market.createRoom("Question 1", bytes32(uint256(1)), expiry);
        uint256 roomId2 = market.createRoom("Question 2", bytes32(uint256(2)), expiry);
        uint256 roomId3 = market.createRoom("Question 3", bytes32(uint256(3)), expiry);
        
        assertEq(roomId1, 0, "First room ID");
        assertEq(roomId2, 1, "Second room ID");
        assertEq(roomId3, 2, "Third room ID");
        assertEq(market.nextRoomId(), 3, "Next room ID should be 3");
        
        console.log("Created 3 rooms, next ID:", market.nextRoomId());
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
    
    /// @notice Fuzz test for room creation with random inputs
    /// @dev Demonstrates Hardhat 3's fuzz testing capabilities
    /// @dev The fuzzer will generate random values for question and timeOffset
    /// @param question Random string for room question
    /// @param timeOffset Random time offset for expiry
    function testFuzz_CreateRoom(string memory question, uint64 timeOffset) public {
        // Constrain inputs to valid ranges
        vm.assume(timeOffset > 0 && timeOffset < 365 days);
        
        bytes32 feedId = bytes32(uint256(1));
        uint64 expiry = uint64(block.timestamp + timeOffset);
        
        uint256 roomId = market.createRoom(question, feedId, expiry);
        
        (string memory q, , uint64 e, , ) = market.rooms(roomId);
        assertEq(q, question, "Question should match");
        assertEq(e, expiry, "Expiry should match");
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
    
    /// @notice Test gas usage for room creation
    /// @dev Useful for optimizing contract gas costs
    function test_Gas_CreateRoom() public {
        uint256 gasBefore = gasleft();
        
        market.createRoom(
            "Will ETH reach $5000?",
            bytes32(uint256(1)),
            uint64(block.timestamp + 1 days)
        );
        
        uint256 gasUsed = gasBefore - gasleft();
        console.log("Gas used for createRoom:", gasUsed);
        
        // Assert reasonable gas usage (adjust threshold as needed)
        assertTrue(gasUsed < 200_000, "Gas usage should be reasonable");
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
