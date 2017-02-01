## 4.6

In Jetpack 4.6, we focused on fixing bugs and making the plugin fully compatible with PHP 7.1. We also added a brand new module, Google Analytics.

### Google Analytics

Google Analytics support on Jetpack is available as a feature of the [Professional plan](https://jetpack.com/pricing/). Visit **Jetpack → Settings → Engagement → Google Analytics** in your dashboard to enable Google Analytics.

Once the module is enabled, go to **Settings → Analytics** [on WordPress.com](https://.wordpress.com/settings/analytics) and you'll find a field where you can add your Google Analytics Tracking ID.

Once you've added the tracking ID, you should be able to see the Google Analytics tracking code in the source code of all pages on your site.

### Publicize

We've made a few changes to Publicize, and would appreciate your help testing the following scenarios:

Test and make sure Publicize is triggered when **scheduling posts instead of publishing them directly**.


Make sure Publicize works when scheduling posts **on a site that doesn't use the default WP Cron mechanism**. To test this, you can add `define( 'DISABLE_WP_CRON', true );` to your site's `wp-config.php` file, and then set up a cron job to hit `/wp-cron.php?doing_wp_cron` every 15 minutes or so.

Make sure Publicize **respects the "Shared" connection settings on a site with multiple authors**. To test this, follow these steps:

1. Add 2 authors to your site.
2. Create a Publicize option with Author A, and set that connection as "Shared" when creating it.
3. Publish a post while logged in as Author B; Publicize should be triggered and a post should be sent to your shared Publicize connection.
4. With Author B, create a new, non shared Publicize connection.
5. With Author A, publish a new post. That post should not be sent to the non-shared Publicize connection you created with Author B.

### Widgets

**Twitter Widget:** We've added back an option that had been removed by mistake in a previous Jetpack release. To use the No Scrollbar" option, you should not specify a number of tweets in the widget settings, and check the "No Scrollbar" option.

**Top Posts Widget:** We've fixed layout issues when the Top Posts Widget was set to use the "List" layout. To test this fix, go to Appearance > Widgets, and create a new Top Posts Widget. Then, choose the list layout.
The widget should then be displayed properly on your site. In a browser inspector, check the widget's image URLs. They should use Photon and should include `resize=40,40` at the end of the URL.

### Final Notes

During your tests, we encourage you to open your browser's Development Tools and keep the Console open, checking for any errors in the Console and the Network tabs.

To open the Console in Chrome or Firefox, you can press CMD+Alt+i in macOS or F12 in Windows.

**Thank you for all your help!**
