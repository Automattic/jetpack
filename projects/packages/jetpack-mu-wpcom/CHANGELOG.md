# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.14.1] - 2024-02-26
### Changed
- Verbum: Ensure colour contrast for disabled button is a11y-friendly. [#35929]

### Fixed
- Fix comment form login for passwordless users [#35785]

## [5.14.0] - 2024-02-26
### Added
- Adds a dismissible admin notice to inform users of the hosting menu [#35930]
- Add Scheduled Updates package [#35796]

### Changed
- Add Anthropic UAs to list of crawlers to block. [#35924]
- Change wpcom menu item to go to my sites instead of global site view. [#35928]
- Update WordPress.com menu item to be a menu of links rather than one link. [#35925]

## [5.13.1] - 2024-02-21
### Changed
- Ensure consistent robots.txt behavior between WP.com and WoA. [#35803]

## [5.13.0] - 2024-02-19
### Added
- Blog Privacy: Add AI User Agents to robots.txt depending on blog setting. [#35704]
- Don't override Site Editor's back button URL for sites with classic view enabled. [#35721]
- jetpack-mu-wpcom: Added the wpcom-site-menu feature to add a WordPress.com sidebar menu item. [#35702]

### Fixed
- Create and use Preact signal for subscriptionModalStatus to fix issue of undefined value sent on comment submission. [#35741]

## [5.12.2] - 2024-02-13
### Changed
- Updated package dependencies. [#35608]

## [5.12.1] - 2024-02-12
### Changed
- Make the 'Install the mobile app' task visible to Simple and Atomic. [#35465]

## [5.12.0] - 2024-02-05
### Added
- Adds the completion logic for the Install the mobile app task to Atomic sites" [#35261]
- Import: adds a banner to wp-admin linking to the Calypso import tool [#35351]
- Register wp_block patterns from Dotcompatterns with blockTypes [#35337]

### Changed
- Updated package dependencies. [#35384]
- Updated Readme to include Verbum issue board and clarify code syncing steps [#35318]
- Verbum: Minify dynamic-loader script. [#35323]
- Verbum: Use jetpack-assets package to register scripts using `.asset.php` file data. [#35323]
- Verbum Comments blocks rollout to 50% of sites [#35446]

### Fixed
- Esnsure the submit event is fired by the comments form [#35388]
- Verbum: Avoid copying PHP files into `src/build/verbum-comments/`. [#35323]

## [5.11.0] - 2024-01-29
### Security
- Allow users to post HTML when blocks are enabled [#35276]

### Added
- Cache the response of the Domain List request, and harden the code [#35070]

### Changed
- Change Verbum Blocks sample size to 30% [#35255]
- Hides the "Install the mobile app" task while the completion logic is not fully implemented [#35302]
- Update Verbum README [#35252]

### Fixed
- Verbum cache buster depended on build_meta, which is only updated on production builds. It doesn't refresh during development, giving you a stale block-editor bundle. [#35243]

## [5.10.0] - 2024-01-25
### Added
- Add Verbum Comments in jetpack-mu-wpcom plugin. [#35196]

## [5.9.0] - 2024-01-22
### Added
- Added the completion logic for the 'Install the mobile app' task [#35110]
- Adds the completion logic for the Verify Domain Email task [#35068]
- Block theme previews: show an education modal when previewing a theme. [#34935]
- Launchpad: Enabled to temporary dismiss a dismissible launchpad [#34889]

### Changed
- Dotcom patterns: use assembler v2 patterns in editor [#35081]
- Newsletter launchpad: move email verify task above subscriber task [#35084]

### Fixed
- jetpack-mu-wpcom: Prevent get_plugin_data indirectly calling wptexturize. [#35087]

## [5.8.2] - 2024-01-15
### Added
- Add the completion logic for the `front_page_updated` task [#34837]
- Add the Verify Domain Email task [#34893]

### Removed
- Removes the `Set up your Professional Email` task [#34865]

## [5.8.1] - 2024-01-08
### Added
- Adds the is_dismissible prop to the Launchpad task list definition. [#34839]

## [5.8.0] - 2024-01-04
### Added
- Add WooCommerce setup task completion logic. [#34791]
- Dashboard Link: Allow to customize the url via the query parameter. [#34836]

### Changed
- Launchpad: Rename the title of the setup_general to Give your site a name. [#34826]
- Update launchpad methods docs. [#34829]
- Update package dependencies. [#34815]
- Use the Site Title task instead of the blogname_set task. [#34799]

## [5.7.0] - 2024-01-02
### Added
- Added Sensei setup completion logic. [#34789]
- Fixed the start page options modal still being visible. [#34824]

### Changed
- Block Patterns: Updated to use category name testimonials rather than quotes. [#34808]

## [5.6.0] - 2023-12-25
### Removed
- Remove a nag for domains without a verified email [#34385]
- Removed Launchpad task for domain email verification. [#34387]

## [5.5.0] - 2023-12-15
### Changed
- Updates the WC visibility check to use the `is_plugin_active` function. [#34648]

## [5.4.0] - 2023-12-14
### Added
- Add the Sensei and WooCommerce Setup Task, to allow us to retire the old checklist card. [#34551] [#34564]
- Launchpad: Add context param to endpoint. [#34498]

### Changed
- Mark the setup_general task as complete based on whether blogname or blog description options changed. [#34579]

## [5.3.0] - 2023-12-11
### Added
- Added editor error handling from ETK. [#34158]
- Added initial JS and TS build logic. [#34158]
- Added the Site Setup Launchpad, to allow us to retire the old checklist card. [#34320]
- Launchpad: Added tasks for the new ai-assembler flow. [#34532]
- Launchpad: Completed the plan tasks when the user purchses a plan. [#34480]
- Launchpad: Completed the task, Personalize your site, when the user updates the site title, site tagline or site logo. [#34511]
- Launchpad: Set up tasks for the new assembler-first flow. [#34451]

### Changed
- Launchpad: Added source to Earn stripe task. [#34448]

## [5.2.0] - 2023-12-03
### Changed
- Launchpad: Updated link for paid offer task. [#34413]

## [5.1.1] - 2023-11-30
### Changed
- Update url for launchpad task to add subscribe block to point to site editor with subscribe block docs open in the help center. [#34329]

### Fixed
- Added type check to prevent unnecessary warnings in Coming Soon logic [#34322]
- Earn: Update link to plans page. [#34316]

## [5.1.0] - 2023-11-24
### Added
- Added dynamic titles to task lists. [#34244]
- Migrated Block Patterns. [#34162]

### Changed
- Replaced usage of strpos() with str_contains(). [#34137]
- Replaced usage of substr() with str_starts_with() and str_ends_with(). [#34207]

### Fixed
- Prevented fatal errors when filename is empty in the heif support feature. [#34062]

## [5.0.0] - 2023-11-20
### Added
- Ensure enable subscribe modal task in launchpad. [#33909]
- Launchpad: Add query parameter to the write three posts prompt. [#34160]

### Changed
- Replaced usage of strpos() with str_starts_with(). [#34135]
- Updated required PHP version to >= 7.0. [#34192]

## [4.18.0] - 2023-11-09
### Added
- Take id_map in consideration when checking if a task is completed inside wpcom_launchpad_is_task_option_completed. [#34009]

## [4.17.0] - 2023-11-08
### Added
- Added Launchpad tasks and task list to the Subscriber page. [#33948]

### Changed
- Updated the URL for the Add Subscribers launchpad task to trigger the "Add Subscribers" modal. [#33913]

## [4.16.2] - 2023-11-03
### Fixed
- Launchpad hooks: Made more resilient against non-array values. [#33923]

## [4.16.1] - 2023-10-31
### Fixed
- Clicking on the 'Choose a plan' task would not redirect to the plans page. [#33872]

## [4.16.0] - 2023-10-30
### Added
- Add launchpad checklist for host-site intent. [#33698]

### Fixed
- Disable fullscreen launchpad when completing the site_launched task. [#33819]

## [4.15.1] - 2023-10-26
### Changed
- Coming Soon feature: Be more defensive when checking for meta data. [#33769]

## [4.15.0] - 2023-10-16
### Added
- Launchpad: Add earn-newsletter checklist. [#33200]

### Changed
- Launchpad: Update copy for global styles in plan_selected task. [#33462]

## [4.14.0] - 2023-10-10
### Added
- Expose newsletter_categories_location to JavaScript [#33374]

### Changed
- Changed domain launchpad task visibility [#33456]
- Changed email verification visibility [#33457]

## [4.13.0] - 2023-10-03
### Added
- Add new task for user to confirm email when purchasing a domain. [#33373]
- Add plugin to show frontend email nag for domains with unverified email address [#33390]
- Adds a URL param to identify the source of the navigation on the Customize domain task. [#33404]

## [4.12.0] - 2023-09-28
### Added
- Added calypso_path to Launchpad task [#33355]
- Support Design First tasks on the Customer Home Launchpad [#33272]
- Support Start Writing tasks on the Customer Home Launchpad [#33281]

### Fixed
- Added check for jetpack sync option to only run on Atomic [#33286]

## [4.11.0] - 2023-09-25
### Added
- Adds 100 Year Plan features, including the ability to set a legacy contact and enable locked mode. [#33081]
- Adds a feature to include helpers for the First Posts stream. In particular, an option is being added to the sync list. [#33253]
- Add the Calypso path for the setup_link_in_bio task. [#32905]
- Support Videopress tasks on the Customer Home Launchpad. [#33153]

### Fixed
- Locked Mode: Now applies cap filter in REST API requests as well. [#33246]

## [4.10.0] - 2023-09-19
### Added
- Add removal capability for navigator available checklists [#33019]
- add updating capabilities for current checklist [#32964]
- Change the Site Editor's dashboard link [#33024]
- Change the way the navigator checklists are handled [#33011]

### Fixed
- Make map block settings load after registering the script [#33066]

## [4.9.0] - 2023-09-11
### Added
- adding navigator api endpoint [#32963]
- capability for getting the current active checklist [#32965]

## [4.8.0] - 2023-09-07
### Added
- Add HEIC/HEIF image upload support [#32900]
- Add updater for WPCOM Marketplace plugins [#32872]

### Changed
- Update version numbers [#32902]

## [4.7.0] - 2023-09-06
### Added
- Added Calypso paths for setup_free and domain_upsell tasks [#32851]
- Launchpad: added Calypso paths for newsletter tasks [#32882]

## [4.6.0] - 2023-09-04
### Added
- Added sub-option to show/hide launchpad modal in editor [#32730]
- Use the task id to validate the task update request [#32591]

### Changed
- Adapt the pre launch tasks to work on the Customer Home [#32796]
- Update function prefixes for task list definitions [#32563]
- Update the unused get_task_url prop on the task definition to the get_calypso_path [#32790]

### Removed
- Remove the is launched check for the build intent [#32810]

## [4.5.1] - 2023-08-28
### Changed
- Updated package dependencies. [#32605]

## [4.5.0] - 2023-08-21
### Added
- Added new 'skipped' option to launchpad checklist [#32500]

### Changed
- Remove the initial slash to match the pattern used throughout the project [#32365]

### Fixed
- Add calypso path for set_up_payments task. [#32526]
- Fix completion logic for welcome message on newsletters task. [#32466]
- Reuse completion method to make it easier to add tracking and check for list completion. [#31471]

## [4.4.1] - 2023-08-15
### Changed
- Reduce number of tasks in the free and paid newsletter task lists [#32459]

## [4.4.0] - 2023-08-14
### Added
- Newsletter launchpad: add migrate content task. [#32357]

## [4.3.1] - 2023-08-09
### Added
- Adds the 'Write 3 posts' launchpad task to the 'Write' intent [#32341]

### Changed
- Update the email verification task copy [#32364]

## [4.3.0] - 2023-08-07
### Added
- Added add_about_page Launchpad task [#32245]
- Added new Launchpad task [#32204]
- Added new Launchpad task [#32250]
- Add the path for the Write 3 posts and Enable subscriber modal tasks [#32233]
- Launchpad: add 'Get your first 10 subscribers' task for newsletters and add general repeated task completion logic [#32075]
- Launchpad: add a way to query and set checklist dismissed status [#32200]

### Changed
- Add the Earn money task to the Free Newsletter task list [#32315]
- Refactors is_launchpad_enabled method  to make it clear they are related to the fullscreen launchpad [#32269]
- Refactors refactor disable_launchpad & maybe_disable_launchpad to make it clear they are related to the fullscreen launchpad [#32268]

### Fixed
- Fix the new get_calypso_path for the customize_welcome_message task [#32195]

## [4.2.0] - 2023-08-01
### Added
- Add manage subscribers task. [#32064]
- Add new subscribers modal task to newsletter launchpads. [#32042]
- Add site_goals to the jetpack sync options. [#32068]
- Add the Write 3 posts task for the newsletter flow. [#32012]
- Launchpad: add calypso_url property to tasks where we know the Calypso page we want to show. [#32177]
- Add back the update_about_page task to the intent-build list. [#32188]

### Changed
- Auto-formatted composer file. [#32005]

### Removed
- Remove duplicate task list [#32121]

## [4.1.0] - 2023-07-26
### Added
- Add the intent check on the newsletter functions" [#32067]

### Fixed
- Added some guards around calls to wpcom_get_theme_annotation() to avoid errors [#32078]

## [4.0.0] - 2023-07-25
### Added
- Added additional tests for launchpad tasklist validation [#31992]
- Added the Free and Paid Newsletter task list [#31981]
- Add new task for post-launch Newsletter task lists. [#32034]
- Adds the count propertis to the task definitions [#31970]
- Adds the Earn money with your newsletter task [#32000]
- Launchpad task for updating the about page [#31966]
- Show the correct homepage on the Site Editor when previewing a theme.
  See https://github.com/Automattic/wp-calypso/issues/79221 in more detail. [#31929]

### Changed
- Rename the keep-building Launchpad checklist to intent-build [#31905]
- Updated initial state of Launchpad subscribers task. [#31947]
- Updated launchpad task list validation return types to be more useful. Previously, we just returned a simple bool. Now we return a WP_Error where appropriate. [#31834]

### Fixed
- Remove `design_edited` task from post-launch task list. [#31995]

## [3.7.0] - 2023-07-17
### Added
- Launchpad: Filter tasks by newsletter import goal. [#31825]
- Launchpad task for editing a page [#31789]

## [3.6.0] - 2023-07-10
### Added
- While in the design_first flow, if the user creates a post, deletes the default hello-world. [#31702]

## [3.5.0] - 2023-07-05
### Added
- Added a new email campaign trigger for blog-onboarding [#31612]
- Add validation for required tasks. [#31626]
- Launchpad task for adding a new page [#31578]

### Changed
- Update keep building task list visibility logic to check if a site is launched [#31623]

### Fixed
- Don't hide design_edited task if complete [#31620]

## [3.4.0] - 2023-06-27
### Added
- Check that the function jetpack_is_atomic_site exists before using it. [#31602]

## [3.3.0] - 2023-06-26
### Added
- Launchpad task for domain customization [#31493]

### Changed
- Remove use of the is_launchpad_keep_building_enabled feature. [#31519]

## [3.2.0] - 2023-06-26
### Added
- Add a function to fire off a Tracks event when a task is completed and update existing mark task complete functions to use it. [#31444]
- Adding site_intent and launchpad_checklist_tasks_statuses to JP Sync. [#31558]
- Update visibility for design_edited task for post-launch sites. [#31191]

### Changed
- Using design_completed instead of design_selected for design-first flow [#31513]

## [3.1.0] - 2023-06-19
### Added
- Add new claim free domain task to Keep Building task list. [#31275]
- Adds domain_upsell task to keep-building list and updates visibility rules for that same task. [#31281]
- Adds drive_traffic task to keep-building list. [#31377]

### Fixed
- Updates package version. [#31349]

## [3.0.0] - 2023-06-12
### Added
- Add a site title task to the Keep Building task list. [#31246]
- Move the completion check logic out of the task list availability status [#31055]
- Support task list filtering of visible task [#31186]

### Changed
- Launchpad: Add verify email task to keep-building task list [#31239]
- Launchpad: Refactor task definitions [#31121]

### Fixed
- Fix fatal error for WoA sites due to absence of Logstash on that infrastructure. [#31284]

## [2.4.0] - 2023-06-06
### Added
- Add a new is_enabled logic to the launchpad endpoint to determine whether the task list is enabled for a site. [#30913]
- Add `is_enabled_callback` to all existing task lists with a callback function that checks launchpad_screen. [#31092]
- Apply filter to the Keep building task list [#31113]
- Register a "Keep Building" task list. [#30954]
- Remove unused API endpoint launchpad/checklist [#30882]

### Changed
- Launchpad: use callbacks for task titles to pick up the user locale [#30915]

## [2.3.0] - 2023-05-29
### Added
- Launchpad: Add design-first Launchpad checklist API definition [#30871]
- Launchpad: Include "Choose a plan" task in other flows [#30906]
- Remove unnecessary duplicated require of Launchpad plugin. [#30856]

## [2.2.1] - 2023-05-22
### Changed
- PHP8 compatibility updates. [#30729]

## [2.2.0] - 2023-05-12
### Changed
- Added plan_completed step for start-writing flow instead of plan_selected [#30686]

### Fixed
- Ensure calling Launchpad_Task_Lists::list() with an empty ID doesn't result in a PHP warning. [#30509]

## [2.1.0] - 2023-05-11
### Added
- Add start writing checklist and task definitions to Launchpad Checklist API [#30369]
- Launchpad API improvements and compat [#30527]

## [2.0.0] - 2023-05-08
### Added
- Refactor the Launchpad task list API [#30397]

### Changed
- Migrates Launchpad business logic from the mu-plugin to being defined by tasks [#30472]

### Fixed
- Avoid hooking Map settings multiple times. [#30454]
- Ensure Map block settings get hooked to existing block bbubundle. [#30453]

## [1.7.0] - 2023-05-03
### Added
- Refactor the Launchpad task list API

## [1.6.0] - 2023-05-02
### Added
- Add API to query Zendesk chat availability and use it to conditionally display zendesk chat [#29942]
- Add map_block_settings global [#30287]
- Launchpad: Return checklist from main endpoint. [#30227]

### Changed
- Launchpad: Update text strings. [#30286]
- Updated project dependencies. [#30292]

## [1.5.1] - 2023-05-01
### Changed
- Version update [#30293]

### Fixed
- Launchpad API: Address excess queries [#30361]

## [1.5.0] - 2023-04-25
### Security
- Sanitize cand validate checklist slug query param [#30112]

### Added
- Add newsletter task dedefinitions to launchpad checklist API endpoints [#30078]
- Fixed a bug where only the first option was updated and added unit tests. [#30096]
- Launchpad Checklist API: Adds registry to easily manage Launchpad checklists [#30211]
- SLaunchpad Checklist API: add task definitions for the Launchpad free flow [#30146]
- Update launchpad checklist API twrite flow task definitions to use site option data [#30116]
- Update launchpad checklist API twrite flow task definitions to use site option data [#30117]

### Changed
- Launchpad Checklist API: Update VideoPress tasks [#30141]

### Fixed
- change link_in_bio_launched dependency to link_edited [#30176]

## [1.4.0] - 2023-04-17
### Added
- Added Launchpad Checklist API scaffolding code [#30023]
- Launchpad: Add link-in-bio task logic to endpoint [#30076]

### Removed
- Removed namespacing of jetpack-mu-wpcom launchpad feature [#30044]

### Fixed
- Launchpad: Fixed variable scope issue with endpoint [#30069]

## [1.3.1] - 2023-04-10
### Added
- Add Jetpack Autoloader package suggestion. [#29988]

## [1.3.0] - 2023-04-05
### Added
- Add jetpack-mu-wpcom launchpad update site settings endpoint [#29841]

## [1.2.1] - 2023-03-28
### Changed
- Minor internal updates.

## [1.2.0] - 2023-03-27
### Added
- Fix for the unified navigation on mobile in WordPress 6.2. [#29716]

## [1.1.3] - 2023-03-20
### Changed
- Updated package dependencies. [#29480]

## [1.1.2] - 2023-03-10
### Fixed
- Coming Soon: use DVH units when available to fix height on iPhones [#29416]

## [1.1.1] - 2023-03-09
### Fixed
- Check for existence of wpcom_rest_api_v2_load_plugin function before loading wpcom endpoints. [#29399]

## [1.1.0] - 2023-03-08
### Added
- Add a Launchpad REST API endpoint for cross-platform benefit [#29082]

## [1.0.1] - 2023-02-28
### Changed
- Updated checks for loading the coming soon feature. [#28932]

### Fixed
- Fix undefined is_plugin_active fatal on wpcom. [#29158]

## 1.0.0 - 2023-02-28

- Bump non-zero major version.

## [0.2.2] - 2023-02-20
### Changed
- Minor internal updates.

## [0.2.1] - 2023-02-15
### Fixed
- Check array key exists before access. [#28931]

## [0.2.0] - 2023-02-09
### Changed
- Bumping major package version past zero. [#28880]

## [0.1.2] - 2023-02-06

- Migrate code from 'Automattic/jetpack/pull/27815'.

## 0.1.1 - 2023-01-27

- Minor internal updates.

## 0.1.0 - 2023-01-19

- Testing initial package release.

[5.14.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.14.0...v5.14.1
[5.14.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.13.1...v5.14.0
[5.13.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.13.0...v5.13.1
[5.13.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.12.2...v5.13.0
[5.12.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.12.1...v5.12.2
[5.12.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.12.0...v5.12.1
[5.12.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.11.0...v5.12.0
[5.11.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.10.0...v5.11.0
[5.10.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.9.0...v5.10.0
[5.9.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.8.2...v5.9.0
[5.8.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.8.1...v5.8.2
[5.8.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.8.0...v5.8.1
[5.8.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.7.0...v5.8.0
[5.7.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.6.0...v5.7.0
[5.6.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.5.0...v5.6.0
[5.5.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.4.0...v5.5.0
[5.4.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.3.0...v5.4.0
[5.3.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.2.0...v5.3.0
[5.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.1.1...v5.2.0
[5.1.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.1.0...v5.1.1
[5.1.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v5.0.0...v5.1.0
[5.0.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.18.0...v5.0.0
[4.18.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.17.0...v4.18.0
[4.17.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.16.2...v4.17.0
[4.16.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.16.1...v4.16.2
[4.16.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.16.0...v4.16.1
[4.16.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.15.1...v4.16.0
[4.15.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.15.0...v4.15.1
[4.15.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.14.0...v4.15.0
[4.14.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.13.0...v4.14.0
[4.13.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.12.0...v4.13.0
[4.12.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.11.0...v4.12.0
[4.11.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.10.0...v4.11.0
[4.10.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.9.0...v4.10.0
[4.9.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.8.0...v4.9.0
[4.8.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.7.0...v4.8.0
[4.7.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.6.0...v4.7.0
[4.6.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.5.1...v4.6.0
[4.5.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.5.0...v4.5.1
[4.5.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.4.1...v4.5.0
[4.4.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.4.0...v4.4.1
[4.4.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.3.1...v4.4.0
[4.3.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.3.0...v4.3.1
[4.3.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.2.0...v4.3.0
[4.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.1.0...v4.2.0
[4.1.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.7.0...v4.0.0
[3.7.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.6.0...v3.7.0
[3.6.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.5.0...v3.6.0
[3.5.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.4.0...v3.5.0
[3.4.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.3.0...v3.4.0
[3.3.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.2.0...v3.3.0
[3.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.1.0...v3.2.0
[3.1.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v2.4.0...v3.0.0
[2.4.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v2.3.0...v2.4.0
[2.3.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v2.2.1...v2.3.0
[2.2.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v2.2.0...v2.2.1
[2.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v2.1.0...v2.2.0
[2.1.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.7.0...v2.0.0
[1.7.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.5.1...v1.6.0
[1.5.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.4.0...v1.5.0
[1.4.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v1.0.0...v1.0.1
[0.2.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/Automattic/jetpack-mu-wpcom/compare/v0.1.1...v0.1.2
