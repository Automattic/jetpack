# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## 1.5 - 2023-03-22
### Added
- Added request and update video poster functionality
- Added label and help properties support for the TimestampControl component
- Added basic upload functionality to mobile app block version
- Added details panel to mobile app block's settings
- Added check to remove tracks from previous video after replacement on block

### Changed
- Indicated full compatibility with the latest version of WordPress, 6.2.
- Updated deprecated core prop
- Replaced loading placeholder
- Updated package dependencies

### Fixed
- Fixed video details form change detection
- Fixed race condition when saving the post too fast after uploading a video
- Fixed video library displaying arbitrary video in first page
- Fixed opening upload options automatically when  block is inserted from the block inserter menu (mobile)
- Fixed handling failed uploads on VideoPress block

## 1.4.0 - 2023-02-15
### Added
- Added connect banner to video block when required
- Added Share and Download sections to the video details page
- Added site default privacy in video block privacy control
- Added manual conversion panel to video block sidebar
- Added Preload Metadata control to the video block Playback panel

### Changed
- Updated package dependencies
- Updated video block transform to/from embed block
- Updated layout of video block when uploading a new file
- Updated videos gallery rendering with page and search parameters
- Updated chapters parser limitations
- Updated data request of private videos
- Updated the request handling when a user is not connected

### Removed
- Removed prompt to convert embed block to video block

### Fixed
- Fixed adding videos from the WordPress.com media library
- Fixed minor visual issues of the video block
- Fixed uploading video tracks for private videos
- Fixed error when local videos cannot be read
- Fixed block visualization for private videos
- Fixed custom CSS classes removed issue

## 1.3.0 - 2023-01-18
### Added
- Added Replace Control to the block
- Added anchor support to the block
- Added rating selector on video details edit page
- Added "publish first video" popover
- Added embed block transform from/to video block
- Added "Show video sharing menu" control to VideoPress block
- Added VideoPress shortcode
- Added privacy to the edit details page

### Changed
- Updated no video dashboard UI
- Updated footer of the uploader component
- Enhanced behavior when deleting multiple videos
- Filtered the video fields that re-render the player when changed

### Removed
- Removed src/client files from the final bundle
- Removed video chapters block

### Fixed
- Fixed layout visual issues
- Fixed issues when setting the video block video from the media library
- Fixed video attributes not being cleaned when replacing a video file
- Fixed duplicate uploads when replacing a video
- Fixed local videos listed as VideoPress videos
- Fixed player not rendering once file uploads
- Fixed title and description rendering on the block
- Fixed exception when deleting the last video of the page

## 1.2.1 - 2023-01-18
### Changed
- Updated package dependencies.

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
