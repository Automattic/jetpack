=== Always Use Open Graph with Jetpack ===
Contributors: kraftbj
Tags: Jetpack, open graph
Requires at least: 3.7
Tested up to: 6.0
Stable tag: 1.0.1
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Jetpack automatically disables its Open Graph tags when there's a known plugin that already adds Open Graph tags, which is good. Sometimes, though, you might want to use Jetpack's version instead. Even if you disable the tags in the conflicting plugin, Jetpack won't add Open Graph tags without being told to do so.

== Description ==

Jetpack automatically disables its Open Graph tags when there's a known plugin that already adds Open Graph tags, which is good. Sometimes, though, you might want to use Jetpack's version instead. Even if you disable the tags in the conflicting plugin, Jetpack won't add Open Graph tags without being told to do so.

This is great for when you want to use the awesome WP SEO by Yoast plugin or others like All-in-One SEO, but, for whatever reason, would like to use Jetpack's OG tags instead.

== Installation ==

1. Install the plugin within WordPress via the Plugins->Add New page.
2. Activate Plugin
3. Profit. No options to set, nothing else to do.


== Frequently Asked Questions ==

= Why would I want to use this? =

Jetpack's implementation of Open Graph and Twitter Card tags is the same as what's used on WordPress.com. There's a team of folks who are keeping watch on Facebook and Twitter changes, then improving the code. WP SEO and other plugins do a great job with SEO, so this plugin helps everyone play together nicer.

== Changelog ==
### 1.0.2 - 2022-07-06
#### Added
- Add plugin temporarily to the Jetpack monorepo for automated SVN/WPorg testing.

#### Changed
- Renaming master to trunk.
- Updated package dependencies.
