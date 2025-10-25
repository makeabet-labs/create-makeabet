// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract MockPYUSD is ERC20, Ownable {
    constructor(address initialRecipient, uint256 initialSupply)
        ERC20("Mock PYUSD", "PYUSD")
        Ownable(initialRecipient)
    {
        _mint(initialRecipient, initialSupply);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
