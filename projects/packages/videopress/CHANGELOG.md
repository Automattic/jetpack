# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2022-11-14
### Added
- VideoPress: add Color Panel component [#27381]
- VideoPress: add file drop support after first video [#27297]
- VideoPress: connect UI of settings section with the data handling. [#27350]
- VideoPress: create endpoints to fetch and update the VideoPress settings. [#27293]
- VideoPress: create selector/resolver machinery to fetch VideoPress site privacy setting from the backend. [#27321]
- VideoPress: enable thumbnail selection from video frame on quick action [#27364]
- VideoPress: exposed video_is_private flag on each video, taking into account the video privacy setting as well as the VideoPress site-wide privacy setting. [#27349]
- VideoPress: mitigate video re-rendering flicker [#27305]

### Changed
- Updated package dependencies. [#27289]
- VideoPress: allow keyboard navigation on video quick actions [#27378]
- VideoPress: allow selection of multiple files [#27357]
- VideoPress: introduce PlaybackControl component [#27303]
- VideoPress: remove the fallback video [#27315]
- VideoPress: rename Match video title with Dynamic color [#27385]
- VideoPress: show Settings only when connected [#27361]
- VideoPress: unify file drag and drop UI [#27348]

### Fixed
- VideoPress: fix an issue with private VideoPress videos timing out when script loading is delayed. [#27211]
- VideoPress: change the resolver to rely on the new needsPlaybackToken flag when deciding if a video needs a playback token. [#27380]
- VideoPress: disable automatic re-focus on video quick action popover close [#27338]
- VideoPress: fix bug and return with select thumbnail from frame [#27309]

## [0.7.0] - 2022-11-07
### Added
- Adding the new Video Chapter block. [#27240]
- Videopress: add a notice and a modal informing the users how they can create chapters. [#27244]
- VideoPress: add inspector controls to VideoPress chapters block. [#27242]
- VideoPress: add Site Settings section. [#27290]
- VideoPress: add video chapters style selector component. [#27237]
- VideoPress: add VideoPress video block select control. [#27214]
- VideoPress: introduce initial layout for chapters. [#27246]
- VideoPress: scaffolding Video Chapters block. [#27241]
- VideoPress: show message when there are no search results. [#27275]

### Changed
- Modified the VideoPress block's prompt to add a VideoChapters block so that the button functions as expected. [#27248]
- VideoPress: improve the re-rendering process of the video player when editing video props. [#27192]
- VideoPress: re-organize hooks to keep video data in sync. [#27227]

### Fixed
- VideoPress: change base number to 10 and total space value to 10^12 so we refer to it in terabytes instead of tebibytes, keeping consistency between marketing and product. [#27274]
- VideoPress: fix privacy column icon. [#27277]
- VideoPress: make sure media details are set before using them. [#27262]

## [0.6.5] - 2022-11-01
### Added
- VideoPress: add getMediaToken() async helper [#27180]
- VideoPress: add isBetaExtension() helper [#27179]
- VideoPress: add isExtensionEnabled() helper" [#27156]
- VideoPress: Add upload progress to VideoThumbnail and correct states on VideoRow [#27098]
- VideoPress: expose site-type to the client side [#27191]
- VideoPress: implement extensions (beta) handling [#27133]
- VideoPress: migrate video chapters feature from jetpack to videopress [#27178]

### Changed
- Updated package dependencies. [#27089]
- VideoPress: Change deprecated prop on VideoQuickActions [#27057]
- VideoPress: Change the playback token handling to expire tokens after 24h. [#27136]
- VideoPress: fix width of the actionable placeholder of v6 [#27099]

### Fixed
- VideoPress: Add processing state to video thumbnail on edit page [#27148]
- VideoPress: Allow actions and stats on VideoCard when processing video and fix styles [#27123]
- VideoPress: fix trying to get token when user is disconnected bug [#27067]
- VideoPress: Fix typescript issues [#27066]
- VideoPress: Get video title from backend after upload to avoid dirty form while processing [#27188]

## [0.6.4] - 2022-10-25
### Fixed
- VideoPress: Update polling time when processing [#27056]

## [0.6.3] - 2022-10-25
### Added
- VideoPress: Add component unload prevention on video details edit when there are unsaved changes [#26919]
- VideoPress: add GlobalNotice component [#26973]
- VideoPress: add loading state to connect button righ after user clicks on it [#26958]
- VideoPress: Add support to the use of playback tokens on the details page, so it's possible to see thumbnails on videos that are private. [#26996]
- VideoPress: Expose VideoPress playback token generation endpoint to enable client display of private videos and thumbnails. [#26974]
- VideoPress: give access to secondary admins [#26962]
- VideoPress: handle show admin or pricing based on a local state [#26977]
- VideoPress: handle UI when setting private video in the quick actions component [#27035]
- VideoPress: make tracks works [#27040]
- VideoPress: show an actionable notice when user connection is required [#26986]
- VideoPress: Upload from library [#26948]

### Changed
- Updated package dependencies. [#26705]
- VideoPress: Hide thumbnail actions and open library directly [#27038]
- VideoPress: show video thumbnails for private videos in the list view [#27024]

### Fixed
- VideoPress: Add check for site connectivity on video details edit page [#26969]
- VideoPress: Check for empty poster image on video polling after upload [#27000]
- VideoPress: enqueue token bridge script when `init` action [#27021]
- VideoPress: Fix unsaved changes prompt when updating video thumbnail [#26989]
- VideoPress: Remove ConnectionErrorNotice component on dashboard when there is no connection issue [#26997]

## [0.6.2] - 2022-10-19
### Added
- VideoPress: Add confirmation before leaving page when upload is in progress [#26912]
- VideoPress: Scroll to top on route change [#26915]
- VideoPress: track page view and checking out events [#26894]

### Changed
- Updated package dependencies. [#26883]
- VideoPress: change the videopress redirect value to lead to product page [#26886]

### Fixed
- VideoPress: disable upoading button when site supports paid feature [#26876]
- VideoPress: Fix focus style on ClipboardButtonInput component [#26880]
- VideoPress: fix the issue when uploading the file by dropping it off on the media placeholder [#26907]
- VideoPress: Use allowed video extensions from initial state [#26862]
- VideoPress: Use camera icon as thumbnail when the video is private. [#26898]

## [0.6.1] - 2022-10-17
### Added
- VideoPress: add an actionable dialog when the site needs connect [#26819]
- VideoPress: Allow the use of multiple values on the `videopress_rating` and `videopress_privacy_setting` filters, using comma as the separator for the values. [#26830]
- VideoPress: do not block quick actions when uploading poster image [#26853]
- VideoPress: Expose the list of blog users on the application initial state var [#26857]
- VideoPress: filter videos by Filter Section [#26845]
- VideoPress: filter videos by uploader [#26859]
- VideoPress: Loading mode for VideoRow [#26834]
- VideoPress: Persist library type [#26836]

### Changed
- Updated package dependencies. [#26851]
- VideoPress: minor FilterSection component refactoring [#26837]

### Fixed
- VideoPress: Add thumbnail and loading state when uploading poster image on video row [#26856]
- VideoPress: Extract poster image update to actions with loading meta state [#26833]
- VideoPress: fix bug when site contains local videos [#26843]

## [0.6.0] - 2022-10-13
### Added
- VideoPress: add dialog to convert core/video to videopress/video [#26768]
- VideoPress: Add poster image upload to video quick actions [#26762]
- VideoPress: Add support to `videopress_privacy_setting` and `videopress_rating` query filters to filter media attachments using the respectives meta keys. [#26777]
- VideoPress: connect videos Filter UI with the data handling [#26825]
- VideoPress: expose local videos in the initial state [#26743]
- VideoPress: first pagination approach for Local videos [#26794]
- VideoPress: implement a custom VideoPress video block recovery [#26787]
- VideoPress: reduxify local videos. first approach [#26746]
- VideoPress: reorganize and improve URL helpers [#26740]
- VideoPress: show total videos in the Local videos section [#26789]
- VideoPress: start to handle loading state for local videos [#26797]
- VideoPress: style checkout button when checking out [#26798]
- VideoPress: Surface filtering-relevant VideoPress meta keys, copying it from the attachment `videopress` metadata object to searcheable new meta key. [#26769]

### Changed
- Updated package dependencies. [#26790]
- VideoPress: move v6 core/video transfrom from VideoPress to Jetpack plugin [#26799]
- VideoPress: Pagination and search while uploading [#26780]

### Fixed
- VideoPress: Make sure the thumbnail var is set before using it to prevent "Undefined variable" notice [#26801]
- VideoPress: Thumbnail z-index [#26771]
- VideoPress: Uploading states responsive behavior [#26770]

## [0.5.1] - 2022-10-11
### Added
- VideoPress: Create new videopress/v1/site endpoint to fetch site data regardless of having the Jetpack plugin active on the target site. [#26652]
- VideoPress: handle core/oembed videopress block variation [#26735]
- VideoPress: improve UI when loading video in the frame selector modal [#26684]
- VideoPress: Include a new `no_videopress` query string parameter to remove from the list all VideoPress related media. [#26734]
- VideoPress: Provide the used storage space on the initial state data, using the site information fetched from the WPCOM API. [#26672]
- VideoPress: request site purchases to check VideoPress is supported by the site [#26630]
- VideoPress: switch privacy icon according to video privacy [#26667]

### Changed
- VideoPress: disable privacy button when updating video privacy [#26673]
- VideoPress: hide spinner in frame selector when video is loaded [#26689]
- VideoPress: Move upload data to store [#26627]
- VideoPress: Remove arrows from video quick action popovers [#26724]
- VideorPress: change the dialog message to convert from core/oembed to VideoPress video block [#26744]

### Fixed
- VideoPress: Change the endpoint used by the client to fetch the site information, so we request the storage usage from the new VideoPress-specific endpoint. [#26677]
- VideoPress: check whether the $site_data is a WP_Error instance before to het the storage used data [#26679]
- VideoPress: Fix modal layout with core gutenberg version [#26674]
- VideoPress: Fix uploaded video count update [#26651]
- VideoPress: Load data when user enter directly on edit page [#26631]
- VideoPress: Wrap the request for connection-dependent initial state data around a connection check, so we only set it when there is actually an active connection. [#26685]

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

[0.8.0]: https://github.com/Automattic/jetpack-videopress/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/Automattic/jetpack-videopress/compare/v0.6.5...v0.7.0
[0.6.5]: https://github.com/Automattic/jetpack-videopress/compare/v0.6.4...v0.6.5
[0.6.4]: https://github.com/Automattic/jetpack-videopress/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/Automattic/jetpack-videopress/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/Automattic/jetpack-videopress/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/Automattic/jetpack-videopress/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/Automattic/jetpack-videopress/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/Automattic/jetpack-videopress/compare/v0.5.0...v0.5.1
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
