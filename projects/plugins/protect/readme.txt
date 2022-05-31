=== Jetpack Protect ===
Contributors: automattic, retrofox, leogermani, renatoagds, bjorsch, ebinnion, fgiannar, zinigor, miguelxavierpenha, dsmart, jeherve, manzoorwanijk, njweller, oskosk, samiff, siddarthan, wpkaren, arsihasi, kraftbj, kev, sermitr, kangzj, pabline
Tags: jetpack, protect, security, malware, scan
Requires at least: 5.9
Requires PHP: 5.6
Tested up to: 6.0
Stable tag: 0.1.0-alpha
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

Jetpack Protect - Free malware scan and WordPress site security

== Description ==

Jetpack Protect is a free security plugin for WordPress that scans your site and warns you about vulnerabilities,
keeping your site one step ahead of security threats and malware.

== What does Jetpack Protect check for? ==

Jetpack Protect scans your site on a daily basis and warns you about:

- The version of WordPress installed, and any associated vulnerabilities
- What plugins are installed and any related vulnerabilities
- What themes are installed and any associated vulnerabilities

== Over 25,000 registered malware and vulnerabilities in our database ==

WordPress security is something that evolves over time. Jetpack Protect leverages the extensive database of WPScan, an
Automattic brand. All vulnerabilities and malwares are entered into our database by dedicated WordPress security
professionals and updated constantly as new information becomes available.

== Easy to setup and use ==

There’s nothing to configure – the setup process is as easy as:
1. Install and activate the plugin
2. Set up it with one click.

After you activate the plugin, Jetpack Protect will run daily automatic malware scans on your WordPress site and update
you on vulnerabilities associated with your installed plugins, themes, and WordPress core.

== WITH 💚 BY JETPACK ==

This is just the start!

We are working hard to bring more features and improvements to Jetpack Protect. Let us know your thoughts and ideas!

== Further reading ==

