=== Jetpack Boost - Website Speed, Performance and Critical CSS  ===
Contributors: automattic, xwp, adnan007, bjorsch, danwalmsley, davidlonjon, dilirity, donncha, ebinnion, exelero, jeherve, jpolakovic, karthikbhatb, kraftbj, lsarsfield, luchad0res, pyronaur, rheinardkorf, scruffian, thingalon, dlocc
Donate link: https://automattic.com
Tags: performance, speed, web vitals, critical css, cache
Requires at least: 7.0
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 4.8.1
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Speed up your WordPress site with one-click optimizations like Page Cache, Critical CSS, and Image CDN to improve Core Web Vitals.

== Description ==

Speed up your WordPress site by optimizing page performance with Jetpack Boost. Easily activate one-click optimizations to boost your Core Web Vitals.

Did you know that a faster website:-

- Ranks higher on Google.
- Improves bounce rate (people stay on your site for longer).
- Increases your conversion rate.

Increase your website performance and speed up your website with one-click optimizations that supercharge your WordPress site’s performance and improve core web vitals scores for better search engine listings.

Improving Core Web Vitals helps you rank higher on Google. A faster website also improves your SEO, helps you reduce your bounce rate and increase your ecommerce conversion rate.

- Largest Contentful Paint (LCP): Measures loading performance. Improve your LCP and improve your website loading speed.
- Interaction to Next Paint (INP): Measures responsiveness. To improve user experience pages should have a low INP.
- Cumulative Layout Shift (CLS): Measures visual stability. Lowering your CLS helps improve your user experience.

### Performance Modules

Optimize your website with the same techniques used on the world's most successful websites.

Each technique that is used to increase website performance is packaged up as a module that you can activate and try out.

Currently, the plugin has 8 performance modules available:

