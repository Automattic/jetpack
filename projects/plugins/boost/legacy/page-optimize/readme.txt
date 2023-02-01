=== Page Optimize ===
Contributors: aidvu, bpayton
Tags: performance
Requires at least: 5.3
Tested up to: 6.1
Requires PHP: 7.4
Stable tag: 0.5.2
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Optimize pages for faster load and render in the browser.

== Description ==

This plugin supports a few features that may improve the performance of page loading and rendering in the browser:

* Concatenate CSS
* Concatenate JavaScript
* Execution timing of non-critical scripts
    * Note: Changing script execution timing can be risky and will not work well for all sites.

== Installation ==

This plugin uses sensible defaults so it can operate without configuration, but there are a number of constants you may use for a custom configuration.

= PAGE_OPTIMIZE_CACHE_DIR =

Page Optimize caches concatenated scripts and styles by default, and this constant controls where the cache files are stored. The default directory is `cache/page_optimize` under your site's `wp-content` folder.

To change the cache location, set this constant to the absolute filesystem path of that location.

To disable caching, set this constant to `false`. Please note that disabling Page Optimize caching may negatively impact performance unless you are caching elsewhere.

= PAGE_OPTIMIZE_CSS_MINIFY =

Page Optimize has CSS Minification capabilities which are off by default.

If you're using caching, and not minifying CSS elsewhere, it is recommended to enable it by setting it to `true`.

== Testing ==

To test features without enabling them for the entire site, you may append query params to a WordPress post or page URL. For example, to test enabling JavaScript concatenation for `https://example.com/blog/`, you can use the URL `https://example.com/blog/?concat-js=1`.

Supported query params:

* `concat-css` controls CSS concatenation. Values: `1` for ON and `0` for OFF.
* `concat-js` controls JavaScript concatenation. Values: `1` for ON and `0` for OFF.
* `load-mode-js` controls how non-critical JavaScript are loaded. Values: 'defer' for [deferred](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-defer), 'async' for [async loading](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#attr-async), any other value indicates the feature should be disabled.

== Changelog ==

= 0.5.1 =
* Bail when editing pages in Brizy Editor (it errors when JavaScript load mode is `async`).

= 0.5.0 =
* Apply the `script_loader_tag` filter for scripts that are concatenate-able but have no neighbors to concatenate with. This fixes a case where the TwentyTwenty theme wanted to apply a `defer` attribute to its script but was never given the opportunity.

= 0.4.5, 0.4.6 =
* Force absolute paths for CSS replacements.
* Lower required PHP version to 7.0.

= 0.4.4 =
* Don't queue the cache cleaning WP Cron job if we aren't caching.
* Cleanup cache if we turned caching off or directory changed.

= 0.4.3 =
* gzip in PHP slows stuff down a bit. Simply don't do this. Any web server can handle this better.
* also remove the output buffering, no need for that anymore
* CSS Minification can sometimes slow things down significantly. Add constant to enable/disable.

= 0.4.2 =
* Initial release. No changes yet. :)
