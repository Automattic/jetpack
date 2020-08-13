Paid Blocks
===========

This shared extension takes over providing additional behavior to a block if it considered to be a paid feature.

This condition can depend on a few factors: is it a simple or atomic site? have the have site a paid or free plan? However, from the perspective of paid-blocks implementation, it relies on the business-layer system.

Ultimately, the feature defines the availability of the blocks by checking data from the Jetpack global state provide on the client-side within the global `Jetpack_Editor_Initial_State` object.

In short and as a generic rule, if you need to set a block as the paid, you should do it in the proper place not here.

### Setting blocks as paid in Jetpack

You can take a look at the Extension doc, [Paid Blocks](extensions/README.md#paid-blocks) section to know more about this process.

### Setting blocks as paid not registered by Jetpack

Sometimes some blocks need to be defined as paid because some of their features depend on the site plan, for instance, `core/video`. It's a core block.

For such cases, you will need to mark the extension as "paid" within the WordPress.com codebase (not within Jetpack). You will also need to add the dependency to the paid blocks list. Please refer to D46955-code as a reference for how to achieve this.
