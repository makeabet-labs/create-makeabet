// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPyth} from "@pythnetwork/pyth-sdk-solidity/IPyth.sol";

contract MakeABetMarket {
    struct Room {
        string question;
        bytes32 priceFeedId;
        uint64 expiry;
        bool settled;
        bool outcome;
    }

    IPyth public immutable pyth;
    address public immutable admin;

    mapping(uint256 => Room) public rooms;
    uint256 public nextRoomId;

    event RoomCreated(uint256 indexed roomId, string question, bytes32 feedId, uint64 expiry);
    event RoomSettled(uint256 indexed roomId, bool outcome);

    constructor(address pythAddress) {
        pyth = IPyth(pythAddress);
        admin = msg.sender;
    }

    function createRoom(
        string calldata question,
        bytes32 priceFeedId,
        uint64 expiry
    ) external returns (uint256 roomId) {
        require(expiry > block.timestamp, "expiry must be future");

        roomId = nextRoomId++;
        rooms[roomId] = Room({
            question: question,
            priceFeedId: priceFeedId,
            expiry: expiry,
            settled: false,
            outcome: false
        });

        emit RoomCreated(roomId, question, priceFeedId, expiry);
    }

    function settleRoom(uint256 roomId, bytes[] calldata priceUpdateData, int64 targetPrice)
        external
    {
        Room storage room = rooms[roomId];
        require(block.timestamp >= room.expiry, "not expired");
        require(!room.settled, "already settled");

        uint fee = pyth.getUpdateFee(priceUpdateData);
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);

        // For demo purpose we only need the price sign
        int64 latestPrice = pyth.getPrice(room.priceFeedId).price;
        room.outcome = latestPrice >= targetPrice;
        room.settled = true;

        emit RoomSettled(roomId, room.outcome);
    }
}
