=== Jetpack Boost ===
Contributors: automattic, xwp, adnan007, bjorsch, danwalmsley, davidlonjon, ebinnion, exelero, jeherve, jpolakovic, karthikbhatb, kraftbj, luchad0res, pyronaur, rheinardkorf, scruffian, thingalon
Donate link: https://automattic.com
Tags: performance, speed, pagespeed, web vitals, critical css, optimize, defer
Requires at least: 5.5
Tested up to: 5.8
Requires PHP: 7.0
Stable tag: 1.3.1
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Speed up your website by optimizing page performance with Jetpack Boost!

== Description ==

Jetpack Boost provides one-click optimizations that supercharge your WordPress site’s performance and improve web vitals scores for better SEO.

### Performance Modules

Optimize your site with the same techniques used on the world's most successful websites. Each technique is packaged up as a module that you can activate and try out.

Currently the plugin has 3 performance modules available:

1. *Optimize CSS Loading* generates Critical CSS for your homepage, posts and pages. This can allow your content to show up on the screen much faster, particularly for viewers using mobile devices.

   Read more about critical CSS generation at [web.dev](https://web.dev/extract-critical-css/)

1. *Defer Non-Essential Javascript* moves some tasks to after the page loads, so that important visual information can be seen sooner.

   Read more about deferring javascript at [web.dev](https://web.dev/efficiently-load-third-party-javascript/)

1. *Lazy Image Loading* only loads the images the user can see. As the user scrolls, images are loaded just before they show up on the page. This simple optimization makes sites faster and saves bandwidth for your host and your customers.

   Read more about lazy image loading at [web.dev](https://web.dev/lazy-loading-images/)

### Easy Setup

There's nothing to configure - the setup process is as easy as:

 1. Install the plugin
 2. Activate Jetpack Connection
 3. Turn on performance modules one by one and observe how the performance score changes

 Google PageSpeed API is used to measure the performance score of a site. It's important to look at the PageSpeed score because Core Web Vitals are going to be used as a ranking factor in search engines.

### With 💚 by Jetpack

This is just the start!

We are working hard to bring more features and improvements to Jetpack Boost. Let us know your thoughts and ideas!

We'd also like to give a special THANK YOU to the XWP team who provided help with initial research and scoping of the plugin and were engaged with our team throughout the project.

== Frequently Asked Questions ==

= What does the Jetpack Boost plugin do to help speed up my site? =

Jetpack Boost makes small changes to the way that data is sent from your WordPress site to your users’ browser, to enable the browser to display your site faster.

Jetpack Boost includes a few separate features which can be turned on individually to improve your site’s performance. These include:

* **Optimize CSS Loading**: This feature determines the most important CSS that your site needs to display your site’s initial content as quickly as possible, and embeds it directly into your site header.
* **Defer Non-Essential JavaScript**: This feature forces all of the JavaScript which is not deemed essential to displaying your site to load after your site’s main content has been loaded.
* **Lazy Image Loading**: This feature delays loading images on your site until they are scrolled into view, allowing the browser to load the first content that the user will see first.

= What speed improvements can I expect when using Jetpack Boost? =

Website Performance is complicated and can be affected by a number of factors. As a result, it is difficult to accurately predict how much impact it will have on each site.

Generally, the lower your speed score is to begin with, the more Jetpack Boost may impact your performance. We have seen user reports of up to 25 Speed Score points improvement simply by installing and using Jetpack Boost.

However, as performance can be impacted by so many factors, it is also possible for Jetpack Boost to have a small negative performance impact in some rare cases.

We recommend that you install Jetpack Boost, and try it for yourself. It includes a tool for measuring your Speed Score, to check what impact it has on your site.

= Can I also defer non-essential CSS with Jetpack Boost? =

Jetpack Boost automatically defers non-essential CSS if its “Optimize CSS Loading” feature is enabled.

The “Optimize CSS Loading” feature identifies the most important CSS rules your site needs to display your pages as quickly as possible (commonly called “Critical CSS”), and defers all other CSS rules from loading until your main content has loaded.

= What are Web Vitals? =

Web Vitals are the measurements that Google uses to better understand the user experience on a website. By improving Web Vitals scores you're also improving the user experience on your site.

You can read more about Web Vitals on [web.dev](https://web.dev/vitals/)

= How does Jetpack Boost plugin improve Core Web Vitals? =

Each Core Web Vital relates to an aspect of how quickly your site can load and appear on new visitors’ screens.

Jetpack Boost makes small changes to the way that data is sent from your WordPress site to your users’ browsers, to enable your content to load faster. As a result, it can improve your Core Web Vitals scores.

For example, our “Optimize CSS Loading” feature ensures the most important CSS rules are sent to users’ browsers as early as possible, improving both First Contentful Paint (FCP) and Cumulative Layout Shift (CLS) scores.

= Does this plugin require Jetpack? =

Jetpack Boost is a part of the Jetpack brand, but it doesn’t require Jetpack plugin to run. This is a separate plugin from Jetpack and it will always remain that way.

= Will this plugin be able to improve performance on any website? =

This plugin includes a range of performance improvements, which can help almost any WordPress site perform better.

However, if your site is already extremely well optimized, Jetpack Boost may not have much room to improve it.

Jetpack Boost includes a tool for measuring your site’s Speed Score - we encourage users to try it out and see what impact it can have for them.

= How do I know if it's working? =

Every site is different and so performance benefits for each module may vary from site to site. That's why we recommend that you measure the performance improvements on your site by enabling the performance modules one by one. There are many tools out there that you can use for free to measure performance improvements:

* [WebPageTest.org](https://www.webpagetest.org/easy)
* [web.dev/measure](https://web.dev/measure/)
* [PageSpeed Insights](https://developers.google.com/speed/pagespeed/insights/)
* [GTMetrix](https://gtmetrix.com/)

Google PageSpeed measurements are built-in the Jetpack Boost dashboard.

= Is Speed Optimization with Jetpack Boost safe? =

Yes, it’s safe to try Jetpack Boost on any WordPress site.

Jetpack Boost does not alter your site’s content, it only modifies the way the content is sent to the user’s browser to allow it to display faster.

As a result, all of Jetpack Boost’s features can safely be turned off in the event of an incompatibility with your other plugins.

= How does Jetpack Boost compare with other speed optimization plugins? =

Speed Optimization plugins for WordPress can be complicated and opaque for users. They often offer columns of checkboxes with little explanation, and don’t include tools to measure the impact of each change or choice users make.

Jetpack Boost aims to be as easy to use as possible, and includes a Speed Score indicator to help users immediately measure the impact of their choices.

= Does it work with static page cache? =

Absolutely! If you have plugins like WP Super Cache or W3 Total Cache installed - Jetpack Boost is only going to help increase the performance benefits! Keep in mind that you need to wait for the cache to clear for Jetpack Boost improvements to show up.

= Can Jetpack Boost make my website load faster if I have a large database? =

Jetpack Boost does not include any optimizations that target large databases at this time. However, watch this space - we are always looking for new ways to help our users perform better.

= Does Jetpack Boost help with image optimization? =

Jetpack Boost can help sites with large images perform better through lazy-loading, preventing images from loading until they are scrolled into view.

However, it currently does not have any Image Format Optimization features. We are always looking for ways to improve the plugin, so watch this space for more features in the near future.

= Is Jetpack Boost compatible with other caching and speed optimization plugins? =

With few exceptions, Jetpack Boost has no problems running alongside most caching and speed optimization plugins. As a guideline, we don’t recommend enabling the same feature in multiple optimization plugins.

For example, if two plugins attempt to defer your non-essential JavaScripts, then they may end up conflicting with each other and cause display problems on your site.

If you run into compatibility issues, please do let us know. You can drop us a line on [the Jetpack Boost Support Forums](https://wordpress.org/support/plugin/jetpack-boost/) at any time.



== Installation ==

1. Install Jetpack Boost via the plugin directory, and activate it.
2. Visit the "Jetpack Boost" section of your site's WP Admin.
3. Turn on the performance features you would like to try out on your site.

== Screenshots ==

1. Manage your Jetpack Boost settings

== Changelog ==
### 1.3.1-beta - 2021-12-02
#### Added
- Critical CSS: Added a filter to allow stylesheets to load synchronously, to avoid CLS issues on certain setups.
- Critical CSS: Exclude "library" posts from Elementor plugin when generating Critical CSS.
- Critical CSS: Explicitly hide admin_bar during Critical CSS render, to improve compatability with custom admin bar setups.
- Speed Scores: Automatically retry if a speed score request is stuck for more than 15 minutes.
- Stability: New end-to-end testing system.

#### Changed
- Critical CSS: Detect external CSS URLs from the client side, to improve compatibility with WAFs which modify HTML.
- Move Boost admin menu into Jetpack submenu.
- Speed Scores: Automatically refresh speed scores if the theme has changed.
- Speed Scores: Include active modules and Jetpack Boost version with Speed Score requests.

#### Fixed
- Critical CSS: Ensure CSS files still load when JavaScript is not enabled.
- Critical CSS: Fixed issue with re-serving Critical CSS during generation process
- Critical CSS: Fix handling for corrupted font-face rules.
- Critical CSS: Fix issue with dismissing recommendations after enabling Critical CSS without page refresh.
- Critical CSS: Use home_url instead of site_url when determining homepage during Critical CSS generation.
- Minor UI fixes for small screens and tooltip display.
- Speed Scores: Do not show comparative scores when no modules are active.

--------

[See the previous changelogs here](https://github.com/Automattic/jetpack/blob/master/projects/plugins/boost/CHANGELOG.md#changelog)
