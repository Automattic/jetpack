## Jetpack 14.9

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.
- You may need to connect Jetpack to a WordPress.com account to test some features; find out how to do that [here](https://jetpack.com/support/getting-started-with-jetpack/).
- Blocks in beta status require a small change for you to be able to test them. You can do either of the following:
  - Edit your `wp-config.php` file to include: `define( 'JETPACK_BLOCKS_VARIATION', 'beta' );`
  - Or add the following to something like a code snippet plugin: `add_filter( 'jetpack_blocks_variation', function () { return 'beta'; } );`

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

### Open Graph site image

The social preview image fallback logic was adjusted, so make sure it's still working:

1. Start with a site that has a paid plan (Social, Business, or Complete).
2. Go to Jetpack > Settings > Sharing.
3. Enable the Sharing module or the Publicize module.
4. Load your site's home page.
5. View source.
6. Check the `og:image` tag
   * The tag should use a `https://s0.wp.com/_si/` URL.
   * That URL should return a preview image using the site title and any representative image you use for the site.
   * Try uploading a site logo if you haven't yet. You can do so in Settings > General for example. It should change the generated image.

### Slideshow block and Carousel

The Swiper dependency used in both components has been updated. As a result, we need to make sure things work as before. For the Slideshow, try variations of the following:

* One image and several images
* Autoplay enabled/disabled
* Fade/slide effect
* Captions/no captions
* Editor and frontend
* Adding under an old JP version and upgrading to the latest JP version

For the gallery there aren't many options, but try with one image and several images.

Ensure there are no Swiper-related logs in the JS console, and that everything works as expected.

### Pay with PayPal Block

For this block, we only show the block with certain plans. Ensure that you only see the Pay with PayPal block when you have a [Growth, Security, Complete, or Creator plan](https://jetpack.com/support/pay-with-paypal/).

For testing purposes:
* On a site that does not have one of the above plans, search for the Pay with PayPal block. Ensure that you do not see the block in the inserter.
* On a site that does have one of the above plans, search for the block and insert it.
    * Test the various settings of the block.
    * Ensure that validation works. For example, are you required to enter your PayPal email address?
    * Ensure that the block functions on the frontend of the site.
    * Ensure that, when you click the button to make a purchase, the PayPal modal correctly loads.
    * Optionally, make a purchase.

### PayPal Payment Buttons

This block is currently marked as a beta block, but is available on all plans otherwise.

For testing purposes:
* Start with a site that does not have beta blocks enabled and does not have a plan.
* In the block editor, search for PayPal. Ensure that you do not see the `Pay with PayPal` block.
* Enable beta block for the site.
* In the block editor, ensure that you can now find the `Pay with PayPal` block.
* In the block, you'll notice links out to log in to, or create, a PayPal account. When you hover over these links, ensure that you see `wp_org` or `wp_com` as expected on the block.
* On PayPal, configure a payment button.
* When you click "Build It" after configuring, you'll have an option to get code for stacked buttons or single buttons. The values that you are presented there will map to the settings in the block.
* Ensure that you can save the block and then see the button on the frontend of the site.
* On the frontend of the site, click the button and ensure that it either loads a modal or sends you to PayPal.com.
* Optionally, complete a purchase.

**Thank you for all your help!**
