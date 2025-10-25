// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {MakeABetMarket} from "../contracts/MakeABetMarket.sol";
import {MockPYUSD} from "../contracts/MockPYUSD.sol";

/// @title MakeABetMarket Solidity Tests
/// @notice Demonstrates Hardhat 3 native Solidity testing capabilities
/// @dev Uses Forge-style testing syntax supported by Hardhat 3
contract MakeABetMarketTest is Test {
    MakeABetMarket public market;
    MockPYUSD public pyusd;
    address public admin;
    address public user1;
    address public user2;
    
    // Mock Pyth contract address for testing
    address public constant MOCK_PYTH = address(0x1);
    
    function setUp() public {
        admin = address(this);
        user1 = address(0x100);
        user2 = address(0x200);
        
        // Deploy contracts
        market = new MakeABetMarket(MOCK_PYTH);
        pyusd = new MockPYUSD(admin, 1_000_000 * 10**6);
        
        // Fund test users
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        pyusd.mint(user1, 10_000 * 10**6);
        pyusd.mint(user2, 10_000 * 10**6);
    }
    
    function test_Deployment() public view {
        assertEq(address(market.pyth()), MOCK_PYTH, "Pyth address should match");
        assertEq(market.admin(), admin, "Admin should be deployer");
        assertEq(market.nextRoomId(), 0, "Initial room ID should be 0");
    }
    
    function test_CreateRoom() public {
        string memory question = "Will ETH reach $5000?";
        bytes32 feedId = bytes32(uint256(1));
        uint64 expiry = uint64(block.timestamp + 1 days);
        
        vm.expectEmit(true, false, false, true);
        emit MakeABetMarket.RoomCreated(0, question, feedId, expiry);
        
        uint256 roomId = market.createRoom(question, feedId, expiry);
        
        assertEq(roomId, 0, "First room ID should be 0");
        assertEq(market.nextRoomId(), 1, "Next room ID should increment");
        
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
    }
    
    function test_CreateRoom_RevertsIfExpiryInPast() public {
        string memory question = "Past question";
        bytes32 feedId = bytes32(uint256(1));
        uint64 expiry = uint64(block.timestamp - 1);
        
        vm.expectRevert("expiry must be future");
        market.createRoom(question, feedId, expiry);
    }
    
    function test_CreateMultipleRooms() public {
        uint64 expiry = uint64(block.timestamp + 1 days);
        
        uint256 roomId1 = market.createRoom("Question 1", bytes32(uint256(1)), expiry);
        uint256 roomId2 = market.createRoom("Question 2", bytes32(uint256(2)), expiry);
        uint256 roomId3 = market.createRoom("Question 3", bytes32(uint256(3)), expiry);
        
        assertEq(roomId1, 0, "First room ID");
        assertEq(roomId2, 1, "Second room ID");
        assertEq(roomId3, 2, "Third room ID");
        assertEq(market.nextRoomId(), 3, "Next room ID should be 3");
    }
    
    function test_MockPYUSD_Deployment() public view {
        assertEq(pyusd.name(), "Mock PYUSD", "Token name should match");
        assertEq(pyusd.symbol(), "PYUSD", "Token symbol should match");
        assertEq(pyusd.decimals(), 6, "Token decimals should be 6");
        assertEq(pyusd.owner(), admin, "Owner should be admin");
    }
    
    function test_MockPYUSD_InitialSupply() public view {
        uint256 expectedSupply = 1_000_000 * 10**6;
        assertEq(pyusd.totalSupply(), expectedSupply, "Total supply should match");
        assertEq(pyusd.balanceOf(admin), expectedSupply, "Admin should have initial supply");
    }
    
    function test_MockPYUSD_Mint() public {
        uint256 mintAmount = 1000 * 10**6;
        uint256 initialBalance = pyusd.balanceOf(user1);
        
        pyusd.mint(user1, mintAmount);
        
        assertEq(
            pyusd.balanceOf(user1),
            initialBalance + mintAmount,
            "Balance should increase by mint amount"
        );
    }
    
    function test_MockPYUSD_MintRevertsForNonOwner() public {
        vm.prank(user1);
        vm.expectRevert();
        pyusd.mint(user2, 1000 * 10**6);
    }
    
    function test_MockPYUSD_Transfer() public {
        uint256 transferAmount = 500 * 10**6;
        
        vm.prank(user1);
        bool success = pyusd.transfer(user2, transferAmount);
        
        assertTrue(success, "Transfer should succeed");
        assertEq(pyusd.balanceOf(user1), 10_000 * 10**6 - transferAmount, "Sender balance");
        assertEq(pyusd.balanceOf(user2), 10_000 * 10**6 + transferAmount, "Receiver balance");
    }
    
    function testFuzz_CreateRoom(string memory question, uint64 timeOffset) public {
        vm.assume(timeOffset > 0 && timeOffset < 365 days);
        
        bytes32 feedId = bytes32(uint256(1));
        uint64 expiry = uint64(block.timestamp + timeOffset);
        
        uint256 roomId = market.createRoom(question, feedId, expiry);
        
        (string memory q, , uint64 e, , ) = market.rooms(roomId);
        assertEq(q, question, "Question should match");
        assertEq(e, expiry, "Expiry should match");
    }
    
    function testFuzz_MockPYUSD_Mint(address recipient, uint256 amount) public {
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
}
