## Jetpack 12.5

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### WooCommerce Analytics

Ensure correct values for cart/checkout blocks/shortcode use are tracked correctly when using WooCommerce Blocks templates after WC Blocks 10.6.0
- Ensure site is connected, WooCommerce is installed, products, payment methods, and shipping methods are available. (Cash on Delivery and Free shipping will be fine).
- Install WooCommerce 7.8.0 and a blocks theme e.g. Twenty Twenty-Three.
- Ensure WooCommerce analytics is running.
- Go to Pages -> Cart. Change its content to contain the shortcode block, and have it display the WooCommerce cart. (`[woocommerce_cart]`).
- Do the same for Pages -> Checkout and enter `[woocommerce_checkout]` into the shortcode block.
- Add an item to your cart and go to the checkout.
- Check out and then visit Tracks and find your event. (I spoofed my user agent so I could find the event easily)
- Check the event for the following properties:
  - `cart_page_contains_cart_block`: `false` (or 0)
  - `cart_page_contains_cart_shortcode`: `true` (or 1)
  - `checkout_page_contains_checkout_block`: `false` (or 0)
  - `checkout_page_contains_checkout_shortcode`: true (or 1)
- Go back to the pages from the earlier steps, remove the shortcodes and replace them with the Cart and Checkout blocks.
- Add an item to your cart and check out again, the new values should be:
  - `cart_page_contains_cart_block`: true (or 1)
  - `cart_page_contains_cart_shortcode`: false (or 0)
  - `checkout_page_contains_checkout_block`: true (or 1)
  - `checkout_page_contains_checkout_shortcode`: false (or 0)
- Feel free to change the setup so one page has the shortcode and one page doesn't and mix it up.
- Update to WooCommerce 8.0
- Repeat the steps above, however when you go to Pages -> Checkout and Pages -> Cart you should notice that it opens the site editor instead of the usual post editor.

### Newsletter

The Newsletter settings are moved from the Discussion settings to their own dedicated page.
- Go to "Jetpack settings → Newsletter"
- Ensure all toggles work
- Go to "Discussion" settings and confirm newsletter settings aren't there anymore

### SEO and Sharing Changes

There are a lot of small tweaks to the SEO and sharing modules that should be tested:
* Enable SEO tools in Jetpack -> Settings -> Traffic
* Draft a new post
* Open the Jetpack sidebar in the editor
* Confirm the SEO tools textareas width looks okay.
* Confirm that the "hide page from search engines" is now a toggle (instead of a checkbox)
* Confirm that the Like and Sharing options in post are now also toggles.

### My Jetpack

The My Jetpack menu item in wp-admin has been moved to the top of the sub-menu list. Poke around and make sure things look good and links go where they're supposed to!

### AI Assistant

There were many tweaks and back-end changes to the AI assistant. To test it out: 
- Add a paragraph block to a post or page
- From the block toolbar, select the sparkling AI Assistant button.
- Try a few of the options and make sure they work and make sense.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
