## 6.4

### Widgets

#### Top Posts Widget

We added new `jetpack_top_posts_widget_layout` filter that allows you to create a custom display layout for the Top Posts widget (which _might_ be used to extend Top Posts widget).

To test:

- Add 'Top Posts' Widget
- Make sure it works as expected

### AMP Compatibility

AMP compatibility for Comments was improved.

To test:

1. Install [AMP v1.0-beta1](https://github.com/Automattic/amp-wp/releases/tag/1.0-beta1).
2. In the admin, go to AMP > General settings and enable Native template mode.
3. Activate the comments module in Jetpack.
4. Open the dev console.
5. Navigate to a post and attempt to leave a comment.
6. Clicking the “Post Comment” button, expect to see no error like `Blocked form submission to 'https://jetpack.wordpress.com/jetpack-comment/' because the form's frame is sandboxed and the 'allow-forms' permission is not set.`.


### Contact Form

We added a bit of flexibility to the data exporter and eraser so they can be tailored to the needs of different privacy and data retention policies.

To test (You will need ftp / ssh access to the test site):

- Enable Jetpack Contact Forms.
- Create a page and add a Jetpack Contact Form.
- Submit the form a couple of times with a test email address.
- Check that `Export Personal Data` & `Remove Personal Data` tool work as expected. You should find that exporting personal data includes a "Feedback" group containing the personal data that you submitted with the test email address. Removing personal data should remove the Feedback posts associated with the test email address.
- Copy this file (https://gist.github.com/coreymckrill/bed546ef05c9917d0d01618588a2c206) into the wp-content/mu-plugins folder.
- Perform the two tests separately, uncommenting the relevant lines to activate them.
- For Test 1, the result should be that the data export does not include feedback posts, and during data erasure, the feedback posts are not deleted.
- For Test 2, during erasure, you should see a message that personal data was found, but not erased, followed by the "because reasons" message.

### Connection

We updated the wording on the connection prompts text by removing the word "fascinating" from it.

To test:

* Start with a disconnected site.
* Confirm that the connection on WordPress' Dashboard and on Jetpack's Dashboard lacks the word "fascinating".
* Deactivate and activate Jetpack. Confirm that the modal that appears on reactivation lacks the word too.

### Lazy images

We fixed the behaviour for visitors with JavaScript disabled when the images were expected to be centered.

- Ensure lazy images module is on.
- Load a post with images in it, with at least one image being centered.
- Ensure the centered image does not fill the post content. If it does, crop it.
- Reload post and ensure that image is properly centered

We also fixed compatbility on lazy images when updating WooCommerce cart quantity.

To test:

* Start having a WooCommerce with the Salient theme installed.
* Add some items into the cart, go to the cart.
* Update the quantity and save.
* Confirm that images start loading fine after quantity update.

### Sharing

We now redirect users to WordPress.com for configuring Sharing. If a user is not linked to WordPress.com, we put them in the flow to complete the connection.

1. Enable "sharing".
2. Create a secondary admin/user on the site.
3. Log in as secondary user, navigate to the Settings -> Sharing page in wp-admin.
4. You should be redirected to Calypso to link your WordPress.com account.
5. Once linked, you should be redirected back to the wp-admin sharing screen.
6. If the secondary user is already linked, there should be no redirection.
7. Clicking on Settings -> Sharing as a linked user should take you to WordPress.com for configuration.

### Shortcodes

We added a shortcode for adding [flat.io](https://flat.io) embeds.

To test:

1. Start a new post and paste `https://flat.io/score/5a5268ed41396318cbd7772c-string-quartet-for-rainy-days` on a new line.
2. Publish the post and expect to see the embed.

### Simple Payments widget

We added a warning for admin users when there are Simple Payments products published on pages/posts or as a Widget and Simple Payments is disabled.

To test:

* Get a Professional Subscription on a Jetpack site.
* Add a Simple Payment Product to a Page/Post and as a Widget, and publish the changes.
* Navigate to the page/post: the site should show the product and the widget for both admin, non-admins and logged out users.
* Cancel the Professional Subscription
* Navigate to the page/post: the site should show the warning for admin users, and for non-admin and anonymous users it shouldn't show a warning nor the product.

We also fixed a fatal error that was affecting the main site on multisite installations.

To test:

* Start with Multisite Installation.
* Activate the Jetpack Plugin on the main site.
* Deactivate the Jetpack Plugin on the main site.
* Expect not to see an error logged like `Uncaught Error: Class 'Jetpack_Simple_Payments' not found`.

Also a bug was fixed related to 2 years plan implemented recently in WordPress.come

To test:

* Start with an Atomic site having a 2 year business plan subscription.
- Install the [Jetpack beta plugin](https://jetpack.com/download-jetpack-beta/)
- Visit /wp-admin/admin.php?page=jetpack-beta and active the Release Candidate.
- Expect to be able to add a Simple Payment in the post editor or as a widget in the customizer.

### Site Logo

We removed the custom name for the "Site Identity" section in the Customizer. The custom name is unnecessary, given core's updating of the section name in 4.3.

* Visit the Customizer.
* The section containing Site Title, Tagline, and Logo should be named "Site Identity".

**Thank you for all your help!**
