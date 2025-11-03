# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.67.0] - 2025-11-03
### Changed
- Don't translate product names. [#43961]
- Update dependencies. [#45664]

## [0.66.19] - 2025-10-27
### Changed
- Update dependencies. [#44736]

## [0.66.18] - 2025-10-20
### Fixed
- Sharing: Prevent PHP fatals when passed malformed data. [#45418]

## [0.66.17] - 2025-10-10
### Changed
- Update dependencies. [#44736]

## [0.66.16] - 2025-10-06
### Changed
- Update package dependencies. [#45334]

## [0.66.15] - 2025-09-29
### Changed
- Update dependencies. [#44736]

## [0.66.14] - 2025-09-22
### Changed
- Update dependencies. [#44736]

## [0.66.13] - 2025-09-19
### Changed
- Update package dependencies. [#45173] [#45229]

## [0.66.12] - 2025-09-15
### Changed
- Update package dependencies. [#45127] [#45128]

## [0.66.11] - 2025-09-08
### Changed
- Update package dependencies. [#45027]

## [0.66.10] - 2025-09-01
### Fixed
- Social: Allow default image to be cleared. [#44994]

## [0.66.9] - 2025-08-25
### Changed
- Update package dependencies. [#44899]

### Fixed
- Code: Resolve `PhanImpossibleCondition` violations. [#44869]

## [0.66.8] - 2025-08-18
### Changed
- Update dependencies. [#44736]

## [0.66.7] - 2025-08-14
### Changed
- Update package dependencies. [#44701]

## [0.66.6] - 2025-08-11
### Changed
- Update dependencies. [#44673]
- Update package dependencies. [#44677]

## [0.66.5] - 2025-08-05
### Added
- Social Image Generator: Add font option. [#44514] [#44634]

### Changed
- Social Image Generator: Ensure the feature can be used on WordPress.com Private sites. [#44624]

## [0.66.4] - 2025-08-04
### Changed
- Internal updates.

## [0.66.3] - 2025-07-28
### Deprecated
- Social Image Generator: Deprecate unused methods. [#44378]

### Fixed
- Social Image Generator: Do not use the latest post's Social Image as Open Graph Image tag on the home page. [#44377]
- Social Image Generator: Ensure token generation is limited on WordPress.com Simple sites. [#44350]

## [0.66.2] - 2025-07-21
### Changed
- Update package dependencies. [#44356]

## [0.66.1] - 2025-07-14
### Changed
- Update dependencies. [#44229]

## [0.66.0] - 2025-07-07
### Changed
- Scripts: Ensure host-related checks and functionality are only added via Assets. [#44133]
- Social: Hide admin page in Jetpack plugin if site not connected. [#44168]
- Update dependencies. [#44161]
- Update package dependencies. [#44148] [#44151]

### Fixed
- get_current_screen(): Check for the existence before trying to call it [#44192]

## [0.65.7] - 2025-06-30
### Changed
- Update dependencies. [#44061]

## [0.65.6] - 2025-06-24
### Changed
- Update dependencies. [#44061]

## [0.65.5] - 2025-06-23
### Changed
- Update dependencies. [#44002]
- Update package dependencies. [#44020]

## [0.65.4] - 2025-06-16
### Changed
- Update dependencies. [#42943]

## [0.65.3] - 2025-06-05
### Changed
- Update package dependencies. [#43734]

## [0.65.2] - 2025-06-02
### Changed
- Update package dependencies. [#43710]

### Fixed
- Social: Ensure images load in connections management when concatenating JS. [#43655]

## [0.65.1] - 2025-05-26
### Changed
- Update package dependencies. [#43578]

## [0.65.0] - 2025-05-22
### Added
- Added option to set default image for Social Image Generator. [#43461]

### Changed
- Update package dependencies. [#43516]

## [0.64.5] - 2025-05-19
### Changed
- Update package dependencies. [#43398]

## [0.64.4] - 2025-05-12
### Changed
- Update package dependencies. [#43400]

## [0.64.3] - 2025-05-05
### Changed
- Update package dependencies. [#43326]

## [0.64.2] - 2025-04-28
### Fixed
- Newsletters: Show newsletter widget on P2s. [#43085]

## [0.64.1] - 2025-04-21
### Changed
- Remove a stale comment in connections post field. [#43061]
- Social: Re-enable resharing in classic editor on Simple sites. [#43005]

## [0.64.0] - 2025-04-17
### Changed
- Publicize: Improve package initialization. [#42737]
- Re-enable unit tests for share status. [#43099]

### Fixed
- Do not load the module on private WordPress.com sites. [#43078]

## [0.63.0] - 2025-04-14
### Added
- Add share status support for WordPress.com sites. [#42593]

### Changed
- Improved the logic for share status. [#42978]

### Fixed
- Linting: Use double colon notation for pseudo-element selectors. [#43019]
- Social: Always register the product info endpoint regardless of Publicize being active. [#42812]
- Social: Do not load in the editor if module is off. [#43006]

## [0.62.5] - 2025-04-07
### Changed
- Update dependencies. [#42820]
- Update package dependencies. [#42809]

## [0.62.4] - 2025-03-31
### Changed
- Internal updates.

## [0.62.3] - 2025-03-24
### Fixed
- Publicize: Update the Jetpack plugin version check. [#42649]

## [0.62.2] - 2025-03-21
### Added
- Social: Add `wpcom/v2` endpoint for Social Image Generator token generation. [#42534]

### Deprecated
- Social: Deprecate `jetpack/v4` endpoint for Social Image Generator token. [#42574]

### Fixed
- Keyring Helper: Move initialization to pre_initialization to let it work even when Publicize is off. [#42604]
- Social: Fix permission check for connection url. [#42572]

## [0.62.1] - 2025-03-19
### Changed
- Update dependencies. [#42564]

## [0.62.0] - 2025-03-18
### Changed
- Move the `jetpack-social` endpoint to the Publicize package. [#42187]
- Update package dependencies. [#42511]

### Fixed
- Fix compatibility with older versions of Jetpack. [#42503]

## [0.61.5] - 2025-03-17
### Changed
- Internal updates.

## [0.61.4] - 2025-03-17
### Changed
- Improve scheduled-actions endpoint permission checks. [#42318]
- Social: Change the query parameter to open Jetpack sidebar on editor load. [#42364]

### Removed
- Remove the useAdminUiV1 feature flag. [#42451]
- Social: Connections schema: Remove the deprecated fields. [#42454]
- Social: Removed the old unused initial state. [#42390]
- Social: Remove unused scheduled-actions endpoint routes. [#42415]

## [0.61.3] - 2025-03-12
### Changed
- Update package dependencies. [#42384]

## [0.61.2] - 2025-03-10
### Changed
- Move share post endpoint from Jetpack to publicize package. [#42179]
- Social: Move JS editor code from Jetpack and Social to Publicize package. [#41836]
- Make scheduled-actions endpoint compatible with getEntityRecords. [#42283]

### Fixed
- Social: Fix stylesheets loaded on the front-end when not needed. [#42289]
- Social: Fix the share date schema for scheduled actions endpoint. [#42244]

## [0.61.1] - 2025-03-03
### Added
- Move publicize/scheduled-actions enpoint from WPCOM to publicize. [#42136]

### Changed
- Social: Improve connect URL generation. [#42019]
- Update package dependencies. [#42163]

### Deprecated
- Deprecate jetpack/v4 connection endpoints. [#41911]

### Fixed
- Social: Fix PHP warnings on WPCOM. [#42107]
- Social: Fix Social post UI not showing connections. [#42095]

## [0.61.0] - 2025-02-24
### Added
- Social: Update the admin page for use by Editors and Authors. [#41859]

### Changed
- Script data: Extract less host information. [#41890]
- Social: Use new connections class for share status. [#41905]
- Update the connections schema for classic editor. [#41778]
- Update Keyring_Helper class and enable publicize services caching [#41460]

### Removed
- Remove the deprecated "dismiss notice" functionality. [#41987]

### Fixed
- Code: Prevent dynamic class properties. [#41857]
- Fix social connection toggle. [#41912]

## [0.60.1] - 2025-02-17
### Changed
- Internal updates.

## [0.60.0] - 2025-02-11
### Changed
- Register social/settings endpoint only if Jetpack version does not have it. [#41596]
- Use social admin for connections URL. [#41541]

## [0.59.1] - 2025-02-10
### Changed
- Update package dependencies. [#41491]

## [0.59.0] - 2025-02-03
### Added
- Enable Social Post UI for WordPress.com. [#41219]

### Changed
- Move Social admin page code and assets logic to publicize package. [#41239]
- Move initial state from Social plugin to publicize package. [#41381]
- Phan: Update baselines. [#41263]
- Move Social settings endpoint to publicize package. [#41456]
- Use feature flag for Social admin page. [#41413]
- Update package dependencies. [#41286]
- Update the settings endpoint to use existing endpoints. [#41461]
- Use Admin_Menu::remove_menu to handle old Social menu item. [#41422]

### Fixed
- Fix the default value for UTM settings schema. [#41386]
- Fix connections cache when WordPress.com API call fails. [#41392]
- Fix the API calls on WordPress.com for options. [#41420]

## [0.58.0] - 2025-01-27
### Changed
- Refactored Social Note settings to use core. [#41153]
- Unify connections management API schema. [#40679]
- Use feature flag for share status data. [#41218]

### Fixed
- Fix profile links for LinkedIn connections. [#40873]
- Fix editor invalid parameters error for old Jetpack versions. [#41199]
- Fix feature check for social connections list initial state. [#40679]

## [0.57.4] - 2025-01-20
### Changed
- Code: Use function-style exit() and die() with a default status code of 0. [#41167]
- License: Social admin page header hides license link on WoA sites. [#41076]
- Updated package dependencies. [#41099]

### Fixed
- Social Disable caching for publicize services list to avoid stale nonces [#41149]
- Social | Fixed the status field for connections to allow null [#41114]

## [0.57.3] - 2025-01-14
### Fixed
- Social: Fix failure on post save with LinkedIn connection enabled. [#41000]

## [0.57.2] - 2025-01-13
### Added
- Publicize: Allow filtering of connections in publicize rest endpoint. [#40914]

### Changed
- Update connections post field rest endpoint to use the updated schema. [#40916]

## [0.57.1] - 2024-12-30
### Fixed
- Social: Ensure that broken connection notices work fine on WoA sites. [#40732]

## [0.57.0] - 2024-12-23
### Changed
- Move wpcom/v2/publicize/connections endpoint to publicize package. [#40607]
- Script data: Don't call service endpoint on WP.com. [#40596]

## [0.56.5] - 2024-12-16
### Changed
- Updated package dependencies. [#40564]

## [0.56.4] - 2024-12-09
### Changed
- Updated package dependencies. [#40363]

## [0.56.3] - 2024-12-02
### Changed
- Made resharing async in classic editor to fix timeout issues. [#40302]

## [0.56.2] - 2024-11-26
### Fixed
- Fix undefined index error on Atomic sites. [#40337]

## [0.56.1] - 2024-11-25
### Added
- Add initial post share status to the initial state. [#40301]

### Changed
- Updated package dependencies. [#40286] [#40288]

### Fixed
- Fix initial state error in the editor for Simple sites. [#40319]
- Fix page-detection util methods to stop unnecessary API calls to WordPress.com. [#40311]
- Fix call to undefined method on WordPress.com. [#40328]

## [0.56.0] - 2024-11-18
### Added
- Add a new toggle for UTM tracking. [#39998]

### Removed
- General: Update minimum PHP version to 7.2. [#40147]

## [0.55.2] - 2024-11-11
### Changed
- Social: Migrated social plugins settings to new script data. [#40032] [#40081]
- Updated package dependencies. [#39999]

## [0.55.1] - 2024-11-04
### Added
- Enable test coverage. [#39961]

### Changed
- Social: Migrated Social Image Generator settings to new store [#39904]

## [0.55.0] - 2024-10-25
### Fixed
- Social: Fix Bsky profile URL [#39849]

## [0.54.4] - 2024-10-21
### Changed
- Initial State: Migrated URLs to script data. [#39797]

### Fixed
- Fixed the site features for Simple sites. [#39817]

## [0.54.3] - 2024-10-14
### Changed
- Updated package dependencies. [#39707]

## [0.54.2] - 2024-10-07
### Changed
- Updated package dependencies. [#39594]

## [0.54.1] - 2024-10-02
### Fixed
- Social: Fixed Bluesky not showing up on page load [#39597]

## [0.54.0] - 2024-09-23
### Added
- Added tracking for the resharing action [#39408]

### Changed
- Social: Disabled resharing on Simple sites in classic editor [#39419]
- Social: Migrated useEditorPreview feature flag to new script data [#39405]
- Social: Migrated useShareStatus feature flag to new script data [#39404]

## [0.53.0] - 2024-09-16
### Added
- Social: adds hook for plugin developers to be able to pull social share URLs on save. [#39398]

### Changed
- Moved initialization of Publicize UI from init action to admin_init action [#39342]
- Social: Migrated useAdminUiV1 feature flag to new script data [#39137]

### Removed
- Social: Cleaned up media auto-conversion backend logic [#38587]

### Fixed
- Hide share logs not belonging to current admin. [#39379]

## [0.52.3] - 2024-09-10
### Changed
- Updated package dependencies. [#39302]

## [0.52.2] - 2024-09-09
### Changed
- Internal updates.

## [0.52.1] - 2024-09-06
### Changed
- Internal updates.

## [0.52.0] - 2024-09-05
### Changed
- Made resharing async [#39227]
- Updated package dependencies. [#39176]

## [0.51.0] - 2024-09-02
### Added
- Add share status log modal to published posts [#39051]

## [0.50.1] - 2024-08-29
### Added
- Added share status info to Jetpack sidebar [#39073]

### Changed
- Updated package dependencies. [#39111]

## [0.50.0] - 2024-08-26
### Added
- Added the new feature flag for the social share status [#39015]

### Changed
- Social: Migrated shares data to the new script data [#38988]
- Updated package dependencies. [#39004]

## [0.49.2] - 2024-08-21
### Changed
- Social; Migrated the API paths from initial state to the new script data [#38962]

## [0.49.1] - 2024-08-19
### Changed
- Social: Migrated services list to the initial state. [#38924]
- Updated package dependencies. [#38662]

### Fixed
- Fix incorrect next-version tokens in php `@since` and/or `@deprecated` docs. [#38869]
- Social: Fixed connection services list crash on simple sites. [#38954]

## [0.49.0] - 2024-08-12
### Changed
- Open Graph Meta Tags: Stopped handling Fediverse tags from Publicize package. [#38809]
- Social: Updated intial state logic to use the new consolidated initial state. [#38606]

## [0.48.0] - 2024-08-05
### Added
- Added endpoint to sync shares post meta back to the self-hosted site. [#38702]
- Added feature flag management for social [#38669]

### Fixed
- Cleaned-up publicize shares rest endpoint [#38709]

## [0.47.4] - 2024-08-01
### Removed
- Removed Fediverse og filters to fix fatals [#38612]

### Fixed
- Fixed Threads connections not having a profile_url [#38611]

## [0.47.3] - 2024-07-15
### Added
- Mastodon: display a Fediverse Creator tag when the post author has connected their account to a Mastodon account. [#38198]

### Changed
- Social: Removed unnecessary feature checks for social connections [#38216]

## [0.47.2] - 2024-07-08
### Fixed
- Social | Fixed the permissions for update and disconnection connections endpoints [#38187]

## [0.47.1] - 2024-07-03
### Changed
- Updated package dependencies. [#38132]

## [0.47.0] - 2024-07-01
### Removed
- Removed share as a social post toggle [#37964]

### Fixed
- Ensured that connections are only fetched once per request [#38080]

## [0.46.3] - 2024-06-26
### Added
- Added social preview for Threads [#38003]

## [0.46.2] - 2024-06-24
### Added
- Added Social resharing for classic editor [#37810]

### Changed
- Removed unneeded check for connection management wpcom [#37899]

### Fixed
- Added support for Threads for Social connections [#37977]

## [0.46.1] - 2024-06-17
### Fixed
- Fixed connections management links for classic editor [#37681]

## [0.46.0] - 2024-06-13
### Changed
- Changed the social-product-info endpoint to return v1 plan [#36846]

## [0.45.2] - 2024-06-05
### Added
- Publicize: Package version update [#37683]

### Changed
- Updated package dependencies. [#37669]

## [0.45.1] - 2024-06-03
### Changed
- Social: Update upgrade nudges to use the new plan. [#37638]

## [0.45.0] - 2024-05-27
### Changed
- Added external_id to connections field. [#37405]
- Changed how social connections are cached by moving to using transients. [#37500]
- Moved "can_manage_connection" method to Publicize_Base class. [#37532]
- Fixed no connections UI for editor. [#37571]
- Updated the connection test results endpoint for front-end. [#37531]
- Standardized the rest endpoint structure for Jetpack social connections. [#37510]

### Fixed
- Disconnect button was not showing for connections in the editor. [#37501]

## [0.44.1] - 2024-05-20
### Changed
- Changed the connections management feature flag check to include the WP.com plan feature. [#37425]
- Social: Updated connection modal UI. [#37420]
- Updated package dependencies. [#37379]

### Fixed
- Added back the previous Open Graph filter function. [#37368]
- Fixed the typo in the Open Graph hook. [#37411]

## [0.44.0] - 2024-05-13
### Added
- Add connect form/button for connection management. [#37196]
- Social Connections: Added disconnection confirmation dialog. [#37310]
- Wired up disconnect button and added reconnect button. [#37237]

## [0.43.0] - 2024-05-06
### Added
- Added feature flag for new social admin UI. [#37134]
- Added new endpoint to delete publicize connection. [#37115]
- Social Admin page: Added connection management component. [#37120]

### Changed
- Updated package dependencies. [#37147]

## [0.42.13] - 2024-04-29
### Changed
- Internal updates.

## [0.42.12] - 2024-04-25
### Changed
- Internal updates.

## [0.42.11] - 2024-04-22
### Changed
- Internal updates.

## [0.42.10] - 2024-04-15
### Fixed
- Fixed 403 error for SIG for non-admin authors. [#36894]

## [0.42.9] - 2024-04-08
### Changed
- Updated package dependencies. [#36760]

### Fixed
- Fixed the learn more link. [#36735]

## [0.42.8] - 2024-03-27
### Changed
- Updated package dependencies. [#36585]

## [0.42.7] - 2024-03-25
### Changed
- Internal updates.

## [0.42.6] - 2024-03-18
### Changed
- Internal updates.

## [0.42.5] - 2024-03-12
### Changed
- Updated package dependencies. [#36325]

### Fixed
- REST requests: avoid potential warnings with custom objects. [#36315]

## [0.42.4] - 2024-03-04
### Security
- Added new tests for the OG image optimization logic [#35987]

### Changed
- Updated package dependencies. [#36095]

## [0.42.3] - 2024-02-26
### Fixed
- Deprecate the sharing_menu method of the Publicize_UI class. [#35810]

## [0.42.2] - 2024-02-14
### Fixed
- Fixed an issue where on old sites og:image is an array that causes issues [#35688]

## [0.42.1] - 2024-02-13
### Changed
- Updated package dependencies. [#35608]

## [0.42.0] - 2024-02-12
### Changed
- Change editor layout for social notes [#35536]
- Hid the custom message box for social notes in the classic editor [#35540]
- OG image will be converted to match platform requirements even if its inside the body [#35038]

### Fixed
- Fixed a bug where a parameter is missing [#35601]

## [0.41.0] - 2024-02-05
### Changed
- Updated package dependencies. [#35384]
- Use Blog ID in links to WPCOM instead of site slug. [#35006]

## [0.40.0] - 2024-01-18
### Changed
- Changed dismissed notices endpoint to be a core endpoint [#34544]

## [0.39.0] - 2024-01-04
### Changed
- Updated package dependencies. [#34815]

### Removed
- Social: Remove obsolete tweetstorm files. [#34330]

## [0.38.3] - 2023-12-20
### Fixed
- Fixed backwards compatibility with Social store refactor. [#34566]

## [0.38.2] - 2023-12-15
### Fixed
- Social: Fixed issue with auto-conversion option logic. [#34666]

## [0.38.1] - 2023-12-14
### Fixed
- Fixed Jetpack Social scheduled post messaging. [#34182]
- Social: Fixed bug with PHP conversion error. [#34636]
- Updated version. [#34182]

## [0.38.0] - 2023-12-11
### Changed
- Social: Refactored storing of feature options to use core functions. [#34113]

### Removed
- Social: Removed deprecated files because of refactore. [#34113]

## [0.37.2] - 2023-12-03
### Changed
- Updated package dependencies. [#34411]

## [0.37.1] - 2023-11-24
### Removed
- Removed unused code. [#34241]

## [0.37.0] - 2023-11-20
### Changed
- Replaced usage of strpos() with str_starts_with(). [#34135]
- Removed the 'jetpack/publicize' store. [#34111]
- Updated required PHP version to >= 7.0. [#34192]

## [0.36.6] - 2023-11-14
### Changed
- Updated package dependencies. [#34093]

## [0.36.5] - 2023-11-03
### Added
- Added Nextdoor to Social Previews. [#33907]

## [0.36.4] - 2023-10-23
### Added
- Social: Add the Nextdoor connection toggle. [#33663]

### Changed
- Updated package dependencies. [#33687]

## [0.36.3] - 2023-10-16
### Changed
- Added type prop to custom media for social posts. [#33504]

## [0.36.2] - 2023-10-10
### Changed
- Updated package dependencies. [#33428]

## [0.36.1] - 2023-09-19
### Fixed
- Classic Editor Notices: do not display Twitter in post-publish message. [#33063]
- Publicize: Ensure that the auto-conversion setting is enabled by default [#33088]

## [0.36.0] - 2023-09-04
### Changed
- Changed logic that disables the connections based on the auto-conversion feature [#32671]
- Updated option name [#32693]
- Updated package dependencies. [#32803]

## [0.35.0] - 2023-08-23
### Added
- Added the new auto-conversion toggle for Social [#32597]

### Changed
- Updated package dependencies. [#32605]

## [0.34.0] - 2023-08-21
### Added
- Added key for auto-conversion settings. [#32577]
- Social: Added endpoint for media auto-conversion settings. [#32342]

### Fixed
- Publicize: Prevent metadata updates for published posts [#32301]

## [0.33.1] - 2023-08-09
### Changed
- Updated package dependencies. [#32166]

## [0.33.0] - 2023-08-07
### Added
- Added admin-page upsell notice [#32128]
- Added new nudge in the editor to upgrade to the Advanced plan. Appears every 3 months [#32087]

## [0.32.0] - 2023-08-01
### Changed
- Change dismiss notice so it can be dismissed for a given time. [#32033]

## [0.31.0] - 2023-07-25
### Added
- Added instagram reel restrictions [#31808]

## [0.30.4] - 2023-07-17
### Changed
- Updated package dependencies. [#31785]

## [0.30.3] - 2023-07-05
### Changed
- Updated package dependencies. [#31659]

## [0.30.2] - 2023-06-26
### Changed
- Updated package dependencies. [#31468]

## [0.30.1] - 2023-06-06
### Changed
- Updated package dependencies. [#31129]

### Fixed
- Simplified i18n strings [#31185]

## [0.30.0] - 2023-05-29
### Added
- Added account_name field to the publicize connections object. [#30937]
- Added the Instagram service [#30803]
- Check for featured image in the classic editor [#30769]
- Jetpack Social: Add a notice to let users know Instagram is available [#30777]
- Mastodon post preview [#30919]

### Changed
- Changed the enhanced publishing feature check to use Current_Plan [#29881]

## [0.29.0] - 2023-05-22
### Added
- Added validation of featured image for Instagram connections [#30724]

### Fixed
- Added a failsafe check for error codes [#30748]
- Publicize: Update the UI logic to properly cope with broken connections [#30687]

## [0.28.0] - 2023-05-15
### Added
- Added Mastodon to list of supported services [#30661]

### Changed
- Changed how we update the publicize skip meta. [#30479]
- Get Jetpack to use connection_id as the uninque identifier of the editor elements on the sidebar [#30492]
- PHP 8 Compatibility fixes [#30692]

## [0.27.0] - 2023-05-08
### Added
- Added support for flagging unsupported connections in the editor UI [#30280]

## [0.26.0] - 2023-05-02
### Changed
- Updated package dependencies. [#30375]

## [0.25.1] - 2023-05-01
### Fixed
- Jetpack Social: Render Social Image Generator panel even when SIG's default is disabled [#30358]

## [0.25.0] - 2023-04-25
### Added
- Added new option for flagging a post as social post [#30179]

### Changed
- Added dynamic pricing to Social admin page [#30105]
- Use attached media for the OpenGraph image [#30162]

## [0.24.2] - 2023-04-10
### Added
- Add Jetpack Autoloader package suggestion. [#29988]

### Fixed
- Reinstated is_social_image_generator_enabled for backwards compatibility [#29952]

## [0.24.1] - 2023-04-04
### Changed
- Updated package dependencies. [#29854]

## [0.24.0] - 2023-03-28
### Changed
- Jetpack Social: Enable Social Image Generator by default when it's available. [#29742]
- Use picked default template for Social Image Generator [#29722]

## [0.23.0] - 2023-03-27
### Added
- Add new endpoint to Social Image Generator to get and update SIG-specific options [#29624]
- Social: Added an endpoint to generate a token for use as the preview of the social image. [#29596]

### Changed
- Moved SIG initilization to the admin_init hooks and updated the check to find out whether SIG is enabled to use the current plans package and added code to refresh plan data on every jetpack heartbeat." [#29529]
- Updated package dependencies. [#29529]
- Use TemplatePicker to save selected template and send it to our token generation endpoint [#29590]

## [0.22.0] - 2023-03-20
### Added
- Added SIG image to the post media array if it's enabled [#29093]

### Changed
- Updated package dependencies. [#29471]

### Fixed
- Prevent metadata updates during autosave. [#29263]

## [0.21.0] - 2023-03-13
### Added
- Add Social Image Generator class to Publicize [#29118]

## [0.20.1] - 2023-03-08
### Changed
- Updated package dependencies. [#29216]

## [0.20.0] - 2023-02-28
### Added
- Add options panel for Social Image Generator to Jetpack Social sidebar. [#28737]
- Add Social Image Generator feature flag to Jetpack Social [#29001]

## [0.19.5] - 2023-02-20
### Changed
- Minor internal updates.

## [0.19.4] - 2023-02-15
### Changed
- Update to React 18. [#28710]

### Fixed
- Configure with standard `@wordpress/browserslist-config` config. [#28910]

## [0.19.3] - 2023-02-08
### Changed
- Minor internal updates.

## [0.19.2] - 2023-01-26
### Changed
- Minor internal updates.

## [0.19.1] - 2023-01-11
### Changed
- Changed attached_media type [#27840]

## [0.19.0] - 2023-01-02
### Added
- Added already shared meta value for post editor api. [#28072]

## [0.18.4] - 2022-12-19
### Changed
- Updated package dependencies. [#27962]

## [0.18.3] - 2022-12-12
### Added
- Social: Added a 'more info' link to the plan details in the editor nudge [#27617]

## [0.18.2] - 2022-12-06
### Changed
- Updated package dependencies. [#27688, #27696]

## [0.18.1] - 2022-11-28
### Changed
- Updated package dependencies. [#27043]

## [0.18.0] - 2022-11-14
### Changed
- Save attached media to post meta [#26930]

## [0.17.3] - 2022-11-08
### Changed
- Updated package dependencies. [#27289]

## [0.17.2] - 2022-11-01
### Changed
- Updated package dependencies. [#27196]

## [0.17.1] - 2022-10-28
### Fixed
- Classic Editor: fix the is_healthy logic that disabled connections. [#27159]
- Include built JavaScript bundles in the package. [#27152]

## [0.17.0] - 2022-10-25
### Added
- Cache connection testing results during an HTTP request. [#26955]
- Social: Add the reshare endpoint for proxying the request to WPCOM [#25993]

### Changed
- Updated package dependencies. [#26705]

### Fixed
- Display error for broken connections in editor [#25803]

## [0.16.2] - 2022-10-11
### Changed
- Updated package dependencies. [#26640]

## [0.16.1] - 2022-10-05
### Changed
- Updated package dependencies. [#26569]

## [0.16.0] - 2022-09-27
### Added
- Add caching to shares info check [#26449]

### Changed
- Move share limits code to the Publicize package [#26294]
- Social: Aligned Jetpack and Social to use the connection-test-results endpoint in the block editor [#26274]
- Updated package dependencies. [#26294]

## [0.15.0] - 2022-09-20
### Added
- Added is-healthy endpoint to post field [#26216]

## [0.14.0] - 2022-09-13
### Added
- Added hooks for Publicize form in Classic Editor [#26039]

## [0.13.2] - 2022-09-08
### Changed
- Updated package dependencies.

### Fixed
- Fixed wrong permissions check for contributors [#26025]

## [0.13.1] - 2022-08-31
### Removed
- Removed errant code change.

## [0.13.0] - 2022-08-31
### Changed
- Updated package dependencies. [#25931]

## [0.12.0] - 2022-08-30
### Changed
- Rebrand Publicize to Jetpack Social [#25787]
- Updated package dependencies. [#25694]

### Fixed
- Post field: Allow for the filter which could make the connections default to disabled. [#24617]

## [0.11.1] - 2022-08-23
### Changed
- Updated package dependencies. [#25628]

## [0.11.0] - 2022-08-09
### Added
- Added scheduled post calculation on plugin activation [#25334]

## [0.10.1] - 2022-08-03
### Changed
- Updated package dependencies. [#25300, #25315]

## [0.10.0] - 2022-07-26
### Changed
- Updated package dependencies. [#25158]
- Use new Jetpack Social endpoint on WPCOM to get Publicize shares info [#25147]

## [0.9.0] - 2022-07-19
### Added
- Fetch share counter on the server side in Jetpack Social. To facilitate this, the call to wpcom has been moved into the Publicize_Base class. [#24836]

## [0.8.1] - 2022-07-12
### Changed
- Updated package dependencies.

## [0.8.0] - 2022-07-06
### Added
- Synced changes made in modules/publice/publicize.php and made sure the composer package for publicize has those changes. [#24943]

## [0.7.1] - 2022-06-29
### Changed
- Update annotations versions.

## [0.7.0] - 2022-06-21
### Added
- Added a proxy end-point to get the shares count for Publicize. [#24786]

### Changed
- Renaming master to trunk. [#24661]

## [0.6.0] - 2022-06-14
### Added
- Made changes to not instantiate the publicize object, if it's already instantiated. [#24695]

### Changed
- Publicize: Allow users to set the image for their social post even when themes don't support featured images. [#23871]
- Updated package dependencies. [#24529]

## [0.5.0] - 2022-05-31
### Added
- Changed logic to initialize publicize classes only if the publicize module is active. [#24451]

### Changed
- Classic Editor: Replaced the initial settings form with the Jetpack redirect link [#24526]

## [0.4.0] - 2022-05-24
### Added
- Added the post field to the Publicize package [#24324]

## [0.3.0] - 2022-05-18
### Added
- Added new jetpack v4 end-point to list publicize connections. [#24293]

### Changed
- Updated package dependencies. [#24153] [#24360]

### Fixed
- Added check for wp_ajax_elementor_ajax to allow publicizing via elementor. [#24387]
- gitignore wordpress directory within the publicize package [#24339]

## [0.2.1] - 2022-05-10
### Fixed
- Publicize: Correct bad namespaces

## [0.2.0] - 2022-05-04
### Added
- Added redirect links for Jetpack cloud. [#24205]

### Changed
- Updated package dependencies. [#24095]

### Deprecated
- Moved the options class into Connection. [#24095]

## [0.1.1] - 2022-05-19
### Fixed
- Added check for wp_ajax_elementor_ajax to allow publicizing via elementor.
- Publicize: Correct bad namespaces

## 0.1.0 - 2022-04-26
### Added
- Added an empty shell package
- Added Publicize module files to Composer package
- Set composer package type to "jetpack-library" so i18n will work.
- Use the publicize package in the Jetpack plugin.

### Changed
- Applied legacy Publicize filters to flag setting for Publicize
- Fix Composer dependencies
- Microperformance: Use === null instead of is_null
- PHPCS: Fix `WordPress.Security.ValidatedSanitizedInput`
- Publicize: Do not display legacy UI for block editor pages
- Sync'd changes with the equivalent files in the Publicize module
- Updated package dependencies.
- Update package.json metadata.

[0.67.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.19...v0.67.0
[0.66.19]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.18...v0.66.19
[0.66.18]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.17...v0.66.18
[0.66.17]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.16...v0.66.17
[0.66.16]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.15...v0.66.16
[0.66.15]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.14...v0.66.15
[0.66.14]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.13...v0.66.14
[0.66.13]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.12...v0.66.13
[0.66.12]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.11...v0.66.12
[0.66.11]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.10...v0.66.11
[0.66.10]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.9...v0.66.10
[0.66.9]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.8...v0.66.9
[0.66.8]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.7...v0.66.8
[0.66.7]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.6...v0.66.7
[0.66.6]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.5...v0.66.6
[0.66.5]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.4...v0.66.5
[0.66.4]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.3...v0.66.4
[0.66.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.2...v0.66.3
[0.66.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.1...v0.66.2
[0.66.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.66.0...v0.66.1
[0.66.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.65.7...v0.66.0
[0.65.7]: https://github.com/Automattic/jetpack-publicize/compare/v0.65.6...v0.65.7
[0.65.6]: https://github.com/Automattic/jetpack-publicize/compare/v0.65.5...v0.65.6
[0.65.5]: https://github.com/Automattic/jetpack-publicize/compare/v0.65.4...v0.65.5
[0.65.4]: https://github.com/Automattic/jetpack-publicize/compare/v0.65.3...v0.65.4
[0.65.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.65.2...v0.65.3
[0.65.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.65.1...v0.65.2
[0.65.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.65.0...v0.65.1
[0.65.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.64.5...v0.65.0
[0.64.5]: https://github.com/Automattic/jetpack-publicize/compare/v0.64.4...v0.64.5
[0.64.4]: https://github.com/Automattic/jetpack-publicize/compare/v0.64.3...v0.64.4
[0.64.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.64.2...v0.64.3
[0.64.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.64.1...v0.64.2
[0.64.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.64.0...v0.64.1
[0.64.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.63.0...v0.64.0
[0.63.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.62.5...v0.63.0
[0.62.5]: https://github.com/Automattic/jetpack-publicize/compare/v0.62.4...v0.62.5
[0.62.4]: https://github.com/Automattic/jetpack-publicize/compare/v0.62.3...v0.62.4
[0.62.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.62.2...v0.62.3
[0.62.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.62.1...v0.62.2
[0.62.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.62.0...v0.62.1
[0.62.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.61.5...v0.62.0
[0.61.5]: https://github.com/Automattic/jetpack-publicize/compare/v0.61.4...v0.61.5
[0.61.4]: https://github.com/Automattic/jetpack-publicize/compare/v0.61.3...v0.61.4
[0.61.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.61.2...v0.61.3
[0.61.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.61.1...v0.61.2
[0.61.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.61.0...v0.61.1
[0.61.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.60.1...v0.61.0
[0.60.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.60.0...v0.60.1
[0.60.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.59.1...v0.60.0
[0.59.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.59.0...v0.59.1
[0.59.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.58.0...v0.59.0
[0.58.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.57.4...v0.58.0
[0.57.4]: https://github.com/Automattic/jetpack-publicize/compare/v0.57.3...v0.57.4
[0.57.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.57.2...v0.57.3
[0.57.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.57.1...v0.57.2
[0.57.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.57.0...v0.57.1
[0.57.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.56.5...v0.57.0
[0.56.5]: https://github.com/Automattic/jetpack-publicize/compare/v0.56.4...v0.56.5
[0.56.4]: https://github.com/Automattic/jetpack-publicize/compare/v0.56.3...v0.56.4
[0.56.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.56.2...v0.56.3
[0.56.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.56.1...v0.56.2
[0.56.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.56.0...v0.56.1
[0.56.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.55.2...v0.56.0
[0.55.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.55.1...v0.55.2
[0.55.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.55.0...v0.55.1
[0.55.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.54.4...v0.55.0
[0.54.4]: https://github.com/Automattic/jetpack-publicize/compare/v0.54.3...v0.54.4
[0.54.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.54.2...v0.54.3
[0.54.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.54.1...v0.54.2
[0.54.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.54.0...v0.54.1
[0.54.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.53.0...v0.54.0
[0.53.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.52.3...v0.53.0
[0.52.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.52.2...v0.52.3
[0.52.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.52.1...v0.52.2
[0.52.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.52.0...v0.52.1
[0.52.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.51.0...v0.52.0
[0.51.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.50.1...v0.51.0
[0.50.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.50.0...v0.50.1
[0.50.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.49.2...v0.50.0
[0.49.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.49.1...v0.49.2
[0.49.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.49.0...v0.49.1
[0.49.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.48.0...v0.49.0
[0.48.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.47.4...v0.48.0
[0.47.4]: https://github.com/Automattic/jetpack-publicize/compare/v0.47.3...v0.47.4
[0.47.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.47.2...v0.47.3
[0.47.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.47.1...v0.47.2
[0.47.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.47.0...v0.47.1
[0.47.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.46.3...v0.47.0
[0.46.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.46.2...v0.46.3
[0.46.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.46.1...v0.46.2
[0.46.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.46.0...v0.46.1
[0.46.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.45.2...v0.46.0
[0.45.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.45.1...v0.45.2
[0.45.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.45.0...v0.45.1
[0.45.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.44.1...v0.45.0
[0.44.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.44.0...v0.44.1
[0.44.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.43.0...v0.44.0
[0.43.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.42.13...v0.43.0
[0.42.13]: https://github.com/Automattic/jetpack-publicize/compare/v0.42.12...v0.42.13
[0.42.12]: https://github.com/Automattic/jetpack-publicize/compare/v0.42.11...v0.42.12
[0.42.11]: https://github.com/Automattic/jetpack-publicize/compare/v0.42.10...v0.42.11
[0.42.10]: https://github.com/Automattic/jetpack-publicize/compare/v0.42.9...v0.42.10
[0.42.9]: https://github.com/Automattic/jetpack-publicize/compare/v0.42.8...v0.42.9
[0.42.8]: https://github.com/Automattic/jetpack-publicize/compare/v0.42.7...v0.42.8
[0.42.7]: https://github.com/Automattic/jetpack-publicize/compare/v0.42.6...v0.42.7
[0.42.6]: https://github.com/Automattic/jetpack-publicize/compare/v0.42.5...v0.42.6
[0.42.5]: https://github.com/Automattic/jetpack-publicize/compare/v0.42.4...v0.42.5
[0.42.4]: https://github.com/Automattic/jetpack-publicize/compare/v0.42.3...v0.42.4
[0.42.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.42.2...v0.42.3
[0.42.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.42.1...v0.42.2
[0.42.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.42.0...v0.42.1
[0.42.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.41.0...v0.42.0
[0.41.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.40.0...v0.41.0
[0.40.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.39.0...v0.40.0
[0.39.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.38.3...v0.39.0
[0.38.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.38.2...v0.38.3
[0.38.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.38.1...v0.38.2
[0.38.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.38.0...v0.38.1
[0.38.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.37.2...v0.38.0
[0.37.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.37.1...v0.37.2
[0.37.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.37.0...v0.37.1
[0.37.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.36.6...v0.37.0
[0.36.6]: https://github.com/Automattic/jetpack-publicize/compare/v0.36.5...v0.36.6
[0.36.5]: https://github.com/Automattic/jetpack-publicize/compare/v0.36.4...v0.36.5
[0.36.4]: https://github.com/Automattic/jetpack-publicize/compare/v0.36.3...v0.36.4
[0.36.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.36.2...v0.36.3
[0.36.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.36.1...v0.36.2
[0.36.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.36.0...v0.36.1
[0.36.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.35.0...v0.36.0
[0.35.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.34.0...v0.35.0
[0.34.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.33.1...v0.34.0
[0.33.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.33.0...v0.33.1
[0.33.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.32.0...v0.33.0
[0.32.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.31.0...v0.32.0
[0.31.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.30.4...v0.31.0
[0.30.4]: https://github.com/Automattic/jetpack-publicize/compare/v0.30.3...v0.30.4
[0.30.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.30.2...v0.30.3
[0.30.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.30.1...v0.30.2
[0.30.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.30.0...v0.30.1
[0.30.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.29.0...v0.30.0
[0.29.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.28.0...v0.29.0
[0.28.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.27.0...v0.28.0
[0.27.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.26.0...v0.27.0
[0.26.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.25.1...v0.26.0
[0.25.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.25.0...v0.25.1
[0.25.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.24.2...v0.25.0
[0.24.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.24.1...v0.24.2
[0.24.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.24.0...v0.24.1
[0.24.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.23.0...v0.24.0
[0.23.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.22.0...v0.23.0
[0.22.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.21.0...v0.22.0
[0.21.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.20.1...v0.21.0
[0.20.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.20.0...v0.20.1
[0.20.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.19.5...v0.20.0
[0.19.5]: https://github.com/Automattic/jetpack-publicize/compare/v0.19.4...v0.19.5
[0.19.4]: https://github.com/Automattic/jetpack-publicize/compare/v0.19.3...v0.19.4
[0.19.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.19.2...v0.19.3
[0.19.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.19.1...v0.19.2
[0.19.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.19.0...v0.19.1
[0.19.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.18.4...v0.19.0
[0.18.4]: https://github.com/Automattic/jetpack-publicize/compare/v0.18.3...v0.18.4
[0.18.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.18.2...v0.18.3
[0.18.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.18.1...v0.18.2
[0.18.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.18.0...v0.18.1
[0.18.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.17.3...v0.18.0
[0.17.3]: https://github.com/Automattic/jetpack-publicize/compare/v0.17.2...v0.17.3
[0.17.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.17.1...v0.17.2
[0.17.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.17.0...v0.17.1
[0.17.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.16.2...v0.17.0
[0.16.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.16.1...v0.16.2
[0.16.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.16.0...v0.16.1
[0.16.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.14.0...v0.15.0
[0.14.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.13.2...v0.14.0
[0.13.2]: https://github.com/Automattic/jetpack-publicize/compare/v0.13.1...v0.13.2
[0.13.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.13.0...v0.13.1
[0.13.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.11.1...v0.12.0
[0.11.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-publicize/compare/v0.1.0...v0.2.0
[0.1.1]: https://github.com/Automattic/jetpack-publicize/compare/v0.1.0...v0.1.1
