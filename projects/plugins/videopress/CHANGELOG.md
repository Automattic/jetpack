# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## 2.3 - 2025-04-07
### Added
- Add Account Protection initialization. [#40925]
- Add title to the attachment details view. [#42023]
- Connection: Disconnect all other users before disconnecting connection owner account. [#41923]
- Replace video embed with VideoPress block in Media & Text block. [#42522]
- Improve the onboarding experience of Jetpack guiding the users through a new onboarding process. [#42757]
- My Jetpack: Introduce a new onboarding screen to provide clear, step-by-step instructions for new users connecting to Jetpack. [#42523]

### Changed
- Code: Use function-style `exit()` and `die()` with a default status code of 0. [#41167]
- Connection: Allow pre-selected login providers. [#42662]
- Connection: Display connection status on Users page independent of the SSO module. [#41794]
- External Media: Move GooglePhotosMedia, OpenverseMedia, and PexelsMedia to `@automattic/jetpack-shared-extension-utils`. [#41078]
- General: Indicate compatibility with WordPress 6.8. [#42701]
- Update composer.lock [#40863]
- Update package dependencies. [#40980] [#41099] [#41286] [#41491] [#42163] [#42180] [#42384] [#42511] [#42809] [#42815]
- Update the unowned section from a product grid to a product list. [#41312]

### Fixed
- Components: Prevent deprecation notices by adding `__next40pxDefaultSize` to controls. [#42576]
- Ensure all files are uploaded when drag-and-dropped into editor. [#42312]
- Fix issue with VideoPress block with 0 height and width. [#41319]
- Ensure undo function works. [#42332]

## 2.2 - 2025-01-10
### Added
- Add tracks for connection banner. [#39732]
- My Jetpack: Update the recommendations section in My Jetpack to include a slider interaction for the cards. [#39850]

### Changed
- General: Indicate compatibility with the upcoming version of WordPress - 6.7. [#39786]
- Include `wp-polyfill` as a script dependency only when needed. [#39629]
- Resolve an issue where revoked licenses were incorrectly treated as unattached. This caused users to be redirected to the license activation page after site connection, even when unattached licenses were not valid for activation. [#40215]
- Social: Change My Jetpack CTA for Social from "Learn more" to "Activate". [#40359]
- Updated dependencies. [#40286]
- Updated package dependencies. [#39288] [#39302] [#39594] [#39653] [#39707] [#39999] [#40060] [#40116] [#40288] [#40363] [#40515] [#40564] [#40693] [#40815]

### Removed
- Connection: Remove deprecated `features_available` method. [#39442]
- Connection: Remove deprecated `features_enabled` method. [#39475]
- General: Update minimum PHP version to 7.2. [#40147]
- General: Update minimum WordPress version to 6.6. [#40146]

### Fixed
- E2E Tests: Only install single browser used by Playwright. [#40827]
- My Jetpack: Update GlobalNotice component to look better on mobile. [#39537]

## 2.1 - 2024-09-06
### Changed
- Internal updates.

## 2.0 - 2024-09-05
### Changed
- General: Dependency updates. [#38942] [#38822] [#39004] [#39111] [#39176]

## 1.9 - 2024-08-15
### Changed
- General: indicate compatibility with the upcoming version of WordPress - 6.6.
- Updated package dependencies.

### Removed
- General: update WordPress version requirements to WordPress 6.5.

### Fixed
- Updated package dependencies.

## 1.8 - 2024-05-22
### Added
- Trigger a red bubble notification when a bad plugin install is detected.

### Changed
- Updated WordPRess tested version to 6.5.
- Updated minimum WordPress version requirement to WordPress 6.4.
- Switched to wp_admin_notice function to display notices.
- Updated to show installation errors only on the plugins page.

## 1.7 - 2023-11-21
### Changed
- Updated WordPress tested version to 6.4.
- Updated minimum WordPress version requirement to WordPress 6.3.
- Updated minimum PHP version requirement to PHP 7.0.

## 1.6-beta - 2023-10-17
### Added
- Added Divi Builder Compatibility.
- Added play button when the video block Show controls and Preview On Hover are enabled.
- Pick video block attributes from URL when pasting/inserting.
- Integrated video poster with Preview On Hover effect.

### Changed
- Indicate full compatibility with WordPress 6.3
- Updated WordPress version requirement to WordPress 6.2
- Made the Jetpack menu item default to point to My Jetpack.
- Hide core Video and embed VideoPress variations, when video block is available.
- Improved the connection prompt when the Jetpack VideoPress module is not active.
- Changed max duration of the Preview On Hover effect to ten seconds.
- Support autoplay playback option when Preview On Hover is enabled.
- Render VideoPress video block 100% dynamically instead of saving html representation.
- Video block: Create VideoPress video block when pasting URLs.
- Video block: Stopped saving HTML markup representation.
- Video block: Added Privacy and Rating panel to native block's settings.
- Video block: Added replace functionality for the native version of the block.
- Video block: Handle uploading video files when dropping in the editor canvas.

### Security
- Escape VideoPress attributes poster, and anchor when rendering block.

### Fixed
- Added a Notice when trying to edit a video that doesn't belong to the site.
- Added error handling for track files upload process.
- Handle block registration in the REST API request context.
- Defer assets enqueuing for non block themes so they don't load on every page.
- Enqueue token bridge file in the front-end only when required.
- Ensure the appropriate scripts are enqueued to support private VideoPress videos rendered by the VideoPress Divi module.
- Set video player position according to "starting point" and "duration".
- Avoid conflicts with Better Click To Tweet plugin.
- Fixed compatibility with Timber theme.
- Fixed false values not working on shortcodes.
- Fixed issue with disabled Privacy and rating panel.
- Fixed JITM layout on video edit page.
- Fixed playing state of poster mini-player.
- Fixed playback of private videos on private sites.
- Video block: Fixed blocking state when stopping an upload.

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
