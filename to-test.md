## 6.6

### Admin Page

We've made some design changes to all the Jetpack settings screens in this release, so all the Jetpack pages share the same design as the main Jetpack dashboard.

You can test this on different devices and browsers. The following pages were changed:

- Jetpack > Site Stats
- Jetpack > Site Stats > Configure
- Jetpack > Debug
- Jetpack > Debug > All Modules list
- **Settings > Sharing**
- On Multisite networks, we have updated Network > Jetpack Sites
- Still on Multisite, check Network > Jetpack settings

### Verification Tools

We've made a big improvement to the process needed to verify a site with Google. Here are the details steps you can follow to test the new process:

1. Open a brand new site ([you can use Jurassic Ninja for this](https://jurassic.ninja/create?jetpack-beta&branch=master&shortlived&wp-debug-log)
2. Set Up Jetpack and connect to a WordPress.com account.
3. Choose a Free Plan.
4. Navigate to `https://[my-site].jurassic.ninja/wp-admin/admin.php?page=jetpack#/traffic`
5. Scroll to the "Site verification" pane.
6. Click "auto-verify with Google".
7. Choose a Google Account and log into it.
8. Confirm that the Google Site Verification field has a green check marks and the text "Your site is verified with Google".
9. You should see a link to the Google Search Console, click on it and verify that you can access your site there.
10. Click the "Edit" button and edit the text field, clear it, and click save.
11. Navigate to https://www.google.com/webmasters/verification/home and confirm you can see your site.
12. Click on  "Verification Details" to the right of your site.
13. Click "Unverify" near the bottom right and "Unverify" in the dialog.
14. Confirm that the site is removed from the list of properties and that no error appears
15. Return to `https://[my-site].jurassic.ninja/wp-admin/admin.php?page=jetpack#/traffic` or refresh and confirm that the Google Site Verification field has reverted to its original two button layout. 

### Infinite Scroll

Infinite Scroll was not fully compatible with the Privacy options that were recently added to WordPress. We've fixed that! To test, try the following:

1. Publish a privacy policy page on your site.
2. Enable infinite scroll.
3. Scroll down to display the infinite footer.
4. Confirm that it now includes a link to the privacy policy page.

### Lazy Images

We've made some changes to the Lazy Images feature in this release. You'll want to make sure none of the images on your site are broken after this release.

You will want to try to insert images of different sizes, galleries, but also images from other sites via the "insert via URL" option.

In addition to this, you can make the following tests:

1. Ensure that lazy images module is on
2. Create a post/page with images in it. You can also test this with other post types. Try for example to create WooCommerce Products with images.
3. View source on page load and ensure that the placeholder is loaded via the `srcset` attribute
4. After scrolling down, ensure the image loads properly and the `srcset` attribute now contains the actual images OR the `srcset` attribute has been removed in favor of just using `src`.

### Search

We have made some changes to the Search feature and how it could be enabled in this release. Try starting from a brand new site, with a free plan. Look at the different prompts to upgrade to a Professional plan to get Jetpack Search, and make sure everything looks good.

Then, try the following:

1. Upgrade to a Professional plan.
2. Go to https://wordpress.com/settings/traffic/{your site}
3. Make sure Jetpack Search (bottom of page) is disabled
4. Go to {your site}/wp-admin/widgets.php
5. Add the "Search (Jetpack)" widget.
6. Go back to https://wordpress.com/settings/traffic/{your site} (reload the page)
7. (Wait a second or two)
8. See that Jetpack Search is enabled.

### Shortcodes

#### MailChimp

Mailchimp updated their newsletter embed code, and the old one does not work anymore.

To test the changes, try the following:

- As an admin, add the new embed code to a new post.
- As a contributor, add the new embed code to a new post and save your draft. Watch the code convert into a shortcode.
- Make sure the newsletter pop up appears on your site when you view the post.
- Make sure no JavaScript errors appear in your browser console.

If possible, try to create your own embed code as explained [here](https://jetpack.com/support/extra-sidebar-widgets/mailchimp-subscriber-popup-widget/). If not, here is an example embed code you can add to your post:

```html
<script type="text/javascript" src="//downloads.mailchimp.com/js/signup-forms/popup/unique-methods/embed.js" data-dojo-config="usePlainJson: true, isDebug: false"></script><script type="text/javascript">window.dojoRequire(["mojo/signup-forms/Loader"], function(L) { L.start({"baseUrl":"mc.us8.list-manage.com","uuid":"be06c2a596db91bfe4099fde8","lid":"08cf5fa008","uniqueMethods":true}) })</script>
```

**Thank you for all your help!**
