# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.2.0 - 2022-12-05
### Added
- Added a static image for when the block acts as an example in Editor inserter.
- Added example image to the dynamic colors panel.
- Implemented tracks control implementation.

### Changed
- Updated tracks icon.
- We now include videos with Site Default privacy setting on the search results.

### Removed
- Removeed caption field from edit page.

### Fixed
- Fixed handling of chapters edition which previously overwrote existing video track file.
- Fixed issue where video meta could not be saved on a WP.com simple site.
- Fixed the thumbnail selection to allow selecting the last frame of the video.
- Fixed video block conversion from core/video.

## 1.2.0-beta - 2022-12-02
### Added
- Added a static image for when the block acts as an example in Editor inserter.
- Added example image to the dynamic colors panel.
- Implemented tracks control implementation.

### Changed
- Updated tracks icon.
- We now include videos with Site Default privacy setting on the search results.

### Removed
- Removeed caption field from edit page.

### Fixed
- Fixed handling of chapters edition which previously overwrote existing video track file.
- Fixed issue where video meta could not be saved on a WP.com simple site.
- Fixed the thumbnail selection to allow selecting the last frame of the video.
- Fixed video block conversion from core/video.

## 1.1.0 - 2022-11-22
### Added
- Added Download, Details, Privacy, Rating and Dimensions panel to block.
- Added file drop support also after first video on admin page.
- Added rating control to the block's admin page details panel.
- Added thumbnail selection from video frame on quick action and in edit details view for the admin page.
- Added VideoPress feedback link to the VideoPress block.

### Changed
- Allowed keyboard navigation on video quick actions.
- Renamed "Match video title" setting for "Dynamic color" in block settings panel.
- Updated Color Panel on block.

### Fixed
- Added Site Settings section for controlling site-wide privacy for videos.
- Fixed an issue with private VideoPress videos timing out when script loading is delayed.
- Fixed issue when setting video privacy.
- Fixed recognition of Jetpack Complete plan.
- Introduced a static list of video extensions allowed on VideoPress.
- Mitigated video re-rendering flicker.

## 1.0.0 - 2022-10-25
### Added
- Initial release.
