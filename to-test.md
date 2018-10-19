## 6.7

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

### Shortcodes

We've made some changes to [the Gist shortcode](https://en.support.wordpress.com/gist/) in this release. It should now be fully compatible with the AMP plugin.

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

**Thank you for all your help!**
