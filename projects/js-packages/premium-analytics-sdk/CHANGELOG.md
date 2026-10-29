# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.6.1 - 2026-10-28
### Added
- Declare the period starts a report result carries, for pairing comparison buckets by period. [#53965]

## 0.6.0 - 2026-10-26
### Added
- Add the `refreshNotice` option to the `useReport` types, to keep a failed refresh out of the stale-data notice. [#54017]
- Add useReportActions: a widget declares its View all link and CSV download, and the dashboard renders them in the card footer. [#53881]
- Declare the Button, ButtonLink, Progress, Text and VisuallyHidden primitives a widget renders. [#53887]
- Support React 19. [#53882]

### Removed
- Remove WidgetFooter, ReportLink and ExporterCsvDownloadButton; a widget declares its footer with useReportActions. Widget contract 2.0.0. [#53885]

## 0.5.0 - 2026-10-19
### Added
- Add stated totals to the Donut props. [#53707]
- Add `Columns`, the kind for a few categories compared across the periods as vertical bars. [#53476]
- Add `Locations`, the kind that lists a ranking of places beside the map that draws them. [#53534]
- Declare the optional chart title of the Columns, Donut, Funnel and Locations components, which names their charts for screen readers. [#53333]

### Changed
- Declare the optional action of a widget empty state. [#53411]
- Declare the option that opens a widget empty state link in a new tab. [#53541]

## 0.4.0 - 2026-10-12
### Added
- Add the `half-ring` variant of `Donut`, the breakdown drawn as a semi-circle, and its `withTotal` switch. [#53429]
- Add `Funnel`, the funnel kind: steps as counts in, the rate of the whole, the shares and the states out. [#53461]
- Declare the Donut component with its props, and WidgetStatus, the request status every widget kind takes. [#53309]
- Leaderboard: add the bars variant, which lays the label above the bar and draws both periods as bars under a period legend. [#53398]

### Changed
- Declare the optional title of a widget state error. [#53352]

### Removed
- Remove `chartTypeAttributeField`: a widget declares the chart type attribute as a `jpa/toggle-group` field, and the README lists the field types the dashboard registers. [#53313]

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
