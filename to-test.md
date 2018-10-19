## 6.7

### shortcodes

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

**Thank you for all your help!**
