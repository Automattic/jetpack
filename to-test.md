## 6.1.1

### Privacy

#### Warning about extent of Jetpack's Privacy Policy

To test:

* Be sure 'Extra Sidebar Widgets' are enabled in Jetpack.
See: /wp-admin/admin.php?page=jetpack_modules to review.
* Add the EU Cookie Law Banner widget.
* It should be using our cookies statement as a default setting, which will generate this notice.
* Using a custom URL should automatically disable the notice.
* Save the widget, try with multiple EU widget instances in a single sidebar, and try multiple instances across multiple sidebars; i.e., do your best to break it and report any issues.

#### Support for core's Removal and Export of personal data.

To test:

You'll need to start with WordPress 4.9.6

* Enable Jetpack Contact Forms.
* Create a page and add a Jetpack Contact Form.
* Submit the form a couple of times with a test email address.
* Test both of these upcoming tools in core.
    * Export Personal Data
    * Remove Personal Data
* Expect to find that exporting personal data includes a "Feedback" group containing the personal data that you submitted with the test email address. Removing personal data should remove the Feedback posts associated with the test email address.

#### Privacy page copy updates

We updated the copy and content of the Privacy settings area within the Jetpack settings UI. This will now be in sync with the same setting on WordPress.com

To test:

* Visit the Privacy settings page of your Jetpack site (wp-admin).
* Confirm that the content/copy has been updated, according to the changes in this PR.
* Confirm that all links work as expected and that the setting still toggles correctly.

#### Cookies & Consent Widget: Default to core's privacy policy when present

When a user site has a Privacy Policy page set (introduced in 4.9.6), we now default to using that privacy policy as a custom policy URL.

To test:

Start testing on WordPress 4.9.6.

* With no privacy policy set in WP core, add a new widget and make sure it defaults to using the "default" policy url.
* Set a privacy policy in WP Core. Then add a new widget and make sure the policy URL defaults to a custom URL which is pre-populated with the privacy policy page URL set in WP Core.

#### New setting for Banner consent expiration.

To test:

* After adding a EU Banner widget from Appearance -> Widgets, test the new settings, make sure they behave as expected.
* Enable the Ads module, then click the consent banner. Make sure the personalized-ads-consent cookie is present.

### Sharing

* We added a check for validating the Akismet key before allowing sharing by email.

To test:

* Start with a Jetpack-connected site.
* Go to wp-admin > Jetpack > Settings > Sharing > Sharing buttons and make sure sharing buttons are enabled.
* Go to wp-admin > Plugins and make sure Akismet is activated but do not connect Akismet via Jetpack or with an API key.
* Check this branch.
* With the Akismet plugin activated but not connected, expect to not be able to add the email sharing button.

### WordAds

We made Ads only show on the main query in the loop.

To test:

* Setup a test Jetpack site and sign up for WordAds
* Ping @rclations for him to enable your site as WordAds-enabled
* Enable all of the automatic ad placements in Jetpack > Settings > Traffic. Place 4 ad widgets in a sidebar (for good measure).
* You should find that 5-6 ads are showing, and the `atatags-` ids show sequential numbers in the source.

**Thank you for all your help!**
