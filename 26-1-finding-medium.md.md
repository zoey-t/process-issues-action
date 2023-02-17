[source]
dfsdkka
contracts/Broker.sol#L105, L125;

[status]
fsfds
**Resolved** in commit 01b8abc;

[commit]
7e35553;

[title]
Function state mutability can be restricted to view

[Description]
The state mutability of both the `getAmountIn()` and `getAmountOut()` functions can be restricted to `view`.

These two functions are used to calculate the number of tokens to get a given input or the number of tokens to deposit given an output. No state change is needed when calling the functions; therefore, the `view` modifier can be used.

[Exploit Scenario]
N/A. 

[Recommendations]
Add the `view` modifier to the specified functions.

[Results]
**Resolved** in commit 01b8abc.

The `view` modifier was added to the functions.

EOF