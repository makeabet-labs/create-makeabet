// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IPyth} from "@pythnetwork/pyth-sdk-solidity/IPyth.sol";
import {PythStructs} from "@pythnetwork/pyth-sdk-solidity/PythStructs.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MakeABetMarket {
    struct Market {
        string question;
        bytes32 priceFeedId;
        int64 targetPrice;
        uint64 expiry;
        bool settled;
        bool outcome;
        uint256 bullishPool;
        uint256 bearishPool;
    }

    struct Bet {
        bool isBullish;
        uint256 amount;
        bool claimed;
    }

    IPyth public immutable pyth;
    IERC20 public immutable token; // PYUSD token
    address public immutable admin;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Bet)) public bets;
    uint256 public nextMarketId;

    event MarketCreated(uint256 indexed marketId, string question, bytes32 feedId, int64 targetPrice, uint64 expiry);
    event BetPlaced(uint256 indexed marketId, address indexed user, bool isBullish, uint256 amount);
    event MarketSettled(uint256 indexed marketId, bool outcome);
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 amount);

    constructor(address pythAddress, address tokenAddress) {
        pyth = IPyth(pythAddress);
        token = IERC20(tokenAddress);
        admin = msg.sender;
    }

    function createMarket(
        string calldata question,
        bytes32 priceFeedId,
        int64 targetPrice,
        uint64 expiry
    ) external returns (uint256 marketId) {
        require(expiry > block.timestamp, "expiry must be future");

        marketId = nextMarketId++;
        markets[marketId] = Market({
            question: question,
            priceFeedId: priceFeedId,
            targetPrice: targetPrice,
            expiry: expiry,
            settled: false,
            outcome: false,
            bullishPool: 0,
            bearishPool: 0
        });

        emit MarketCreated(marketId, question, priceFeedId, targetPrice, expiry);
    }

    function placeBet(uint256 marketId, bool isBullish, uint256 amount) external {
        Market storage market = markets[marketId];
        require(block.timestamp < market.expiry, "market expired");
        require(!market.settled, "market settled");
        require(amount > 0, "amount must be positive");
        
        Bet storage userBet = bets[marketId][msg.sender];
        require(userBet.amount == 0, "already bet on this market");

        // Transfer PYUSD from user to contract
        require(token.transferFrom(msg.sender, address(this), amount), "transfer failed");

        // Record bet
        userBet.isBullish = isBullish;
        userBet.amount = amount;
        userBet.claimed = false;

        // Update pools
        if (isBullish) {
            market.bullishPool += amount;
        } else {
            market.bearishPool += amount;
        }

        emit BetPlaced(marketId, msg.sender, isBullish, amount);
    }

    function settleMarket(uint256 marketId, bytes[] calldata priceUpdateData) external payable {
        Market storage market = markets[marketId];
        require(block.timestamp >= market.expiry, "not expired");
        require(!market.settled, "already settled");

        // Update Pyth price feeds
        uint fee = pyth.getUpdateFee(priceUpdateData);
        pyth.updatePriceFeeds{value: fee}(priceUpdateData);

        // Get latest price
        PythStructs.Price memory latest = pyth.getPriceNoOlderThan(market.priceFeedId, 3600);
        int64 latestPrice = latest.price;
        
        // Determine outcome (bullish wins if price >= target)
        market.outcome = latestPrice >= market.targetPrice;
        market.settled = true;

        emit MarketSettled(marketId, market.outcome);
    }

    function claimWinnings(uint256 marketId) external {
        Market storage market = markets[marketId];
        require(market.settled, "market not settled");
        
        Bet storage userBet = bets[marketId][msg.sender];
        require(userBet.amount > 0, "no bet found");
        require(!userBet.claimed, "already claimed");
        
        // Check if user won
        bool userWon = userBet.isBullish == market.outcome;
        require(userWon, "bet lost");

        // Calculate winnings
        uint256 totalPool = market.bullishPool + market.bearishPool;
        uint256 winningPool = market.outcome ? market.bullishPool : market.bearishPool;
        uint256 winnings = (userBet.amount * totalPool) / winningPool;

        userBet.claimed = true;

        // Transfer winnings
        require(token.transfer(msg.sender, winnings), "transfer failed");

        emit WinningsClaimed(marketId, msg.sender, winnings);
    }

    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    function getUserBet(uint256 marketId, address user) external view returns (Bet memory) {
        return bets[marketId][user];
    }
}
