=== Jetpack Starter Plugin ===
Contributors: automattic,
Tags: jetpack, stuff
Requires at least: 6.6
Requires PHP: 7.2
Tested up to: 6.8
Stable tag: 0.1.0-alpha
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Jetpack Starter Plugin plugin

== Description ==

plugin--description

== Installation ==

Installation instructions go here.

== Frequently Asked Questions ==

= A question that someone might have =

An answer to that question.

== Screenshots ==

1. This screen shot description corresponds to screenshot-1.(png|jpg|jpeg|gif). Note that the screenshot is taken from
the /assets directory or the directory that contains the stable readme.txt (tags or trunk). Screenshots in the /assets
directory take precedence. For example, `/assets/screenshot-1.png` would win over `/tags/4.3/screenshot-1.png`
(or jpg, jpeg, gif).
2. This is the second screen shot

== Changelog ==
### 0.5.0 - 2024-12-04
#### Added
- Add Woocommerce event remove_order_items to Jetpack Sync
- Enable test coverage.
- Explicitly add the Connection package as dependency
- My Jetpack: update the recommendations section in My Jetpack to include a slider interaction for the cards.
- New setting in /sties/$site/settings that is not relevant to this plugin.
- Packages: add version tracking for identity-crisis package.
- Trigger red bubble notification when bad install is detected

#### Changed
- General: indicate compatibility with the upcoming version of WordPress, 6.5.
- General: indicate compatibility with the upcoming version of WordPress - 6.6.
- General: indicate compatibility with the upcoming version of WordPress - 6.7.
- General: update WordPress version requirements to WordPress 6.4.
- General: use wp_admin_notice function introduced in WP 6.4 to display notices.
- Only include `wp-polyfill` as a script dependency when needed.
- Only show installation errors on plugins page
- Remove explicit Plugin Install package dependency.
- Remove the 'jetpack-identity-crisis' dependency.
- Resolved an issue where revoked licenses were incorrectly treated as unattached. This caused users to be redirected to the license activation page after site connection, even when unattached licenses were not valid for activation.
- Social | Changed My Jetpack CTA for Social from "Learn more" to "Activate"
- Update composer lock file
- Updated dependencies.
- Updated package dependencies.
- Update package lock

#### Removed
- Connection: Removed deprecated method features_available
- Connection: Removed features_enabled deprecated method
- General: Update minimum PHP version to 7.2.
- General: Update minimum WordPress version to 6.6.
- General: update WordPress version requirements to WordPress 6.5.

#### Fixed
- My Jetpack: visual update to the GlobalNotice component look better on mobile.
- Updated package dependencies.

== Arbitrary section ==

You may provide arbitrary sections, in the same format as the ones above.  This may be of use for extremely complicated
plugins where more information needs to be conveyed that doesn't fit into the categories of "description" or
"installation."  Arbitrary sections will be shown below the built-in sections outlined above.

== A brief Markdown Example ==

Ordered list:

1. Some feature
1. Another feature
1. Something else about the plugin

Unordered list:

* something
* something else
* third thing

Here's a link to [WordPress](https://wordpress.org/ "Your favorite software") and one to [Markdown's Syntax Documentation][markdown syntax].
Titles are optional, naturally.

[markdown syntax]: http://daringfireball.net/projects/markdown/syntax
"Markdown is what the parser uses to process much of the readme file"

Markdown uses email style notation for blockquotes and I've been told:
> Asterisks for *emphasis*. Double it up  for **strong**.

`<?php code(); // goes in backticks ?>`
