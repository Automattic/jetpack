# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## 3.6 - 2026-09-23
### Added
- Add a Latest Videos Playlist block that plays the site's newest VideoPress videos, with the number of videos set in the block settings. [#52665]

### Changed
- My Jetpack: Answer module switch clicks immediately, and explain what happened when a change fails. [#52494]
- With the inline player setting on, draw the play button like the player's and show a loading spinner from the click until the player has loaded. [#52574]

### Fixed
- Chapters: Show specific validation messages for chapters entered in video descriptions. [#52488]
- Connection: Report a broken connection on My Jetpack's connection card instead of claiming everything looks good, and show a break only the connection owner can repair as a warning, not an error, to everyone else. [#52130]
- Fix private video playback on sites using WPML. [#52659]
- Footer: Hide Products and Help links when My Jetpack is unavailable. [#52557]
- My Jetpack: Point users who cannot connect the site at an administrator, instead of an onboarding screen they cannot complete. [#52614]
- My Jetpack: Show each notice once instead of twice. [#52494]
- Pricing: Open information tooltips with the keyboard and dismiss them with Escape. [#52661]
- Show each number on the views trends chart's value axis once when counts are small. [#52588]
- With the inline player setting on, show the poster of private videos, and of videos the server could not look up, before they are played instead of a black box. [#52574]

## 3.5 - 2026-09-18
### Added
- Add a "Learn more" support link to the admin page. [#52111]
- Add a setting to render players in the page from one shared player script instead of one frame per video. [#52244]
- Add a site-wide setting to turn off player preloading for every embed. [#51991]
- Connection: Surface SSL certificate verification failures reported by WordPress.com as a connection error notice. [#52035]
- Invite the first upload with a dropzone when the video library is empty. [#51717]
- My Jetpack: Allow the Automattic for Agencies banner to be dismissed. [#51441]
- With the inline player setting on, show each video's poster and load the player only when it is played. [#52011]
- With the shared player setting on, the block editor previews video blocks with the same shared player instead of one frame per block. [#52052]

### Changed
- Boost: Wait up to four minutes for slow speed tests in My Jetpack instead of timing out after two. [#51605]
- Charts: follow the WordPress admin color scheme for chart series colors. [#51535]
- Charts: update chart grid, axis and label colors immediately when the theme changes. [#51687]
- Connection: Show every connection error in one notice, each with the account it affects, and link to Site Health when a firewall is blocking WordPress.com. [#51504]
- Dashboard: Display video library thumbnails in a 16:9 aspect ratio. [#52318]
- Dashboard: Open the file picker directly from the welcome modal's Upload a video button, then land on the Library to follow the upload's progress. [#51791]
- Hide the VideoPress sidebar item when VideoPress is not active. [#52156]
- My Jetpack: Restyle dashboard notices to match the WordPress design system. [#52290]
- My Jetpack: Show the dashboard in the new rounded admin page frame. [#52446]
- My Jetpack: Show the Jetpack menu notification badge when a connection error is detected. [#52332]
- Sidebar: sort Jetpack menu items alphabetically, pinning My Jetpack to the top and external links and Settings to the bottom. [#52003]
- Update package dependencies. [#51701]
- Update package dependencies. [#51802]
- Update package dependencies. [#52187]
- VideoPress: refine the welcome modal type scale, match the upload dropzone text to the design system's empty state, and drop the duplicate header Upload button while the empty-library dropzone is showing. [#52061]

### Fixed
- Activity Log: Fix the page overlapping the admin menu in right-to-left languages. [#51963]
- Activity Log: honor the module setting, so the page can be turned off. [#52409]
- Admin dashboards: Keep the page header and content in view when the wp-admin menu is taller than the window. [#51696]
- Avoid free-plan limits and upgrade prompts when site features cannot be loaded. [#52050]
- Charts: Fix unreadable axis labels in forced-colors mode. [#52268]
- Charts: keep chart tooltips under sticky and fixed page elements. [#51640]
- Charts: Place line and area chart date ticks on the site's time zone boundaries, name the hour in tooltips on hourly data, and read hour labels in the site's own locale rather than a forced 12-hour clock. [#51813]
- Charts: Restore keyboard focus after dismissing line chart tooltips. [#52284]
- Charts: Stop the first and last dates on a chart's horizontal axis from being cut off. [#52112]
- Connection: Fix a stale connection error notice that could persist on healthy sites. [#52264]
- Connection: Hide connection error notices from users who cannot fix the connection. [#52049]
- Dashboard: Continue the wp-admin menu color behind the page frame on WordPress.com and third-party admin color schemes. [#51619]
- Dashboard: Keep the video editor footer at the bottom of the page. [#52489]
- Dashboard: Make the welcome=1 review parameter reopen the welcome modal after it has been dismissed. [#51791]
- Fix selecting thumbnail frames from private videos and prefer browser-compatible video renditions. [#52158]
- Fix the dashboard rendering blank on WordPress 7.0.x, where the welcome modal crashed on the missing public ThemeProvider export. [#51847]
- Fix the VideoPress block failing to load in the editor on WordPress.com-hosted sites. [#52362]
- JITM: Fix missing messages and a console error on sites without the Jetpack plugin active. [#51733]
- Keep admin icons colored after the @wordpress/icons 16 update, which draws them as strokes. [#52187]
- Keep keyboard focus on the first or last data point when an arrow key reaches the end of the views trends chart, return focus to the chart when Escape closes a tooltip, stop a focused chart from swallowing keys it does not use such as Page Down, and close the tooltip when the series it describes is hidden. [#50140]
- My Jetpack: Keep the Automattic for Agencies banner hidden after dismissing it and switching tabs. [#51441]
- My Jetpack: Show the right product status as soon as fresher plan data is available, instead of reusing an earlier lookup. [#52009]
- My Jetpack: Stop repeating the partner lookup request on every page load. [#51441]
- Playlist block: Wrap long unbroken video titles and decode HTML entities in titles on the front end. [#51849]
- Say when a video upload failed because of a Jetpack connection problem, instead of only "Upload failed". [#51541]
- Say when a video upload from the Video block failed because of a Jetpack connection problem, instead of only "Failed to upload your video". [#51541]
- Show the Jetpack connection error notice on the VideoPress dashboard again. [#51541]
- Status: Detect a site served on any 127.0.0.0/8 loopback address, or on 0.0.0.0, as a local site. [#51311]
- Stop the dashboard frame from flashing while loading and when switching admin pages. [#52235]

## 3.4.1 - 2026-08-26
### Added
- Add a first-run welcome modal to the dashboard. [#51520]

### Changed
- General: Update minimum WordPress version to 7.0. [#51370]
- My Jetpack: Show what Paid Stats actually adds — UTM tracking, device stats, and region & city locations — instead of commercial use. [#51410]
- Redesign the video details page: group details into one card in a wider layout, move the player and settings into a side column, and add thumbnail tiles, collapsible sections, and an Add to content action. [#51480]
- Tested up to WordPress 7.1. [#51370]

### Removed
- Updated PHP version requirements to PHP 7.4 or newer. [#51515]

### Fixed
- Charts: draw labels at the design system's font weight and size. [#51452]
- Connection: Update wording for some connection error notices. [#51360]
- Fix a timeout error when updating a video poster from the media library. [#51479]
- Fix private video playback authorization for videos embedded through synced patterns and Video Playlist blocks, let private videos preview in the block editor canvas, load live metadata for private playlist entries for authorized viewers, and show a lock placeholder on playlist thumbnails of private videos the viewer cannot access. [#51569]
- My Jetpack: always label the license activation link 'Activate a license'. It previously read 'Activate a new license' on sites with a plan, even when no licenses had been activated. [#51283]
- My Jetpack: Stop the Stats dashboard from asking which plan you want again after Start for Free was already chosen. [#51413]

## 3.4 - 2026-08-19
### Changed
- Update package dependencies. [#51399]

### Fixed
- Connection: Stop showing a duplicate account notice when your WordPress.com email differs from your site email only in letter case. [#51285]

## 3.3 - 2026-08-13
### Added
- Add the Activity Log page to wp-admin, so it is available without the Jetpack plugin installed. [#51224]

### Changed
- Update dependencies. [#50473]
- Update package dependencies. [#50510] [#50529] [#50751]

## 3.2 - 2026-07-09
### Added
- Add a site-level setting to turn off auto-generated subtitles. [#50014]
- Add presentation to the player iframe allow list to enable casting from embeds. [#50215]
- Resumable video uploads are now verified as they arrive, instead of re-reading the whole file once the upload completes. [#50054]

### Changed
- Dashboard: Release modernized VideoPress dashboard. [#49023]
- Remove unneeded development and documentation files from the published plugin. [#49014]
- Update composer.lock files. [#48743] [#49415]
- Update minimum WordPress version to 6.9. [#49021]
- Update package dependencies. [#48735] [#49793] [#48405] [#49218] [#49273] [#49492] [#49631] [#49691] [#49757] [#49831] [#50097] [#50183]

### Fixed
- Fix admin page crash on video upload/delete when the free-plan upgrade nudge is shown. [#49340]
- Fix fatal error on My Jetpack when the current stable Jetpack plugin is active. [#49994]
- Fix the media library "Edit video details" link so it opens the modernized dashboard. Old links now redirect to the new location. [#50323]
- Fix the post-connection redirect so the modernized dashboard returns users to the VideoPress page instead of a 404. [#49168]
- Load VideoPress Overview stats even when the Jetpack Stats module is inactive. [#50326]

## 3.1 - 2026-05-14
### Changed
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]
- Update package dependencies. [#48106]

### Fixed
- Prevent the "Add new video" button from disappearing on the admin dashboard after the first video is uploaded. [#48690]
- VideoPress admin: Add padding around the Settings section, make the hero full width on medium screens, and remove an empty pagination placeholder below the video library. [#48131]

## 3.0 - 2026-04-16
### Changed
- Tested up to WordPress 7.0. [#48114]
- Update package dependencies. [#48064]

## 2.9 - 2026-04-10
### Changed
- Dependencies: Update lock file to keep root requirements in sync. [#47418]
- Remove header border-bottom from the admin page for a cleaner unified header appearance. [#47313]
- Switch to Native TypeScript compiler based on Go. [#47375]
- Update dependencies. [#47472]
- Update design of the sidebar upsell. [#47909]
- Update package dependencies. [#47002] [#47021] [#47099] [#47173] [#47285] [#47300] [#47371] [#47496] [#47505] [#47684] [#47825] [#47890] [#47998]

### Fixed
- Admin Page: Restore border on header component. [#47425]

## 2.8 - 2026-02-04
### Added
- Adding Jetpack Protect details page for users without the dedicated Jetpack Protect plugin. [#46630]
- IDC: Add revalidation for IDCs. [#46268]

### Changed
- My Jetpack: Check red bubble notification async when cache is not available. [#46396]

### Removed
- General: Update minimum WordPress version to 6.8. [#46801]

### Fixed
- Clarify error messages when video uploads fail due to plan limitations. [#46668]
- Fix compatibility with Gutenberg 22.4 by removing invalid null timezone argument from dateI18n calls. [#46928]
- Fix upgrade notice incorrectly showing for A4A (Automattic for Agencies) VideoPress customers by using dynamic features API instead of hardcoded plan slugs. [#46835]
- Fix video query to only return VideoPress videos instead of all video types. [#46689]

## 2.7 - 2025-11-21
### Added
- Tested up to WordPress 6.9. [#45571]

### Changed
- Update dependencies. [#45488]
- Update package dependencies. [#45478] [#45652] [#45676] [#45756] [#45915]

### Fixed
- Jetpack: Remove getIconColor functions for block icons. [#45992]
- My Jetpack: Fix expiring renewal prompt to show all products. [#45995]
- My Jetpack: Fix visual compatibility issue with Hello Dolly plugin. [#45474]

## 2.6 - 2025-10-10
### Added
- Add typecheck support for E2E tests. [#44788]

### Changed
- Remove CRM installation nudge for Complete plan users. [#45026]
- My Jetpack: Fix multisite availability check for restricted products and modules. [#44710]
- Update package dependencies. [#44677] [#44701] [#44725] [#45027] [#45096] [#45097] [#45173] [#45200] [#45229] [#45298] [#45299] [#45334]

## 2.5 - 2025-08-05
### Added
- My Jetpack: Added analytics for empty product search results. [#44344]

### Changed
- Improve performance of WordPress.com comment likes by caching and minimizing API requests. [#44205]
- My Jetpack: Enable access to My Jetpack on WP Multisite. [#44260]
- My Jetpack: Unify the user connection flow with a unified screen. [#44469]
- My Jetpack: Update Stats card to include a chart for better analytics. [#43870]
- Sync: Ignore the ActivityPub Outbox CPT [#44222]
- Update package dependencies. [#44020] [#44148] [#44151] [#44206] [#44356]

### Fixed
- JITM: Fix ineffective caching due to expired plugin sync transient. [#44117]
- My Jetpack: Fix footer alignment for disconnected accounts. [#44468]
- My Jetpack: Prevent expiration alerts for products covered by active bundles. [#44586]
- My Jetpack: Restore plan purchase link. [#44535]
- Update JITMs to remove jQuery dependency. [#43783]
- Fix video row action button clickability by properly hiding stats on hover. [#44167]

## 2.4 - 2025-06-10
### Added
- Add more error logging. [#42959]
- Add My Jetpack tour. [#42880]

### Changed
- E2E Tests: Update config file encryption algorithm. [#43523]
- My Jetpack: Hide backup failure notice when backups are deactivated. [#43568]
- My Jetpack: Optimize the images for onboarding slider for faster page load. [#43473]
- My Jetpack: Update the onboarding UI, changing it to a single button [#43203]
- Update package dependencies. [#43071] [#43085] [#43326] [#43398] [#43400] [#43425] [#43578] [#43734] [#43839]

### Removed
- General: Update minimum WordPress version to 6.7. [#43192]

### Fixed
- Block editor: Fix layout issues with the Media Library modal buttons. [#43035]
- My Jetpack: Fix Onboarding UI responsiveness at 600px. [#43533]
- My Jetpack: Fix readability of license activation button on hover. [#43550]
- My Jetpack: Prevent social login from getting stuck when email input is not empty. [#43158]
- Update E2E tests. [#42956]

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
