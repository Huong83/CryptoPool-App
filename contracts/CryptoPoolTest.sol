// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title CryptoPool Sepolia Test Contract
/// @notice Safe test-only contract: accepts ETH, emits an event, and immediately refunds the caller.
///         It does not keep user funds and has no owner/admin withdrawal function.
contract CryptoPoolTest {
    event TestExecuted(address indexed user, uint256 amount, uint256 note, uint256 timestamp);

    function executeTest(uint256 note) external payable {
        emit TestExecuted(msg.sender, msg.value, note, block.timestamp);
        (bool ok, ) = payable(msg.sender).call{value: msg.value}("");
        require(ok, "REFUND_FAILED");
    }

    receive() external payable {
        revert("USE_EXECUTE_TEST");
    }
}
