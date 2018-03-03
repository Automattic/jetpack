## 5.9

### Activity Log

We now show a better entry in the Activity Log for a failed login event.

Start with a connected site having  a Professional Plan.

* Log out of the site.
* Attempt to login with wrong credentials.
* Visit WordPress.com Activity log for the site.
* Expect to see a login failed entry with a nice message related to a username instead of just the IP address origin of the failed attempt.

### Custom Content Types

We added support for excerpts to these custom content types.

* Attempt to create either a new Portfolio post or a Testimonial one. 
* Expect to see the excerpt field shown.

### General

The suppress_filters param passed to get_posts / get_children was updated in several places. Passing this param allows plugins to filter wp query to modify behaviour.

This one's hard to test.

* [Advanced post cache](https://github.com/Automattic/advanced-post-cache) is an example of a plugin providing caching.
* Out of the box, WP_Query runs a couple of queries and these are uncached. Advanced post cache, used on all WordPress.com sites (even GO VIP), hooks into WP_Query can caches the result of these queries to stop the running on every page load. With this suppress_filtersadvanced post cache doesn't not run. This means queries run unnecessarily and result in high level of traffic to database servers at peak times.
* Test Jetpack with this plugin enabled and confirm that everything works as expected.


### Jetpack Connect

With Jetpack 5.8 we introduced an issue that would appear sometimes when attempting to connect a site after clicking the banner for Jetpack in the WordPress Dashboard.

* Start with a brand new site, with Jetpack active but not connected.
* Visit the WordPress Dashboard and click the Set up Jetpack button.
* Expect to be redirected to Calypso. Then click the Back button to get to the WordPress dashboard again.
* Click the Set Up Jetpack button.
* Expect to be redirected to Calypso.
* Expect to **not** see a yellow notice stating that the site is already connected to another account.

### Jetpack Onboarding

_The following features are only enabled in the staging envirronment._

We started allowing saving of a country field for the business address.
Test with a **brand new site** that's not connected yet:

* Start the onboarding flow for the Jetpack site by going to `/wp-admin/admin.php?page=jetpack&action=onboard&calypso_env=wpcalypso`
* On the site type step, choose **Business**
* Skip to the Business Address step.
* Verify the country field appears properly.
* Input some data in it, and save the step. 
* Verify the country saves properly and goes straight to the address widget.
* Verify a fresh load of this step loads the setting properly.

We also started allowing the enabling of the stats module on this flow. 

Test with a **brand new site** that's not connected yet:

* Start the onboarding flow (`/wp-admin/admin.php?page=jetpack&action=onboard&calypso_env=wpcalypso`)
* When arriving the Calypso screen, in your console, enter `dispatch( { type: 'JETPACK_ONBOARDING_SETTINGS_REQUEST', siteId: 12345678 } )`, where `12345678` is the ID of your site.
* Verify the response contains a `stats` field in the `onboarding` option and it's disabled.
* In your console, enter `dispatch( { type: 'JETPACK_ONBOARDING_SETTINGS_SAVE', siteId: 12345678, settings: { stats: true } } )` , where `12345678` is the ID of your site.
* Verify you get a `stats not connected` error.
* Connect the site.
* In your console, enter `dispatch( { type: 'JETPACK_ONBOARDING_SETTINGS_SAVE', siteId: 12345678, settings: { stats: true } } )` , where `12345678` is the ID of your site.
* Verify you receive a successful response, and the stats module gets enabled.


This flow now deletes the temporary token used for saving settings when the site is connected.
Test with a **brand new site** that's not connected yet:

* Make sure you are logged into WP.com and the Jetpack site.
* Start the onboarding flow by going to `/wp-admin/admin.php?page=jetpack&action=onboard&calypso_env=wp-calypso` and get redirected to the site title step in Calypso
* Visit `/wp-admin/options.php` and verify `jetpack_onboarding` contains the token.
* Go to https://wordpress.com/jetpack/connect/ and connect the site.
* Visit `/wp-admin/options.php` again and verify `jetpack_onboarding` is not present in the list of options.

### Lazy images.

We now properly hide settings for Lazy images if the module is filtered out.

* Try to filter out lazy images as a module using this snippet:
    ```
    add_filter( 'jetpack_get_available_modules', function( $active ) {
	    return array_diff_key( $active, array( 'lazy-images' => 'Does not matter' ) );
    } );
    ```
* Make sure you don't see the module at all when you open the Writing tab, or search for something like `lazy`.


We now allow images to be ignored by Lazy images if they contain a reserved class name like `skip-lazy` or a custom one you define via the `jetpack_lazy_images_blacklisted_classes` filter.

* Create a post with some images. 
* Apply the skip-lazy class to one of them.
* Save the post
* Visit the post in the frontend.
* Expect the image to not be loaded in a deferred fashion.


### Masterbar

* Start by being signed in to WordPress.com.
* Then, on a connected Jetpack site...
* Enable the Masterbar from the Jetpack Settings Page.
* Sign out from the Masterbar.
* Go back to WordPress.com.
* Expect to be logged in.

Repeat steps on an Atomic site but expect to be logged out from WordPress.com in the end.

* Start by being signed in to WordPress.com (non-proxied).
* Then, on an Atomic site...
* Enable the Masterbar from the Jetpack Settings Page..
* Sign out from the Masterbar.
* Go back to WordPress.com.
* Expect to be logged out.

### Search

We now implicitly activate the Search Module when the Jetpack Search Widget gets added to a sidebar.

Start with a site that has a plan that supports Jetpack Search.

1. Remove any active search widgets and disable the search module via Settings -> Traffic.
2. Verify that the widget still shows up in both the admin area and the customizer.
3. Add the widget to your sidebar.
4. Load the frontend of your site and verify that the widget shows up and works.
5. Verify that the search module is now enabled again.


We now link from the Jetpack Search settings card to the proper widgets section in the customizer

* Go to Jetpack → Settings → Traffic and enable the Search module. Click on "Add Jetpack Search Widget" and verify that the widgets section of the Customizer opens once it fully loads (it'll take a moment).

We now move any active Jetpack Search widgets to the inactive list if you disable the search module.

1. Add the Jetpack Search widget to your sidebar. Ideally give it a custom title so you can more easily track it.
2. Disable the search module.
3. Refresh the page and verify that the search module is still disabled.
4. Visit the widgets configuration page and make sure that the widget you added in step one is now listed at the top of the inactive widgets list.

### Tracks events

We will log events now if the user has already accepted Terms of Service instead of doing it only when Jetpack is connected.

To test:

* Start with a fresh site 
* Either add some error logging in `Jetpack_Tracks_Client::record_event()`, or look at the live tracks feed in mc for your username.
* Click on any of the connection buttons.  The option should have been set.  You can check with `Jetpack_Options::get_option( 'tos_agreed' );`
* You're looking for the events `jetpack_jpc_register_begin`, `jetpack_jpc_register_success` events specifically.  
* Make sure that previously connected sites are still sending tracks events. 
* Delete the plugin. The option should have been cleared along with the other Jetpack options.  

### Twitter Cards

A new filter jetpack_twitter_image_default was added  to allow themes and plugins to customize twitter:image when no suitable image is found automatically.

To test:

Include this snippet:

    ```
    function my_twitter_image_default ($url) {
	    return 'http://asdf.com/89asdf.gif';
    }
    add_filter( 'jetpack_twitter_cards_image_default', 'my_twitter_image_default' );
    ```
* Fetch your site's home page, and a post page that wouldn't otherwise have a Twitter image set. Verify that they both now include `<meta name="twitter:image" content="http://asdf.com/89asdf.gif" />`.

### Widget Visibility

A decodeEntities function was added in widget-conditions.js to handle entity decoding for the minor conditions dropdown.

To test:

* Check the minor conditions dropdown with a category name that contains an entity (e.g. ampersand) in the widget visibility settings. 
* Confirm that the category name is encoded properly on the dropdown.

### WooCommerce analytics

* Use a test site which is connected with Jetpack and has WooCommerce active
* As a logged out user, notice a request to  `https://stats.wp.com/s-20180821.js` on public facing pages. The `20180821` is dynamic and will change based on date
* Notice `https://stats.wp.com/s-20180821.js` is not requested on `wp-admin` pages because this code should not run on admin facing pages. The same for logged in admin users.
* Back to user facing pages, open the console and see `_wca` global exists and is an object. 

#### Product Page View
* Go to a product page
* See a Network request `t.gif`

#### Add to Cart via a list
* Click "Add to Cart"
* See a Network request `t.gif`

#### Add to Cart via a Product Page
* Go to a product page
* Enable the Preserve log checkbox at the top of the console to persist the console history between page refreshes or changes.
* Click "Add to Cart"
* See a Network request `t.gif`

#### Remove from Cart via click on the "X"
* Add an item to your cart
* Go to the cart and remove the item by clicking the "X"
* See a Network request `t.gif`

#### Remove from Cart via updating the quantity
* Add an item to your cart
* Go to the cart and remove the item by changing the quantity to 0
* Click "Update"
* See a Network request `t.gif`

#### Order Received
* "Place Order" on your cart
* Once the page refreshes, see one event for each item in the order


### Final Notes

During your tests, we encourage you to open your browser's Development Tools and keep the Console open, checking for any errors in the Console and the Network tabs.

To open the Console in Chrome or Firefox, you can press CMD+Alt+i in macOS or F12 in Windows.

We would also recommend that you check your site's `debug.log` as you test.

To make sure errors are logged on your site, you can add the following to your site's `wp-config.php` file:

```php
define( 'WP_DEBUG', true );

if ( WP_DEBUG ) {

	@error_reporting( E_ALL );
	@ini_set( 'log_errors', true );
	@ini_set( 'log_errors_max_len', '0' );

	define( 'WP_DEBUG_LOG', true );
	define( 'WP_DEBUG_DISPLAY', false );
	define( 'CONCATENATE_SCRIPTS', false );
	define( 'SAVEQUERIES', true );

}
```

**Thank you for all your help!**
