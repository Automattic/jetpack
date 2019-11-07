## 7.9

For this round of testing, I would encourage y'all to install [WordPress' Beta Tester plugin](https://wordpress.org/plugins/wordpress-beta-tester/) on your sites, and switch to using WordPress 5.3 Beta. It will allow you to test Jetpack with the upcoming version of WordPress scheduled to be released in a few weeks.

### Dashboard

#### Updated design

When you load Jetpack > Dashboard with this release, you may notice that the buttons now look a bit different. We've indeed updated the dashboard's design to better match the updated design of the WordPress dashboard in the upcoming version of WordPress.

If you are running WordPress 5.3 RC already, I would invite you to compare the look of the buttons and elements of the dashboard with the look of the Jetpack dashboard. Let us know if you find anything that looks out of place.

#### New disconnection experience

From now on, whenever you want to disconnect your site from WordPress.com, Jetpack will present you with some details about your Jetpack usage and some links to help you fully understand the consequences of disconnecting your site.

To test this, head over to Jetpack > Dashboard and click on the link to "Manage Site Connection". A new modal will appear with information about your site. Let us know what you think about the new modal, and make sure the data displayed there is correct.

### Blocks

#### AMP

Both the MailChimp and the SlideShow blocks now work well with the AMP plugin.

To test this, try adding either of those blocks to a site where you use the AMP plugin. When visiting your site on an AMP view, you should be able to use the 2 blocks with no issues.

#### Contact Form

We've added a new option to the Form block. When adding or editing a block in the block editor, you should now see a new "Confirmation Message" setting in the block sidebar. That setting will allow you to do one of 3 things when a visitor submits a form on your site:
- Display a summary of the form they just submitted. This used to be the only option until now.
- Redirect to a new URL, either on your site or anywhere else.
- Display a custom confirmation message.

Try to edit existing forms, and creating new ones. In both cases, the 3 options should behave as advertized.

#### VideoPress

This should be a big improvement for folks using Jetpack Videos on their site and using the Block editor. Until now, you had to go to the WordPress.com dashboard or to Media > Library to be able to upload videos to VideoPress. You would then go to the block editor and insert those videos you had uploaded earlier.

From now on, you can do everything from the editor. To test this, you'll need a Premium or Professional plan on your site. Then, go to Jetpack > Settings > Performance and make sure the Jetpack Videos feature is active.
Then, go to Posts > Add New, insert a Video Block, and try to upload a video. You should see the upload take place and the video should appear inside a VideoPress player in the editor.

You'll also want to make sure the Video Block still works well when the VideoPress option is inactive.

### Connection

We've made some more changes to the connection flow, so you'll want to pay extra attention to the connection flow when initially configuring Jetpack on your site.

- Try using a different prompt to start the connection process. You can start connecting from Jetpack > Dashboard, but also using the banners in the Plugins menu or in the main dashboard page.
- When in Jetpack > Dashboard before you start the connection process, make sure everything on the page works well.

### Search

**Note: Jetpack Search is currently only available for sites using Jetpack Professional. If you do not use this plan on your site yet, you'll want to upgrade first.**

We're currently working on several improvements to [Jetpack Search](https://jetpack.com/support/search/). We're aiming to deliver a better experience whenever someone launches a search on a site using what we call "Instant Search". This feature is currently in Beta, and we need your help and feedback to iron out any bugs before the feature is made available to everyone.

To enable the new Instant Search feature, add the following to your site's `wp-config.php` file:

```php
define( 'JETPACK_SEARCH_PROTOTYPE', true );
```

Once you've done so, select a theme, make sure the Search feature is enabled under Jetpack > Settings > Search, and then head over to Appearance > Customize to add the Jetpack Search widget to your site.

Once that's done, you can start testing that new search form on your site, and let us know how that goes!

### SSO

When on WordPress 5.3 and with the SSO feature active, you'll want to make sure the login form always looks good, with no layout issues or missing WordPress.com button when logging out / in.

### Themes

WordPress 5.3 will ship with a brand new default theme, Twenty Twenty. We've updated Jetpack to make sure that widgets, sharing buttons, related posts, and other theme-dependent features like Infinite Scroll work well with that new theme. If you'd like to give that a try, you can enable the Twenty Twenty Theme on your site. To do so:

1. Download a zip of the theme [here](https://github.com/wordpress/twentytwenty).
2. Unzip the archive, remove `-master` from the unzipped directory, rezip it.
3. Upload that new zip file to your site, and activate it.
4. Try to use the theme without changing any of the colors in Appearance > Customize, then try again after applying custom colors.
5. Make sure that all Jetpack features work well with the new theme.

### Others

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

**Thank you for all your help!**
