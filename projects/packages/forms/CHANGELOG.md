# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.24.1] - 2023-11-24
### Changed
- Replaced usage of strpos() with str_contains(). [#34137]
- Replaced usage of substr() with str_starts_with() and str_ends_with(). [#34207]
- Fixed markup accessibility issues for Contact Form's single and multiple choice inputs. [#34147]
- Updated form blocks to prioritize the use of form elements in the block inserter. [#34247]

### Fixed
- Improved Contact Form required label contrast. [#34237]
- Updated `Admin::grunion_ajax_shortcode()` to use the correct sorting function. [#34230]

## [0.24.0] - 2023-11-20
### Changed
- Replaced usage of strpos() with str_starts_with(). [#34135]
- Updated required PHP version to >= 7.0. [#34192]

### Fixed
- Added an accessible name to the Contact Form dropdown rendered in the front-end. [#34139]
- Avoid errors when a saved feedback form does not have the expected WP_Post format. [#34129]

## [0.23.1] - 2023-11-14
### Changed
- Updated package dependencies. [#34093]

## [0.23.0] - 2023-11-13
### Changed
- Updated 'useModuleStatus' to use the new Jetpack modules store. [#33397]

## [0.22.6] - 2023-11-03

## [0.22.5] - 2023-10-31
### Fixed
- Fixes style for multiple choice checkbox in Froms block. [#33827]

## [0.22.4] - 2023-10-23
### Changed
- Updated package dependencies. [#33646] [#33687]

## [0.22.3] - 2023-10-16
### Changed
- Updated package dependencies. [#33429]

## [0.22.2] - 2023-10-10
### Changed
- Updated package dependencies. [#33428]

## [0.22.1] - 2023-09-28
### Changed
- Minor internal updates.

## [0.22.0] - 2023-09-19
### Changed
- Moving block registration when plugin activated [#33050]
- Updated package dependencies. [#33001]

## [0.21.0] - 2023-09-04
### Added
- Add Jetpack AI Form section to new Forms landing page [#32726]

### Changed
- Updated package dependencies. [#32803]
- Updated package dependencies. [#32804]

### Fixed
- Fix block icons for display on wp.org [#32754]

## [0.20.1] - 2023-08-28
### Changed
- Updated package dependencies. [#32605]

## [0.20.0] - 2023-08-21
### Added
- Add block.json file to Contact Form block [#32583]
- Forms block - allow transforming to a subscribe block. [#32478]

### Changed
- Forms block: rename "Newsletter Connection" to "Creative Mail" to avoid confusing with "Jetpack Newsletters" and subscription block. Call the block a "Lead Capture" block (not sign up). [#32481]

## [0.19.11] - 2023-08-14
### Changed
- Add a unified/consistent visual aid for focused elements. [#30219]

## [0.19.10] - 2023-08-09
### Changed
- Updated package dependencies. [#32166]

## [0.19.9] - 2023-08-07
### Added
- Added SIG modal ui [#31665]

## [0.19.8] - 2023-07-25
### Changed
- Updated package dependencies. [#32040]
- Update the name of the Newsletter Sign-up Variation. [#31998]

## [0.19.7] - 2023-07-17
### Changed
- Updated package dependencies. [#31785]

### Fixed
- Avoid Fatal errors when exporting fields that were not saved with the correct value. [#31858]
- Fix Forms dropdown required validation [#31894]

## [0.19.6] - 2023-07-05
### Changed
- Remove the default title ("You got a new response!") added to emails sent for new feedback received. [#31667]
- Updated package dependencies. [#31659]

## [0.19.5] - 2023-06-26
### Changed
- Updated package dependencies.

## [0.19.4] - 2023-06-12
### Removed
- Jetpack Forms: remove the links in the response emails sent to site owners [#31270]

## [0.19.3] - 2023-06-06
### Changed
- Updated package dependencies. [#31129]

### Fixed
- Editor view: remove duplicated Add Contact Form button. [#31158]

## [0.19.2] - 2023-05-30
### Changed
- Jetpack Forms: added basic email template [#31026]

## [0.19.1] - 2023-05-29
### Changed
- Internal updates.

## [0.19.0] - 2023-05-22
### Fixed
- Forms: Attempt to fix Forms hash generation [#30764]

## [0.18.0] - 2023-05-18
### Added
- Akismet: include current gmt time to assist in spam detection [#30755]
- Jetpack Forms: improving the styling of response emails [#30088]

### Fixed
- Change hook parameter to what it was before (fields collection). Modify Post_To_Url hook to handle such collection instead of a form instance [#30744]

## [0.17.0] - 2023-05-15
### Added
- Forms: Add style customization options for the MC/SC field buttons style [#30526]
- Forms: Create dashboard landing page [#30161]
- The new Jetpack Forms feedback WP Admin page is now enabled. The old page remains the default for the time being and all users can opt-in to see the new interface by using the 'view' swtich in the top right corner. [#30515]

### Changed
- Forms: Enable Forms landing page redirection logic [#30605]
- Forms: Remove Forms landing page redirection logic [#30548]
- Provide default data sets for responses data to avoid PHP warnings on undefined array keys [#30520]

### Fixed
- Add salesforce form variation alongside default variations for better discoverability. Fix private method for action trigger [#30562]

## [0.16.0] - 2023-05-08
### Added
- Added URL-based navigation support for the new forms dashboard [#30367]
- Add inspector ID/name settings for form fields [#30260]

### Changed
- Do not normalize feedback posts main comment when possible, allowing fexports to not guess which is the Comment and simply adding a column with the input's label [#30475]
- Forms: Introduce Multiple Choice and Single Choice style variations [#30319]
- Forms: Update Multiple Choice and Single Choice fields Sidebar style settings [#30437]
- Updated border radius on forms dashboard cards [#30466]
- Update Forms pattern modal default view to Grid [#28906]
- We will not be re-sending emails when marking items as not-spam in the new forms dashboard. [#30356]

### Fixed
- Add necessary context to the word "Trash". [#30507]
- Change post_type comparison on untrash filter to only affect feedback posts [#30464]
- Ensure array is provided to array_diff_key to avoid warnings [#30317]
- Fix dropdown menu not working due to some CSS issues [#30409]
- Fixed class names for the response on the JP Forms dashboard. [#30468]
- Fixed the hitbox for the source link on the forms dashboard response list. [#30469]
- Forms: Fix Forms response meta date value [#30189]

## [0.15.0] - 2023-05-02
### Added
- Added a 'Copy' button for emails on the Jetpack forms dashboard response tab. [#30256]

### Changed
- Rows in the forms dashboard will now be dynamically removed and appended when performing bulk actions. [#30213]
- Updated package dependencies.

### Fixed
- Ensure IP address can be properly displayed for all form submissions. [#29491]
- Fixed an issue causing the forms dashboard view setting not to be saved on WP.com. [#30258]
- Fixed buggy behavior of loading placeholders in the forms dashboard. [#30353]
- Fixed invalid totals being reported for different tabs in the forms dashboard. [#30354]
- Forms: Fix Forms dashboard Multiple Choice response format. [#30370]

## [0.14.1] - 2023-05-01
### Changed
- Internal updates.

## [0.14.0] - 2023-04-25
### Added
- Added an animation for the responses tab on the forms dashboard. [#30152]
- Added counters on the tabs in the Jetpack Forms dashboard [#30252]
- Reinstate salesforce integration with a generic post-to-url hook [#30191]

### Fixed
- Fixed html entities not displaying correctly in the forms dashboard [#30257]

## [0.13.0] - 2023-04-17
### Added
- Added a 'Check for spam' button to the new feedback dashboard. [#29963]
- Added style overrides for the forms dashboard on WP.com [#29915]

### Changed
- Forms: Update Forms child blocks to allow any transformation between the blocks [#29978]
- Forms: Update forms dashboard body font-size to 14px [#29956]
- Updated package dependencies. [#30019]

### Fixed
- Forms: Fix Forms styles when inside Cover blocks [#30075]
- Forms: Prevent response details meta values line breaking [#30017]

## [0.12.0] - 2023-04-10
### Added
- Add Jetpack Autoloader package suggestion. [#29988]

### Changed
- Forms: Add line on top of the response list when the actions menu is sticky [#29941]
- Forms: Dashboard finetunings round 2 [#29909]
- Forms: Update source column styles and trash action label [#29970]

## [0.11.0] - 2023-04-04
### Added
- Export modal for the new JP Forms dashboard. [#29775]
- Forms: Add single actions menu to the Dashboard inbox view [#29848]
- Forms: Create response inbox filters [#29694]

### Changed
- Disregard post_status when calculating available filters for form responses. [#29817]
- Forms: Dashboard finetunings [#29789]
- Forms: Include bulk actions menu [#29766]
- Forms: Update Dashboard inbox columns responsiveness and sticky items style [#29914]
- Updated form responses endpoint to embed available filter data. [#29805]
- Updated package dependencies. [#29854]
- Updated package dependencies. [#29857]

### Fixed
- Made feedback bulk actions more explicit and easier to work with. [#29884]

## [0.10.2] - 2023-04-03
### Changed
- Internal updates.

## [0.10.1] - 2023-03-28
### Changed
- Minor internal updates.

## [0.10.0] - 2023-03-27
### Added
- Add all source post IDs on forms/responses endpoint [#29428]
- Added an endpoint for performing bulk actions on feedback responses. [#29682]
- Forms: Add Tabs to Forms dashboard inbox view [#29652]

### Changed
- Add a check for array on $attributes before trying to set an item on it [#29557]
- Add search input and styles [#29397]
- Change default entries per page on responses inbox [#29406]
- Feedback responses endpoint now allows filtering by post status and returns all totals. [#29589]
- Forms: Adjust Forms inbox view columns responsiveness [#29666]
- Forms: Update Forms inbox view responses styles [#29660]
- Jetpack Forms: changed "message sent" tracking from Tracks to bump stat. [#29383]
- Jetpack Forms: Change default entries per page on responses inbox [#29701]
- Jetpack Forms: display carriage returns in responses in the Feedback->Form Responses page. [#29698]
- Jetpack Forms: json_encode form responses instead of using print_r. [#29664]
- Upgrade package number [#29457]

### Fixed
- Refactored state management for forms dashboard [#29684]
- Use Contact_Form_Plugin::init instead of requiring the old module file [#29648]

## [0.9.0] - 2023-03-20
### Added
- Jetpack Forms: Add tracking of Google Sheets exports [#29225]

### Changed
- Rollback rename of columns/fields on export [#29448]
- Updated package dependencies. [#29471]

### Fixed
- Avoid PHP notices when using a form with a dropdown field. [#29512]
- Fix Forms previews on Forms package [#29359]

## [0.8.0] - 2023-03-13
### Added
- Added a 'view' toggle for switching between the new and old feedback views. [#29246]
- Added tracking of Jetpack Forms exports to CSV files. [#29102]

### Changed
- Better handling for loading state and empty results [#29387]
- Move action bar components out of inbox [#29360]
- Move BulkActionsMenu component inside Inbox, too tailored to be reused [#29386]
- Multiple Choice and Single Choice fields redesign [#29290]

### Fixed
- Avoid Fatal errors by calling method from the right class in the paackage. [#29391]

## [0.7.0] - 2023-03-08
### Added
- Add weekly/monthly props to sent message tracking [#28999]
- Add form responses app and state into package (out of plugin) [#29007]
- Fix search by invalidating resolution on the selector [#29259]
- Implement RWD navigation for feedback dashboard [#29315]

### Changed
- Forms: Move field width settings and remove placeholder field from MC/SC fields [#29292]
- Updated package dependencies. [#29216]

### Fixed
- Add defaults for Jetpack Forms CSS variables. [#29236]
- Fix table interactions for feedback dashboard [#29282]
- Forms Responses endpoint: fix permission check. [#29223]
- Move search into state, fix double fetch on search and paging [#29336]

## [0.6.0] - 2023-02-28
### Added
- Added a page navigation component for the new feedback dashboard [#28826]
- Add v2/v4 endpoint for form responses inbox [#29043]
- Allow Form fields style synchronization [#28988]
- Increase form fields padding based on user-defined border-radius [#28820]

### Changed
- Jetpack Forms dashboard now replaces the "Feedback" menu entry in WP Admin. [#29198]

### Fixed
- Remove body font normalization for on contact-form module and package [#29166]

## [0.5.1] - 2023-02-20
### Changed
- Minor internal updates.

## [0.5.0] - 2023-02-15
### Changed
- Update form-styles script to prevent blurred forms on slow loading pages [#28973]

## [0.4.0] - 2023-02-15
### Added
- Added response list table to the new feedback dashboard [#28821]
- Added the template for the response view in the new feedback dashboard [#28877]
- Add new method to reverse print_r output as stored on the feedback posts. Use it to try and parse the form fields, fallback to old method. [#28815]

### Changed
- Update to React 18. [#28710]

### Fixed
- Add filter to prevent contact-form-styles script from being concatenated [#28905]
- Configure with standard `@wordpress/browserslist-config` config. [#28910]
- Prevent Forms blur effect on AMP pages [#28926]

## [0.3.0] - 2023-02-08
### Added
- Add "watch" entries for both composer and package .json files. This allows us to run `jetpack watch packages/forms` while working on JS things [#28704]
- Add tooling for building the Jetpack Forms Dashboard [#28689]
- Moved contact form PHP files to automattic/jetpack-forms [#28574]
- Move Forms blocks to Forms package [#28630]

### Changed
- Forms: Update Form package with latest contact-form changes from trunk [#28752]
- Reorder export columns in 3 groups: response meta (title, source, date), response field values, response extra (consent, ip address) [#28678]

## [0.2.0] - 2023-01-26
### Added
- Moved contact form static files into the new forms package [#28417]

## 0.1.0 - 2023-01-23
### Added
- Added a new jetpack/forms package [#28409]
- Added a public load_contact_form method for initializing the contact form module. [#28416]

[0.24.1]: https://github.com/automattic/jetpack-forms/compare/v0.24.0...v0.24.1
[0.24.0]: https://github.com/automattic/jetpack-forms/compare/v0.23.1...v0.24.0
[0.23.1]: https://github.com/automattic/jetpack-forms/compare/v0.23.0...v0.23.1
[0.23.0]: https://github.com/automattic/jetpack-forms/compare/v0.22.6...v0.23.0
[0.22.6]: https://github.com/automattic/jetpack-forms/compare/v0.22.5...v0.22.6
[0.22.5]: https://github.com/automattic/jetpack-forms/compare/v0.22.4...v0.22.5
[0.22.4]: https://github.com/automattic/jetpack-forms/compare/v0.22.3...v0.22.4
[0.22.3]: https://github.com/automattic/jetpack-forms/compare/v0.22.2...v0.22.3
[0.22.2]: https://github.com/automattic/jetpack-forms/compare/v0.22.1...v0.22.2
[0.22.1]: https://github.com/automattic/jetpack-forms/compare/v0.22.0...v0.22.1
[0.22.0]: https://github.com/automattic/jetpack-forms/compare/v0.21.0...v0.22.0
[0.21.0]: https://github.com/automattic/jetpack-forms/compare/v0.20.1...v0.21.0
[0.20.1]: https://github.com/automattic/jetpack-forms/compare/v0.20.0...v0.20.1
[0.20.0]: https://github.com/automattic/jetpack-forms/compare/v0.19.11...v0.20.0
[0.19.11]: https://github.com/automattic/jetpack-forms/compare/v0.19.10...v0.19.11
[0.19.10]: https://github.com/automattic/jetpack-forms/compare/v0.19.9...v0.19.10
[0.19.9]: https://github.com/automattic/jetpack-forms/compare/v0.19.8...v0.19.9
[0.19.8]: https://github.com/automattic/jetpack-forms/compare/v0.19.7...v0.19.8
[0.19.7]: https://github.com/automattic/jetpack-forms/compare/v0.19.6...v0.19.7
[0.19.6]: https://github.com/automattic/jetpack-forms/compare/v0.19.5...v0.19.6
[0.19.5]: https://github.com/automattic/jetpack-forms/compare/v0.19.4...v0.19.5
[0.19.4]: https://github.com/automattic/jetpack-forms/compare/v0.19.3...v0.19.4
[0.19.3]: https://github.com/automattic/jetpack-forms/compare/v0.19.2...v0.19.3
[0.19.2]: https://github.com/automattic/jetpack-forms/compare/v0.19.1...v0.19.2
[0.19.1]: https://github.com/automattic/jetpack-forms/compare/v0.19.0...v0.19.1
[0.19.0]: https://github.com/automattic/jetpack-forms/compare/v0.18.0...v0.19.0
[0.18.0]: https://github.com/automattic/jetpack-forms/compare/v0.17.0...v0.18.0
[0.17.0]: https://github.com/automattic/jetpack-forms/compare/v0.16.0...v0.17.0
[0.16.0]: https://github.com/automattic/jetpack-forms/compare/v0.15.0...v0.16.0
[0.15.0]: https://github.com/automattic/jetpack-forms/compare/v0.14.1...v0.15.0
[0.14.1]: https://github.com/automattic/jetpack-forms/compare/v0.14.0...v0.14.1
[0.14.0]: https://github.com/automattic/jetpack-forms/compare/v0.13.0...v0.14.0
[0.13.0]: https://github.com/automattic/jetpack-forms/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/automattic/jetpack-forms/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/automattic/jetpack-forms/compare/v0.10.2...v0.11.0
[0.10.2]: https://github.com/automattic/jetpack-forms/compare/v0.10.1...v0.10.2
[0.10.1]: https://github.com/automattic/jetpack-forms/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/automattic/jetpack-forms/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/automattic/jetpack-forms/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/automattic/jetpack-forms/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/automattic/jetpack-forms/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/automattic/jetpack-forms/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/automattic/jetpack-forms/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/automattic/jetpack-forms/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/automattic/jetpack-forms/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/automattic/jetpack-forms/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/automattic/jetpack-forms/compare/v0.1.0...v0.2.0
