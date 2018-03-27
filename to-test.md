## 6.0

### Masterbar

With the Grammarly extension enabled on Chrome macOS, an error occured before when navigating to a site with the WordPress.com Masterbar module active, logged in as a WordPress.com user. Testing instructions:

* Navigate to a Jetpack site with the Masterbar module active and there should be no regressions, all Tracks events should fire.

A change sets the jetpack_masterbar_should_logout_from_wpcom to be true by default. Testing instructions:

* Activate masterbar
* Sign out from the site
* Expect to be signed out from WordPress.com too.

### Admin area

A change forces words to break on long usernames and email addresses in the account connection settings in the dashboard. Try changing your username to a very long one without breaks and make sure it doesn't go out of the box.

Another change removes the wpcom account creation link from below the connection buttons. Go to your jetpack menu in an unconnected site: You should see the top & bottom connect buttons, but the old "no account?" link shouldn't be after them anymore.

One more change updates the "install and activate" link in the Backups card to be a functional link matching the "Set up" button. Testing instructions:

* Set up the site with a paid plan
* After checkout but before allowing set up to run, return to the site dashboard.
* You will see the link on "install and activate" now points to the same URL as the "Set up" button.
* Click the link and verify that the Backups set up is performed correctly.

Some JITMs can be specified to be opened in a new window, or the same window. Testing instructions:

* Get a personal plan
* View the rewind jitm on the dashboard
* Clicking the button should open in same window instead of a new window

Plans are no longer hidden on small screens. Testing instructions: View the Plans tab on a screen smaller than 600px wide, you should see the plans table.

#### Warm Welcome 

Search is added to the Professional plan warm welcome. Testing instructions:

* Visit the Jetpack dashboard in wp-admin on a site that has the Professional plan. Check out the updated dialog box.
* Verify that the new link at the bottom takes you to the Customizer's widget section.
* Verify that the Tracks event triggers when you click on that new link.

#### Privacy page

6.0 introduces a new page accessible through the Privacy link at the bottom of the Jetpack dashboard. The page features links to the Automattic privacy policy and to the upcoming privacy.blog. The support link goes through what data does Jetpack sync. The page also introduces a toggle so users can opt-out of information tracking that Automattic collects for its own purpose. Try toggling the setting on and off, make sure it gets saved correctly.

#### New caching policy

Before, if you navigated to WordPress.com from the Jetpack dashboard and then came back via back button, you would have gotten the previous state of the app because of browser's cache. Now the no-store cache policy makes sure you don't get a cached version of the dashboard when you click 'back' from wpcom. How to test:

* Activate Jetpack (or if it's already active and you don't want to deactivate, run wp option update show_welcome_for_new_plan true with wp-cli)
* You should get the Warm Welcome modal (if you used wp-cli, you may need to navigate to the jetpack dashboard or reload the page)
* Click on the "view more stats in WordPress.com" button.
* Once you get to wp.com, click on the browser's back button
* You should be taken back to your jetpack dashboard, and the Warm Welcome modal shouldn't show

#### VaultPress

Issues with VaultPress deactivation when Rewind is active are fixed. The Jetpack menu was previously still showing the VaultPress submenu and clicking it lead to a blank page. Testing instructions:

* Test with a site with Rewind active
* Activate the VaultPress plugin. It will be automatically deactivated and a notice will show.
* Ensure that: there's not a VaultPress submenu entry under the Jetpack menu, the notice VaultPress needs your attention! is not visible.

#### Settings

Some plans support different modules. A change declares plan support in the module header, and checks for that support when rendering the "active plan" information. This allows us to easily render inactive rows in the jetpack_modules page and elsewhere, so that users know which modules are truly available. Also some basic checking is added in WP-cli and elsewhere for whether plan activation was successful. Testing instructions:

Another change allows to display a short text and a link in the info popover. Testing instructions:

* verify that on each settings card the text corresponds to the one provided here
* ensure that the support link is correct

##### On a site with a free plan:
* Go to /wp-admin/admin.php?page=jetpack_modules
* Ads, Data Backups, Google Analytics, SEO Tools, Search and VideoPress should be greyed out. Only Data Backups should be clickable, with a Configure link.
* Go to /settings/traffic/{site_domain} in Calypso
* Attempt to enable SEO tools using the Enable link next to SEO Tools module is disabled in Jetpack.
* You should see a message There was a problem saving your changes. Please try again.

