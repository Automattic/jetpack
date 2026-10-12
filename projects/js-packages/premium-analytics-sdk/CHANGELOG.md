# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.3.0 - 2026-10-07
### Added
- Declare the video poster URL helper. [#53011]
- Declare `useReport`, which runs a report query and its comparison in the dashboard query client, and `toBucketStamp`, which writes the bounds of a report row as the dashboard time series read them. [#53234]

### Changed
- Declare `useReport` with the types it has, so the report hooks built on it keep their response types. [#53281]

## 0.2.0 - 2026-10-05
### Added
- Declare the CSV download action of the linked report. [#52909]
- Declare the Leaderboard component, the error mapper and the video plays hook. [#52885]

## 0.1.0 - 2026-09-28
### Added
- Add TypeScript types for the SDK the Premium Analytics dashboard provides to plugins that extend it. [#52635]
