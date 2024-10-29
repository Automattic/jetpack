## Jetpack 14.0

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features, find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`
	- To test Breve further in the document please enable the feature with the following snippet: `add_filter( 'breve_enabled', '__return_true' );`

### AI Logo Generator

On top of the already available AI Logo generator, we've now added a styles dropdown to allow more control for the user without depending entirely on the provided prompt.

The logo generator is not available for free users, test with a plan or subscription. Also, it's currenlty available for a12s only (and will soon be open to public).

- Load the editor and add a Logo block.
- On the network tab you should see a request to `ai-assistant-feature`
  - If using an a11n account (or focing the filter to `true`), the response should include `featuresControl['logo-generator'].styles` as a collection of style objects.
  - If NOT using an a11n account, the `styles` property should be an empty array.
```
{
  ...
  featuresControl: {
    'logo-generator': {
      enabled: true,
      styles: [ COLLECTION OF SYLES HERE ]
    }
  }
}
```
- Use the block's AI toolbar button to open the Logo generator modal, you should see a style dropdown on the top-right corner
- Feel free to play with the styles to achieve different results
- Confirm that using style "Auto" will try to guess the style based on the prompt (AI query request) and set the style prior to sending the image generation request
- If possible, try different combinations of plans and cases:
  - use `add_filter( 'jetpack_ai_tier_licensed_quantity', function() { return 0 | 100 | 1; } );` on your `0-sandbox.php` file filter to mock free/tier100/unlimited plans
	- sandbox the API, but then don't connect to sandbox to mock a disconnected situation

### AI Image Generator

The styles added to the logo generator are now also available on general image creation.
It is currently only available for a12s as well, so test in a site where you are logged in with your A8c account.

The testing steps are the same as the logo generator steps above, except that now you should add an Image block instead and click on the "Generate with AI" button.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
