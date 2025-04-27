## Jetpack.Constants.MasterUserConstant

This sniff flags uses of the constant `JETPACK_MASTER_USER`, which was deprecated in 2020 (see [#16974]).

### Messages

* `ShouldNotBeUsed`: JETPACK_MASTER_USER constant should not be used. Use the blog token to make requests instead, or use the current user token when needed.

### Configuration

This sniff has no configuration options.

[#16974]: https://github.com/Automattic/jetpack/pull/16974
