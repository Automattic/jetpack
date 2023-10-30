## Jetpack 12.7

### Before you start:

- **At any point during your testing, remember to [check your browser's JavaScript console](https://wordpress.org/support/article/using-your-browser-to-diagnose-javascript-errors/#step-3-diagnosis) and see if there are any errors reported by Jetpack there.**
- Use the "Debug Bar" or "Query Monitor" WordPress plugins to help make PHP notices and warnings more noticeable and report anything of note you see.

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


### SEO Tools/Sharing Sidebar

There are some new options in the Jetpack sidebar in the block editor. To test:

- Go to Posts > Add New.
- Click on the Jetpack plugin sidebar.
- Click on the "SEO" panel title.
- Click on the button.
- Verify that the module is enabled and working as expected.
- Click on the "Likes and Sharing" panel title.
- Click on the button.
- Verify that the module is enabled and working as expected.

### Jetpack AI Search Block

We've launched and AI Search block, moving it from beta to production! To test, create a new post and add the AI Chat bot. Play around with the block and the sidebar settings and make sure things work in the editor and on the front end.

## Known Issues:

- Button styling can be improved.
- It can sometimes be very slow.
- The search can be very hit or miss depending on keywords used in the question.
- It can only chat with posts & pages reliably. Products are harder to find.

### New Quick Share Options

We've added the quick-share options to the block editor panel. To test:

* Open up a new post, there should not be anything new.
* After publishing you should see the new Quick share Button if our panel is open
* Clicking the icon should open the Quick share dropdown
* Clicking on any of the icons there should work
* Clicking the learn more on the dropdown should open the help modal and close the dropdown.

### Add Forced 2FA Functionality when SSO is enabled

We have a new filter that will allow someone to force 2FA to be enabled when SSO is also enabled. There's no UI for this yet, but it would be good to do some functionality testing. To do so:

* Jetpack connnected + SSO enabled.
* Connect an account that does not have 2fa enabled to the Jetpack site (either cycle the connection or make a new admin user connected to a non-2fa WP.com account.)
* Create a new user with subscriber or contributor role.
* Log out and log back into admin account with regular WP creds (not SSO) This should work.
* Enable flag via `add_filter( 'jetpack_force_2fa', '__return_true' );`
* Log out and log back in with regular WP creds. It should fail.
* Log in with WP.com SSO with an account that has 2fa enabled. It should work.
* Log out and login with the non-2fa WP.com account via SSO. It should fail.
* Add a filter to modify the cap, e.g. `add_filter( 'jetpack_force_2fa_cap, function() { return 'read' } );`
* Verify that the contributor forces SSO.


### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