1. *Optimize CSS Loading* generates Critical CSS for your homepage, posts and pages. This can allow your content to show up on the screen much faster, particularly for viewers using mobile devices.

   Read more about critical CSS generation at [web.dev](https://jetpack.com/redirect/?source=jetpack-boost-critical-css)

2. *Page Cache* speeds up your site by saving pages as static files. These files are quickly served to visitors, reducing load times and enhancing user experience.

3. *Defer Non-Essential JavaScript* moves some tasks to after the page loads, so that important visual information can be seen sooner and your website loads quicker.

   Read more about deferring JavaScript at [web.dev](https://jetpack.com/redirect/?source=jetpack-boost-defer-js)

4. *Image Guide* is a must-have feature for anyone who wants to optimize the images on their website. With this guide, you can ensure that the images on your site are the right size and dimensions, which is critical for improving user experience, page speed, and site ranking. Following the tips and best practices outlined in the guide, you can reduce image file sizes and speed up your site. Check out our [support page](https://jetpack.com/support/jetpack-boost/image-performance-guide/) to learn more about this feature and how it can help you achieve a faster and smoother website experience for your users.

5. *Image CDN* allows your site to serve automatically-resized images in modern web formats directly from Jetpack's worldwide Content Delivery Network.

   Read more about Image CDNs at [web.dev](https://web.dev/image-cdns/)

6. *Concatenate and Minify CSS and JS* combines and shrinks your JavaScript and CSS resources to reduce the number and size of requests to your server, ensuring your content loads faster.

   Read more about minifying files at [web.dev](https://web.dev/minify-css/)

7. *Optimize LCP Images* improves the Largest Contentful Paint (LCP) of your Cornerstone Pages by optimizing their key image, so your most important content shows up sooner.

8. *Prerender Cornerstone Pages* loads your Cornerstone Pages in the background before visitors click a link to them, so your most important pages appear almost instantly.

Don’t want to have to manually generate your critical CSS each time you update your site? Let us do the heavy lifting for you with automated critical CSS – each time you update your site we will automatically regenerate your critical CSS and update your performance scores. Upgrading also gives you dedicated email support access.

### With 💚 by Jetpack

This is just the start!

We are working hard to bring more features and improvements to Jetpack Boost. Let us know your thoughts and ideas!

We'd also like to give a special THANK YOU to the XWP team who provided help with initial research and scoping of the plugin and were engaged with our team throughout the project.

== Frequently Asked Questions ==

= What does Jetpack Boost do to help speed up my WordPress site? =

Jetpack Boost makes small changes to the way that data is sent from your WordPress site to your users’ browser, to enable the browser to display your site faster.

Jetpack Boost includes a growing number of separate features which can be turned on individually to improve your site’s performance. These include:

* **Optimize CSS Loading**: This feature identifies the styles needed to display your site’s initial content quickly. See “Can I also defer non-essential CSS with Jetpack Boost?” below for how Critical CSS is applied.
* **Page Cache**: This feature stores your website's pages as static HTML files, bypassing the need for dynamic generation. This means visitors receive pages faster, reducing wait times and improving overall site performance.
* **Defer Non-Essential JavaScript**: This feature forces all of the JavaScript which is not deemed essential to displaying your site to load after your site’s main content has been loaded.
* **Image CDN**: This feature automatically resizes images to a more appropriate size for your visitors' screens, converts them to modern image formats, and serves them from Jetpack's worldwide network of servers.
* **Concatenate JS**: This feature reduces the size of your JavaScript resources, and automatically combines them into fewer files, allowing your site to load faster with fewer requests.
* **Concatenate CSS**: As with concatenating JavaScript, this feature shrinks your CSS files and allows them to load with fewer requests.

= What speed improvements can I expect when using Jetpack Boost? =

Website Performance is complicated and can be affected by a number of factors. As a result, it is difficult to accurately predict how much impact it will have on each site.

Generally, the lower your speed score is to begin with, the more Jetpack Boost may impact your performance. We have seen user reports of up to 25 Speed Score points improvement simply by installing and using Jetpack Boost.

However, as performance can be impacted by so many factors, it is also possible for Jetpack Boost to have a small negative performance impact in some rare cases.

We recommend that you install Jetpack Boost, and try it for yourself. It includes a tool for measuring your Speed Score, to check what impact it has on your site.

= Can I also defer non-essential CSS with Jetpack Boost? =

Jetpack Boost automatically defers non-essential CSS when its “Optimize CSS Loading” feature is enabled and usable Critical CSS is available for the page.

The “Optimize CSS Loading” feature identifies the most important CSS rules your site needs to display your pages as quickly as possible (commonly called “Critical CSS”), and defers all other CSS rules from loading until your main content has loaded.

Boost embeds Critical CSS in the page header after the page title. Generated CSS larger than 512 KiB is rejected with an error message, and any previous CSS for that page group is removed. Previously saved CSS above this limit is also not embedded. Without usable Critical CSS, this feature leaves stylesheets loading normally; other page groups can still be optimized.

= What are Web Vitals? =

Web Vitals are the measurements that Google uses to better understand the user experience on a website. By improving Web Vitals scores you're also improving the user experience on your site.

You can read more about Web Vitals on [web.dev](https://jetpack.com/redirect/?source=jetpack-boost-vitals)

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

* [WebPageTest.org](https://jetpack.com/redirect/?source=jetpack-boost-webpagetest)
* [web.dev/measure](https://jetpack.com/redirect/?source=jetpack-boost-measure)
* [PageSpeed Insights](https://jetpack.com/redirect/?source=jetpack-boost-pagespeed)
* [GTMetrix](https://jetpack.com/redirect/?source=jetpack-boost-gtmetrix)

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

Jetpack Boost's Image CDN feature automatically converts your images to more modern web formats, resulting in smaller image file sizes without a loss in quality.

= Is Jetpack Boost compatible with other caching and speed optimization plugins? =

With few exceptions, Jetpack Boost has no problems running alongside most caching and speed optimization plugins. As a guideline, we don’t recommend enabling the same feature in multiple optimization plugins.

For example, if two plugins attempt to defer your non-essential JavaScripts, then they may end up conflicting with each other and cause display problems on your site.

If you run into compatibility issues, please do let us know. You can drop us a line on [the Jetpack Boost Support Forums](https://wordpress.org/support/plugin/jetpack-boost/) at any time.



== Installation ==

1. Install Jetpack Boost via the plugin directory, and activate it.
2. Activate Jetpack Connection
3. Turn on performance modules one by one and observe how the performance score changes

== Screenshots ==

1. Jetpack Boost dashboard with performance scores and optimization modules.
2. Free Critical CSS generation in progress.
3. Automatic Critical CSS generation with the upgraded plan.
4. Historical performance tracking with the upgraded plan.

== Changelog ==
### 4.8.2 - 2026-11-06
#### Added
- Connection: Add a Connected view to the Users page, show connection errors on the Connectors card, and transfer connection ownership to another administrator without leaving your site, with a note that moving a Jetpack plan is an additional step.
- Dashboard: Add breadcrumbs linking to My Jetpack.
- My Jetpack: Add an Available filter to the Features list, and recognize Jetpack Pro subscriptions, licenses and catalog offers while preserving existing plans.
- Site Health: Add Jetpack connection details to the Info tab and the copied site info report.

#### Changed
- Activity Log: Show the connection error notice only when a connection error has been recorded.
- Connection: Clarify connection, Offline Mode and ownership notices, confirm account disconnections and list the plugins that stop working, and show clearer errors and owner details on the Connectors card.
- Dashboard: Show "Checking site speed…" while a speed test runs, and show "Run speed test" as an icon on screens 480px wide or narrower.
- Getting Started: Send premium upgrades to the My Jetpack upgrade page, where a license key can also be redeemed.
- Image Guide: Render the overlay with React; administrators now load WordPress's data and React scripts on the front end.
- My Jetpack: Ask for a WordPress.com account only when something in use needs one, and leave plugins included in a bundle plan out of the menu notification badge.
- My Jetpack: Connect accounts from the feature cards that need one, turn a module on once Install or Activate Jetpack finishes, open Modules links in Features, and restore the "Included in plan" view.
- My Jetpack: List VaultPress Backup among the plans that include Activity Log history, and simplify the Search paid-plan wording.
- My Jetpack: Show the avatar and connection status control in the headers of My Jetpack and the modern Boost dashboard, with access to connection and plan details.
- My Jetpack: Simplify the Features tab with switches instead of status badges, flat cards and aligned notices, and show it in Offline Mode.
- Update package dependencies.

#### Deprecated
- Dashboard: Deprecate the filter that restores the legacy dashboard, which will be removed in a future release.

#### Fixed
- Accessibility: Announce the score history chart and a disabled Cornerstone Pages Save button correctly to screen readers, and show the selected history day's focus ring on any bar color.
- Activity Log: Show an empty date picker on the free plan, instead of a date range it does not apply.
- Cache cleanup: Prevent memory exhaustion when removing expired optimization data.
- Concatenate JS: Fix scripts printed on their own failing to load on sites served from a custom port.
- Connection: Fix reconnecting an account disconnecting other users, an empty Safe Mode window, owner names with characters like &, untranslated Connectors card text, and spurious Site Health connection failures.
- Connection: Stop users who cannot set up the site connection from becoming the connection owner when the owner's connection is missing.
- Critical CSS: Enable automatic regeneration after upgrading, reduce repeated styles, print after the page title, and reject generated CSS above 512 KiB with an error message.
- Critical CSS: Keep generation running when the site returns an older status or a page never answers, and report a Regenerate that did not start or a request the site refused.
- Dashboard: Fix "Something went wrong!" on WordPress 7.1 when the site data request fails, old scores in the header after a test started from My Jetpack, and oversized links in notices.
- Footer: Show the Features link to administrators only.
- Image CDN: Fix some images hosted on other sites failing to load when their file name ends in a size like -600x400.
- Image Guide: Fix duplicate guides appearing after the guide is paused and resumed, and open popup links in separate new tabs.
- LCP: Stop cropping optimized images when their box has a different shape, their URL has a query string, or their original file is offloaded or deleted, and size the image to its box when the theme sets `object-fit: cover`.
- My Jetpack: Fetch a new speed score when the saved one is incomplete, and show the highest-priority notice first.
- My Jetpack: Fix layout problems on the setup and connection screens and in the Help tab on narrow screens, scroll to the first Features results after filtering, and return to the previous tab from upgrade screens.
- My Jetpack: Keep product switches, statuses and the Overview connection card in sync after changes, including failed changes, Beta or development plugin copies, and switching VideoPress off without Jetpack.
- My Jetpack: Stop showing $0, NaN or $0.00 prices when prices cannot be loaded, and stop offering retired Security and Growth plans while preserving existing subscriptions.
- Optimize LCP Images: Re-analyze cornerstone pages a few minutes after a template, Global Styles or Additional CSS change, show an error when a re-analysis can't start, and skip the analysis on a cornerstone page save when no results are stored.
- Overview: Show grade ranges that match how the overall grade is calculated.

--------

[See the previous changelogs here](https://github.com/Automattic/jetpack/blob/trunk/projects/plugins/boost/CHANGELOG.md#changelog)
