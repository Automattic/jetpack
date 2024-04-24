# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2024-04-22
### Added
- Add a sync option where for scheduled updated. [#36877]
- Populated sync option with results from endpoint. [#36915]
- Scheduled Updates: Added a views link to filter plugins that are part of a scheduled update. [#36880]

### Changed
- Scheduled Updates: Change how we read status and get it from logs directly [#36981]

## [0.7.2] - 2024-04-15
### Changed
- Internal updates.

## [0.7.1] - 2024-04-08
### Fixed
- Delete logs after scheduled update deletion. [#36778]

## [0.7.0] - 2024-04-05
### Changed
- Infer scheduled update status from logs [#36752]

## [0.6.0] - 2024-04-04
### Added
- Add backend infrastructure to log scheduled update events [#36676]
- Add scheduled updates logging endpoints [#36687]

### Fixed
- Force cache cleaning before scheduling a new job. [#36697]
- Store log timestamp as int [#36736]

## [0.5.3] - 2024-04-01
### Changed
- General: update Phan configuration. [#36528]

## [0.5.2] - 2024-03-27
### Changed
- Internal updates.

## [0.5.1] - 2024-03-22
### Fixed
- Fixed a bug where the weekday index was not properly accounted for in list of weekdays. [#36524]
- Transfer status when editing a schedule. [#36521]

## [0.5.0] - 2024-03-20
### Added
- Add a new plugin deletion hook that remove the plugin from the scheduled updates. [#36458]

### Changed
- Scheduled Updates: Update cron event name from jetpack_scheduled_update to jetpack_scheduled_plugins_update [#36427]

## [0.4.1] - 2024-03-18
### Changed
- Internal updates.

## [0.4.0] - 2024-03-15
### Added
- Add scheduled updates option with last statuses. [#36277]

### Changed
- Scheduled Updates: limit plugins up to ten per schedule [#36375]

## [0.3.4] - 2024-03-12
### Fixed
- Fixed a bug where only plugin slugs were send to the update handler instead of full update objects. [#36355]
- Fixed a bug where the cron callback did not accept more than one plugin to update. [#36361]

## [0.3.3] - 2024-03-12
### Fixed
- Fixed a bug where timezone difference where not taken into account when displaying schedule run times in wp-admin. [#36335]

## [0.3.2] - 2024-03-11
### Added
- Added a new endpoint /plugins/capabilities that returns whether we can update plugins. [#36238]
- The plugin list now accounts for all schedules a plugin might be a part of. [#36259]

### Changed
- Sends update requests even if there are no plugins to be updated, so WP.com can keep track of that outcome of a schedule execution. [#36162]

### Fixed
- Fix: add check for wp_unschedule_event return value [#36248]
- Fixed a bug where individual plugin slugs were not actually validated and sanitized. [#36231]
- Fixed a bug where plugin autoupdates were no longer allowlisted after switching away from the jetpack_update_schedules option. [#36292]

## [0.3.1] - 2024-03-05
### Added
- Adds plugins to and removes them from aut-updates when creating and deleting update schedules. [#36125]

### Fixed
- Fixed scheduled updates returning is_managed = true for non-root symlinks to /wordpress directory. [#36170]

## [0.3.0] - 2024-03-04
### Added
- Added a Cron API function to retrieve all events scheduled for a specified hook. [#36071]
- Adds an is_managed key to the wp/v2 sites/%s/plugins API. This key checks if the plugin is managed on Atomic by verifying if it's symlinked. [#36098]

### Changed
- Aligned handling of schedules that can't be found to return the same error messages. [#35963]
- Scheduled Updates: Load API endpoints on WP.com so it works with public-api passthrough. [#35999]
- Scheduled updates: Modified the `allowlist_scheduled_plugins` function to check scheduled update requests.
- Change the `allowlist_scheduled_plugins` function to include a check for the `SCHEDULED_AUTOUPDATE` constant. This allows us to identify requests coming from scheduled updates and include the relevant plugins when the `auto_update_plugin` hook is triggered. [#35941]

### Fixed
- Moved schedule validation into its own callbacks so permission callbacks just check permissions. [#36130]

## [0.2.1] - 2024-02-27
### Changed
- Internal updates.

## [0.2.0] - 2024-02-26
### Added
- Show schedule information for scheduled plugin updates in wp-admin [#35917]

### Changed
- Fix up cron callback and schedule generation to make schedule execution work [#35885]

## 0.1.0 - 2024-02-26
### Added
- Generate initial package for Scheduled Updates [#35796]

[0.8.0]: https://github.com/Automattic/scheduled-updates/compare/v0.7.2...v0.8.0
[0.7.2]: https://github.com/Automattic/scheduled-updates/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/Automattic/scheduled-updates/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/Automattic/scheduled-updates/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/Automattic/scheduled-updates/compare/v0.5.3...v0.6.0
[0.5.3]: https://github.com/Automattic/scheduled-updates/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/Automattic/scheduled-updates/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/Automattic/scheduled-updates/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/scheduled-updates/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/Automattic/scheduled-updates/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/Automattic/scheduled-updates/compare/v0.3.4...v0.4.0
[0.3.4]: https://github.com/Automattic/scheduled-updates/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/Automattic/scheduled-updates/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/Automattic/scheduled-updates/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/Automattic/scheduled-updates/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/scheduled-updates/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/Automattic/scheduled-updates/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/scheduled-updates/compare/v0.1.0...v0.2.0
