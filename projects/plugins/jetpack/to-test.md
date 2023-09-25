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

☝️ **Between each checkout it is necessary to clear out the transient: `jetpack_woocommerce_analytics_cart_checkout_info_cache` - you can install [Options View](https://wordpress.org/plugins/options-view/) to easily do this.**

- Add an item to your cart and go to the checkout.
- Check out and then visit Tracks and find your event. (I spoofed my user agent so I could find the event easily)
- Check the event for the following properties:
  - `cart_page_contains_cart_block`: `false` (or 0)
  - `cart_page_contains_cart_shortcode`: `true` (or 1)
  - `checkout_page_contains_checkout_block`: `false` (or 0)
  - `checkout_page_contains_checkout_shortcode`: `true` (or 1)
- Go back to the pages from the earlier steps, remove the shortcodes and replace them with the Cart and Checkout blocks.
- Add an item to your cart and check out again, the new values should be:
  - `cart_page_contains_cart_block`: `true` (or 1)
  - `cart_page_contains_cart_shortcode`: `false` (or 0)
  - `checkout_page_contains_checkout_block`: `true` (or 1)
  - `checkout_page_contains_checkout_shortcode`: `false` (or 0)
- Feel free to change the setup so one page has the shortcode and one page doesn't and mix it up.
- Update to WooCommerce 8.0
- Repeat the steps above, however when you go to Pages -> Checkout and Pages -> Cart you should notice that it opens the site editor instead of the usual post editor.
- Repeat with a classic theme, e.g Storefront

Remove logic that prevents site admins being tracked and add store_admin property to WooCommerce analytics events
- Ensure site is connected, WooCommerce is installed, products, payment methods, and shipping methods are available. (Cash on Delivery and Free shipping will be fine).
- Ensure WooCommerce analytics is running.
- As an admin user: add an item to your cart and go to the checkout.
- Check out and then visit Tracks and find your event. (I spoofed my user agent so I could find the event easily)
- Check the event for the `store_admin` property, which should be `1`
- Repeat as a logged _out_ (e.g. guest) user, the event should be logged, and should have the `store_admin` property but it should be `0`
- Repeat as a logged in, but _not_ admin user, (e.g. a customer), the event should be logged, and should have the `store_admin` property but it should be `0`

Add Logic to track My account page
- On a connected, live, WordPress account, check if existing tracks are being sent (either from the track page or using the Tracks - Vigilante extension).
On the My Account page, test that:
- `woocommerceanalytics_my_account_tab_click` with prop tab: logout is triggered when you click log out.
- `woocommerceanalytics_my_account_page_view` with the prop tab: $tabName is being triggered on each top level tab you visit.
- `woocommerceanalytics_my_account_order_number_click` Is being triggered if you clicked an order number in the orders view.
woocommerceanalytics_my_account_order_action_click is being triggered with prop action: view if you click the view button, and action: pay if you click the pay button, and action: cancel if you click the cancel button.
To see the pay and cancel buttons, change the order status to pending payment.
- `woocommerceanalytics_my_account_address_click` with prop address: billing | shipping when you click on the button to edit an address.
- `woocommerceanalytics_my_account_address_save` with prop address: billing | shipping when you save an address you edited.
- `woocommerceanalytics_my_account_details_save` When you click save on the Accounts Details page.
- For those you will need a payment method installed like Stripe or WCPay:
Check that:
- `woocommerceanalytics_my_account_payment_add` Is being triggered when you add a new payment method.
- `woocommerceanalytics_my_account_payment_save` Is being triggered when you save a payment method you're adding.
- `woocommerceanalytics_my_account_payment_delete` Is being triggered when you delete a payment method.

### Enabling beta blocks

Testing most features on this list requires enabling Jetpack beta blocks. You can be the one of the first to test upcoming features by adding this constant as a snippet, or directly into your configuration file:

```
define( 'JETPACK_BLOCKS_VARIATION', 'beta' );
```

### Social Auto Conversion

- Turn off Social and have Jetpack enabled.
  - Go to the Jetpack settings page and turn on the auto conversion setting.
  - Open up the editor and create a new post.
  - Select a media file that is convertible, but not valid for some connections - for example a 10Mb jpg image.
  - You should see the notice that it will be converted. If you dismissed already, remove the `jetpack_social_dismissed_notices` option to bring it back.
  - On the notice click change settings button. It should open up Jetpack settings on the sharing screen.
  - Turn off the auto conversion.
  - Go back to the editor, the page should reflect the changes without needing to refresh.
- Do the same with Jetpack Social enabled only. The only difference is that the button should direct you to the social admin page.

### AI Excerpt helper

To properly test this ensure that beta blocks are enabled.

- Go to the block editor.
- Open the post sidebar.
- Confirm the Excerpt panel is there when:
  -	beta extensions are enabled;
  - AI Assistant block is enabled.

- Go to the block editor, open the block sidebar.
- Look at the AI Excerpt panel.
- Confirm that the Accept button is initially disabled.
- Request an excerpt.
- Confirm that you can discard the changes by clicking on the Discard button.
- Request an excerpt.
- Confirm that Accept button gets enabled once the requests finishes.
- Confirm you can use the suggestion by clicking on the button.
- Confirm the Generate button gets disabled when the request is done.
- Confirm the Generate button gets enabled right after clicking on the Accept or Discard button.
- Request an excerpt
- Confirm that after changing the number or words the Generate button gets enabled again.

### Create with Voice AI helper

To properly test this ensure that beta blocks are enabled.

- Go to the block editor.
- Create a "Create with voice" block instance and confirm that the block shows its toolbar.
- Confirm now it's possible to remove the block.
- Start to record/pause/resume.
- Confirm how the block button changes according to the recording status.
- Start to record.
- Confirm the block shows the current time duration.
- Stop recording.
- Confirm the Done button is there, and start, pause, and resume actions work fine.
- Confirm the block shows the audio player.
- Confirm you can listen to the recorded audio.

### And More!

You can see a [full list of changes in this release here](https://github.com/Automattic/jetpack-production/blob/trunk/CHANGELOG.md). Please feel free to test any and all functionality mentioned!

**Thank you for all your help!**
