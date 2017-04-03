## 4.8

Jetpack 4.8 introduces a refreshed admin interface, a new WordPress.com Toolbar for your Jetpack site, and several other improvements.

### Test Jetpack's new look!

We just made some wild changes to Jetpack and we want your feedback! We dramatically overhauled Jetpack's Admin interface to make it easier to navigate the list of Jetpack options and to create a unified experience with the WordPress.com dashboard.

We now make more decisions to help new Jetpack users navigate through all the things Jetpack can do, and we now display less settings and options. The language of all those options has been rethought and is clearer than ever. The toggles make things feel much faster removing the need for save buttons on most of the sections. We've also improved upgrade notices for Jetpack plans. All in all, the design of the settings screen is closer than ever before to WordPress.com settings, which we have been working on in tandem.

It is going to be a pretty big change for everyone, and we want your feedback! If you have any remarks, [let us know](https://jetpack.com/contact-support/beta-group/).

Here are some specific things you could try to get familiar with the settings screen:

- Try interacting with the menu before you connect your site to a WordPress.com account.
- Try accessing the menu from a different local account, that is not linked to WordPress.com.
- Try accessing the menu with different user roles.
- Access the menu from different browsers, and from your mobile device.
- Do the settings displayed under Jetpack > Settings match the options you used on your site until now?
- When making changes to any of the settings there, can you save those changes, and do the changes get applied to your site?
- Are there any options that seem confusing?
- Try clicking on links providing more information, and make sure none of the links are broken.
- Try navigating the new admin interface using only your keyboard.

### WordPress.com Toolbar

The WordPress.com toolbar replaces the default admin bar and offers quick links to the Reader, all your sites, your WordPress.com profile, and notifications. Centralize your WordPress experience with a single global toolbar.

To test this new feature, go to Jetpack > Settings, enable the WordPress.com Toolbar option, and check the toolbar appearing at the top of your site. You'll want to make sure all links are relevant to your account and your site, and work.

We would also recommend testing using different accounts on your site, and different roles.

### Sitemaps

We've completely refactored the Sitemaps module to improve performance and to work on sites with a very large amount of posts (more than 1,000). It'd be great if you could test the module on your own test sites, like so:

1. Create some posts (see [FakerPress](https://wordpress.org/plugins/fakerpress/)). Make sure some of them have a recent (<=2 day old) timestamp.
2. Activate the sitemaps module.
3. Under Settings > Permalinks, set permalinks to anything but the default numerical permalinks.
4. Go to `example.com/news-sitemap.xml`.
5. Go to `example.com/sitemap.xml`.
6. Under Settings > Permalinks, set permalinks to "plain".
7. Go to `example.com/?jetpack-sitemap=sitemap.xml` and `example.com/?jetpack-sitemap=news-sitemap.xml`
8. Add some images and videos to the media library and repeat steps 3--7.

### Widgets

We've added a new [MailChimp Subscriber Popup Widget](https://en.support.wordpress.com/mailchimp/). To test it, try the following:

1. Go to Appearance > Widgets.
2. Find "MailChimp Subscriber Popup" and add the widget to any sidebar.
3. Add the following embed code in "Code" field:
```html
<script type="text/javascript" src="//s3.amazonaws.com/downloads.mailchimp.com/js/signup-forms/popup/embed.js" data-dojo-config="usePlainJson: true, isDebug: false"></script><script type="text/javascript">require(["mojo/signup-forms/Loader"], function(L) { L.start({"baseUrl":"mc.us11.list-manage.com","uuid":"1ca7856462585a934b8674c71","lid":"2d24f1898b"}) })</script>
```
4. Open the front-end and you should see the popup.

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