- [Jetpack: Security, performance, and growth tools made for WordPress sites by the WordPress experts.](https://jetpack.com/)
- You can follow the [Jetpack Twitter](https://twitter.com/jetpack?lang=en) account to catch up on our latest WordPress
security recommendations and updates.
- [WordPress Security: How to Protect Your Site From Hackers](https://jetpack.com/blog/category/security/page/3/)
- [Should You Use Jetpack for WordPress Security?](https://jetpack.com/blog/should-you-use-jetpack-for-wordpress-security/)
- [Jetpack Acquires WordPress Vulnerability Database WPScan](https://jetpack.com/blog/jetpack-acquires-wordpress-vulnerability-database-wpscan/#more-139339)

== FAQ ==

= How does Jetpack Protect help your WordPress Site security? =

Protect is a free WordPress security and malware scanner plugin that scans your site and lets you know possible malware
and security threats on your installed plugins, themes, and core files.

= Does this plugin require the Jetpack plugin to work? =

Jetpack Protect does not require the Jetpack plugin to run and secure your site.

= What are the differences between Jetpack Protect, Jetpack Scan, and WPScan plugins? =

Jetpack Protect and Scan do not have any limit on the number of plugins and themes you can scan. WPScan has a daily cap
based on your API usage.

For now, in Jetpack Protect, you can track your scan results only through the plugin’s dashboard. Jetpack Scan and
WPScan have additional notifications such as email.

Jetpack Protect runs daily automated scans. Jetpack Scan and WPScan provide on-demand scan options on top of automatic
scans.

Jetpack Scan has one-click fixers for most vulnerabilities. Protect does not have any fixers at this time, but it
provides “how-to-fix” guides so that you can fix vulnerabilities manually.

Jetpack Protect and WPScans are standalone plugins that don’t need additional plugins to run, while Jetpack Scan needs
the [Jetpack plugin](https://jetpack.com/) to work.

Jetpack Protect is a free plugin, and WPScan has free and paid options. On the other hand, Jetpack Scan is a paid plugin
that you can purchase with a 14-day money-back guarantee. As with other paid Jetpack plugins, Scan users also have
access to our [priority support](https://jetpack.com/features/security/expert-priority-support/).

= How will I know if Jetpack Protect has found WordPress security vulnerabilities and malware? =

You can visit Jetpack Protect dashboard in your WordPress admin panel to see the security threats and malware found by
the integrated malware scanner.

= What do I do if Jetpack Protect finds a security threat? =

When the malware scanner finds a security threat, you can view the recommended actions on the Jetpack Protect dashboard
to secure your sites.

= Can I set the time of the daily security scan? =

It is not possible to set a time for the automated daily scans run by the integrated malware scanner.

= Why do I need WordPress security and malware scan? =

A hacked WordPress site can cause serious damage to your business revenue and reputation. Jetpack Protect scans your
site and lets you know possible malware and security threats on your installed plugins, themes, and core files.

= Where can I learn more about WordPress security and malware threats? =

To learn how to achieve better WordPress security, [see this guide](https://jetpack.com/blog/guide-to-wordpress-security/).
On the [Jetpack Blog](https://jetpack.com/blog/category/security/), you can find many more articles written by the top
WordPress security experts.

== Screenshots ==

1. Focus on running your business while Jetpack Protect automatically scans your site.
2. Keep your site one step ahead of security threats and malware.
3. View all the found vulnerabilities in your site and learn how to fix them.

== Changelog ==
### 0.1.0 - 2022-05-31
#### Added
- Add additional tracking events
- Add Alert icon to the error admin page
- Add checks to the Site Health page
- Add custom hook to handle viewport sizes via CSS
- Add error message when adding plugin fails
- Add first approach of Interstitial page
- Add Jetpack Scan to promotion section when site doesn't have Security bundle
- Add missing prop-types module dependency
- Add Navigation dropdown mode and use it for small/medium screens
- Add ProductOffer component
- Add product offer component
- Add title and redirect for vul at wpscan
- Add 'get themes' to synced callables in Protect
- Add installedThemes to the initial state
- Add notifications to the menu item and the admin bar
- Add status polling to the Protect admin page.
- Added details to the FAQ question on how Jetpack Protect is different from other Jetpack products.
- Added Jetpack Protect readme file for the plugin listing.
- Added option to display terms of service below product activation button.
- Added Social card to My Jetpack.
- Added the list of installed plugins to the initial state
- Change ConnectScreen by the Interstitial component
- Creates Status Class
- Empty state screen
- Expose and use IconsCard component
- Flush cache on plugin deactivation
- Footer component
- Handle error in the UI
- Hooks on plugin activation and deactivation
- Hook to read data from the initial state
- Implement Footer
- Implement Add Security bundle workflow
- Introduce Accordion component
- Introduce Navigation component
- Introduce Summary component
- Introduce VulnerabilitiesList component
- JS Components: Introduce Alert component. Add error to ProductOffer components
- More options to the testing api responses
- Record admin page-view and get security from footer events
- Render Security component with data provided by wpcom
- Request and expose to the client the Security bundle data
- Update logo

#### Changed
- Add empty state for no vuls
- Add popover at Badge
- Cache empty statuses for a short period of time
- Changed connection screen to the one that does not require a product
- Changed the method used to disconnect
- Changed the wording for the initial screen.
- Change expiration time of plugin cache
- Clean connection data. Update to latest connection API
- Configure Sync to only what we need to sync
- Janitorial: require a more recent version of WordPress now that WP 6.0 is coming out.
- JS Components: Add subTitle prop to ProductOffer component
- JS Components: iterate over Dialog component
- Improve Dialog layout in medium viewport size
- Move VulnerabilitiesList to section hero
- New VulsList
- Redesign Summary component
- Re-implement "Your results will be ready soon" layout
- Re-implement Admin page by using Dialog component
- Remove use of `pnpx` in preparation for pnpm 7.0.
- Replace deprecated external-link variation by using isExternalLink prop
- Require only site level connection
- Truncate items at NavigationGroup
- Tweak footer
- Update Footer and VulsList for small/medium viewport
- Update Navigation to be external controlled
- Update Protect icon
- Update VulnerabilitiesList to remove severity and add fixed in
- Updated package dependencies.
- Update package.json metadata.
- Updates CTA wording to reduce confusion when user already has Jetpack Security Bundle which includes Jetpack Scan
- Update the Status when connection is established
- Use data provided by My Jetpack to render Product offer
- Use weight Button prop to style the "learn more" footer link
- Use a different copy when there are no found vulnerabilities but there are still some unchecked items

#### Removed
- Removed Full Sync from loaded modules as Full Sync Immediately is present by default now

#### Fixed
- Adjust spacing and overflow properties of the navigation labels to improve display of long names.
- Fix Connectino initialization
- Fix fatal when checking whether site site has vuls
- Fix right margin in primary layout
