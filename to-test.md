## 6.5

### Admin Page

Added ability to disable backups related UI when a filter is passed for our hosting partners.

To test :

1. In an integration plugin, add `add_filter( 'jetpack_show_backups', '__return_false' );`
2. Load Jetpack admin page.
3. Ensure that backups and scanning are not mentioned in UI.
4. Install and activate VaultPress.
5. Ensure that backups and scanning are mentioned.

### AMP

Fixed PHP error notice that appears when a post has no featured image set, but does have an embedded `gallery` shortcode with image files that have been deleted before.

To test :

1. Enable logging in WordPress.
2. Add a post with no featured image set.
3. Add `gallery` shortcode to that post with some images.
4. Delete those images from `gallery`.
5. Ensure the following error code does not appear in your error log when you view the post in `AMP`:
`Undefined index: src_width in wp-content/plugins/jetpack/3rd-party/class.jetpack-amp-support.php on line 224`

### Comments

Moved the Subscription checkboxes from after the submit button to before the submit button.

To test :

1. When viewing a comment form, ensure Subscription options are located above the submit/post comment button.
![](https://user-images.githubusercontent.com/44990/43659234-37cad834-9710-11e8-83fd-7b3661bf927d.png)
2. Make sure Subscribing also does work as expected.

### Contact Form

We fixed an issue when attempting to erase all feeback using the personal data eraser that would leave some feedback non deleted. 

To test: 

Setup:

1. Create a contact form on your site
2. Manually edit to `/contact-form/grunion-contact-form.php` on line 846 to read `$per_page = 1;`
Test:
1. Submit 3 feedbacks through the form, all with *the same email address*.
2. Go to wp-admin/ -> Tools -> Erase Personal Data.
3. Enter the email address you used, click "Send Request".
4. Find that Pending Request in the table on that page, hover over it and click "Force Erase Personal Data".
5. See the AJAX requests go, and the success message "All of the personal data found for this user was erased." appear.
6. Go to wp-admin/ -> Feedback
7. Expect to see no feedbacks left.

### General

Improved compatibility with the upcoming PHP 7.3 that fixes warning when using `continue` within a `switch` to confirm intent.

To test :

1. Ensure there are no warning messages when running with PHP 7.3.

Removed the outdated "Site Verification Services" card in Tools.

To test :

1. Connect to `WP-Admin` on a Jetpack Site
2. Go to `Tools` (`/wp-admin/tools.php`) and notice the screen to verify your site on search engines (titled `Website Verification Services (?)`) has been replaced by a placeholder.

Old UI :
![](https://user-images.githubusercontent.com/230230/44407221-d8a47c00-a55d-11e8-9e60-f8dad7e7daec.png)

New UI :
![](https://user-images.githubusercontent.com/51896/44542314-45845700-a6c1-11e8-8a02-996bb28b4ff6.png)

Updated input validation we have for meta tags used for Website Verification services.

To test :

1. Enter any of the following valid meta tags and make sure they are saved successfully without any validation errors.

- `<meta name="google-site-verification" content="1234"/>` (no space before `/>`)
- `<meta name='google-site-verification' content='1234' />` (use of `'` instead of `"`)
- `<meta name='google-site-verification' content=1234 />` (does not use any quotes)
- `<meta content="1234" name="google-site-verification" />` (switches the order)
- `<meta name="google-site-verification" content="1234" some-prop />` (has extra properties)
- `<meta name="google-site-verification" content="1234">` (does not have a closing character)

2. Enter a "bad" string and make sure it fails to save with a validation error. i.e `<moota name="google-site-verification" content="1234"/>`

### Lazy Images

Deprecates `jetpack_lazy_images_skip_image_with_atttributes` filter in favor of `jetpack_lazy_images_skip_image_with_attributes` to address typo.

To test :

1. Make sure filters work on tests with `phpunit --filter=WP_Test_Lazy_Images`

We also updated lazy images to use a base64 encoded transparent to reduce a network request.

To test:

- Ensure that site has Lazy Images turned on.
- Create a post/page with some images in it.
- Load the post/page.
- Ensure that images load properly.
- If you view the source when the page first loads, you should see the base64 encoded image.

### Search

Fixed an issue where a CSS and JavaScript file could be enqueued unnecessarily if the Search module was activated and if the site was using the Query Monitor plugin.

To test :

1. Purchase Jetpack Professional plan.
2. Ensure Search module is ON.
3. Install and activate Debug Bar.
4. While logged in, perform a search on frontend of site and ensure Jetpack Search debug panel shows.
5. Ensure that you can prettify JSON output in panel.
6. In an incognito, or logged out tab, perform search on the frontend, and ensure that you don't see files like this in the source: `jetpack/3rd-party/debug-bar/debug-bar.css`.
7. Deactivate Debug Bar plugin.
8. Follow steps above for Query Monitor plugin.

### Sharing

Fixed an issue with Twitter sharing that affected WordPress.com sites.

To test :

1. Set a default Twitter handle for your sharing buttons, and that your default Twitter handle appears when you click a share-via-twitter button.
2. When you Publicize a post, and no default Twitter handle is set, ensure the Twitter handle used in Publicize is present when you click a share-via-twitter button.

Fixed an issue with duplicate `rel` tags on Sharing links.

To test :

1. Enable Jetpack Sharing.
2. Inspect the Sharing links/buttons on any page/post and ensure there is only one `rel` tag in the link.

i.e should NOT be like this (contains double `rel` tags) :
`<li class="share-twitter"><a rel="nofollow" data-shared="sharing-twitter-14" class="share-twitter sd-button no-icon" href="https://myurl.com/link?share=twitter" rel="noopener noreferrer" target="_blank" title="Click to share on Twitter"><span>Twitter</span></a></li>`

### Shortcodes

We updated Wufoo Shortcode to always load over HTTPS and use async form embed.

To test :

1. Test with various Wufoo embed shortcodes. All should work over HTTPS, regardless of whether they set HTTPS argument to (true/false) or not at all.

We also updated the Geo Location module to fix compatibility issues with plugins that added meta attributes to site feeds.

To test:

* Add a plugin that uses the `rss2_ns` hook, or better yet, create one yourself: https://gist.github.com/zinigor/8c2fb946536be33b2cb141d5808d57b4
* Feed your feed into [the validator](https://validator.w3.org/feed/). You can get your site's feed URL by adding `/rss` to the end of the site URL.
* Confirm that the feed is only invalid due to a duplicate attribute issue and not due to a `not well-formed (invalid token)` issue.

### Widgets

Fixed an issue with Twitter Timeline widget that caused excessive logging.

To test :

1. Enable logging in WordPress.
2. Use the Twitter Timeline widget.
3. Check your log and ensure there are no log lines like this :

`PHP Notice: Undefined index: type in .../wp-content/plugins/jetpack/modules/widgets/twitter-timeline.php on line 88`
`PHP Notice: Undefined index: type in .../wp-content/plugins/jetpack/modules/widgets/twitter-timeline.php on line 111`


We also added precision validation for the price field in the Simple Payments Widget. Fixes a bug that allows the creation of Simple Payment Products with the wrong number of decimals. This is because all currencies have a precision of 2, except Japanese Yen that does not support decimals.

To test:

* Start with a Premium or Professional plan.
* On the Customizer, navigate to Widgets and select a sidebar or a footer.
* Click on Add a Widget and search for Simple Payments.
* Click on Add New to create a new Product.
* Using an invalid precision, click _Save_.
* Expect to receive an error message.

### WordAds

We added the ability to include custom ads.txt entries in the ads module by configuring them on the Jetpack Admin Page.

To test:

1. Enable Jetpack ads module.
1. View `<site>/ads.txt` and verify `#Jetpack - User Custom Entries` is not present.
1. Add custom entries to `Custom ads.txt entries` textarea and save.
1. Attempt to include garbage entries with HTML markup or `<script>` tags.
1. View `<site>/ads.txt` and verify `#Jetpack - User Custom Entries` is present and that "bad" entries are stripped and only "regular" text remains.
1. On a site WP install utilizing a subdirectory (e.g. www.site.com/foo/wp-admin) check that the ads.txt portion is removed, as ads.txt requires by definition not to run under a subdirectory.

**Thank you for all your help!**
