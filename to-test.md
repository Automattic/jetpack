## 4.0.4

### Carousel

- Ampersands in image titles and image descriptions should be displayed properly in the Carousel view. To test this, try inserting Ampersands in your gallery image titles and descriptions.
- We fixed a JavaScript error happening when visiting a gallery page including a hash in the URL. To test this scenario, follow these steps:
	1. Create a gallery in one of your posts.
	2. Load that post in an incognito window, and add `#test` to the end of the URL.
	3. No JavaScript error should appear in your browser console.

### Comments

- When using the Comments module on a site where the language is set to anything other than English, make sure the comment form uses the right language.

### Contact Form

- We fixed PHP notices that appeared in error logs and in the form success message in some very specific situations, in combination with other plugins. To test, try creating a new form with multiple fields, then fill in the form as a visitor, and make sure it doesn't create any PHP notice on the page or in your logs.

### Custom CSS

- Properly handle slashes and quotes when saving Custom CSS. To make sure the module doesn't strip away or incorrectly replace slashes or quotes, try the following:
    1. Go to Appearance > Edit CSS.
    2. Enter CSS using slashes and quotes, like so:
    ```css
    @import url("fineprint.css") print;
    @import url("bluish.css") projection, tv;
    @import 'custom.css';
    @import url("chrome://communicator/skin/");
    @import "common.css" screen, projection;
    @import url('landscape.css') screen and (orientation:landscape);
    .test {
        background: url( 'an-image.jpg');
        content: '\6404';
    }
    ```
    3. Save your changes, and make sure CSS is not destroyed or removed.

### Manage

- We've made some improvements to the way WordPress.com could poll for available updates on your site. To test this, you can go to [WordPress.com/plugins](https://wordpress.com/plugins/), and make sure Jetpack reports all the plugin updates available under Dashboard > Updates in your dashboard.
- We made a few changes to the connection process to allow people to connect a Jetpack site to WordPress.com right from WordPress.com. To give that a try, you can start connecting a new Jetpack site to your WordPress.com account [here](https://wordpress.com/jetpack/connect).
- When testing this new Connection flow, try the following:
    1. Deactivate the Manage module on your test site.
    2. Disconnect Jetpack from WordPress.com.
    3. Go to [WordPress.com/jetpack/connect](https://wordpress.com/jetpack/connect).
    4. Go through the steps to connect your site.
    5. Go back to your site's dashboard, and make sure the Manage module was activated.

### Multisite

- Make sure Jetpack Connection management works in the Jetpack menu in Network Admin. To test this, you'll need a Multisite network. Then, try the following combinations:
	1. When Jetpack is network activated.
	2. When Jetpack isn't network activated, and is only activated on a few sites of the network.
In all cases, the site list in the Network Admin Jetpack Menu should reflect the Jetpack Status of each site of the network.


### Open Graph

- Do not add Jetpack Open Graph Meta Tags when [the SEO Framework plugin](https://wordpress.org/plugins/autodescription/) is already active.
- Grab images from Slideshows. To test this, enable the Shortcodes module on your site, and insert a slideshow into a new post. The images from the slideshow should appear in the Open Graph Image Meta tags.
- Make sure Open Graph Meta tags are set properly regardless of Static Front Page settings. To test, follow these steps:
	1. Go to Appearance > Customize, and set "Front Page Displays" to a static page and set two pages as the front and the posts pages.
	2. Save your changes.
	3. Change the Front Page Displays to Latest posts and save. The dropdown for the pages for front and posts remain set, but greyed.
	4. Visit the home page and check the Open Graph tags. They should match the home page, not the static page that was previously set.
- Twitter Cards: make sure they can be removed with the `jetpack_disable_twitter_cards` filter. To test this, try activating a plugin like [JM Twitter Cards](https://wordpress.org/plugins/jm-twitter-cards/). Jetpack's Twitter Cards shouldn't be added to posts. If that works, deacctivate the plugin, and then try to add `add_filter( 'jetpack_disable_twitter_cards', '__return_true', 99 );` to a functionality plugin. It should also disable Jetpack's Twitter Cards.

### Photon

- Auto-generate additional `srcset` options. To test, check the `srcset` values for each one of your post images after enabling Photon.
- Avoid PHP notice when Photon arguments are provided as a string, and not as an array. To test, use the `jetpack_photon_pre_args` filter to change the Photon parameters used for images on your site, and make sure it doesn't generate PHP notices:

```php
function jeherve_testing_things_photon() {
        return 'resize=500,500&filter=grayscale';
}
add_filter( 'jetpack_photon_pre_args', 'jeherve_testing_things_photon' );
```

### Protect

- New filter: `jetpack_protect_connect_timeout`. You can use it to control the maximum timeout in waiting for a response from Protect servers. Here is how you could use it:
```php
function jeherve_custom_protect_timeout() {
    return 180;
}
add_filter( 'jetpack_protect_connect_timeout', 'jeherve_custom_protect_timeout' );
```
- We fixed an issue where the Protect math form didn't show up on frontend login forms. To check this, install a plugin that includes a frontend log in form, like bbPress.

### Spelling and Grammar

- Fix mismatching HTML tags. To check this, go to Users > My Profile in your dashboard, and make sure the Spelling options are displayed properly there.

### Sharing

- LinkedIn: fix sharing count when using unofficial buttons. You can test the button like so:
    1. Activate unofficial sharing buttons (Icon, Icon + Text, or Text) on your site, including LinkedIn button.
    2. Share a post to LinkedIn.
    3. The sharing counts should be properly displayed.

### Sitemaps

- In some languages (like Swedish or French), sitemap stylesheets included characters that were not supported in XML files. To test that this has been properly fixed, visit `yoursite.com/sitemap.xml` and `yoursite.com/sitemap.xsl`, and make sure no errors appear on the page. **To make testing easier, you can use a plugin like [Transient Manager](https://wordpress.org/plugins/transients-manager/) to make sure you are not looking at a cached version of the sitemap pages.**

### Support

- You should be able to contact the Jetpack support team right from your dashboard, thanks to a contact form appearing under Jetpack > Debug. The debug link is available at the bottom of each Jetpack menu page.

### Widgets

- Fix JavaScript errors in the customizer. To test this change, follow these steps:
    1. Go to Jetpack > Settings, and enable the Extra Sidebar Widgets module.
    2. Go to Appearance > Customize.
    3. Make a few changes to your theme, and then head over to the Widgets section.
    4. Make changes to widget settings, and make sure you don't see any JavaScript error in your browser console.

### VideoPress

- We've added a fix to avoid JavaScript errors in the Post Editor when editing post types that do not support the Core Media editor. To test this, activate a plugin that enables Custom Post Types on your site. A plugin like [CampTix](https://wordpress.org/plugins/camptix/) is a good example. Once you've done so, go to Tickets > Tickets > Add New, and make sure there are no JavaScript errors on the page.
