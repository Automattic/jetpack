## 10.2

### Before you start

- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Widget Visibility

Widget visibility controls have been added for blocks when using the block-based widget editor. To test:

* In Jetpack writing settings `/wp-admin/admin.php?page=jetpack#/writing`, make sure the `Enable widget visibility controls to display widgets only on particular posts or pages` setting under "Widgets" is enabled.
* Then access the block-based widget editor, `/wp-admin/widgets.php`.
* Add any block widget, a Paragraph block will work for example.
* With that block selected, navigate to the block settings panel and open the `Advanced` options.
* Under `Visibility`, try adding new visibility rules.
* Visit the frontend of the site to verify your rules are working.

### VideoPress

VideoPress is being added as a standalone Jetpack product. This is best tested on a Jetpack connected site without a paid Jetpack plan:

* The VideoPress module can now be activated from the Modules page (even for sites without a paid plan): `/wp-admin/admin.php?page=jetpack_modules`
* Once VideoPress is activated, on the Jetpack dashboard `/wp-admin/admin.php?page=jetpack#/dashboard` you will see a VideoPress card that will mention the status such as `1 free video available. Upgrade now to unlock more videos and 1TB of storage`. You can toggle the VideoPress module on/off from this card.
* If VideoPress is enabled on a site without a paid Jetpack plan, you are able to upload one free video to VideoPress.
* For uploading videos to VideoPress there are two methods:
  1. From WordPress.com, go to My Site(s) → Media. Drag the video file from your computer into the media library, or click Add New and select the video file from your computer.
  2. From the WP Admin dashboard, go to Media → Library and drag the video file from your computer into the media library. Note: Clicking Media → Add New and selecting the video file in WP Admin will not upload the video to Jetpack. In order to upload video, make sure the grid view (Grid View) in media library is selected, and then you can drag the file into the WP Admin media library, or you can click Add New. Clicking Add New in the list view (List View) in media library will not upload the video to Jetpack.

### Contact Form Custom Email Headers

There is a new filter available for customizing the email headers for Jetpack contact forms. For testing, try:

* Add a new Jetpack contact form to a test page.
* Add the following snippet to your site using a functionality plugin:

```php
add_filter(
	'jetpack_contact_form_email_headers',
	function ( $headers, $comment_author, $reply_to_addr, $to ) {
		$headers .= 'Bcc: ' . $reply_to_addr . "\r\n";
		return $headers;
	},
	10,
	4
);
```

* Make a test submission to the form you created.
* An email should be sent to the email address specified in the added snippet.
* Warning: DO NOT add headers or header data from the form submission without proper escaping and validation, or you're liable to allow abusers to use your site to send spam. Especially DO NOT take email addresses from the form data to add as CC or BCC headers without strictly validating each address against a list of allowed addresses.

### SEO Tools Archive Title

For custom Archive page titles a new `Archive Title` option replaces the `Date` option. To test:

* At `/wp-admin/admin.php?page=jetpack#/traffic` make sure `Customize your SEO settings` is enabled.
* Click on `Expand to customize the page title structures of your site`.
* For `Archives` use the buttons to insert each token presented (Site Title, Tagline, and Archive Title).
* The live preview should show "Example Archive Title/Date" for the inserted `Archive Title`
* Save the SEO settings.
* Check a custom post type archive page. For example you can enable Jetpack's custom Portfolio type, then view that archive at `example.com/portfolio/`. In the `<title>` you should see "Projects" replacing the `Archive Title"` inserted via button.
* Check a date archive (e.g. `example.com/2019/09`). You should see the appropriate date replacing the `Archive Title` inserted via button.

**Thank you for all your help!**
