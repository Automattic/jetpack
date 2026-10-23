# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.2.0]: https://github.com/Automattic/jetpack-protect/compare/v0.1.0...v0.2.0
