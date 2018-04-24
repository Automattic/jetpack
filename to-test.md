## 6.1

### Admin Page

#### GDPR

We added "Privacy Information" links to each Jetpack module/feature card.

To test:

* Enable all Jetpack functionality on a Professional plan from the debug page in Jetpack: `/wp-admin/admin.php?page=jetpack_modules`.
* Go to the Jetpack Dashboard Admin Page and check all of the icons in each module/feature to ensure they are working properly. In the case of "Privacy Information" links that aren't supposed to be working yet, please just review the URL itself and report any problems.
* Repeat for every module/feature on the Jetpack Settings page too.

### Content options

 We now show featured images in WooCommerce pages when "Display on blog and archives" is turned off for Themes that support this feature.

 To test:

* Activate a theme that supports Content Options, For example Lodestar or Shoreditch.
* Activate WooCommerce and add a few products.
* Go to Customizer > Content Options and make sure "Display on blog and archives" under Featured Images is checked.
* Visit Shop page - the product images should be visible. Visit blog page - the featured images should be visible.
* Go to Customizer > Content Options and uncheck "Display on blog and archives" under Featured.
* Visit Shop page - the product images should be visible. Visit blog page - the featured images should not be visible.
* Deactivate WooCommerce and check if Content Options are working as expected, and there aren't any errors or warnings.

### General

* We fixed a warning that started being shown with the latest releases of PHP.

Start with Jetpack active Sharing active (or any module that outputs OG tags) on PHP 7.2.

* Visit a post without an explicitly set excerpt.
* Confirm excerpt is set in the og tags in head with no PHP warnings like `Warning: count(): Parameter must be an array or an object that implements Countable showing on PHP 7.x`.

### Google Analytics

We fixed a conflict preventing Google Analytics from activating for Premium subscribers.

* Start with a connected Jetpack site with a Premium plan.
* Try to activate Google Analytics and confirm this works.

### Plans

We fixed the localization of the plans table in the Admin page

To test:

* Start with a fresh site and connect it.
* Switch the language of the site to one that has an acceptable percentage of translated strings.
* Confirm the plans page shows in that language


### Publicize

When a post transitions to publish, Jetpack used to add Publicize post meta to all posts, whether or not it was a publicize-able post type. We fixed that.

Testing instructions:

* Setup Jetpack + Publicize
* Add a new CPT that is not able to be Publicized (e.g. lacking post_type_support('publicize')).
* Publish a post.
* Inspect the post meta and expect to see no _publicize_pending present.

### Sharing

We removed the sharing and like display functionality from Cart, Checkout, and Account WooCommerce pages.

Testing instructions:

* Enable sharing and/or like buttons on a site running WooCommerce.
* Go to a regular page. Confirm sharing is displayed.
* Add something to cart. Go to cart. Confirm sharing is NOT displayed.
* Proceed to checkout, again sharing should be hidden.

### Stats

We added a new filter `jetpack_honor_dnt_header_for_stats`, which if enabled would make Jetpack not track stats for visitors with DNT enabled.

To test:

* On a connected Jetpack site.
* Add a code snippet like:
    ```
    add_filter( 'jetpack_honor_dnt_header_for_stats', '__return_true' );
    ```
* Turn on the Do Not Track on your browser. You can find guidance on how to achieve this here: [Chrome](https://support.google.com/chrome/answer/2790761?co=GENIE.Platform%3DDesktop&hl=en), [Firefox](https://support.mozilla.org/en-US/kb/settings-privacy-browsing-history-do-not-track#w_tracking_3), [Safari](https://support.apple.com/kb/PH21416?locale=en_US), [Edge](https://privacy.microsoft.com/en-us/windows-10-microsoft-edge-and-privacy).
* Visit the frontend of the site and confirm you don't get a stats entry for your visit.

### WooCommerce Analytics

We fixed broken Remove From Cart links.

To test:

* Start with a Woo site with a Jetpack Professional plan.
* In Calypso > Settings > Traffic, enable Google Analytics and all its options.
* On your site, add products to your cart.
* Go to the cart page.
* Make sure that all remove from cart icons work, and include the product ID attribute.

### WordAds

We added a new shortcode: `[wordad]` for inline placement of Ads in posts and pages.

To test:

* Enable the Ads module.
* Place a `[wordad]` shortcode in the body of a post.
* View the post and expect to see an Ad in the post content.

#### ads.txt

* We also added ads.txt support to the Ads module.

To test:

* Start with a connected Jetpack site and a plan that supports WordAds.
* Activate the Jetpack Ads module if it's not active already.
* Visit `yoursite/ads.txt`. You should now see a text file.

**Thank you for all your help!**
