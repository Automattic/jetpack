## Jetpack 13.3

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features, find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

### My Jetpack: AI interstitial and product page

- Go to My Jetpack
- See the Jetpack AI card, its CTA should read "Learn more".
- Clicking it should take you to a pricing table.
- Choosing to "Continue for free" should take a moment and land you on the product page.
- The first feature should have a link that reads "Connect to Jetpack to start using the AI Assistant"
- Click on the connect link, you'll be directed to the connection page, connect
- Back to My Jetpack, the AI card should still read "Learn more" and clicking it will still take you to the pricing table since you just connected to Jetpack. Choose "free" once more to land on the product page.
- The product page's first link should now be a "Create new post", clicking it should land you on the editor with a AI block inserted and ready to use.
- Back to My Jetpack, the AI card should now get you straight into the product page.
- Use the "Get more requests" to go into the pricing table and get an upgrade this time. After checkout process you should be taken back to My Jetpack.
- Now the AI card's CTA should read "View". Clicking it should get straight into the product page.
- The product page should now show your current period's remaining requests and your all time requests.
- Use the "Get more requests" to land back at the pricing table, test both remain free and upgrade flows
- Continue upgrading until you get to the highest tier (1000). The product page should show a "Contact us" button instead of the upgrade one.

### Todo Section

- Todo Content

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
