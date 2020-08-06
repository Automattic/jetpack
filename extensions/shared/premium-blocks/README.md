Premium Blocks
==============

This shared extension takes over providing additional behavior to a block it's considered premium.

This condition can depend on a few factors: is it a simple or atomic site? have the have site a paid or free plan? However, from the perspective of premium-blocks implementation, it relies on the business-layer system.

In the end, the feature will define the availability of the blocks, getting data from the Jetpack global state on the client-side `Jetpack_Editor_Initial_State`.

In short and as a generic rule, if you need to set a block as the premium, you should do it in the proper place not here.

### Setting blocks as premium in Jetpack

You can take a look at the Extension doc, [Paid Blocks](extensions/README.md#paid-blocks) section to know more about this process.

### Setting blocks as premium not registered by Jetpack

Sometimes some blocks need to be defined as premium because some of their features depend on the site plan, for instance, `core/video`. It's a core block.

For these cases, set the extension in WordPress.com in the same way that a block registered by Jetpack, also add the dependency to the paid blocks list. Use D46955-code as a reference for how to do it. 
