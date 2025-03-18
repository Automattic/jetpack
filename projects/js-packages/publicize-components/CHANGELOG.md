# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.84.0] - 2025-03-18
### Changed
- Move the `jetpack-social` endpoint to the Publicize package. [#42187]
- Use service status to display unsupported networks notice. [#42418]
- Update package dependencies. [#42509] [#42511]

## [0.83.1] - 2025-03-17
### Changed
- Update dependencies. [#39855]

## [0.83.0] - 2025-03-17
### Added
- Add "Schedule" functionality to the Share Post modal. [#42376]
- Add Scheduled Posts panel. [#42297]

### Changed
- Schedule Button: Prevent date/times in the past from being selected. [#42381]
- Change the query parameter to open Jetpack sidebar on editor load. [#42364]
- Migrate review prompt initial state to script data. [#42389]

### Removed
- Connections schema: Remove the deprecated fields. [#42454]

### Fixed
- Fixed a deadlock with the media picker. [#42455]
- Resolve connection issues with LinkedIn company pages and Tumblr additional blogs. [#42352]

## [0.82.0] - 2025-03-12
### Added
- Add a helper function to get the max message length. [#42325]
- Add internal state for the ScheduleButton component. [#42372]
- Provide connection data to footer component. [#42000]
- Publicize Components: Add the schedule button. [#42313]
- Social: Configure data store to handle scheduled shares. [#42296]

### Changed
- Update package dependencies. [#42384]

## [0.81.0] - 2025-03-10
### Added
- Social: Add the ConnectionList and Item components. [#42233]
- Social: Add the TabbedModal pure component. [#42298]
- Social: Add scheduled post components. [#42221]

### Changed
- Social: Clean up the MessageBoxControl component. [#42253]
- Social: Move resharing into the post modal. [#42224]
- Social: Move JS editor code from Jetpack and Social to Publicize package. [#41836]
- Update package dependencies. [#42162]

## [0.80.0] - 2025-03-03
### Security
- Social: Moved Mastodon input form to start. [#41986]

### Added
- Added unit tests for the admin page. [#41951]
- Publicize Components: Add Storybook support. [#42167]

### Changed
- Social: Improve connect URL generation. [#42019]
- Update package dependencies. [#42081] [#42163]

### Fixed
- Clean up Social admin page unit tests. [#42064]
- Social: Avoid calling the settings endpoint on Social admin page if not relevant. [#42102]

## [0.79.0] - 2025-02-24
### Added
- Add support for Bluesky video selection. [#41669]
- Social: Updated the admin page for use by Editors and Authors [#41859]

### Fixed
- Prevent custom message box from showing up for custom notes. [#41948]
- Prevent unsupported connection from showing up. [#41907]
- Social Previews: Fix distorted image for Tumblr preview. [#41844]
- Social: Fix plugin version in admin page footer. [#41888]
- Social: Hide upgrade nudge for Atomic sites. [#41713]

## [0.78.0] - 2025-02-17
### Added
- Added a utility to get the link to Social admin page. [#41741]
- Added more clarity on how the Bluesky handle is set up. [#41782]

### Changed
- Social: Hide mark as shared UI if the user cannot share connection. [#41806]

## [0.77.2] - 2025-02-11
### Changed
- Hide Social Notes if Social plugin is not active. [#41393]

## [0.77.1] - 2025-02-10
### Changed
- External Media: Move the external-media to the new @automattic/jetpack-external-media package [#41078]
- Updated package dependencies. [#41486] [#41491] [#41577]

## [0.77.0] - 2025-02-03
### Added
- Social Connections: Handle LinkedIn connections requiring reauthentication. [#41494]
- Social: Enable Social Post UI for WordPress.com. [#41219]

### Changed
- Moved Social admin page code and assets logic to publicize package [#41239]
- Move initial state from Social plugin to publicize package [#41381]
- Replace getSite selector with getEntityRecord to avoid redundant API calls [#41386]
- Social post character limits are now dynamic based on selected connections [#41429]
- Social: Move settings endpoint to publicize package [#41456]
- Update the settings endppoint to use existing endpoints [#41461]

### Removed
- Social Previews: Remove "Your post" section in favour of Social Post UI [#41329]

## [0.76.0] - 2025-01-27
### Changed
- Moved the Social admin page to the publicize-components package [#41181]
- Refactored Social Note settings to use core [#41153]
- Social: Unify connections management API schema [#40679]

## [0.75.4] - 2025-01-20
### Changed
- Updated package dependencies. [#41099]

## [0.75.3] - 2025-01-13
### Fixed
- Social: Handle publicize connections meta error gracefully. [#40916]

## [0.75.2] - 2025-01-06
### Changed
- Updated package dependencies. [#40792] [#40797] [#40798]

## [0.75.1] - 2024-12-16
### Changed
- Updated package dependencies. [#40564] [#40598]

## [0.75.0] - 2024-12-09
### Changed
- Changed text domain from 'jetpack' to 'jetpack-publicize-components'. [#40368]
- Updated package dependencies. [#40363]

## [0.74.2] - 2024-12-02
### Changed
- Updated messaging for async sharing in block editor. [#40302]
- Updated @wordpress/editor to the latest version. [#40373]

## [0.74.1] - 2024-11-26
### Changed
- Update dependencies. [#39855]

## [0.74.0] - 2024-11-25
### Added
- Added warnings when linkedin permission is cached. [#40220]

### Changed
- Updated package dependencies. [#40288]

### Fixed
- Add missing ids to radio buttons in the confirmation form. [#40199]
- Decode entities in post titles and descriptions for social previews. [#40256]
- Fixed TS errors following @wordpress/editor update. [#40291]

## [0.73.0] - 2024-11-18
### Added
- Added toggle for UTM settings. [#39998]

### Changed
- Removed some unused code for Social. [#40122]

## [0.72.1] - 2024-11-11
### Changed
- Social: Clean up social store. [#40033]
- Social: Migrated social plugins settings to new script data. [#40032] [#40081]
- Updated package dependencies. [#39999] [#40000] [#40060]

## [0.72.0] - 2024-11-04
### Added
- Enable test coverage. [#39961]

### Changed
- Change order of social connections. [#40020]
- Social: Migrate Social Image Generator settings to new store. [#39904]

### Fixed
- Fix dataviews styles imported in share status being added globally. [#39991]
- Social: Fix empty whitespace in Bluesky and Mastodon connection forms. [#39984]
- Social: Fix the Instagram max video length. [#39930]

## [0.71.5] - 2024-10-29
### Changed
- Components: Add __nextHasNoMarginBottom to BaseControl-based components, preventing deprecation notices. [#39877]

## [0.71.4] - 2024-10-25
### Changed
- Initial state: Migrated isEnhancedPublishingEnabled to feature check [#39835]

### Fixed
- Fixed Bsky conneciton management profile name [#39889]
- Fixed reconnection for broken Bluesky connections [#39844]
- Social: Fixed Bluesky custom domain handle not being accepted [#39872]

## [0.71.3] - 2024-10-21
### Changed
- Initial state: Migrated URLs in the editor to the new script data. [#39799] [#39797]
- Update dependencies. [#39781]

### Fixed
- Social: Fixed Bluesky display name when it's not set in Bluesky profile. [#39840]

## [0.71.2] - 2024-10-14
### Added
- Social: Added Bluesky to social previews. [#39659]

### Changed
- Updated package dependencies. [#39707]

### Fixed
- Add missing deps in calls to the `useSelect` React hook. [#39421]
- Social: Updated the check to see if Bluesky is already connected. [#39661]

## [0.71.1] - 2024-10-07
### Changed
- Updated package dependencies. [#39594]

### Fixed
- Social: Fixed share status tooltip text overflow [#39599]

## [0.71.0] - 2024-10-01
### Added
- Social: Added support for Bluesky [#39561]

## [0.70.1] - 2024-09-30
### Changed
- Update dependencies. [#39528]

## [0.70.0] - 2024-09-23
### Added
- Added tracking for the resharing action [#39408]

### Changed
- Social: Migrated useEditorPreview feature flag to new script data [#39405]
- Social: Migrated useShareStatus feature flag to new script data [#39404]

### Fixed
- Social: Updated social previews button styles to fit the translated string [#39430]

## [0.69.0] - 2024-09-16
### Added
- Social: Share status | Updated retry to show spinner and start polling [#39293]

### Changed
- Social: Disable reshare button and hide post publish share status when all the enabled connections are invalid [#39346]
- Social: Migrated useAdminUiV1 feature flag to new script data [#39137]
- Updated package dependencies. [#39332]

### Fixed
- Fixed the display where the error wasn't visible to the user. [#39372]

## [0.68.0] - 2024-09-10
### Added
- Added share status feedback to resharing [#39294]

### Changed
- Updated package dependencies. [#39302]

## [0.67.0] - 2024-09-09
### Added
- Added tracking for the share status modal [#39198]

### Changed
- Updated package dependencies. [#39278]

### Fixed
- Social: Fixed multiple issues in share status retry UI and logic [#39291]

## [0.66.1] - 2024-09-06
### Added
- Social: Added polling flag for share status for better UI [#39265]
- Updated share status modal to use dataviews [#39230]

## [0.66.0] - 2024-09-05
### Added
- Added the functionality to reshare from the modal [#39157]
- Poll for share status after reshare [#39156]

### Changed
- Made resharing async [#39227]
- Updated package dependencies. [#39176]

### Fixed
- Fixed resharing for jetpack sites when only social plugin is active [#39220]
- Fixed unnececarry call to API if feature flag is off [#39184]
- Social: Improved polling performance for share status [#39194]

## [0.65.0] - 2024-09-02
### Added
- Add share status log modal to published posts. [#39051]

### Changed
- Social: Renamed review sharing status to 'View sharing history'. [#39150]

### Fixed
- Fixed a bug on when to show the share log modal trigger. [#39135]
- Fixed share status being shown even if no connection is enabled. [#39120]
- Social: Improve ts error reporting in publicize. [#39133]

## [0.64.0] - 2024-08-29
### Added
- Added share status info to Jetpack sidebar [#39073]
- Added usePostPrePublishValue hook [#39119]

### Changed
- Social: Default to the current post ID for share status selector [#39112]
- Social: Updated the share status modal to render it globally [#39116]

### Fixed
- Fixed a deadlock with media validation and media picker [#38933]

## [0.63.0] - 2024-08-26
### Added
- Added the new feature flag for the social share status [#39015]

### Changed
- Moved PostPublishPanels component to publicize-components package [#39049]
- Social: Migrated shares data to the new script data [#38988]
- Updated package dependencies. [#39004]

## [0.62.0] - 2024-08-21
### Changed
- Social: Migrated the API paths from initial state to the new script data. [#38962]

### Removed
- Social: Removed share limits UI and data logic. [#38904]

## [0.61.0] - 2024-08-19
### Added
- Added a description for the social modal. [#38927]

### Changed
- Social: Migrated services list to the initial state. [#38924]  [#38861] [#38662] [#38665]

### Removed
- Remove the unused Advanced plan nudge. [#38926]

### Fixed
- Fixed a ui issue with the toggle naming. [#38925]
- Lossless image optimization for images (should improve performance with no visible changes). [#38750]

## [0.60.0] - 2024-08-12
### Changed
- Hid most of the actions and notices when sharing is off [#38801]
- Updated the position of connection notices in the editor [#38789]
- Social: Updated intial state logic to use the new consolidated initial state [#38606]
- Updated the custom message placeholder [#38784]

### Fixed
- Fixed a UI issue in the editor [#38829]
- Fixed social post modal max-height [#38830]
- Social post UI: Fix connection toggle and media notice [#38799]

## [0.59.0] - 2024-08-05
### Added
- Added connection toggle to social post preview [#38686]
- Added feature flag management for social [#38669]
- Added preview section to the social post modal [#38686]
- Added Social post UI modal and trigger [#38666]
- Added tracking for the publicize settings changes [#38714]
- Social: Added settings section to the social post modal [#38683]

### Fixed
- Fix the media validation notice for Instagram when SIG is enabled [#38689]

## [0.58.0] - 2024-08-01
### Changed
- Fixup versions [#38612]

### Removed
- Removed the unused code for image auto-conversion from social store [#38609]
- Social | Removed the media auto-conversion UI [#38497]

### Fixed
- Improved broken connection messaging for non-admins [#38639]
- Social | Fixed and improved media auto conversion notices [#38499]

## [0.57.0] - 2024-07-29
### Added
- Added mentioning of Manual Sharing [#38411]

### Fixed
- Fixed broken connection notices to make them more helpful [#38450]

## [0.56.2] - 2024-07-22
### Fixed
- Fixed double request issue and simplifed refresh logic [#38350]
- Social: Fixed parallel social connection requests messing up the UI state. [#38408]

## [0.56.1] - 2024-07-15
### Changed
- Social: Removed unnecessary feature checks for social connections [#38216]

### Fixed
- Fixed an issue with frontend media validation [#38234]

## [0.56.0] - 2024-07-08
### Added
- Updated the connections cofirmation logic to preselect the reconnecting account by default on confirmation screen [#38193]

### Changed
- Changed `Manage connections` to a link with at least 1 connection [#38220]

## [0.55.1] - 2024-07-03
### Changed
- Updated package dependencies. [#38132]

## [0.55.0] - 2024-07-01
### Added
- Added "Save to media library" button for images generated by SIG [#38106]

### Removed
- Removed share as a social post toggle [#37964]

### Fixed
- Added service status to broken connections for a service [#38053]
- Fixed Threads and Instagram social previews [#38138]
- Social | Updated "Share post" logic to hide the button when there are no connections [#38056]

## [0.54.6] - 2024-06-26
### Added
- Added social preview for Threads [#38003]

## [0.54.5] - 2024-06-24
### Added
- Added Threads to the social connections services [#37977]

### Fixed
- Fixed skipped connections id [#37810]
- Social | Replaced + icon with connections management link in the post editor [#37961]

## [0.54.4] - 2024-06-17
### Fixed
- Social: Fixed broken connections reconnect link to point it to new connections UI [#37869]

## [0.54.3] - 2024-06-13
### Changed
- Updated package dependencies. [#37795] [#37796]

### Fixed
- Social: Fixed WSOD on connections UI when an old Twitter connection exists. [#37836]

## [0.54.2] - 2024-06-10
### Changed
- Change codebase to use clsx instead of classnames. [#37708]
- Social | Added optmistic response for connection creation [#37730]

### Fixed
- Clean up the creating connection spinner for confirm button [#37734]

## [0.54.1] - 2024-06-05
### Changed
- Updated package dependencies. [#37669]

## [0.54.0] - 2024-06-03
### Changed
- Social | Updated upgrade nudges to use the new plan. [#37638]
- Updated the editor nudge text and logic. [#37644]

## [0.53.0] - 2024-05-29
### Added
- Added tests for manage connections modal and services. [#37582]

### Removed
- Social | Removed sharing buttons info from connections modal. [#37593]

### Fixed
- Social | Hide "Mark as shared" for non-admin authors. [#37595]

## [0.52.0] - 2024-05-27
### Added
- Added tests. [#37516]
- Added the connection modal to the editor. [#37405]

### Changed
- Refactored the connection list UI. [#37437]
- Social | Cleaned up connections management list. [#37570]
- Social | Fixed no connections UI for editor. [#37571]
- Social | Improved reconnect flow to automatically open the connection window. [#37467]
- Social | Made the editor connections modal behavior similar to the modal on the social admin page. [#37501]
- Social | Updated connection fields to match the API schema. [#37529]
- Social | Updated the connection test results endpoint for front-end. [#37531]

### Fixed
- Fixed an issue where non-admins saw action on connection management. [#37507]
- Fixed UI bug with border. [#37490]

## [0.51.1] - 2024-05-20
### Added
- Added globalize/unglobalize connection UI. [#37377]
- Social: Wired up confirmation UI with connect button. [#37295]

### Changed
- Social: Updated connection modal UI. [#37420]
- Updated package dependencies. [#37379] [#37380] [#37382]

## [0.51.0] - 2024-05-13
### Added
- Add connect form/button for connection management. [#37196]
- Social: Added add connection modal. [#37211]
- Social Connections: Added disconnection confirmation dialog. [#37310]
- Social Limits: Added clarification of cycle reset. [#37350]
- Wired up disconnect button and added reconnect button. [#37237]

### Fixed
- Fixed a CSS styling issue in the connection management component. [#37304]
- Fixed social connections list not displayed for simple sites. [#37267]

## [0.50.0] - 2024-05-06
### Added
- Added feature flag for new social admin UI. [#37134]
- Social Admin page: Added connection management component. [#37120]

### Changed
- Updated package dependencies. [#37147] [#37148]

## [0.49.3] - 2024-04-22
### Changed
- Update the Social Sidebar Share Post panel to direct non-admin authors to user connection if there is no user connection. [#36976]

## [0.49.2] - 2024-04-15
### Changed
- Updated social previews package. [#36874]

### Fixed
- Fixed social previews crashing for non-admin authors. [#36875]

## [0.49.1] - 2024-04-11
### Changed
- Update dependencies. [#36156]

## [0.49.0] - 2024-04-08
### Added
- Added options and UI for link formatting. [#36671]

### Changed
- Extracted the connection toggle state logic. [#36776]
- Only show custom media picker for normal posts. [#36640]
- Updated package dependencies. [#36760] [#36761]
- Update to the most recent version of Color Studio, 2.6.0. [#36751]

### Fixed
- Fixed an issue where share as a social post was available free. [#36779]
- Fixed the (no title) link on the post publish panel. [#36718]
- Fixed the learn more link. [#36735]

## [0.48.5] - 2024-03-27
### Changed
- Updated package dependencies. [#36585]

## [0.48.4] - 2024-03-12
### Changed
- Updated package dependencies. [#36325]

## [0.48.3] - 2024-03-07
### Changed
- Update dependencies. [#36156]

## [0.48.2] - 2024-03-04
### Changed
- Update dependencies. [#36113]
- Updated package dependencies.

### Removed
- Removed the flow to reconnect a broken social connection from the editor. [#35343]

## [0.48.1] - 2024-02-27
### Changed
- Update dependencies. [#35170]

## [0.48.0] - 2024-02-26
### Added
- Added toggle to Social admin page for the Social Notes [#35681]

### Changed
- Added description to social previews for titleless posts [#35728]

### Removed
- Removed a notice to tell users that instagram is new nad can be connected [#35860]

## [0.47.1] - 2024-02-13
### Changed
- Updated package dependencies. [#35608]

## [0.47.0] - 2024-02-12
### Changed
- Change editor layout for social notes [#35536]

## [0.46.0] - 2024-02-05
### Added
- Add blog ID to the initial state. [#35006]

### Changed
- Updated package dependencies.

## [0.45.2] - 2024-01-29
### Changed
- Update dependencies. [#35170]

## [0.45.1] - 2024-01-22
### Changed
- Update dependencies. [#35126]

### Fixed
- Fixed a bug where the post body images weren't used for social previews [#35111]

## [0.45.0] - 2024-01-18
### Changed
- Changed dismissed notices endpoint to be a core endpoint [#34544]

## [0.44.2] - 2024-01-04
### Changed
- Updated package dependencies. [#34815] [#34816]

## [0.44.1] - 2024-01-02
### Changed
- Updated the design for Quick Share buttons and fixed its a11y [#34754]

## [0.44.0] - 2023-12-20
### Changed
- Hide conversion notice on Simple sites. [#34733]
- Updated package dependencies. [#34694]

### Fixed
- Fixed the media validation notice shown even when auto conversion is enabled. [#34730]

## [0.43.0] - 2023-12-14
### Changed
- Moved `usePostMeta` hook to `/hooks/` directory. [#34611]
- Split PublicizeForm component into smaller ones. [#34612]
- Updated the share limit bar design. [#34182]

### Fixed
- Fixed Jetpack Social scheduled post messaging. [#34182]
- Fixed the scheduled post double count for share limits. [#34182]

## [0.42.0] - 2023-12-11
### Changed
- Refactored storing of feature options to use core functions. [#34113]

## [0.41.9] - 2023-12-06
### Changed
- Updated package dependencies. [#34416]

## [0.41.8] - 2023-12-03
### Changed
- Disabled quick share for scheduled posts. [#34354]
- Extracted test utils to make them reusable. [#34309]
- Updated package dependencies. [#34411] [#34427]

### Fixed
- Fixed the issue of publicize remaining ON after the post is published. [#34289]

## [0.41.7] - 2023-11-24
### Fixed
- Fixed pre-publish UI reactivity for Jetpack Social. [#34243]

## [0.41.6] - 2023-11-20
### Removed
- Removed the 'jetpack/publicize' store. [#34111]

## [0.41.5] - 2023-11-14
### Added
- Added unit tests for Jetpack social store connections. [#34064]

### Changed
- Updated package dependencies. [#34093]

### Fixed
- Fixed post editor dirty state caused by Publicize state. [#34064]

## [0.41.4] - 2023-11-13
### Changed
- Updated dependencies.

## [0.41.3] - 2023-11-08
### Fixed
- Social: Fixed an issue where initial state of the Jetpack Social toggle is not in sync. [#33969]

## [0.41.2] - 2023-11-03
### Added
- Added Facebook to Quick Share buttons. [#33934]
- Added Nextdoor to Social Previews. [#33907]

### Changed
- Updated package dependencies. [#33904]

## [0.41.1] - 2023-10-26
### Fixed
- Fixed Social Image Generator debouncing. [#33767]

## [0.41.0] - 2023-10-23
### Added
- Added media restrictions for nextdoor media. [#33630]

### Changed
- Updated package dependencies. [#33646] [#33687]

### Removed
- Social: Remove tweetstorm editor components. [#33723]

### Fixed
- Connection Toggle: Prevented the change handler for firing when the component is disabled. [#33602]

## [0.40.2] - 2023-10-16
### Added
- Added aspect-ratio validation for Instagram images. [#33522]

### Changed
- Added type prop to custom media for social posts. [#33504]
- Changed Twitter icon and label to X. [#33445]
- Convert Twitter to X. [#33574]
- Replaced inline social icons with social-logos package. [#33613]
- Updated package dependencies. [#33429]

### Fixed
- Fixed an issue with conditional className property [#33592]
- Fixed tracking for quick share buttons [#33589]

## [0.40.1] - 2023-10-10
### Changed
- Updated package dependencies. [#33428]

## [0.40.0] - 2023-10-03
### Added
- Added a new post-publish panel for quick sharing [#33244]

## [0.39.1] - 2023-09-28
### Added
- Added Copy to clipboard button to sharing buttons [#33261]

## [0.39.0] - 2023-09-25
### Added
- Added a new post-publish panel for quick sharing. [#33231]
- Added sharing buttons to be used in post-publish panel. [#33074]
- Added tracking events for post publish share buttons. [#33231]

### Fixed
- Fixed versions. [#33231]
- Publicize: Reinstate the connect an account link. [#33182]

## [0.38.0] - 2023-09-19
### Changed
- Move auto-conversion notice near the Instagram one [#33106]
- Updated package dependencies. [#33001] [#33043]

### Fixed
- Fixed video previews for Social Previews [#33132]
- Only allow selectable image types for Social attached media [#33142]

## [0.37.0] - 2023-09-11
### Added
- Add the change settings logic in Social for the auto conversion feature [#32712]

### Changed
- Changed the isConvertible logic so that Auto conversion only works for Photon supported mime typesa [#32938]
- Social: Disable Share as a social post checkbox if there is no media on the post [#32922]

## [0.36.0] - 2023-09-04
### Changed
- Changed logic that disables the connections based on the auto-conversion feature [#32671]
- Updated package dependencies. [#32803] [#32804]

### Fixed
- Fixed an issue with the logic of getting the enchanced publishing feature [#32707]
- Fixed FB image size limit for restrictions [#32760]

## [0.35.0] - 2023-08-23
### Added
- Added the new auto-conversion toggle for Social [#32597]

### Changed
- Updated package dependencies. [#32605]

## [0.34.0] - 2023-08-21
### Added
- Added SIG toggle for Jetpack Settings [#32475]

### Changed
- Update connection toggles to be button switches [#32305]

### Fixed
- Social: Scope the preview image CSS to its container [#32539]

## [0.33.0] - 2023-08-09
### Changed
- Moved store to publicize-components package [#32317]
- Updated package dependencies. [#32166]

## [0.32.0] - 2023-08-07
### Added
- ADded new notice for admin page for Advanced plan upsell [#32128]
- Added new nudge in the editor to upgrade to the Advanced plan. Appears every 3 months [#32087]

### Changed
- Social: Move the Social Image Generator settings to a modal. [#31665]

### Fixed
- Fixed checkout link so it's not siteless [#32254]

## [0.31.0] - 2023-08-01
### Added
- Add check for seeing if user is on Basic plan. [#32112]

### Changed
- Change dismiss notice so it can be dismissed for a given time. [#32033]

## [0.30.0] - 2023-07-25
### Added
- Added instagram reel restrictions [#31808]

### Changed
- Refactor TemplatePicker component, so inner part can be use in it's own without a modal. [#31740]

## [0.29.1] - 2023-07-17
### Changed
- Updated package dependencies. [#31785]

### Fixed
- Fix Instagram Max size [#31912]

## [0.29.0] - 2023-07-10
### Changed
- Refactored component so it can accept values as prop, and disable debounce [#31700]

## [0.28.0] - 2023-07-05
### Changed
- Refactored the media validation so that it is done on a per connection basis [#31565]
- Updated package dependencies. [#31659] [#31661]

## [0.27.0] - 2023-06-26
### Changed
- Updated package dependencies. [#31468]

### Fixed
- Media picker: Constrain the preview image [#31461]
- Social Review Prompt: Fix the state so it is shown when Jetpack is also active [#31456]

## [0.26.3] - 2023-06-19
### Fixed
- Fixed an issue where Instagram restricitons are not working because of the service name [#31310]

## [0.26.2] - 2023-06-12
### Changed
- Improved the defaults for social previews [#31060]

## [0.26.1] - 2023-06-06
### Changed
- Updated package dependencies.

### Fixed
- Jetpack Social: Hide the image requirement notice when the site is out of shares [#31184]
- Simplified i18n strings [#31185]
- Social: Fixed the connection state to ensure that new connections are disabled by default when there are no shares left. [#31168]

## [0.26.0] - 2023-05-29
### Added
- Added account_name field to the connections post field. [#30937]
- Added Instagram preview to Social Previews [#30929]
- Instagram connection toggle [#30803]
- Jetpack Social: Add a notice to let users know Instagram is available [#30777]
- Mastodon post preview [#30919]

### Changed
- Bump social-previews version [#31034]
- Removed duplicate twitter preview [#29803]
- Social Preview: Shift the modal nav to the top [#29803]
- Updated Google Search preview [#29803]
- Updated the social previews to use the updated Calypso components [#29803]
- Update Facebook preview [#29803]

### Removed
- Removed duplicate styles [#29803]

### Fixed
- Ensured the media picker is disabled correctly [#30888]
- Fixed Instagram notice from showing up when you already have a connection. [#30980]
- Fixed Social Preview modal styling [#29803]
- Social Previews: Update the LinkedIn default profile image and make the text translatable [#31023]
- Use correct image in Social Previews [#29803]

## [0.25.0] - 2023-05-22
### Added
- Added validation of featured image for Instagram connections [#30724]

### Fixed
- Publicize: Update the UI logic to properly cope with broken connections [#30687]

## [0.24.0] - 2023-05-15
### Added
- Support both connection_id and token_id in publicize connection test results repsponse. [#30492]

## [0.23.0] - 2023-05-08
### Added
- Added support for flagging unsupported connections in the editor UI [#30280]

## [0.22.0] - 2023-05-02
### Changed
- Jetpack Social sidebar: Disable the Media Picker if Social Image Generator is enabled. [#30311]
- Reduced the file sizes of the Social Image Generator template previews. [#30301]
- Updated package dependencies.

### Fixed
- Jetpack Social: Render Social Image Generator panel even when SIG's default is disabled. [#30358]

## [0.21.0] - 2023-04-25
### Added
- Added new component social-post-control for toggling Share as a Social post. [#30185]
- Added new option for flagging a post as social post [#30179]

### Changed
- Use attached media for the OpenGraph image [#30162]

## [0.20.2] - 2023-04-17
### Changed
- Updated package dependencies. [#30019]

## [0.20.1] - 2023-04-04
### Changed
- Updated package dependencies. [#29854]

### Fixed
- Fixed featured image not loading on startup [#29752]

## [0.20.0] - 2023-03-28
### Added
- Added SIG image preview component [#29559]
- Added toggle to Social admin page to enable or disable Social Image Generator as well as an option to pick a default template [#29722]

## [0.19.0] - 2023-03-27
### Added
- Added SIG image preview component [#29559]

### Changed
- Use TemplatePicker to save selected template and send it to our token generation endpoint [#29590]

### Fixed
- Fixed infinite loop with media section [#29729]
- Fixed the bug where the attache media doesn't show up after post publish. [#29613]

## [0.18.0] - 2023-03-20
### Added
- Add Template Picker component to Jetpack Social [#29504]

### Changed
- Update deprecated core selector [#29420]

### Fixed
- Fixed a bug where reduce would show an error because of empty array [#29272]

## [0.17.1] - 2023-03-08
### Changed
- Updated package dependencies. [#29216]

## [0.17.0] - 2023-02-28
### Added
- Add Social Image Generator editor panel to post sidebar [#28737]
- Add Social Image Generator feature flag to Jetpack Social [#29001]
- Jetpack Social: Add Mastodon and default media upload restrictions [#29034]

### Removed
- Removed default image for SIG as it's not used yet [#29206]

### Fixed
- Update React peer dependencies to match updated dev dependencies. [#28924]

## [0.16.1] - 2023-02-20
### Changed
- Minor internal updates.

## [0.16.0] - 2023-02-15
### Changed
- Refactored media picker into seperate componetn [#28773]
- Update to React 18. [#28710]

## [0.15.2] - 2023-02-08
### Changed
- Changed remaining shares phrasing [#28688]
- Updated package dependencies. [#28682]

## [0.15.1] - 2023-02-01
### Fixed
- Add support for VideoPress videos to the Jetpack Social media picker [#28666]

## [0.15.0] - 2023-01-30
### Added
- Added video preview [#28547]

## [0.14.0] - 2023-01-26
### Changed
- Update Media Picker UI in Jetpack Social sidebar to match new designs [#28527]

## [0.13.1] - 2023-01-23
### Fixed
- Clean up JavaScript eslint issues. [#28441]

## [0.13.0] - 2023-01-11
### Added
- Extended media validation hook to validate videos [#27840]

### Changed
- Updated package dependencies.

## [0.12.0] - 2023-01-02
### Added
- Add a review request prompt for Jetpack Social plugin [#28072]

## [0.11.1] - 2022-12-19
### Changed
- Updated package dependencies. [#27916]

## [0.11.0] - 2022-12-12
### Added
- Media validator for image picker [#27610]
- Social: Added a 'more info' link to the plan details in the editor nudge [#27617]

## [0.10.1] - 2022-12-06
### Added
- Add simple JS React test for PublicizeConnection component [#27122]

### Changed
- Updated package dependencies. [#27688, #27696, #27697]

## [0.10.0] - 2022-11-28
### Changed
- Make upgrade nudge text more clear [#27490]
- Social Previews: show custom Jetpack SEO Page Title if set for a post. [#27236]
- Updated package dependencies. [#26069]

## [0.9.0] - 2022-11-14
### Added
- Added media section to Jetpack Social panel [#26930]

### Changed
- Updated package dependencies. [#27319]

## [0.8.3] - 2022-11-08
### Changed
- Updated package dependencies. [#27289]

## [0.8.2] - 2022-11-01
### Changed
- Updated package dependencies. [#27196]

## [0.8.1] - 2022-10-27
### Fixed
- Publicize Components: Fix the panel component refactor [#27095]

## [0.8.0] - 2022-10-25
### Added
- Display broken connections to user in editor [#25803]

### Changed
- Reshare: Refactored the config logic and moved in the additional components for resharing [#25993]

### Fixed
- Social: Fix the path to the connections URL in the editor [#26932]

## [0.7.4] - 2022-10-17
### Changed
- Updated package dependencies. [#26851]

## [0.7.3] - 2022-10-13
### Changed
- Updated package dependencies. [#26790]

## [0.7.2] - 2022-10-06
### Changed
- Do not open upgrade links from Jetpack Social in a new tab [#26649]

## [0.7.1] - 2022-10-05
### Changed
- Updated package dependencies. [#26457]

## [0.7.0] - 2022-09-27
### Added
- Publicize Components: Move the usePublciizeConfig hook to the package [#26420]

### Changed
- Updated package dependencies.

## [0.6.0] - 2022-09-20
### Added
- Added Jetpack social redirect urls. [#26135]

### Changed
- Updated package dependencies. [#26081]

## [0.5.2] - 2022-09-13
### Changed
- Updated package dependencies. [#26072]

## [0.5.1] - 2022-09-08
### Changed
- Updated package dependencies.

## [0.5.0] - 2022-08-31
### Added
- Added Social Previews components. [#25931]

## [0.4.0] - 2022-08-30
### Added
- Enforce sharing limits for Jetpack Social in the block editor, if it is enabled for a site. [#25661]

### Changed
- Rebrand Publicize to Jetpack Social [#25787]
- Updated package dependencies. [#25814]

## [0.3.6] - 2022-08-23
### Changed
- Updated package dependencies. [#25338, #25339, #25377, #25762]

## [0.3.5] - 2022-08-03
### Changed
- Updated package dependencies. [#25281]

## [0.3.4] - 2022-07-26
### Changed
- Updated package dependencies. [#25147]

## [0.3.3] - 2022-07-12
### Changed
- Updated package dependencies. [#25048, #25055]

## [0.3.2] - 2022-07-06
### Changed
- Updated package dependencies. [#24923]

## [0.3.1] - 2022-06-28
### Removed
- Remove unused peer dependency on `enzyme`. [#24803]

## [0.3.0] - 2022-06-21
### Changed
- Updated package dependencies. [#24766]

### Fixed
- Profile pictures now fail gracefully if they fail to load for any reason [#24736]

## [0.2.2] - 2022-06-14
### Changed
- Updated package dependencies. [#24722]

## [0.2.1] - 2022-06-08
### Changed
- Reorder JS imports for `import/order` eslint rule. [#24601]
- Updated package dependencies. [#24510]

## [0.2.0] - 2022-05-31
### Added
- Publicize Components: Move the remaining components and hooks required for Jetpack Social [#24464]

### Changed
- Updated package dependencies. [#24475] [#24573]

## 0.1.0 - 2022-05-24
### Added
- Created the package and moved the store, connection and twitter components [#24408]

### Changed
- Updated package dependencies. [#24470]

[0.84.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.83.1...v0.84.0
[0.83.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.83.0...v0.83.1
[0.83.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.82.0...v0.83.0
[0.82.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.81.0...v0.82.0
[0.81.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.80.0...v0.81.0
[0.80.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.79.0...v0.80.0
[0.79.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.78.0...v0.79.0
[0.78.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.77.2...v0.78.0
[0.77.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.77.1...v0.77.2
[0.77.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.77.0...v0.77.1
[0.77.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.76.0...v0.77.0
[0.76.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.75.4...v0.76.0
[0.75.4]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.75.3...v0.75.4
[0.75.3]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.75.2...v0.75.3
[0.75.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.75.1...v0.75.2
[0.75.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.75.0...v0.75.1
[0.75.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.74.2...v0.75.0
[0.74.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.74.1...v0.74.2
[0.74.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.74.0...v0.74.1
[0.74.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.73.0...v0.74.0
[0.73.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.72.1...v0.73.0
[0.72.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.72.0...v0.72.1
[0.72.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.71.5...v0.72.0
[0.71.5]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.71.4...v0.71.5
[0.71.4]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.71.3...v0.71.4
[0.71.3]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.71.2...v0.71.3
[0.71.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.71.1...v0.71.2
[0.71.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.71.0...v0.71.1
[0.71.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.70.1...v0.71.0
[0.70.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.70.0...v0.70.1
[0.70.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.69.0...v0.70.0
[0.69.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.68.0...v0.69.0
[0.68.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.67.0...v0.68.0
[0.67.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.66.1...v0.67.0
[0.66.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.66.0...v0.66.1
[0.66.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.65.0...v0.66.0
[0.65.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.64.0...v0.65.0
[0.64.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.63.0...v0.64.0
[0.63.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.62.0...v0.63.0
[0.62.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.61.0...v0.62.0
[0.61.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.60.0...v0.61.0
[0.60.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.59.0...v0.60.0
[0.59.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.58.0...v0.59.0
[0.58.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.57.0...v0.58.0
[0.57.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.56.2...v0.57.0
[0.56.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.56.1...v0.56.2
[0.56.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.56.0...v0.56.1
[0.56.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.55.1...v0.56.0
[0.55.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.55.0...v0.55.1
[0.55.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.54.6...v0.55.0
[0.54.6]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.54.5...v0.54.6
[0.54.5]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.54.4...v0.54.5
[0.54.4]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.54.3...v0.54.4
[0.54.3]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.54.2...v0.54.3
[0.54.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.54.1...v0.54.2
[0.54.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.54.0...v0.54.1
[0.54.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.53.0...v0.54.0
[0.53.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.52.0...v0.53.0
[0.52.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.51.1...v0.52.0
[0.51.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.51.0...v0.51.1
[0.51.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.50.0...v0.51.0
[0.50.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.49.3...v0.50.0
[0.49.3]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.49.2...v0.49.3
[0.49.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.49.1...v0.49.2
[0.49.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.49.0...v0.49.1
[0.49.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.48.5...v0.49.0
[0.48.5]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.48.4...v0.48.5
[0.48.4]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.48.3...v0.48.4
[0.48.3]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.48.2...v0.48.3
[0.48.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.48.1...v0.48.2
[0.48.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.48.0...v0.48.1
[0.48.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.47.1...v0.48.0
[0.47.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.47.0...v0.47.1
[0.47.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.46.0...v0.47.0
[0.46.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.45.2...v0.46.0
[0.45.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.45.1...v0.45.2
[0.45.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.45.0...v0.45.1
[0.45.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.44.2...v0.45.0
[0.44.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.44.1...v0.44.2
[0.44.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.44.0...v0.44.1
[0.44.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.43.0...v0.44.0
[0.43.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.42.0...v0.43.0
[0.42.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.41.9...v0.42.0
[0.41.9]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.41.8...v0.41.9
[0.41.8]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.41.7...v0.41.8
[0.41.7]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.41.6...v0.41.7
[0.41.6]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.41.5...v0.41.6
[0.41.5]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.41.4...v0.41.5
[0.41.4]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.41.3...v0.41.4
[0.41.3]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.41.2...v0.41.3
[0.41.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.41.1...v0.41.2
[0.41.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.41.0...v0.41.1
[0.41.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.40.2...v0.41.0
[0.40.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.40.1...v0.40.2
[0.40.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.40.0...v0.40.1
[0.40.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.39.1...v0.40.0
[0.39.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.39.0...v0.39.1
[0.39.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.38.0...v0.39.0
[0.38.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.37.0...v0.38.0
[0.37.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.36.0...v0.37.0
[0.36.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.35.0...v0.36.0
[0.35.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.34.0...v0.35.0
[0.34.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.33.0...v0.34.0
[0.33.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.32.0...v0.33.0
[0.32.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.31.0...v0.32.0
[0.31.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.30.0...v0.31.0
[0.30.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.29.1...v0.30.0
[0.29.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.29.0...v0.29.1
[0.29.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.28.0...v0.29.0
[0.28.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.27.0...v0.28.0
[0.27.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.26.3...v0.27.0
[0.26.3]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.26.2...v0.26.3
[0.26.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.26.1...v0.26.2
[0.26.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.26.0...v0.26.1
[0.26.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.25.0...v0.26.0
[0.25.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.24.0...v0.25.0
[0.24.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.23.0...v0.24.0
[0.23.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.22.0...v0.23.0
[0.22.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.21.0...v0.22.0
[0.21.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.20.2...v0.21.0
[0.20.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.20.1...v0.20.2
[0.20.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.20.0...v0.20.1
[0.20.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.19.0...v0.20.0
[0.19.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.18.0...v0.19.0
[0.18.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.17.1...v0.18.0
[0.17.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.17.0...v0.17.1
[0.17.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.16.1...v0.17.0
[0.16.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.16.0...v0.16.1
[0.16.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.15.2...v0.16.0
[0.15.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.15.1...v0.15.2
[0.15.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.15.0...v0.15.1
[0.15.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.13.1...v0.14.0
[0.13.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.13.0...v0.13.1
[0.13.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.11.1...v0.12.0
[0.11.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.8.3...v0.9.0
[0.8.3]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.8.2...v0.8.3
[0.8.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.7.4...v0.8.0
[0.7.4]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.5.2...v0.6.0
[0.5.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.3.6...v0.4.0
[0.3.6]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.3.5...v0.3.6
[0.3.5]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.3.4...v0.3.5
[0.3.4]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-publicize-components/compare/v0.1.0...v0.2.0
