## Jetpack 12.8

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

### AI Assistant

[Beta extension]
- Inside the editor, click the 'Jetpack' icon and open the 'AI Assistant' section.
- There should be a usage meter indicating how many requests you've used.
- Add/use an AI block, save the post/draft, and refresh the page.
- The usage counter should increase.
- If you're not on an AI plan, a visual usage bar should be shown along with an 'Upgrade' button.
- Clicking the 'Upgrade' button should take you to the appropriate upgrade page.
- After completing the flow and purchasing the upgrade, you should no longer see the visual usage indicator or the upgrade button. Instead a message should be displayed about you having unlimited requests.

AI Extensions are now disabled for empty blocks preventing unnecessary requests.

- Add an empty paragraph block. Adding a few spaces will work too.
- Click the AI Extension button on the block toolbar.
- There should be a notice indicating you need to add content before the options become enabled.

You can use the new `jetpack_ai_enabled` filter to register the plugin.

- Add the following filter to your site: `add_filter( 'jetpack_ai_enabled', '__return_false' );`.
- AI features should now become unavailable on your site.

### SEO/Sharing

Character counts for SEO Title and SEO Description are now also displayed when over limit, instead of just getting a warning message.

- Edit a post.
- In the editor, click the 'Jetpack' icon and expand the 'SEO' section.
- Click 'Activate Jetpack SEO' button if not already activated.
- Type into the 'SEO Title' field.
- Once you go past 70 characters, ensure you continue to see the current character count at the end '(xx used)', in addition to the warning.
- Verify the same is true for 'SEO Description'.

### Subscriptions

Site administrators can now see the subscribe modal/popup for demo/debugging purposes.

- Go to Jetpack > Settings > Newsletters and ensure the subscriber modal is enabled.
- While logged in as an admin, go to a frontend post without a paywall or limited access, scroll, and confirm the modal loads.

Not logged users shoudl see a 'retrieve subscriptions' link. [33656]

### WordAds

You should now be able to use Ad block before the module is enabled.

- Navigate to `/wp-admin/admin.php?page=jetpack_modules` and make sure the Ads module is disabled.
- Make sure you don't have a plan that supports Ads.
- Create a new post.
- You should not see the Ad block in the blocks inserter.
- Purchase the 'Jetpack Complete' plan but make sure the Ads module remains disabled.
- Create a new post. You should now see the Ad block in the inserter.
- Add the Ad block to your post. It should contain an 'Activate WordAds' button.
- Activate the module and check that the form works as expected.

### Scan

The scan module can now be disabled using a dedicated filter.

- Add the following filter to your site: `add_filter( 'jetpack_disable_scan', '__return_true' );`.
- Scan module should be distabled on your site.

### Add additional properties to WooCommerce analytics checkout and purchase events

#### New properties

  - To the `woocommerceanalytics_product_checkout` event:
	`shipping_option`: the selected shipping option 
	`products_count`: number of products included in the cart
	`coupon_used`: if the coupon was used (boolean)
	`order_value`: the order value/total
	`template_used`: if the proceed from cart to checkout action has happened on a regular cart page or powered by the template
	`additional_blocks`: if there are additional blocks on the cart page
	`store_currency`: the currency used in the store

  - To the `woocommerceanalytics_product_purchase` event
		`products_count`: number of products included in the cart
		`coupon_used`: if the coupon was used (boolean)
		`order_value`: the order value/total
		`template_used`: if the proceed from cart to checkout action has happened on a regular cart page or powered by the template
		`additional_blocks`: if there are additional blocks on the cart page
		`store_currency`: the currency used in the store

#### Testing instructions

- Ensure your store is set up so it can be tracked.
- Ensure your site is using the Checkout block.
- Set up multiple shipping methods on your store.
- Install [Multiple Packages for WooCommerce](https://wordpress.org/plugins/multiple-packages-for-woocommerce/). Go to the settings (WooCommerce -> Settings -> Multiple Packages) and set the grouping option to "Product (individual)".
- Install the Tracks Vigilante extension (optional)
- For each of the following scenarios, view the Checkout page also complete the checkout process, ensuring the `woocommerceanalytics_product_checkout` and `woocommerceanalytics_product_purchase` events fire with the correct properties (Except `shipping_option` on the purchase event)
- Add multiple items to your cart (including a virtual item), go to the Checkout page and change the shipping option on each of them.
- Check out and check the events are correct and the correct shipping option is tracked, ensure a shipping option is not tracked for the virtual item.
- Do this again, this time check out with a coupon.
- Go to Appearance -> Editor and edit the Checkout template. Add some extra blocks to the template.
- Go to the Checkout page again and ensure the extra blocks you added are in the `additional_blocks` property.
- Downgrade your WooCommerce version to 7.8.2 and ensure WooCommerce Blocks is disabled.
- Add products to your cart and check out. Ensure the `template_used` value is false (Cart/Checkout templates were not in use in this version).
- Go to the Checkout page (Pages -> Checkout) and add extra blocks to the Checkout page.
- Go to the Checkout block and ensure the additional blocks you added are in the `additional_blocks` property.
- Change the checkout page to use the shortcode (`[woocommerce_checkout]`) and repeat these steps. Ensure the correct value is tracked for each event. **Note that the `checkout_page_contains_cart_shortcode` property is stored in a transient so this will be incorrect if changing, but it has been tested in another PR and is known to be working.**

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
