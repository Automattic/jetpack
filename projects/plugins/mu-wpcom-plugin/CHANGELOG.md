# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2.8.0 - 2025-04-04
### Added
- Add newsletter widget to the dashboard. [#41807]
- Add site launch button to the admin bar. [#41240]
- Bump a Tracks stat for every wp-admin page view. [#42422]
- Comments: Use Verbum on comments containing block mark-up. [#42022]
- Connection: Disconnect all other users before disconnecting connection owner account. [#41923]
- Dashboard: Add Daily Writing Prompt widget. [#41094]
- Dashboard: Add general tasks widget. [#41150]
- Dashboard: Add launchpad. [#41434]
- Dashboard: Add site preview and links. [#41106]
- Launchpad: Add create-course-goal intent task list [#42108]
- Media: Introduce the Import Media page. [#41032]
- Media: Support Upload from URL on media-new page. [#41627]
- Media: Untangle Calypso. [#41628]
- Newsletter Dashboard Widget: Remove feature flag and enable widget. [#42276]
- Add Subscribers in WP Admin. [#42066]
- Theme tools: Load theme compat functionality relevant to features in Classic Theme Helper package. [#41598]

### Changed
- Admin Bar: Point the Edit Site menu item to `/site-editor.php`. [#41137]
- Admin Color Schemes: Update color schemes to match Calypso. [#40908]
- Connection: Allow pre-selected login providers. [#42662]
- Connection: Display connection status on Users page independent of the SSO module. [#41794]
- Hide "Verify Email" launchpad task for existing users. [#41326]
- Live Preview: Don't change the homepage when previewing a theme in the Site Editor [#42388]
- Prevent site owner from editing user's account-level fields. [#42177]
- Site Visibility: Port the site visibility settings from Calypso to WP Admin. [#42230]
- Theme: Clean up files that were used during the theme switch and theme preview. [#42420]
- Update composer.lock files. [#41066]
- Update package dependencies. [#40980] [#41659] [#42180] [#42815]
- Update Site Settings link copy. [#41663]
- Use `Automattic/jetpack-composer-plugin` so jetpack-library packages will be installed in a place where `wp i18n` will see them. [#41185]

### Removed
- Remove the "Personalize Link in Bio" launchpad task. [#41949]
- Remove start page pattern modal. [#41479]
- Use default core welcome tour when the user creates a post for the first time. [#41258]

### Fixed
- Admin Color Scheme: Fix the color of the Aquatic color scheme. [#42632]
- Avoid opening Fiverr link when hitting Enter. [#42093]
- Media Library: Ensure Upload from URL shows in the editor. [#41711]
- Do not load ETK on agency sites on all pages. [#41272]
- Filter out the full-site-editing plugin from the active_plugins list if the plugin file doesn't exist. [#41887]
- Use blueberry (modern) scheme for launch site button. [#42605]
- Make email and password available in `profile.php` on the default view. [#41945]
- Port the fix of the modern color scheme from WP 6.8. [#42462]
- Site Badge: Update styles of the Coming Soon badge. [#42496]
- Site Visibility: Prevent accidental changes to blog_public on the Settings > Reading page. [#42716]
- Verbum: Fix broken block editor. [#41747]

## 2.7.0 - 2025-01-10
### Added
- WordPress.com Features: Add Holiday Snow functionality. [#40478]

### Changed
- Newspack Blocks: Update to version 4.5.2. [#40636]
- Updated dependencies. [#40286]
- Updated package dependencies. [#40116] [#40515]

### Fixed
- Global Styles: Stop showing the limited global styles notice in distraction-free mode. [#40907]
- Testimonials: Fix a shortcode related bug which ccurs if the column attribute is added and set to 0. [#40896]

## 2.6.1 - 2024-11-11
### Changed
- Internal updates.

## 2.6.0 - 2024-11-11
### Added
- Enable test coverage. [#39961]

### Changed
- Admin dashboard: Disable portfolio toggle if theme supports portfolio and site is WoA [#39508]
- Only include `wp-polyfill` as a script dependency when needed. [#39629]
- Updated package dependencies. [#39288]
- Updated package dependencies. [#39653]
- Update Jetpack Scan link [#39619]

### Removed
- Connection: Removed deprecated method features_available [#39442]
- Connection: Removed features_enabled deprecated method [#39475]

### Fixed
- Portfolios: Ensure these are enabled and working properly on themes that support portfolios [#39431]
- Stats: Fix top post card on the Insight page [#39691]
- wpcom-block-editor: Support getting the canvas mode from the query string after GB 19.6 [#40045]

## 2.5.11 - 2024-09-02
### Changed
- Internal updates.

## 2.5.10 - 2024-08-30
### Changed
- Internal updates.

## 2.5.9 - 2024-08-26
### Changed
- Updated package dependencies. [#39004]

## 2.5.8 - 2024-08-21
### Changed
- Internal updates.

## 2.5.7 - 2024-08-19
### Changed
- Updated package dependencies. [#38822]

## 2.5.6 - 2024-08-12
### Changed
- Internal updates.

## 2.5.5 - 2024-08-08
### Changed
- Internal updates.

## 2.5.4 - 2024-08-05
### Changed
- Fixup versions [#38612]

## 2.5.3 - 2024-07-30
### Changed
- Internal updates.

## 2.5.2 - 2024-07-29
### Changed
- Internal updates.

## 2.5.1 - 2024-07-25
### Changed
- Internal updates.

## 2.5.0 - 2024-07-22
### Added
- Add missing `scssphp/scssphp` dependency to the plugin zip. [#38337]
- Add checks to remove WP.comm items and links in WP Admin for users who are not connected to WP.com. [#38401]

## 2.4.1 - 2024-07-18
### Changed
- Internal updates.

## 2.4.0 - 2024-07-15
### Added
- Composer lock update. [#38241]

## 2.3.3 - 2024-07-08
### Changed
- Updated package dependencies. [#38228]

## 2.3.2 - 2024-07-01
### Changed
- Internal updates.

## 2.3.1 - 2024-06-26
### Changed
- Internal updates.

## 2.3.0 - 2024-06-24
### Changed
- Site Visibility: Update link copy [#37909]

## 2.2.0 - 2024-06-18
### Changed
- Bump lock files. [#37870]

## 2.1.33 - 2024-06-17
### Changed
- Internal updates.

## 2.1.32 - 2024-06-14
### Changed
- Updated package dependencies. [#37767]

## 2.1.31 - 2024-06-10
### Changed
- Internal updates.

## 2.1.30 - 2024-06-06
### Changed
- Internal updates.

## 2.1.29 - 2024-06-03
### Changed
- Internal updates.

## 2.1.28 - 2024-05-27
### Changed
- Internal updates.

## 2.1.27 - 2024-05-20
### Changed
- Internal updates.

## 2.1.26 - 2024-05-16
### Changed
- Updated package dependencies. [#37348]

## 2.1.25 - 2024-05-14
### Changed
- Internal updates.

## 2.1.24 - 2024-05-13
### Changed
- Internal updates.

## 2.1.23 - 2024-05-13
### Changed
- Internal updates.

## 2.1.22 - 2024-05-09
### Changed
- Internal updates.

## 2.1.21 - 2024-05-06
### Changed
- Update formalized dependencies in Scheduled Updates. [#37008]

## 2.1.20 - 2024-04-29
### Changed
- Internal updates.

## 2.1.19 - 2024-04-29
### Changed
- Internal updates.

## 2.1.18 - 2024-04-26
### Changed
- Internal updates.

## 2.1.17 - 2024-04-25
### Changed
- Internal updates.

## 2.1.16 - 2024-04-22
### Changed
- Internal updates.

## 2.1.15 - 2024-04-15
### Changed
- Internal updates.

## 2.1.14 - 2024-04-08
### Changed
- Updated package dependencies. [#36775]

## 2.1.13 - 2024-04-05
### Changed
- Internal updates.

## 2.1.12 - 2024-04-04
### Changed
- Internal updates.

## 2.1.11 - 2024-04-01
### Changed
- Internal updates.

## 2.1.10 - 2024-03-27
### Changed
- Internal updates.

## 2.1.9 - 2024-03-25
### Changed
- Internal updates.

## 2.1.8 - 2024-03-22
### Changed
- Internal updates.

## 2.1.7 - 2024-03-20
### Changed
- Comment: Updated composer.lock. [#36458]

## 2.1.6 - 2024-03-18
### Changed
- Internal updates.

## 2.1.5 - 2024-03-15
### Changed
- Internal updates.

## 2.1.4 - 2024-03-12
### Changed
- Internal updates.

## 2.1.3 - 2024-03-12
### Changed
- Updated package dependencies. [#36309]

## 2.1.2 - 2024-03-11
### Changed
- Internal updates.

## 2.1.1 - 2024-03-05
### Fixed
- Updated dependencies. [#36170]

## 2.1.0 - 2024-03-04
### Added
- Added a Command Palette loader on the jetpack-mu-wpcom plugin. [#35635]

### Changed
- Update dev dependencies. [#35999]

## 2.0.26 - 2024-02-27
### Changed
- Internal updates.

## 2.0.25 - 2024-02-26
### Changed
- Internal updates.

## 2.0.24 - 2024-02-26
### Changed
- Internal updates.

## 2.0.23 - 2024-02-21
### Changed
- Internal updates.

## 2.0.22 - 2024-02-19
### Changed
- Internal updates.

## 2.0.21 - 2024-02-14
### Changed
- Internal updates.

## 2.0.20 - 2024-02-13
### Changed
- Updated package dependencies. [#35591]

## 2.0.19 - 2024-02-12
### Changed
- Internal updates.

## 2.0.18 - 2024-02-05
### Changed
- Internal updates.

## 2.0.17 - 2024-01-29
### Changed
- Internal updates.

## 2.0.16 - 2024-01-25
### Changed
- Internal updates.

## 2.0.15 - 2024-01-23
### Changed
- Internal updates.

## 2.0.14 - 2024-01-22
### Changed
- Internal updates.

## 2.0.13 - 2024-01-15
### Changed
- Internal updates.

## 2.0.12 - 2024-01-08
### Changed
- Updated package dependencies. [#34882]

## 2.0.11 - 2024-01-04
### Changed
- Internal updates.

## 2.0.10 - 2024-01-02
### Added
- Bumped the composer version. [#34789]

## 2.0.9 - 2023-12-25

- Internal updates.

## 2.0.8 - 2023-12-20
### Changed
- Internal updates.

## 2.0.7 - 2023-12-15
### Changed
- Version bump [#34648]

## 2.0.6 - 2023-12-14
### Changed
- Updated package dependencies. [#34559]

## 2.0.5 - 2023-12-11
### Changed
- Internal updates.

## 2.0.4 - 2023-12-03

## 2.0.3 - 2023-11-30
### Changed
- Internal updates.

## 2.0.2 - 2023-11-24

## 2.0.1 - 2023-11-21

## 2.0.0 - 2023-11-20
### Changed
- Updated the required PHP version to >= 7.0. [#34126]

## 1.7.11 - 2023-11-14
### Changed
- Updated package dependencies. [#34087]

## 1.7.10 - 2023-11-13
### Changed
- Internal updates.

## 1.7.9 - 2023-11-09

## 1.7.8 - 2023-11-08

## 1.7.7 - 2023-11-03

## 1.7.6 - 2023-10-31
### Changed
- Internal updates.

## 1.7.5 - 2023-10-30

## 1.7.4 - 2023-10-26

## 1.7.3 - 2023-10-24
### Changed
- Internal updates.

## 1.7.2 - 2023-10-23

## 1.7.1 - 2023-10-16
### Changed
- Updated package dependencies. [#33498]

## 1.7.0 - 2023-10-10
### Changed
- Updated lock files [#33456]
- Updated lock file [#33457]

## 1.6.24 - 2023-10-04
### Changed
- Internal updates.

## 1.6.23 - 2023-10-03

- Minor internal updates.

## 1.6.22 - 2023-09-28
### Changed
- Minor internal updates.

## 1.6.21 - 2023-09-25

## 1.6.20 - 2023-09-19

## 1.6.19 - 2023-09-11
### Changed
- Updated package dependencies. [#32966]

## 1.6.18 - 2023-09-07

## 1.6.17 - 2023-09-06

## 1.6.16 - 2023-09-04

## 1.6.15 - 2023-08-28
### Changed
- Updated package dependencies. [#32605]

## 1.6.14 - 2023-08-21

## 1.6.13 - 2023-08-15
### Changed
- Internal updates.

## 1.6.12 - 2023-08-14

- Minor internal updates.

## 1.6.11 - 2023-08-09
### Changed
- Internal updates.

## 1.6.10 - 2023-08-09
### Changed
- Updated package dependencies. [#32307]

## 1.6.9 - 2023-08-07

## 1.6.8 - 2023-08-01

- Minor internal updates.

## 1.6.7 - 2023-07-26

- Updated package dependencies.

## 1.6.6 - 2023-07-25

## 1.6.5 - 2023-07-17
### Changed
- Updated package dependencies. [#31769]

## 1.6.4 - 2023-07-10

## 1.6.3 - 2023-07-05

## 1.6.2 - 2023-06-27

## 1.6.1 - 2023-06-26
### Changed
- Updated package dependencies.

## 1.6.0 - 2023-06-26
### Changed
- Updated package dependencies. [#31308]

### Fixed
- Updates package version. [#31191]

## 1.5.0 - 2023-06-19
### Fixed
- Updates package version to 3.1.0-alpha [#31349]

## 1.4.0 - 2023-06-12
### Changed
- Updated package dependencies. [#31284]

## 1.3.0 - 2023-06-06
### Changed
- Updated jetpack-mu-wpcom [#30915]

## 1.2.6 - 2023-05-29

## 1.2.5 - 2023-05-22
### Changed
- Internal updates.

## 1.2.4 - 2023-05-15
### Changed
- Internal updates.

## 1.2.3 - 2023-05-12

## 1.2.2 - 2023-05-11

## 1.2.1 - 2023-05-08
### Changed
- Updated package dependencies. [#30493]

## 1.2.0 - 2023-05-02
### Added
- Remove conditional rendering from zendesk chat widget component due to it being handled by an api endpoint now [#29942]

## 1.1.3 - 2023-04-25

- Minor internal updates.

## 1.1.2 - 2023-04-17
### Changed
- Internal updates.

## 1.1.1 - 2023-04-10
### Changed
- Internal updates.

## 1.1.0 - 2023-04-05
### Added
- Launchpad: Update composer.lock [#29841]

### Changed
- Updated package dependencies. [#29565]

## 1.0.12 - 2023-03-28

## 1.0.11 - 2023-03-20
### Changed
- Internal updates.

## 1.0.10 - 2023-03-13
### Added
- Start next cycle [#29437]

### Changed
- Updated package dependencies. [#29434]

## 1.0.9 - 2023-03-10

- Minor internal updates.

## 1.0.8 - 2023-03-09

- Minor internal updates.

## 1.0.7 - 2023-03-08
### Changed
- Minor internal updates.

## 1.0.6 - 2023-02-28
### Changed
- Minor internal updates.

## 1.0.5 - 2023-02-20
### Changed
- Minor internal updates.

## 1.0.4 - 2023-02-15
### Changed
- Updated package dependencies. [#28910]

## 1.0.3 - 2023-02-09
### Changed
- Use JETPACK_MU_WPCOM_LOAD_VIA_BETA_PLUGIN to conditionally load the package. [#28880]

## 1.0.2 - 2023-02-08

- Updated package dependencies.

## 1.0.1 - 2023-02-06

- Updated package dependencies.

## 1.0.0 - 2023-01-30

- Initial plugin release.
