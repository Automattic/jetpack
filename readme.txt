=== Jetpack by WordPress.com ===
Contributors: automattic, adamkheckler, aduth, akirk, allendav, alternatekev, andy, annezazu, apeatling, azaozz, batmoo, barry, beaulebens, blobaugh, cainm, cena, cfinke, chaselivingston, chellycat, clickysteve, csonnek, danielbachhuber, davoraltman, daniloercoli, designsimply, dllh, drawmyface, dsmart, dzver, ebinnion, eliorivero, enej, eoigal, erania-pinnera, ethitter, gcorne, georgestephanis, gibrown, goldsounds, hew, hugobaeta, hypertextranch, iammattthomas, iandunn, jblz, jasmussen, jeffgolenski, jeherve, jenhooks, jenia, jessefriedman, jgs, jkudish, jmdodd, joanrho, johnjamesjacoby, jshreve, keoshi, koke, kraftbj, lancewillett, lschuyler, macmanx, martinremy, matt, matveb, mattwiebe, maverick3x6, mcsf, mdawaffe, MichaelArestad, migueluy, mikeyarce, mkaz, nancythanki, nickmomrik, obenland, oskosk, pento, professor44, rachelsquirrel, rdcoll, ryancowles, richardmuscat, richardmtl, roccotripaldi, samhotchkiss, scarstocea, sdquirk, stephdau, tmoorewp, tyxla, Viper007Bond, westi, yoavf, zinigor
Tags: Jetpack, WordPress.com, backup, security, related posts, CDN, speed, anti-spam, social sharing, SEO, video, stats
Stable tag: 6.5
Requires at least: 4.7
Tested up to: 4.9

The ideal plugin for stats, related posts, search engine optimization, social sharing, protection, backups, security, and more.

== Description ==

Hassle-free design, marketing, and security — all in one place.

= Design Services =
Create and customize your WordPress site from start to finish. Jetpack helps you with:

* Hundreds of professional themes for any kind of site
* Intuitive and powerful customization tools
* Unlimited and high-speed image and video content delivery network
* Lazy image loading for a faster mobile experience
* Integration with the official WordPress mobile apps

= Marketing Services =
Measure, promote, and earn money from your site. Jetpack helps you with:

* Site stats and analytics
* Automated social media posting and scheduling in advance
* Elasticsearch-powered related content and site search
* SEO tools for Google, Bing, Twitter, Facebook, and WordPress.com
* Advertising program that includes the best of AdSense, Facebook Ads, AOL, Amazon, Google AdX, and Yahoo
* Simple PayPal payment buttons

= Security Services =
Stop worrying about data loss, downtime, and hacking. Jetpack helps you with:

* Brute force attack protection, spam filtering, and downtime monitoring
* Daily or real-time backups of your entire site
* Secure logins with optional two-factor authentication
* Malware scanning, code scanning, and automated threat resolution
* Fast, priority support from WordPress experts

