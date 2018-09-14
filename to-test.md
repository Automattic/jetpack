## 6.6

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

**Thank you for all your help!**
