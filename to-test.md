## 6.7

### Block Editor

We've made numerous changes to the infrastructure that will provide Jetpack blocks to the new Block editor in WordPress. We've added a first block, for the Markdown feature. You can test it by going to Posts > Add New on your site after installing the Gutenberg plugin, or switching to WordPress 5.0 Beta.

Try adding the module to your posts, use it, switch between editing and previewing, and let us know what you think about it.

### Calypsoify

If you are used to manage your site via the WordPress.com interface, you can now click on the "Plugins" link in Calypso and be redirected to a WordPress.com themed Plugins page in your site's dashboard (wp-admin).

To test this change, try the following:

**Pre-testing:**

- You must have an active Jetpack connection
- Open/watch your browser console for errors.

**Plugins:**

- Visit `/wp-admin/plugins.php?calypsoify=1`: see the new skin
- Visit `/wp-admin/` with no params. Skin should be removed. Note: you can also click to go "back" to Calypso, and then when in Calypso, click "wp-admin".
- Repeat the above steps after collapsing the WordPress menu
- Repeat the above steps with multiple admin color schemes
- Install a few plugins that have settings pages and ensure that they are displaying properly when Claypsoified.
- Ensure that none of the .js or .css are loading when not Calypsoified in both the admin and front end.

**Gutenberg:**

- Install the Gutenberg plugin
- Visit `wp-admin/post-new.php?calypsoify=1` to view the Calypso skin
- You should not see the sidebar (It's meant to be a "full screen" experience)

**RTL**

- Enable an RTL language.
- Repeat the above testing instructions to ensure everything looks ok

### Site accelerator

In Jetpack 6.6 we started beta-testing a new Jetpack feature that allows you to serve a lot of CSS and JS files from the WordPress.com CDN instead of using your site's resources. In Jetpack 6.7, we're removing the Beta label and making that feature available to everyone!

To test this, you can go to Jetpack > Settings > Writing in your dashboard and turn the feature on.

- You can choose to speed up both images and static files, thus enabling the image CDN (formerly known as Photon) and the new feature.
- You can choose to only turn one of the features on.

When turning on the file feature, you should see the following:

1. All Jetpack's CSS and JS files are now served from a CDN, using the `c0.wp.com` domain.
2. All core WordPress CSS and JS files are also served from the CDN.
3. If you use the WooCommerce plugin on your site, its files should also benefit from the CDN.

You can check your site's source code for that domain once you've activated the feature.

### Shortcodes

As you may know, [Polldaddy has changed its name to Crowdsignal](https://crowdsignal.com/2018/10/18/introducing-crowdsignal/). We are consequently updating the shortcode and embed methods available in Jetpack to match the new service. From now on, both the old embed methods and the new ones (using the new domains) should work.

To test this, you can try adding polls and surveys to your site using both the old and the new domains. You can create new polls and surveys [here](https://polldaddy.com/dashboard/). Once you've done so, try inserting them into your posts using any of the methods available:
- By pasting an embed code with some JavaScript.
- By pasting a URL on its own line in the WordPress editor.
- By pasting a `[polldaddy]` or `[crowdsignal]` shortcode provided in the "Collect responses" area of your Crowdsignal dashboard.

Try to replace polldaddy by crowdsignal in all the tests you make, and check that both the new and old domains work.

We've also made some changes to [the Gist shortcode](https://en.support.wordpress.com/gist/) in this release. It should now be fully compatible with the AMP plugin.

To test this, try installing the AMP plugin on your site (either the current Stable version or [the Beta](https://github.com/Automattic/amp-wp/releases/tag/1.0-RC1-built)), and try adding Gists, using different formats, to one of your posts. Here are some examples:

```html
oEmbed: Full gist:

https://gist.github.com/sebastianbenz/1d449dee039202d8b7464f1131eae449

oEmbed: Linking to a file via in a Gist:

https://gist.github.com/sebastianbenz/1d449dee039202d8b7464f1131eae449#file-sw-html

oEmbed: Linking to file without username in URL.

https://gist.github.com/1d449dee039202d8b7464f1131eae449#file-sw-html

Example from WordPress.com docs:

[gist https://gist.github.com/2314628 /]

Second example from WordPress.com docs:

[gist]2314628[/gist]
```

### Sitemaps

We've made multiple changes to the Sitemaps feature in this release. To test this:

- Try visiting the Sitemaps right after upgrading.
- Try deactivating the sitemaps feature, activate it back, and then immediately visit the Sitemaps pages.
- Under Settings > Reading, set a static front page and a blog page, and check that they both appear in the sitemaps, without being duplicated.

### Twenty Nineteen

This release also includes support for the new default theme, Twenty Nineteen. To test, start by installing the latest version of the theme from [here](https://github.com/WordPress/twentynineteen/archive/master.zip). Then, try to use the following features:

- Add Infinite Scroll support.
- Support for Responsive Videos. Test this by inserting videos in your posts and seeing them on mobile devices.
- Add Content Options support for author-bio, blog-display, post-details, and featured-images. You can see those settings under Appearance > Customize > Content Options.
- Style widgets and shortcodes to match the style of the theme. Try this by adding Jetpack widgets and shortcodes to your site.

**Thank you for all your help!**
