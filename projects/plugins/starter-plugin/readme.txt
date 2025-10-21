=== Jetpack Starter Plugin ===
Contributors: automattic,
Tags: jetpack, stuff
Requires at least: 6.7
Requires PHP: 7.2
Tested up to: 6.9
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
### 0.8.0 - 2025-09-09
#### Added
- Added typecheck support for E2E tests.
- My Jetpack: Added analytics for empty product search results.

#### Changed
- Improve performance of WordPress.com comment likes by caching and minimizing API requests.
- My Jetpack: Enable access to My Jetpack on WP Multisite.
- My Jetpack: Fix multisite availability check for restricted products and modules.
- My Jetpack: Unify the user connection flow with a unified screen.
- My Jetpack: Update Stats card to include a chart for better analytics.
- Remove CRM installation nudge for Complete plan users.
- Sync: Ignore the ActivityPub Outbox CPT.
- Update package dependencies.

#### Fixed
- JITM: Fix ineffective caching due to expired plugin sync transient
- JITM: Remove jQuery dependency.
- My Jetpack: Fix footer alignment for disconnected accounts.
- My Jetpack: Prevent expiration alerts for products covered by active bundles.
- My Jetpack: Restore plan purchase link.

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
