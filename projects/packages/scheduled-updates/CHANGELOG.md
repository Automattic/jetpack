# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.3.1]: https://github.com/Automattic/scheduled-updates/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/scheduled-updates/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/Automattic/scheduled-updates/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/scheduled-updates/compare/v0.1.0...v0.2.0
