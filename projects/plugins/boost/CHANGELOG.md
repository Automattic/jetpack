# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2021-08-12
### Added
- Critical CSS: Added a new Advanced Critical CSS recommendations page.

### Changed
- Critical CSS: Updated error reporting for Critical CSS to offer more users more guidance.
- Tooling: Moved all development to the Jetpack monorepo.
- Boost is now compatible with WordPress 5.8.

### Fixed
- Tooling: Fix PHP unit testing dependency on later versions of PHP.
- Critical CSS: Ensure generator library uses cache-busting to load the latest version after updates.

## 1.1.0 - 2021-06-17

- Update: User connection is no longer required for Speed Scores.
- Update: Completely revamped how site speed scores are retreived.
- Update: Reduced backend dashboard JavaScript bundle size.
- Update: Added a message to explain how site score is calculated.
- Update: Added "Offline Mode" to allow testing Jetpack Boost on local environments easily.
- Update: Improved error handling and the error messages provided.
- Update: Improved Critical CSS Generation stability.
- Update: Remove animations from Critical CSS.
- Fix: Incompatibility with UsersWP and similar plugins that might introduce redirects during Critical CSS Generation.

## 1.0.6 - 2021-05-25

- Fix: Failed to execute 'json' errors
- Fix: Connection UI Border issues
- Update: Improve Jetpack compatibility
- Update: Improve Critical CSS Compatibility with caching and minification plugins
- Update: Clean up JavaScript dependencies

## 1.0.5 - 2021-05-13

- Fixed: Defer JavaScript compatibility with XML Requests

## 1.0.4 - 2021-05-06

- Fixed: Web Stories compatibility
- Improved: "Defer Non-Essential Javascript" module compatibility with other plugins

## 1.0.3 - 2021-04-26

- Updated: Support for AMP Plugin 2.0+
- Updated: No longer defer JavaScript on POST, AJAX, Cron requests and sitemaps.

## 1.0.2 - 2021-04-22

- Improved: HTML Media tag handling
- Fixed: Metrics timeout caused by caching in the REST API

## 1.0.1 - 2021-04-20

- Fixed: An issue where the connection iframe would sometimes break
- Updated: On connection: showing an XML RPC Error instead of HTTP 500 when XML-RPC is disabled

## 1.0.0 - 2021-04-19

- This update brings a lot of stability improvements.
- We've been hard at work to get here and Jetpack Boost v1.0.0 is finally here! 🎉

## 0.9.19 - 2021-03-19

- We've refactored the plugin quite a bit, starting from the UI to stability fixes.

## 0.9.1 - 2020-12-29

- First public alpha release

[1.2.0]: https://github.com/Automattic/jetpack-boost-production/compare/v1.1.0...v1.2.0-beta
