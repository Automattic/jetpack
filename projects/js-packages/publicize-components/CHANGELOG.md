# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Updated package dependencies. [#31659]
- Updated package dependencies. [#31661]

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
