=== Jetpack Starter Plugin ===
Contributors: automattic,
Tags: jetpack, stuff
Requires at least: 7.0
Requires PHP: 7.4
Tested up to: 7.1
Stable tag: 0.11.0
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
### 0.11.0 - 2026-10-14
#### Added
- My Jetpack: Allow the Automattic for Agencies banner to be dismissed.

#### Changed
- Boost: Wait up to four minutes for slow speed tests in My Jetpack instead of timing out after two.
- Charts: follow the WordPress admin color scheme for chart series colors.
- General: Update minimum WordPress version to 7.0.
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency.
- My Jetpack: Show what Paid Stats actually adds — UTM tracking, device stats, and region & city locations — instead of commercial use.
- Remove unneeded development and documentation files from the published plugin.
- Tested up to WordPress 7.1.
- Update composer.lock files.
- Updated package dependencies.

#### Removed
- Updated PHP version requirements to PHP 7.4 or newer.

#### Fixed
- Charts: draw labels at the design system's font weight and size.
- Fix fatal error on My Jetpack when the current stable Jetpack plugin is active.
- My Jetpack: Keep the Automattic for Agencies banner hidden after dismissing it and switching tabs.
- My Jetpack: keep the stats chart tooltip under sticky and fixed page elements.
- My Jetpack: Stop repeating the partner lookup request on every page load.
- My Jetpack: Stop the Stats dashboard from asking which plan you want again after Start for Free was already chosen.

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
