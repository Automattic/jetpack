# Paid Blocks

This shared extension takes over providing additional behavior to a block if it considered to be a paid feature.

This condition can depend on a few factors:

- is the site a Simple or Atomic site?
- does the site have site a paid or free plan?

From the perspective of paid-blocks implementation however, our logic relies on the business-layer system.

Ultimately, the feature defines the availability of the blocks by checking data from the Jetpack global state provide on the client-side within the global `Jetpack_Editor_Initial_State` object.

In short and as a general rule, if you need to set a block as paid, you should do it in the proper place not here.

### Setting blocks as paid in Jetpack

Please refer to the extensions documentation on [Paid Blocks](extensions/README.md#paid-blocks) to learn more about this process.

### Setting blocks as paid which are not registered by Jetpack

Sometimes blocks which are not themselves registered by Jetpack need to be marked as paid because some of their features depend on a site plan. A good example of this is the `core/video` block which is provided by Gutenberg Core and requires a paid plan in order to enable the uploading of video files.

For such cases, you will need to mark the extension as "paid" within the WordPress.com codebase (not within Jetpack). You will also need to add the dependency to the paid blocks list. Please refer to D46955-code as a reference for how to achieve this.