##### On a site with a Premium plan

* VideoPress should become available

##### On a site with a Professional plan

* SEO Tools, Google Analytics and Search should become available

#### Contact Forms

Contact Forms now have styles for input[type="url"]. Testing instructions:

* Create a new Post.
* Click 'Add Contact Form'
* Confirm 'Website' field is styled like other text fields.
* Preview the new post, confirm 'Website' field is styled like other text fields.

#### Jumpstart

The close button has been moved into Jumpstart dialog by reusing the same Jetpack Dialogue component. Because of this, the page doesn't have the gap between the top two cards. Testing instructions:

* On a Jetpack site that is already connected
* Open wp shell and run Jetpack_Options::update_option( 'jumpstart', 'new_connection' )
* Open /wp-admin/admin.php?page=jetpack#/jumpstart
* Dialog should have close button inside dialog frame; hitting esc, clicking background, or clicking close button should all close the dialog.
* Dialog should also work properly with assistive devices/programs like screen readers.

SEO tools are not recommended in Jumpstart screen anymore, neither they are activated. Testing instructions:

* On any connected Jetpack site
* Run wp jetpack reset (warning, this discards all your settings)
* Go to /wp-admin/admin.php?page=jetpack#/dashboard
* Observe Jumpstart screen should not include SEO tools
* Click to activate Jumpstart
* Observe that SEO tools should not be enabled

#### Stats area

One change adresses column spacing styling issues in WP Dashboard > JP Site Stats. It adds a slight padding-right to the first column of each block. Make sure these columns look right.

Another hides the date range tabs shown in the Stats in the dasboard when the dialog explaining about the time needed to collect data is shown and it hasn't been yet dismissed. Testing instructions:

* use a new site and connect
* verify that you see the dialog "Hello there! Your stats have been activated." and that the date range tabs aren't shown

#### Disconnect dialog URL for sites in subfolders

Testing instructions:

* Clear your browser cache.
* Connect a site that's at least two subdirectories deep; e.g., example.com/wp/personal
* Then, from the Jetpack Dashboard, click 'Manage site connection' to disconnect it.
* Instead of :: you should see the correct / separators in the URL.

#### Post editor

Like & Sharing metaboxes are updated to use side context and default priority. Testing instructions:

* Enable Sharing → Sharing Buttons, confirm metabox shows on right side when adding a new Post.
* Enable Sharing → Like Buttons, confirm metabox shows on right side when adding a new Post.
* Also test when one or the other is disabled.

Single post edit metaboxes do not have likes forcedly unchecked when Likes are enabled for all posts. Testing instructions:

* Likes module enabled, Settings->Sharing set to likes on a per post basis
* On a post, check the box to enable likes for that post, save.
* Confirm likes are visible.
* Change the setting on Settings->Sharing to enable likes for all posts.
* View the previously likeable post.
* Confirm you see the Likes button.
* Edit the post and see the checkbox remains checked.

Styling of the publish metabox is made more consistent with the wp-admin styles. Testing instructions:

* Enable Publicize, ensure no connected accounts
* Start a new post
* Ensure styling looks consistent with other elements of the Publish metabox
* Click "Edit" next to Social Sharing section
* Add one or more accounts
* Start a new post again
* Ensure styling looks consistent with other elements of the Publish metabox

### Video uploads

#### Default to grid view when uploading videos

When upgrading to Premium or Professional on a site in Dashboard > Plans when you scroll down to the "Video Hosting" panel, and click the button to "Upload Videos Now" you should upload a video straight away.

Testing instructions:

* Activate Pro plan
* Activate VaultPress
* Go to plans description page from dashboard
* Click "Upload Videos" link
* Link should be /wp-admin/upload.php?mode=grid, and displayed in grid mode

### Search

If you go to the customizer and add a new Jetpack Search widget, it should show with default values. Testing instructions:

* Open the customizer.
* Add a fresh Jetpack Search widget without touching the form.
* Verify that the widget shows up in the preview with the search box.

### Widgets

#### Google Translate

The Google translate widget fixes the layout by defaulting to vertical. Testing instructions:

