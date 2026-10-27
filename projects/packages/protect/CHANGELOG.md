# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Update package dependencies. [#53004]
- Update package dependencies. [#53806]

## 0.1.0 - 2026-10-12
### Added
- Add the Protect dashboard page. [#53182]
- Add the Scan section to the Protect dashboard: review threats in a table with a details sidebar, run on-demand scans, and fix, ignore, or unignore threats. [#53195]
- Add the tabbed layout and section framework to the Protect dashboard. [#53190]
- Initial version. [#53298]
- Protect dashboard: Add a Scan history tab for sites with Jetpack Scan, show threat actions on row hover, and offer to delete unused plugins and themes that have threats. [#53196]

[0.3.0]: https://github.com/Automattic/jetpack-protect/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-protect/compare/v0.1.0...v0.2.0
