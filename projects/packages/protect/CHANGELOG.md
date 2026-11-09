# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-11-09
### Added
- Scan: View the whole file a threat was found in, with the flagged lines highlighted and what the file belongs to, and delete a stray file or restore a changed WordPress core file from there. [#54570]

### Changed
- Dashboard: Refresh the Firewall block counts while the page is open and after the firewall is turned on, without a reload. [#54570]
- List the selected threats a bulk Auto-fix leaves out, since each needs its own confirmation. [#54570]
- Protect Dashboard: Redesign the Firewall card, with what to do next before it blocks anything and its 30-day and all-time block counts once it does. [#54570]
- Say "Jetpack can fix this threat" in threat details, and refer to the Protect page rather than the Protect dashboard in loading errors. [#54592]
- Update dependencies. [#54497]
- Update package dependencies. [#54512]

### Fixed
- Ask for confirmation before Auto-fix updates a plugin or theme, naming the version it updates to. [#54443]
- Dashboard: Accept a plugin or theme slug with surrounding spaces when confirming an auto-fix that deletes it, and disable Confirm deletion in the threat list while another action runs on the threat. [#54570]
- Dashboard: Don't label vulnerabilities from the free check as Low severity when their severity is unknown. [#54442]
- Dashboard: Explain on the Settings tab why account protection is unavailable, as the Overview does. [#54570]
- Dashboard: Explain on the Settings tab why login protection is unavailable, as the Overview does. [#54570]
- Dashboard: Reload the threat lists after an ignore or unignore fails, so the page shows what WordPress.com applied. [#54570]
- Dashboard: Show a dash instead of an empty cell for a threat with no detection date or severity, as from the free vulnerability check. [#54437]
- Downtime monitoring: Require a connected WordPress.com account before it can be turned on, and stop saying the site is monitored when no one will get alerts. [#54441]
- Report a site that hasn't been scanned yet as not scanned, and a failed scan with no results as scan failed, in page view analytics, rather than as active or in progress. [#54594]
- Scan: Advise removing a vulnerable plugin or theme, or updating WordPress, when no fixed version exists yet, instead of reviewing its code. [#54570]
- Scan: Keep a threat you fixed hidden after a scan that failed, until a scan completes. [#54570]
- Scan: Offer a first scan instead of showing "Scanning…" forever when WordPress.com has no scan on record. [#54439]
- Scan: Report a slow but successful ignore or unignore as done, and refresh the ignored threats list right after either. [#54444]
- Scan: Say when the last scan didn't complete while listing threats from an earlier scan. [#54570]
- Scan: Sort a threat with no severity just above Low instead of below it. [#54596]
- Show one action, Auto-fix, for a threat whose fix deletes the plugin or theme, instead of a separate Delete button beside it. [#54570]

## [0.5.0] - 2026-11-02
### Added
- Dashboard: Show the email address downtime monitoring alerts go to on the Settings tab. [#54300]

### Changed
- Dashboard: Refresh the Scan card with a last-scan badge, a live countdown to the next automatic scan, and a shorter upgrade tooltip. [#54077]
- Dashboard: Remove the next-scan countdown from the Scan card and the Scan site button. [#54308]
- Hide the threat count from the menu when the host turns off threat notifications. [#53983]
- Protect Dashboard: Drop the "Jetpack" breadcrumb from the page header, to match other feature pages. [#54239]
- Update package dependencies. [#53869]

### Fixed
- Dashboard: Balance the line breaks in the upgrade cards so no single word sits alone on a line. [#54298]
- Dashboard: Hide the next-scan countdown on paid Scan plans, which have no daily scan limit. [#54294]
- Dashboard: Show the same address format hint under both IP allow list fields on the Settings tab. [#54297]
- Dashboard: Stop logging a missing jetpackConfig error to the console on every load. [#54301]
- Dashboard: Update the menu badge and admin bar threat count as soon as threats are fixed, ignored, or deleted. [#54253]
- Protect dashboard: Ask for the plugin or theme slug before an auto-fix deletes it, and warn when it is active or not on WordPress.org. [#54080]
- Scan: Hide the server credentials link on WoA sites, which don't need them. [#54270]
- Scan: Show that the last scan didn't complete instead of saying no threats were found. [#54295]

## [0.4.0] - 2026-10-28
### Added
- Dashboard: Show the table, row and values a database threat was found in, and delete a flagged option in place. [#54073]
- Firewall: Show the firewall as active where the host provides its own. [#53954]
- Scan: Add a `jetpack_protect_threat_ignoring_enabled` filter, and hide the Ignore action where a host turns it off. [#53984]
- Scan: Let a host change where the Scan upgrade link goes, through the `jetpack_feature_upgrade` filter. [#54068]

### Changed
- Firewall: Refuse to save a block list that includes your own IP address. [#54122]
- Protect dashboard: Point the Settings tab's Scan card at the server credentials Auto-fix needs, instead of a Jetpack Cloud page with no Scan settings. [#53985]
- Protect dashboard: Show the uptime percentage next to the Downtime monitoring status, and drop the perfect uptime badge. [#54081]

### Fixed
- Dashboard: Fix the History tab's Fixed/Ignored switch for screen readers. [#54110]

## [0.3.0] - 2026-10-26
### Added
- Dashboard: Add search, filters, view options, and bulk Auto-fix and Ignore to the Scan card's threat list, under a heading that collapses it, with each threat on one line beside its severity. [#54055]
- Dashboard: Record Tracks events for page views, Scan now, opening and acting on threats, the threat tables, the Get Scan and Monitor connect links, and the security settings. [#54055]
- Dashboard: Show requests blocked today and in the last 30 days, and when the automatic firewall rules were last updated, on the Firewall card. [#53822]
- Dashboard: Show whether the firewall runs in standalone mode and how to set it up on the Firewall settings card, and explain firewall file and rules errors in plain words. [#53823]
- Protect Dashboard: Add a Scan now button to the page header and show when the site was last scanned. [#53898]
- Protect dashboard: Add a threat report page that shows the threats a link names, grouped into ones that need attention, fixed, ignored and no longer detected. [#53693]
- Protect dashboard: Open the Settings tab at a section's card from a link, and point the Configure links of Jetpack's security modules at their card. [#53743]
- Protect dashboard: Show what Scan adds on the Scan and Firewall cards for sites without it, with an Upgrade button. [#53896]

### Changed
- Dashboard: Animate the safe-state shield, with a particle burst when a scan finishes clean. [#53886]
- Dashboard: Explain what the History tab's Fixed and Ignored lists will show when they are empty. [#53997]
- Dashboard: Keep the Scan card the same height while a scan runs, after a clean scan, and when threats are found, with a smaller shield. [#54055]
- Dashboard: Redesign the Login protection card with toggles for account protection and Secure Sign On. [#53739]
- Dashboard: Rename brute force protection to Login protection on the Overview and Settings tabs. [#54055]
- Dashboard: Shorten the Scan card's all-clear after a clean scan to a title and one line, and start scans from the page header instead of the card. [#54055]
- Dashboard: Show the View, Auto-fix and Unignore buttons in threat lists without hovering. [#54055]
- Give the Firewall card a shield with a flame icon, so it no longer shares the Scan card's shield. [#53961]
- Name Offline Mode as it is named across the rest of Jetpack. [#54034]
- Protect Dashboard: Show a "Jetpack / Protect" breadcrumb in the page header, and rename its Scan now button to Scan site. [#54055]
- Protect dashboard: Simplify the Firewall card to a Run test button, the requests blocked in the last 30 days with a View log button, and one row of links to the IP lists and settings. [#54055]
- Protect dashboard: Stop calling a site without a Scan plan safe when no known vulnerabilities are found. [#53802]
- Protect dashboard: Title the Scan card "Scan results" and show when the site was last scanned in a badge beside the title. [#54055]

### Fixed
- Protect dashboard: Show that a threat is being fixed in its row of the threats list, and hide the row's other actions until the fix finishes. [#54055]
- Protect dashboard: Show why Scan now failed when WordPress.com declines to start a scan, instead of showing a scan that never runs. [#53803]

## [0.2.0] - 2026-10-19
### Added
- Add the Firewall section to the Protect dashboard, with blocked-request totals, recently blocked requests, manual IP rules, a firewall test and firewall settings. [#53193]
- Add the Login protection section to the Protect dashboard, covering brute force protection, account protection and WordPress.com login. [#53192]
- Add the Monitor section to the Protect dashboard, with 40 days of uptime and its settings. [#53194]
- Dashboard: Show the number of threats next to the Protect menu item without delaying page loads, and a red alert icon on the Scan card when there are threats. [#53566]

### Changed
- Dashboard: Show the Settings tab in the 660px column used by the other Jetpack settings screens. [#53606]
- Include the upstream status and error in the uptime route's failure response, so a timeout, a 401, and a 500 can be told apart. [#53383]
- Protect dashboard: Delete unused plugins and themes without leaving the page, step through threats with the arrow keys, show a placeholder while Scan history loads, close threat details when switching tabs, name the threat in each notice, show threats on two lines with a narrower Severity column, show whether the affected plugin or theme is active, keep the threat actions at the bottom of the sidebar, and keep Scan progress and error notices until they are dismissed, with a View button that opens the threat while an action runs. [#53439]
- Protect dashboard: Tell the Monitor card's failures apart, with a link to connect a WordPress.com account and a way to retry. [#53382]
- Show the Downtime monitoring card with an uptime percentage, per-day tooltips, and an on/off toggle like the Firewall card. [#53740]
- Update package dependencies. [#53004] [#53806]

## 0.1.0 - 2026-10-12
### Added
- Add the Protect dashboard page. [#53182]
- Add the Scan section to the Protect dashboard: review threats in a table with a details sidebar, run on-demand scans, and fix, ignore, or unignore threats. [#53195]
- Add the tabbed layout and section framework to the Protect dashboard. [#53190]
- Initial version. [#53298]
- Protect dashboard: Add a Scan history tab for sites with Jetpack Scan, show threat actions on row hover, and offer to delete unused plugins and themes that have threats. [#53196]

[0.6.0]: https://github.com/Automattic/jetpack-protect/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/Automattic/jetpack-protect/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-protect/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Automattic/jetpack-protect/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-protect/compare/v0.1.0...v0.2.0
