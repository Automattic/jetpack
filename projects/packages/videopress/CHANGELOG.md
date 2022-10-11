# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2022-10-05
### Added
- Add the new connection error message to VideoPress. [#26579]
- VideoPress:
    - Request Product data not tied to the site
    - Expose that data to the client
    - Use them to show the price in the UI [#26538]
- VideoPress: Add loading state for dashboard [#26542]
- VideoPress: add PricingSection component [#26514]
- VideoPress: add storage meter to the Admin page [#26475]
- VideoPress: add videos stats endpoint. [#26496]
- VideoPress: connect the user from the Pricing section [#26517]
- VideoPress: do not perform async request to get videos in the first rendering [#26560]
- VideoPress: Loding mode in EditVideoDetails [#26493]
- VideoPress: Provide the list of allowed video extensions on the client initial state, fetching it from the site `get_allowed_mime_types()` list. [#26537]
- VideoPress: register the deleting video state [#26506]
- VideoPress: send initial state to the client [#26548]

### Changed
- Updated package dependencies. [#26457]
- VideoPress: Add quick actions on VideoRow for mobile [#26534]
- VideoPress: Adds the caption as a possible field on the video meta update endpoint and set the attachment post_excerpt and meta fields with it's value. [#26455]
- VideoPress: Fix filters mobile layout on dashboard library [#26518]
- VideoPress: Fix mobile style on dashboard library [#26515]
- VideoPress: Fix video edit header on mobile [#26529]
- VideoPress: Mobile layout for VideoCard component [#26491]
- VideoPress: Move upload-jwt to wpcom/v2 namespace [#26559]
- VideoPress: refresh video list right after a video is removed [#26607]

### Fixed
- Components: fix the positio of TOS component of the PricingTable cmp [#26509]
- VideoPress: Add a check for video url before rendering VideoPress block [#26578]
- VideoPress: Add thumbnail selection on video quick actions [#26612]
- VideoPress: Allows empty caption and description values so it's possible to save empty fields from the frontend. [#26564]
- VideoPress: Allows empty title value so it's possible to save empty fields from the frontend. [#26615]
- VideoPress: fix bug when deleting videos [#26553]
- VideoPress: fix current privavy of the video in the UI [#26591]
- VideoPress: fix Maximum update depth exceeded warning triggered from the useVideoDetails() hook [#26582]
- VideoPress: fix showing product price at the very first rendering [#26586]
- VideoPress: Remove button for adding new video when user cannot upload more videos [#26625]
- VideoPress: restore pagination section [#26576]
- VideoPress: Update video count on videos fetch [#26628]

## [0.4.1] - 2022-09-27
### Added
- VideoPress: add contextual upgrade trigger to dashboard. [#26403]
- VideoPress: add placeholder component. [#26478]
- VideoPress: add poster endpoint. [#26291]
- VideoPress: add sub actions to VideoQuickActions component. [#26378]
- VideoPress: add updateVideoPrivacy() action. [#26380]
- VideoPress: add uploaded video count fetch functions. [#26368]
- VideoPress: add upload jwt endpoint. [#26406]
- VideoPress: be able to remove video from the UI. [#26439]
- VideoPress: expose and store more video data. [#26369]
- VideoPress: included raw video caption on the jetpack_videopress field from the media details endpoint. [#26409]
- VideoPress: link search input load state to videos fetch state on dashboard. [#26382]
- VideoPress: set video privacy from Video Grid / dashboard. [#26405]
- VideoPress: support selecting poster by frame. [#26317]
- VideoPress: upload video from dashboard. [#26461]

### Changed
- Updated package dependencies.
- VideoPress: add file extension filter on file selection. [#26454]
- VideoPress: add VideoUploadArea component for first use screen. [#26333]
- VideoPress: hide pagination when there are less than two pages. [#26383]
- VideoPress: hit wp/v2/media to request videos data. [#26318]
- VideoPress: make Pagination work with trully data. [#26326]
- VideoPress: resolve addVideo() selector. [#26331]

### Fixed
- Set the right mapping for the caption field, relying on the new jetpack_videopress.caption raw information. [#26440]
- Set the right source for the total of videos counter on the VideoPress library page. [#26365]
- StoryBook: fix nonexistent pkg bug. [#26407]
- VideoPress: fix printing the upload video date. [#26332]
- VideoPress: fix SearchInput clear and initial typing behavior on dashboard. [#26363]
- VideoPress: fix updating the store when editing video data. [#26352]

## [0.4.0] - 2022-09-20
### Added
- VideoPress: implement filter section UI in the dashboard [#26169]
- VideoPress: Load real data at Edit Details page [#26211]
- VideoPress: sync video `description` value [#26235]
- VideoPress: update post title and content via the /videopress/meta endpoint [#26256]
- VideoPress: Update title, description and caption at backend [#26240]

### Changed
- Updated package dependencies.
- VideoPress: expose title and description in jetpack_videopress endpoint response body [#26228]
- VideoPress: sanitize the videopress description field like a textarea [#26242]
- VideoPress: Support endAdornment in Input [#26206]

### Removed
- VideoPress: Remove chapter extraction helper function [#26209]

## [0.3.1] - 2022-09-13
### Added
- VideoPress: add onSearch() prop to SearchInput component. [#26128]
- VideoPress: add video chapters extraction helper function. [#26181]
- VideoPress: introduce FilterButton component. [#26155]
- VideoPress: introduce minimal Edit Details page. [#26150]
- VideoPress: moved jetpack_videopress REST custom field to VideoPress package. [#26140]
- VideoPress: search videos when typing on the Search component. [#26139]
- VideoPress: support type, size and label in input. [#26127]

### Changed
- Updated package dependencies. [#26176]
- VideoPress: Extract VideoDetails and VideoThumbnail from VideoCard. [#26148, 26149]
- VideoPress: fix library titles. [#26145]
- VideoPress: fix styles, add loading state and clear icon to input component. [#26158]
- VideoPress: handle how the VideoCard looks when no data is provided. [#26124]

### Fixed
- VideoPress: remove white space in VP Logo. [#26121]

## [0.3.0] - 2022-09-08
### Added
- Added for videopress videos in the media selector [#25969]
- Migrating Media Library UI snippets to pkg [#25877]
- VideoPress: Add Input and SearchInput components [#25966]
- VideoPress: add query object to the getVideos() selector [#26074]
- VideoPress: Add register_videopress_blocks() method to register all VideoPress blocks [#25901]
- VideoPress: add VideoCard component [#25992]
- VideoPress: add VideosGrid component. First approach. [#25996]
- VideoPress: Add VideoStatsGroup component [#25998]
- VideoPress: Add VideoStorageMeter component [#25936]
- VideoPress: Alpha admin page [#25905]
- VideoPress: connect data with the client app [#26073]
- VideoPress: extend the media endpoint with the jetpack_videopress_guid field [#26043]
- VideoPress: first approach of data handling [#26067]
- VideoPress: implement quick actions in the VideoCard component [#26010]
- VideoPress: Introduce VideoList component [#25898]
- VideoPress Block: allow editing of some block settings while uploading. [#24556]

### Changed
- Change VideoPress into a Hybrid product in My Jetpack [#25954]
- Require user connection to upload video [#25962]
- Updated package dependencies.
- VideoPress: Improve feedback for upload/previewing [#25952]
- VideoPress: Introduce VideoQuickActions [#26016]
- VideoPress: iterate over VideoThumbnailEdit component [#25956]
- VideoPress: rename VideosGrid component to VideoGrid [#26008]
- VideoPress: set VideoThumbnail aspect ratio. Improve stories. [#25981]
- VideoPress: split up VideoDetailsCard into two new components [#25895]
- VideoPress: Support enable and disable columns and actions at VideoRow/VideoList [#25968]

### Fixed
- Ensure passed args are integer in TUS File class [#26026]

## [0.2.1] - 2022-08-30
### Added
- Upload from Media Library in the block [#25792]
- VideoPress: Add edit dropdown menu to the VideoDetailsCard component [#25817]
- VideoPress: add Logo component [#25875]
- VideoPress: Add minColumns prop to pagination component [#25876]
- VideoPress: Add Pagination component [#25871]
- VideoPress: Introduce Checkbox component [#25893]
- Videopress: Introduce VideoRow component [#25798]
- VideoPress: minor ClipboardButtonInput story enhancement [#25808]
- VideoPress: Support edit from upload [#25849]
- VideoPress: Wrap app with ThemeProvider [#25869]
- VideoPress pkg: Add VideoDetailsCard component [#25731]
- VideoPress plugin hijacks video attachment edit page [#25732]

### Changed
- Updated package dependencies. [#25694]
- Updated package dependencies. [#25814]
- VideoPress: Fix dropdown menu position of the VideoDetailsCard component [#25860]
- VideoPress Pkg: apply changes according on the `videopress/video` name convention for the video block [#25844]

### Removed
- VideoPress: Removed isLoading prop from VideoUploadArea component [#25820]

### Fixed
- Avoid conflict with old versions of Jetpack plugin [#25925]
- Fixing initialization and error handling [#25863]
- VideoPress Pkg: Avoiding re-register the VideoPress video [#25841]
- When adding video from local library that was previously uploaded to VideoPress, check if videopress attachment still exists [#25848]

## [0.2.0] - 2022-08-23
### Added
- Add the VideoUploadArea component without functionality [#25432]
- Migrate VideoPress block to pkg [#25387]
- VideoPress: add ClipboardButtonInput component [#25730]
- VideoPress: serve a minified token bridge version in production env [#25683]
- VPBlock: Support edit from upload (V6) [#25392]

### Changed
- Initialize VideoPress admin UI from the package [#25692]
- Updated package dependencies. [#25338, #25339, #25387, #25628, #25692, #25707, #25762, #25764, #25769]
- VideoPress: capital P [#25717]
- VideoPress: move client-source files from plugin to package [#25687]
- VideoPress: move videopress-token-bridge.js to client/ folder in the VideoPress package [#25676]
- VideoPress: remove sideEffect from package.json [#25714]

### Fixed
- Only add the VideoPress bridge script when a VideoPress player will be rendered on the page. [#24985]

## [0.1.5] - 2022-08-16
### Changed
- Migrating VideoPress code from the plugin to the package [#25412]
- Moving videopress dependencies to the package [#25398]
- Updated package dependencies. [#25347]
- Updated package dependencies. [#25412]

### Fixed
- Fixed missing import for recent VideoPress namespace changes [#25638]

## [0.1.4] - 2022-08-09

- Added REST api endpoint [#25042]

## [0.1.3] - 2022-08-03
### Added
- Added REST api endpoint [#25042]

### Changed
- Updated package dependencies. [#25300, #25315]
- VideoPress: Change package textdomain [#25309]

## [0.1.2] - 2022-07-26
### Changed
- Updated package dependencies. [#25158]

## [0.1.1] - 2022-07-19
### Added
- Add VideoPress Options class [#25047]
- VideoPress: move oEmbed registration to VideoPress package. [#25090]
- XMLRPC class [#24997]

### Changed
- Add mirror repository information to package info. [#25071]
- Updated package dependencies. [#25047]

## 0.1.0 - 2022-07-12
### Added
- Created empty package [#24952]

[0.5.0]: https://github.com/Automattic/jetpack-videopress/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/Automattic/jetpack-videopress/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/Automattic/jetpack-videopress/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/Automattic/jetpack-videopress/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-videopress/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/Automattic/jetpack-videopress/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-videopress/compare/v0.1.5...v0.2.0
[0.1.5]: https://github.com/Automattic/jetpack-videopress/compare/v0.1.4...v0.1.5
[0.1.4]: https://github.com/Automattic/jetpack-videopress/compare/v0.1.3...v0.1.4
[0.1.3]: https://github.com/Automattic/jetpack-videopress/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/Automattic/jetpack-videopress/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/Automattic/jetpack-videopress/compare/v0.1.0...v0.1.1
