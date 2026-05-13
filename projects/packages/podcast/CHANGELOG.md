# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 - 2026-05-11
### Added
- Add initial package gated behind the `jetpack_podcast_untangle` filter. [#48556]
- Dashboard: Add an empty wp-build dashboard scaffold and the "Jetpack > Podcast" wp-admin entry. [#48557]
- Dashboard: Fill in the four tab panels: Welcome onboarding, Settings form, Episodes list, and Distribution submission flow. [#48667]
- Feed: Register `<itunes:*>` / `<googleplay:*>` channel and item tags, podcatcher detection, and stats-tracked enclosure URLs for the configured podcast category. [#48658]
- Settings: Register the `podcasting_*` option schema with REST exposure and Jetpack Sync opt-in. [#48597]
- Tracks: Record podcast publishing, media uploads, status changes, podcatcher show-URL submissions, and settings saves. [#48665]

### Changed
- Dashboard: Replace the wp-build placeholder with page chrome and tab navigation. [#48559]
- Dashboard: Slim down wp-build wiring to the Backup pattern. [#48600]