* On a site using the Google Translate Widget, apply the patch.
* The widget should use the vertical layout with full width selector.

#### WordPress Posts

Adds rel="noopener" to post links shown by the WordPress Posts widget if the Open links in new window/tab: setting is active. Testing instructions:

* Add a Display WordPress Posts widgets to the sidebar (listed as DisplayWordPress Posts (Jetpack)).
* Add a WordPress site as Blog URL.
* Check the box Open links in new window/tab and save the widget.
* Visit a page on your site that will show the widget.
* Inspect the links and confirm that the links to the other site posts include the attribute rel="noopener".

#### EU Cookie Law Widget

Fixed an issue where custom URL choice wasn't preserved in Customizer, also fixed selective refresh. Testing instructions:

* add a EU Cookie Law Banner widget and make sure you can choose a Custom URL for the policy
* make sure selective refresh works fine

### Infinite Scroll

#### Main query detection

We adjusted the order in which the globals wp_the_query and wp_query are set so that is_main_query is accurate when ran on the pre_get_posts hook. This fixes queries from other plugins failing because the Infinite scroll query is not the “main query”.

* Enable Infinite Scroll.
* Clone WooCommerce from GitHub, switch to the fix/infinite-scroll branch, and import the sample data.
* Go to the WooCommerce shop page at local.wordpress.test/shop/
* Scroll to a page loaded via AJAX.
* Open your browser’s Development Tools. In the Network tab you will find the ?infinity=scrolling AJAX request. Inside query_args you should see the WooCommerce product_visibility taxonomy query, as well as the custom wc_query parameter.

#### JavaScript pagination

We’ve also fixed a JavaScript pagination issue where when viewing the first page, the next page was always page 1 again.

* Enable Infinite Scroll.
* Clone WooCommerce from GitHub, switch to the fix/infinite-scroll branch, and import the sample data.
* Go to the WooCommerce shop page at local.wordpress.test/shop/
* When you scroll it loads page 1 + offset 1 = page 2
* If you start at local.wordpress.test/shop/page/2 it loads page 1 + offset 2 + page 3.

#### Posts per page changes

The previous system used a fixed number of 7 or the ‘posts per page’ setting in WP Admin. This isn’t suitable for custom post types where they have their own ‘posts per page’ setting or preference.

To make this more robust we pass through the ‘posts per page’ setting from the original query and use this instead. If the theme defines a different posts_per_page value in the add_theme_support declaration, we default to that instead.

* Enable Infinite Scroll
* Change the number of posts per page in Settings > Reading.
* The number of posts loaded via AJAX should reflect the updated value.
* If testing with WooCommerce, the number of products per page can be changed in the Customizer. Customizer > WooCommerce > Product Catalog > Products per row / per page.

##### Improved rendering callbacks

The previous system relied on a setting, and a fallback, for the render callback. One could also use infinite_scroll_render action.

There’s now a filter of registered callbacks which get ran in sequence. If a callback returns nothing, it continues to the next until content is returned. Callbacks registered through theme support are still called, and the final fallback is the default render method in the infinite scroll class.

* Register a new callback:

```add_filter( 'infinite_scroll_render_callbacks', 'register_some_custom_render_callbacks' );

function register_some_custom_render_callbacks( $callbacks ) {
    $callbacks[] = 'my_post_render_callback';
    return $callbacks;
}

function my_post_render_callback() {
    while ( have_posts() ) : the_post();
        get_template_part( 'content', get_post_format() );
    endwhile; // end of the loop.
}
```

* Your custom callback should load.

#### WooCommerce compatibility

Using the improved callbacks rendering system, we now include a default renderer for WooCommerce products within infinite scroll.

* Enable Infinite Scroll.
* Clone WooCommerce from GitHub, switch to the fix/infinite-scroll branch, and import the sample data.
* Go to the WooCommerce shop page at local.wordpress.test/shop/
* Scroll to page 2.
* Layout should be the same as page 1.

### WooCommerce

Started queueing all add_to_cart events and logging it on the next page. Also preventing duplicate product_view events from product page. Testing instructions:

* click any add to cart button and look for event to be logged in the next page load
* add a link to a post or page with href like http://exampleshop.com/?add-to-cart=${product_id}
* make sure page view and cart event logged in next page load

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