= Expert Support =
We have a global team of Happiness Engineers ready to help you. Ask your questions in the support forum, or [contact us directly](https://jetpack.com/contact-support).

= Paid Services =
Compare our [simple and affordable plans](https://jetpack.com/pricing?from=wporg) or take a [product tour](https://jetpack.com/features?from=wporg) to learn more.

= Get Started =
Installation is free, quick, and easy. [Install Jetpack from our site](https://jetpack.com/install?from=wporg) in minutes.

== Installation ==

= Automated Installation =
Installation is free, quick, and easy. [Install Jetpack from our site](https://jetpack.com/install?from=wporg) in minutes.

= Manual Alternatives =
Alternatively, install Jetpack via the plugin directory, or upload the files manually to your server and follow the on-screen instructions. If you need additional help [read our detailed instructions](https://jetpack.com/support/installing-jetpack/).

== Frequently Asked Questions ==

= Is Jetpack free? =
Yes! Jetpack's core features are and always will be free.

These include: [site stats](https://jetpack.com/features/traffic/site-stats), a [high-speed CDN](https://jetpack.com/features/writing/content-delivery-network/) for images, [related posts](https://jetpack.com/features/traffic/related-posts), [downtime monitoring](https://jetpack.com/features/security/downtime-monitoring), brute force [attack protection](https://jetpack.com/features/security/brute-force-attack-protection), [automated sharing](https://jetpack.com/features/traffic/automatic-publishing/) to social networks, [sidebar customization](https://jetpack.com/features/writing/sidebar-customization/), and many more.

= Should I purchase a paid plan? =
Jetpack's paid services include real-time backups, security scanning, premium themes, spam filtering, video hosting, site monetization, SEO tools, search, priority support, and more.

To learn more about the essential security and WordPress services we provide, visit our [plan comparison page](https://jetpack.com/pricing?from=wporg).

= Why do I need a WordPress.com account? =

Since Jetpack and its services are provided and hosted by WordPress.com, a WordPress.com account is required for Jetpack to function.

= I already have a WordPress account, but Jetpack isn't working. What's going on? =

A WordPress.com account is different from the account you use to log into your self-hosted WordPress. If you can log into [WordPress.com](https://wordpress.com), then you already have a WordPress.com account. If you can't, you can easily create one [during installation](https://jetpack.com/install?from=wporg).

= How do I view my stats? =

Once you've installed Jetpack your stats will be available on [WordPress.com/Stats](https://wordpress.com/stats), on the official [WordPress mobile apps](https://apps.wordpress.com/mobile/), and on your Jetpack dashboard.

= How do I contribute to Jetpack? =

There are opportunities for developers at all levels to contribute. [Learn more about contributing to Jetpack](https://jetpack.com/contribute) or consider [joining our beta program](https://jetpack.com/beta).


== Screenshots ==

1. Themes: Choose from hundreds of customizable, professional themes.
2. Performance: Free high-speed content delivery network for your images.
3. Apps: Update your site from any device with the free WordPress apps.
4. Analytics: Simple and concise site stats and traffic insights.
5. Sharing: Connect your site to social networks for automated social sharing.
6. Revenue: Sell products & take payments with simple payment buttons.
7. Downtime Monitoring: Get notified if and when your site goes down.
8. Security: Protection against brute force attacks, spam, and malware. On-demand backups and restores.

== Changelog ==

= 6.5 =

* Release date: September 4, 2018
* Release post: https://wp.me/p1moTy-a7U

**Major Enhancements**

* WordAds: Added ability to include custom ads.txt entries in the ads module.

**Enhancements**

* Admin Page: Added ability to disable backups UI by filter when VaultPress is not activated.
* Comments: Moved the Subscription checkboxes on a comment form from after the submit button to before the submit button.
* General: Removed the outdated "Site Verification Services" card in Tools.
* General: Removed jetpack_enable_site_verification filter. We recommend filtering access to verification tools using jetpack_get_available_modules instead.
* General: Simplified the logic of Jetpack's signed HTTP requests code.
* Lazy Images: Updated lazy images to use a default base64 encoded transparent to reduce a network request.

**Improved compatibility**

* Geo Location: Fixed a compatibility issue with other plugins that added meta attributes to site feeds with the `rss2_ns`, `atom_ns` or `rdf_ns` filters.

**Bug fixes**

* AMP: Fix PHP notice when rendering AMP images with unknown width and height.
* Contact Forms: We fixed an issue where personal data eraser requests didn't erase all requested feedback.
* General: Improves compatibility with the upcoming PHP 7.3.
* General: Updated input validation for meta tags given in site verification.
* Lazy Images: Deprecated jetpack_lazy_images_skip_image_with_atttributes filter in favor of jetpack_lazy_images_skip_image_with_attributes to address typo.
* Sharing: Fixed duplicate rel tags on Sharing links.
* Search: Fixed an issue where a CSS and JavaScript file could be enqueued unnecessarily if the Search module was activated and if the site was using the Query Monitor plugin.
* Shortcodes: Updated Wufoo Shortcode to always load over https and use async form embed.
* Widgets: Fixed excessive logging issue with Twitter Timeline widget.
* Widgets: Removed cutoff date check for Twitter Timeline widget as it is no longer necessary.
* Widgets: Added decimal precision validator to Simple Payments Widget price field on the Customizer for supporting Japanese Yen.
