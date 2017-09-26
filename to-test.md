## 5.4

### Contact Form

We added a new field to the Contact Form editor; you can now add a date picker to your forms.

To test this new feature,

1. Try creating a form containing a date field using the visual editor.
2. Visit the front end using a modern browser, and try interacting with the date field. Make sure that the styling appears as you would expect. You should see the native browser implementation of the date field controls, including a dropdown picker (activated by an arrow inside the right edge of the input).
3. You can use browserstack to emulate Windows 8 + IE10 to test the display for browsers that do not recognize `<input type="date">` elements. This should display the styled jQuery datepicker.

### Comments

We've improved how the comment form was displayed in some themes. To test this change, enable the Comments feature on your site and make sure the comment form still works properly:
- It should have a minimal height by default, with no white space below it.
- When clicked, it should expand so you can enter some content in the form.
- If you add a lot of content, the height of the form should adapt to your content.

### Plans

When purchasing a plan, you are now presented with a "Warm welcome" screen and some tips to help you make the best of the plan you just purchased. To test this, try to purchase a plan! You will want to review the copy as well as the look of that welcome screen in your dashboard, in as many browsers as possible.

### Search

If you've purchased a [Professional Plan](https://jetpack.com/features/comparison/) for your Jetpack site, this new release will give you access to a new feature, **Jetpack Search**.

To get started, go to [Settings > Traffic](https://wordpress.com/settings/traffic/) on WordPress.com, and select a site using Jetpack 5.4 Beta and a Professional plan. Then, scroll down to the bottom of the page and enable the search feature. Once you've done so, go to Appearance > Widgets in your dashboard, and enable the new Search widget. This widget should give you results that are more relevant than the default WordPress search.

### Shortcodes

We've made some improvements and fixed some bugs with the Facebook shortcode in this release. Try embedding different Facebook posts, images, and more in some of your posts. You will want to make sure the posts are as wide as your theme's content width. Here are a few examples of things you could embed: `https://www.facebook.com/jetpackme/photos/a.1078536988894553.1073741827.103336516414610/1078537925561126/?type=3&theater`
`https://www.facebook.com/jetpackme/posts/1505539472860967`
`https://www.facebook.com/RocketsAreCool/videos/1109290809200449/?permPage=1`

### Widgets

We've improved the [Milestone Widget](https://jetpack.com/support/extra-sidebar-widgets/milestone-widget/) and would like you to test it!

We added a new "Time Unit" setting, and also added a setting to count *up* to a milestone instead of counting down. To test the new settings, follow the detailed instructions [here](https://github.com/Automattic/jetpack/pull/7782).

### Misc

- [always] Try to connect with a brand new site, and also cycle your connections to existing sites.
- Make sure the settings UI looks good in IE11, as we fixed some bugginess there.
- Simple payments got some minor improvements, make sure everything looks ok.
- Recipe Shortcode should look good in RTL
- Edit some comments, make sure the edits are reflecting correctly in Calypso

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
