# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.6.0] - 2026-11-02
### Added
- Add a helper that builds share URLs from an address a reader enters, such as a Mastodon instance. [#54349]
- Settings > Sharing: in Comment Likes, note when new posts have comments turned off, with a link to Discussion settings. [#54358]

### Changed
- Explain on the React version of Settings > Sharing that the block placement applies to pages too, and what editing the page template is for. [#54372]
- Once a template is saved in the Site Editor, replace the block placement cards with a notice linking to the post and page templates there. [#54363]
- Sharing settings: Reword the notice shown on private sites to say that some sharing services aren't available. [#54371]
- Show the React version of Settings > Sharing by default. Return false from the `rsm_jetpack_ui_modernization_sharing_likes` filter to keep the PHP screen. [#54278]
- Template placements: Start the Sharing Buttons block on X, Facebook and Mastodon, or on WordPress, X and Facebook on WordPress.com, and carry a legacy Press This button over as the WordPress button. [#54346]
- Update package dependencies. [#53869]

### Fixed
- Offer a single X button when adding sharing buttons on the React version of Settings > Sharing. Sites that already use the older X (Twitter) button keep it. [#54360]

## [0.5.1] - 2026-10-28
### Changed
- Turn the block placement cards on the React version of Settings > Sharing into one radio choice, led by an option that doesn't add the block. [#54212]

## [0.5.0] - 2026-10-26
### Added
- Add cards to the React version of Settings > Sharing that place the Sharing Buttons and Like blocks before or after the content of posts and pages. [#53838]

### Changed
- Name Offline Mode as it is named across the rest of Jetpack. [#54034]
- Settings: Keep the React Sharing screen's data in a WordPress data store instead of TanStack Query. [#53853]

## [0.4.0] - 2026-10-19
### Added
- Add the Sharing Buttons and Like blocks before or after the post content in block themes' single post and page templates, when the legacy buttons are off and a site option asks for them. The `jetpack_sharing_likes_template_placement_post_types` filter adds other post types. [#53413]
- REST API: Read and save where the Sharing Buttons and Like blocks go in block theme templates, and link to the page template in the Site Editor. [#53732]

### Changed
- Settings: Hide the sharing button toolbar's title with the VisuallyHidden component rather than the global screen-reader-text class. [#53775]
- Update dependencies. [#53618]
- Update package dependencies. [#53004] [#53806]

## [0.3.0] - 2026-10-12
### Added
- Add a React version of the Settings > Sharing screen, available behind the `rsm_jetpack_ui_modernization_sharing_likes` filter. [#53297]
- Add a services manager to the React version of Settings > Sharing: reorder, add and remove sharing buttons, and create, edit and delete custom services. [#53378]
- Add Initializer::init() to set up the settings screen and its REST routes in one call. [#53099]
- Add REST endpoints to read and save every setting on Settings > Sharing, and to switch each feature to its block or turn it back on. [#53099]

### Changed
- Settings: Save no placement along with other sharing options until one is chosen, and return the saved options from Sharing_Options::update(). [#53278]

### Removed
- Remove the Sharing_Likes class. Read PACKAGE_VERSION from Initializer instead. [#53099]

### Fixed
- Stop Settings > Sharing from resetting sharing links to open in the same window. [#53099]

## [0.2.0] - 2026-10-05
### Added
- Add classes that register the per-post Likes and Sharing switches in the REST API. [#52950]

## [0.1.1] - 2026-09-29
### Changed
- Internal updates.

## 0.1.0 - 2026-09-28
### Added
- Initial version. [#52339]
- Settings: Add the wp-admin Settings > Sharing screen, covering sharing buttons, Like buttons, and where they appear. [#52407] [#52727] [#52756] [#52758]
- Settings: Give Comment Likes their own section on every platform, and offer the Like block to Jetpack and Atomic sites running Comment Likes. [#52796]

[0.6.0]: https://github.com/Automattic/jetpack-sharing-likes/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/Automattic/jetpack-sharing-likes/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-sharing-likes/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Automattic/jetpack-sharing-likes/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Automattic/jetpack-sharing-likes/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-sharing-likes/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/Automattic/jetpack-sharing-likes/compare/v0.1.0...v0.1.1
