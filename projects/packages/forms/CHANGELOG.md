# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.56.0] - 2025-06-02
### Added
- Add tracking pixel to form submission emails to know if emails are being opened (no user info is sent). [#43629]
- Add events to Forms dashboard pages. [#43686]
- Add page to announce that forms moved to Jetpack > Forms menu. [#43620]
- Reinstate sending submission email when user moves response from spam to inbox. [#43559]
- Use translated screenshot on dashboard migration page. [#43693] [#43707]

### Changed
- Add mobile-friendly styles and screenshot on Forms migration page. [#43664]
- Add context to About tab translation. [#43708]
- Add translation hint for Trash terminology. [#43704]
- Change action button placement on mobile. [#43605]
- Create a new page instead of post when creating a new form from dashboard. [#43668]
- Create form patterns from About page. [#43608]
- Enable feature filters by default to migrate forms dashboard page and menu. [#43705]
- Indicate in sidebar if no integrations enabled. [#43547]
- Update inbox header to use latest component features. [#43680]
- Update styles, labels and copy edits for integrations modal and tab. [#43666]
- Update package dependencies. [#43712]

### Removed
- Disable default listing UI for Feedback post types if the menu item is removed. [#43657]

### Fixed
- Contact Form: Use `wp_kses_post` instead of `esc_html` when rendering legend to allow safe HTML in fieldset legends. [#43639]
- File Upload field: Show upload progress when reduced motion is enabled. [#43628]
- Remove dependency from `jetpack-mu-wpcom-plugin`. [#43627]

## [0.55.0] - 2025-05-26
### Added
- Forms: Add Create Form button to dashboard header. [#43529]
- Forms: Add feature filter flags and code for moving submenu item from Feedback > Forms responses to Jetpack > Forms. [#43295]
- Forms: Add Integration screen content. [#43530]
- Forms: Add integration tab with feature flag. [#43502]

### Changed
- Forms: Address styles design on integrations tabs and modal. [#43576]
- Update package dependencies. [#43516] [#43578]

### Fixed
- Fixed admin notice showing on all screens instead of only forms classic view. [#43582]
- Forms: Apply max-width on Salesforce ID input. [#43543]
- Forms: Fix Akismet spam URL. [#43542]
- Forms: Remove the ability to upload multiple files at using the same file upload field. This field is not yet released. [#43555]

## [0.54.0] - 2025-05-19
### Added
- Add Google Drive to integrations modal. [#43479]

### Changed
- Get Google status with new `useIntegrationStatus` hook. [#43463]
- Update Google Sheets icon. [#43501]
- Update Salesforce icons. [#43487]
- Dashboard: Fix container height to consistently fit on view. [#43485]
- Update package dependencies. [#43398]

## [0.53.0] - 2025-05-15
### Added
- Add 33% width option to fields and button. [#43417]

### Changed
- Add Google to form integrations endpoint. [#43453]
- Change copy of upsell banner for File Upload block. [#43395]
- Simplify dropzone area and settings for File Upload field. [#43471]

### Fixed
- Fix a bug preventing responses dashboard from loading (blank screen). [#43460]
- Fix double scrollbars for responses. [#43462]
- Fix Google Connect button styling. [#43440]

## [0.52.0] - 2025-05-12
### Added
- Add Typescript support. [#43394]
- Unify icons and add Creative Mail to About page. [#43414]
- Update the email template for feedback responses. [#43323]

### Changed
- Move Salesforce to block modal. [#43297]
- Replace Landing page with About page. [#43361]
- Update form responses tabs. [#43358]
- Update list of files distributed in stable version of the package. [#43310]
- Update package dependencies. [#43400]

### Removed
- Remove Salesforce Form variation. [#43419]

### Fixed
- Adjust export button mobile styles. [#43381]
- Fix block modal mobile styling. [#43422]
- Fix responses toggle background. [#43377]
- Preserve responses query parameters. [#43372]
- Prevent submenu from interfering with Crowdsignal/Polldaddy submenu items. [#43385]
- Show export button only on responses tab. [#43374]
- Improve Success and Email messages. [#43380]
- Remove unused `block.json` for the File field to prevent it from showing in the WP.org blocks list. [#43387]

## [0.51.0] - 2025-05-05
### Added
- File Upload field: Add registration with plan check. [#43177]
- Add tabs to forms dashboard. [#43280]

### Changed
- Don't show colon after question mark for form labels. [#43307]
- Polish integration modal style and copy. [#43252]
- Remove default spacing from variations. [#43342]
- Use WordPress.com specific URLs at about page. [#43341]
- Update package dependencies. [#43314] [#43326] [#43350] [#43355]

### Deprecated
- Drop WP 6.6 support in Inbox by using new format for useResizeObserver. [#43343]

### Fixed
- Ensure forms modal handles services. [#43336]
- Fix Google Drive connection button style and streamline connection. [#43245]
- Linting: Address final rules in WordPress Stylelint config. [#43296]
- Linting: Do additional stylesheet cleanup. [#43247]

## [0.50.0] - 2025-04-28
### Added
- Add integration status to block sidebar. [#43178]
- Add tests for integrations endpoint. [#43236]
- Add Tracks to block modal. [#43174]

### Changed
- Always show "View action" in inbox. [#43185]
- Have integrations endpoint return array instead of object. [#43183]
- Redirect from `/landing` to `/responses` if there are form responses. [#42854]
- Update email HTML template. [#43093]
- Use componentry instead of CSS for some elements in integrations modal. [#43117]

### Removed
- Remove unused integrations code. [#43211]

### Fixed
- Avoid overwriting form values when field names are repeated. [#43140]
- File Field: Improve code style in interactivity layer. [#43201]
- Fix empty file field error case. [#43173]
- Fix max file size upload check. [#43142]
- Fix toggle deprecation warning. [#43218]
- Linting: Fix more Stylelint violations. [#43213]
- Linting: Remove outdated vendor prefixes in stylesheets. [#43219]

## [0.49.0] - 2025-04-21
### Added
- Add new integrations setup modal. [#43057]

### Changed
- Block registration: Do not display the block in the editor for non-admins when the feature is not active. [#40209]
- Add entry to integations modal in block toolbar. [#43126]
- Add tooltips to integration modal plugin CTAs. [#43102]
- Add tooltips to the toggle in integrations modal. [#43080]
- Remove colon after question mark for form labels. [#43133]
- Hide integrations modal CTA in the sidebar for Simple sites. [#43079]
- Reduce default padding in form patterns. [#43124]
- Update modal to use `VStack` and WP icons. [#43084]
- Inbox: Render source consistently in list and details view. [#43131]
- Load editor styles from metadata file. [#42751]

### Fixed
- Fix Creative Mail SVG issue. [#43112]
- Prevent Google Drive connection attempt without Jetpack user account connection. [#43121]
- Update form responses link on editor sidebar. [#43143]

## [0.48.0] - 2025-04-15
### Changed
- Polish integrations modal. [#43064]

## [0.47.0] - 2025-04-14
### Changed
- Close block panels by default. [#42953]
- Simplify IntegrationCardBody content. [#43020]
- Update IntegrationCard markup and styles. [#43017]

### Fixed
- Center pattern button in Form block placeholder. [#42968]
- Ensure form field hook returns string. [#43011]
- Fix IntegrationCardHeader toggle styles. [#42942]
- Fix integration modal tracks events. [#42945]
- Linting: Clean up various Stylelint violations. [#43010]
- Linting: Update stylesheets to use WordPress rules for fonts and colors. [#42920] [#42928]
- Linting: Use double colon notation for pseudo-element selectors. [#43019]

## [0.46.0] - 2025-04-07
### Added
- Add controls to IntegrationCard header. [#42930]
- Add custom hooks for integrations. [#42822]
- Add header, body, and button components to integrations modal. [#42903]
- Add endpoint for all integrations. [#42878]
- Add progress and errors to the form upload field. [#42845]
- Update CRM integration to hooks. [#42831]

### Changed
- Add default file label. [#42801]
- Add consent toggle to Creative Mail card. [#42874]
- Add brand icons for integrations modal. [#42870]
- Change default submissions view to dataviews. [#42329]
- Change path and return for form integrations endpoint. [#42826]
- Linting: First pass of style coding standards. [#42734]
- Move shared integration card logic. [#42908]
- Reorganize form integration modal code. [#42918]
- Update Creative Mail integration to hooks. [#42828] [#42762] [#42806] [#42809]

### Fixed
- Ensure response management compatibility with WordPress 6.6. [#42883]

## [0.45.0] - 2025-03-31
### Added
- Add third-party integration endpoint. [#42730]
- Add File Upload field prototype. [#42695]

### Changed
- Add block integrations modal with feature flag. [#42747]
- Create IntegrationCard component. [#42771]
- Update button styles in inspector controls. [#42769]
- Update IntegrationCard header markup and style. [#42772]
- Update dependencies. [#42678]

### Fixed
- Components: Update controls to prevent more deprecation notices. [#42677]
- Fix sorting of responses in Classic view. [#42764]
- Fix WordPress `useSelect` warning. [#42675]

## [0.44.0] - 2025-03-24
### Changed
- Update editor sidebar copy. [#42642]
- Update dependencies. [#42564]

### Fixed
- Components: Prevent deprecation notices by adding `__next40pxDefaultSize` to controls. [#42576]
- Fix `source` filtering in Classic view for responses management. [#42641]
- Prevent custom label font sizes from breaking animated label font size reduction. [#42248]
- Placeholder should always display if it's a non-empty string. [#42173]

## [0.43.0] - 2025-03-18
### Added
- Add a quick link to the admin bar to form entries. [#42474]

### Changed
- Remove Google Drive beta badge. [#42481]
- Remove Salesforce beta badge. [#42482]
- Update package dependencies. [#42511]

## [0.42.1] - 2025-03-17
### Fixed
- Fix core list bullets not showing. [#42440]

## [0.42.0] - 2025-03-12
### Added
- Provide connection data to footer component. [#42000]

### Changed
- Remove default padding around forms. [#42340]
- Remove the Jetpack footer on modal. [#42341]
- Update response management with DataViews. [#41602]
- Update package dependencies. [#42384]

### Fixed
- Adjust spacing around DataViews table. [#42348]
- Fix issue where multiple contact forms on the same page would fail to submit correctly. [#42345]
- Update date validation method by removing jQuery. [#41698]
- Update the preview for the different block variations. [#42366]

## [0.41.0] - 2025-03-10
### Added
- Add Akismet panel to form block. [#41826]

## [0.40.0] - 2025-03-03
### Added
- Add min/max options to number field. [#41783]

### Changed
- Contact Form: Updated editor styles for improved UI consistency and better alignment of form elements. [#42112]
- Add accessible name field to advanced settings. [#42101]
- Simplify placeholder block. [#42141]
- Use placeholder attribute in editor instead of value. [#41712]
- Update package dependencies. [#42163]

### Fixed
- Fix warnings when post author is not available. [#42115]
- Ensure fields that skip rendering (like empty options fields) do not trigger validation or show value in form submission response. [#41979]
- Fix 404 error when a user submits an invalid form with JavaScript disabled. [#41947]
- Fix field name set as label when trying to empty label. [#42125]
- Show plugin integrations on Atomic. [#42073]

## [0.39.0] - 2025-02-24
### Changed
- Add Tracks when connecting Google Drive. [#41825]

### Fixed
- Fix `empty form` check for select elements. [#41846]
- Update block editor tracks events. [#41824]

## [0.38.0] - 2025-02-17
### Added
- Forms block: Add number input. [#40962]

### Changed
- Add tracking for plugin installations. [#41732]

### Fixed
- Fix error setting for field. [#41715]
- Fix missing translations in choice field settings. [#41719]
- Fix syncing of shared styles for nested fields. [#41708]
- Vertically align submit button in single row. [#41576]

## [0.37.1] - 2025-02-11
### Fixed
- Fix missing translations. [#41671]

## [0.37.0] - 2025-02-10
### Added
- Add a new file upload field block to allow visitors to upload files through contact forms. [#41582]
- Add support for having multiple forms across paginated pages. [#41407]
- Update fields and button blocks to support contentOnly editing. [#41411]
- Tests: Verify empty forms do not submit. [#41504]

### Changed
- File Upload Field block: Use WordPress upload icon and follow consistent field patterns (currently in beta). [#41586]
- Track forms submissions in order to improve the product. [#41307]
- Update package dependencies. [#41491]

### Fixed
- Fix submit button width and alignment. [#41139]
- Fix block style variations not showing in the editor. [#41457]
- Fix the date format input if multiple date pickers are used with different date formats. [#41611]
- Fix invalid HTML IDs. [#41564]
- Hide fields without options. [#41443]
- Improve the styling options of the separator block when placed inside the form block. [#40967]

## [0.36.0] - 2025-02-03
### Added
- Prevent empty client-side form submission. [#41464]

### Changed
- Remove legacy code and improve code quality. [#41348]
- Rename contact form block placeholder to "Forms". [#41384]
- Update package dependencies. [#41286]

### Fixed
- Add wrapping div to the core HTML block when inserted inside the form block. [#41269]
- Code: Remove extra params on function calls. [#41263]
- Feedback: Fix encoding when going from spam to regular type. [#41359]
- Feedback: Fix missing spacing bug in list view. [#41367]
- Fix date picker styles in dark themes. [#41342]
- Fix field spacing and widths. [#41415]
- Fix permanent deletion of form reponses via quicklinks. [#41321]
- Fix submission when date field errored. [#41511]
- Hide empty radio fields. [#41379]
- Prevent empty style values within form field block attributes. [#41206]
- Prevent error in block placeholder when the Forms module is disabled. [#41382]
- Translations: Fix spam % character. [#41345]

## [0.35.1] - 2025-01-27
### Added
- Add Checkbox and Consent field enter action to create a new block. [#41297]
- Create new default block when pressing Enter on text inputs. [#41177]

### Changed
- Remove wrapping <div> element from form block. [#41274]

### Fixed
- Add missing deprecation for checkboxes and radio fields. [#41198]
- Fix the default checkstate for admins. [#40847]
- Add unique ids to each form. [#40998]
- Fix send to settings for multiple authors. [#41290]
- Make the icons show up as expected in the style editor. [#41314]
- Update the icon colours to the new standard. [#41250]

## [0.35.0] - 2025-01-20
### Added
- Forms: Allow HTML block within forms. [#41040]
- Forms: Handle `Enter` on empty radio/checkbox input. [#41082]

### Changed
- Code: Use function-style exit() and die() with a default status code of 0. [#41167]
- Forms: rename "URL" field to "Website" [#41029]
- Forms: settings, opt-in for default 40px size in gutenberg [#41127]
- Forms: update width control to use more modern ToggleGroupControl [#41130]
- Forms: use core icons for phone and email fields [#41034]
- Updated package dependencies. [#41099]

### Fixed
- Forms: Fix dropdown icon styling. [#41074]
- Forms: Fix redirect field styles [#41030]
- Forms: fix spacing issue in sidebar settings [#41133]
- Forms: Properly support formatting options for labels and required text [#40924]

## [0.34.6] - 2025-01-13
### Fixed
- Add webpack plugin to rename RTL files to match core WP expectations. [#40881]
- Show email only in form submission view if name is empty. [#40898]
- Forms: Fix success message color inside a dark Cover block. [#40917]
- Forms: Update default URL field label to match front-end. [#40921]

## [0.34.5] - 2025-01-06
### Changed
- Updated package dependencies. [#40705] [#40784] [#40792] [#40800] [#40831]

### Fixed
- Form block: Fix submit button styles when there are errors. [#40762]

## [0.34.4] - 2024-12-16
### Changed
- Updated package dependencies. [#40564]

### Fixed
- Form Block: Fix validation of URL input types to allow query strings. [#40490]

## [0.34.3] - 2024-12-09
### Changed
- Updated package dependencies. [#40363]

## [0.34.2] - 2024-11-26
### Changed
- Update dependencies. [#39855]

## [0.34.1] - 2024-11-25
### Changed
- Updated dependencies. [#40286]
- Updated package dependencies. [#40288]

### Fixed
- Forms: fixed arrow positioning on select elements [#40206]

## [0.34.0] - 2024-11-18
### Removed
- General: Update minimum PHP version to 7.2. [#40147]

### Fixed
- Fix a fatal error occurring due to a function receiving an unexpected input type. [#40183]

## [0.33.8] - 2024-11-11
### Changed
- Updated package dependencies. [#39999] [#40060]

## [0.33.7] - 2024-11-04
### Added
- Enable test coverage. [#39961]

### Fixed
- Fix PHPUnit coverage warnings. [#39989]

## [0.33.6] - 2024-10-29
### Changed
- Components: Add __nextHasNoMarginBottom to BaseControl-based components, preventing deprecation notices. [#39877]

## [0.33.5] - 2024-10-28
### Changed
- Updated package dependencies. [#39910]

## [0.33.4] - 2024-10-21
### Changed
- Update dependencies. [#39781]

## [0.33.3] - 2024-10-14
### Changed
- Only include `wp-polyfill` as a script dependency when needed. [#39629]
- Updated package dependencies. [#39707]

### Fixed
- Improve security of the form endpoint. [#39759]

## [0.33.2] - 2024-10-07
### Changed
- Updated package dependencies. [#39594]

## [0.33.1] - 2024-09-30
### Changed
- Internal updates.

## [0.33.0] - 2024-09-23
### Added
- New filter to allow for excluding the contact form submission IP from being saved or e-mailed. [#39395]

### Changed
- Options: Get selection from the element's document instead of the global `window`. [#39364]
- Refactor Choice fields [#39141]

## [0.32.16] - 2024-09-16
### Changed
- Email submissions: on sites using www., ensure that the sending email address does not use the www. prefix. [#39370]

### Fixed
- Use en-dash in numeric range in i18n message to conform to guidelines. [#39305]

## [0.32.15] - 2024-09-10
### Changed
- Updated package dependencies. [#39302]

## [0.32.14] - 2024-09-09
### Changed
- Updated package dependencies. [#39176] [#39278]

### Fixed
- Contact Forms: added checks for unexpected contents of textarea elements. [#39271]

## [0.32.13] - 2024-09-04
### Changed
- Check for private and password-protected posts when handling the contact form submissions. [#39238]

## [0.32.12] - 2024-09-02
### Changed
- Forms: update child blocks to Block API v3 [#38916]
- Updated package dependencies. [#39111]

## [0.32.11] - 2024-08-26
### Changed
- Updated package dependencies. [#39004]

## [0.32.10] - 2024-08-21
### Changed
- Internal updates.

## [0.32.9] - 2024-08-19
### Changed
- Updated package dependencies. [#38662]

### Fixed
- Lossless image optimization for images (should improve performance with no visible changes). [#38750]

## [0.32.8] - 2024-08-12
### Added
- React 19 compatibility: Making sure useRef includes an argument. [#38765]

## [0.32.7] - 2024-08-05
### Changed
- React compatibility: Changing ReactDOM.render usage to be via ReactDOM.createRoot. [#38649]

## [0.32.6] - 2024-07-29
### Changed
- Update dependencies. [#38558]

## [0.32.5] - 2024-07-22
### Fixed
- Block Picker: Fixed display of the picker in the block editor following changes in WordPress 6.6. [#38406]
- Form Submissions Table: Ensured the IP address is displayed for each submission, when available. [#38352]

## [0.32.4] - 2024-07-15
### Changed
- Internal updates.

## [0.32.3] - 2024-07-08
### Changed
- Updated package dependencies. [#38132]

## [0.32.2] - 2024-06-24
### Changed
- Update dependencies. [#37979]

## [0.32.1] - 2024-06-17
### Changed
- Updated package dependencies. [#37796]

## [0.32.0] - 2024-06-10
### Changed
- Change codebase to use clsx instead of classnames. [#37708]
- Updated package dependencies. [#37669] [#37706]

### Fixed
- Allow users to add multiple options to a dropdown field [#37739]
- Avoid PHP notice when form is submitted to the wrong URL [#37672]

## [0.31.4] - 2024-05-27
### Changed
- Update dependencies. [#37356]

## [0.31.3] - 2024-05-20
### Changed
- Forms: Ensure non-minified JS file location is also an option when loading the tiny-mce-plugin-form-button script file. [#37351]
- Updated package dependencies. [#37379] [#37380] [#37382]

## [0.31.2] - 2024-05-13
### Changed
- Update dependencies. [#37280]

## [0.31.1] - 2024-05-07
### Fixed
- Contact Form: Prevent an editor error when using the Classic Editor and contact forms are enabled. [#37270]

## [0.31.0] - 2024-05-06
### Added
- Add missing package dependencies. [#37141]

### Changed
- Updated package dependencies. [#37147]

### Removed
- Contact Form: Removing code and renaming relevant references to ensure we use the package version of the contact form. [#37157]

### Fixed
- Fix reference to `Jetpack_Options` class in `Contact_Form_Plugin::record_tracks_event()`. [#37201]

## [0.30.18] - 2024-04-29
### Changed
- General: Use wp_admin_notice function introduced in WP 6.4 to display notices. [#37051]

## [0.30.17] - 2024-04-25
### Fixed
- Set correct `textdomain` in `block.json`. [#37057]

## [0.30.16] - 2024-04-22
### Changed
- Internal updates.

## [0.30.15] - 2024-04-15
### Changed
- Update dependencies. [#36848]

## [0.30.14] - 2024-04-08
### Changed
- Updated package dependencies. [#36760]
- Update to the most recent version of Color Studio, 2.6.0. [#36751]

## [0.30.13] - 2024-03-27
### Changed
- Updated package dependencies. [#36585]

### Fixed
- Enable undoing adding a contact form [#36485]

## [0.30.12] - 2024-03-25
### Changed
- Made some Contact_Form methods publicly available [#36137]

## [0.30.11] - 2024-03-18
### Fixed
- Dashboard: add missing Connection state to the page. [#36406]
- Dashboard: avoid JS errors when content disposition is not set. [#36406]

## [0.30.10] - 2024-03-12
### Changed
- Update code references in docs and comments [#36234]
- Updated package dependencies. [#36325]

## [0.30.9] - 2024-03-12
### Fixed
- Performance: avoid querying for posts on all pages of the dashboard, and only do so on Feedback admin pages. [#36230]

## [0.30.8] - 2024-03-04
### Changed
- Updated package dependencies.

### Fixed
- Contact Form: make constrained inputs full-width on mobile [#36000]

## [0.30.7] - 2024-02-27
### Changed
- Update dependencies.

## [0.30.6] - 2024-02-26
### Deprecated
- Deprecate the temporary tmp_grunion_allow_editor_view filter. [#35584]

## [0.30.5] - 2024-02-13
### Changed
- Updated package dependencies. [#35608]

## [0.30.4] - 2024-02-12
### Fixed
- Dashboard: improve the display of the dashboard to non-admins. [#35571]
- Forms: fix multiple and single choice fields button style [#35456]

## [0.30.3] - 2024-02-05
### Changed
- Asset enqueuing: switch to enqueuing strategy introduced in WordPress 6.3. [#34072]
- Updated package dependencies.

### Fixed
- Center submit button content horizontally [#35319]

## [0.30.2] - 2024-01-29
### Changed
- Update dependencies.

## [0.30.1] - 2024-01-22
### Added
- Contact Form: test setup for front end script [#35074]

## [0.30.0] - 2024-01-08
### Changed
- Updated useModuleStatus hook to use module_status redux store. [#34845]
- Use useModuleStatus hook instead of direct call of store selectors. [#34856]

### Fixed
- Avoid PHP warnings when post is not set. [#34886]

## [0.29.2] - 2024-01-04
### Changed
- Updated package dependencies. [#34815]

## [0.29.1] - 2024-01-02
### Changed
- Made module updates more precise in the modules store. [#34801]

## [0.29.0] - 2023-12-25
### Added
- Contact Form: add accessible name to form [#34667]
- Contact Form: add date format to date picker [#34743]

### Fixed
- Contact Form: suppress PHP warning [#34756]

## [0.28.0] - 2023-12-20
### Added
- Contact Form: add extra field settings to base field. [#34704]

### Changed
- Contact Form: minify stylesheets in prod. [#34672]

## [0.27.0] - 2023-12-15
### Added
- Contact Form: improve form error message [#34629]

### Changed
- Form block: hide 'lead capture' variation for WP.com Atomic sites [#34615]

### Fixed
- Contact Form: add missing Required toolbar button to Checkbox field [#34630]
- Contact Form: align half-width fields on same row [#34632]

## [0.26.0] - 2023-12-14
### Added
- Contact Form: build JS assets [#34622]

### Fixed
- Avoid PHP warnings when methods are called too early. [#34576]

## [0.25.0] - 2023-12-11
### Added
- Contact Form: Added submitting state. [#34367]
- Contact Form: Improved form error message. [#34520]
- Contact Form: Added revalidation for fields on focus out. [#34401]
- Contact Form: Added revalidation for missing value as the user types. [#34518]

### Changed
- Contact Form: Aligned checkbox and radio button baselines. [#34429]
- Contact Form: Refactored accessible-form.js. [#34400]
- Updated package dependencies. [#34416]

### Fixed
- Contact Form: Added margin below global error message. [#34447]
- Contact Form: Ensured warning icons are visible. [#34455]
- Contact Form: Fixed checkbox field layout in editor. [#34405]
- Contact Form: Replaced jQuery UI select by native element. [#34441]
- Contact Form: Specified version for accessible-form script. [#34457]
- Fixed potential undefined variable access in Contact_Form_Plugin. [#34500]

## [0.24.2] - 2023-12-03
### Added
- Made forms a screen reader region. [#34344]

### Changed
- Improved checkbox field design. [#34272]
- Updated package dependencies. [#34411] [#34427]

### Fixed
- Fixed PHP warnings that occured when processing malformed data. [#34386]
- Added focus state to radio buttons and checkboxes. [#34408]
- Fixed styling issues for Outlined and Animated styles. [#34272]
- Made Contact Form error fixing accessible. [#34173]

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
- Updated package dependencies. [#32803] [#32804]

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
- Updated package dependencies. [#29854] [#29857]

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

[0.56.0]: https://github.com/automattic/jetpack-forms/compare/v0.55.0...v0.56.0
[0.55.0]: https://github.com/automattic/jetpack-forms/compare/v0.54.0...v0.55.0
[0.54.0]: https://github.com/automattic/jetpack-forms/compare/v0.53.0...v0.54.0
[0.53.0]: https://github.com/automattic/jetpack-forms/compare/v0.52.0...v0.53.0
[0.52.0]: https://github.com/automattic/jetpack-forms/compare/v0.51.0...v0.52.0
[0.51.0]: https://github.com/automattic/jetpack-forms/compare/v0.50.0...v0.51.0
[0.50.0]: https://github.com/automattic/jetpack-forms/compare/v0.49.0...v0.50.0
[0.49.0]: https://github.com/automattic/jetpack-forms/compare/v0.48.0...v0.49.0
[0.48.0]: https://github.com/automattic/jetpack-forms/compare/v0.47.0...v0.48.0
[0.47.0]: https://github.com/automattic/jetpack-forms/compare/v0.46.0...v0.47.0
[0.46.0]: https://github.com/automattic/jetpack-forms/compare/v0.45.0...v0.46.0
[0.45.0]: https://github.com/automattic/jetpack-forms/compare/v0.44.0...v0.45.0
[0.44.0]: https://github.com/automattic/jetpack-forms/compare/v0.43.0...v0.44.0
[0.43.0]: https://github.com/automattic/jetpack-forms/compare/v0.42.1...v0.43.0
[0.42.1]: https://github.com/automattic/jetpack-forms/compare/v0.42.0...v0.42.1
[0.42.0]: https://github.com/automattic/jetpack-forms/compare/v0.41.0...v0.42.0
[0.41.0]: https://github.com/automattic/jetpack-forms/compare/v0.40.0...v0.41.0
[0.40.0]: https://github.com/automattic/jetpack-forms/compare/v0.39.0...v0.40.0
[0.39.0]: https://github.com/automattic/jetpack-forms/compare/v0.38.0...v0.39.0
[0.38.0]: https://github.com/automattic/jetpack-forms/compare/v0.37.1...v0.38.0
[0.37.1]: https://github.com/automattic/jetpack-forms/compare/v0.37.0...v0.37.1
[0.37.0]: https://github.com/automattic/jetpack-forms/compare/v0.36.0...v0.37.0
[0.36.0]: https://github.com/automattic/jetpack-forms/compare/v0.35.1...v0.36.0
[0.35.1]: https://github.com/automattic/jetpack-forms/compare/v0.35.0...v0.35.1
[0.35.0]: https://github.com/automattic/jetpack-forms/compare/v0.34.6...v0.35.0
[0.34.6]: https://github.com/automattic/jetpack-forms/compare/v0.34.5...v0.34.6
[0.34.5]: https://github.com/automattic/jetpack-forms/compare/v0.34.4...v0.34.5
[0.34.4]: https://github.com/automattic/jetpack-forms/compare/v0.34.3...v0.34.4
[0.34.3]: https://github.com/automattic/jetpack-forms/compare/v0.34.2...v0.34.3
[0.34.2]: https://github.com/automattic/jetpack-forms/compare/v0.34.1...v0.34.2
[0.34.1]: https://github.com/automattic/jetpack-forms/compare/v0.34.0...v0.34.1
[0.34.0]: https://github.com/automattic/jetpack-forms/compare/v0.33.8...v0.34.0
[0.33.8]: https://github.com/automattic/jetpack-forms/compare/v0.33.7...v0.33.8
[0.33.7]: https://github.com/automattic/jetpack-forms/compare/v0.33.6...v0.33.7
[0.33.6]: https://github.com/automattic/jetpack-forms/compare/v0.33.5...v0.33.6
[0.33.5]: https://github.com/automattic/jetpack-forms/compare/v0.33.4...v0.33.5
[0.33.4]: https://github.com/automattic/jetpack-forms/compare/v0.33.3...v0.33.4
[0.33.3]: https://github.com/automattic/jetpack-forms/compare/v0.33.2...v0.33.3
[0.33.2]: https://github.com/automattic/jetpack-forms/compare/v0.33.1...v0.33.2
[0.33.1]: https://github.com/automattic/jetpack-forms/compare/v0.33.0...v0.33.1
[0.33.0]: https://github.com/automattic/jetpack-forms/compare/v0.32.16...v0.33.0
[0.32.16]: https://github.com/automattic/jetpack-forms/compare/v0.32.15...v0.32.16
[0.32.15]: https://github.com/automattic/jetpack-forms/compare/v0.32.14...v0.32.15
[0.32.14]: https://github.com/automattic/jetpack-forms/compare/v0.32.13...v0.32.14
[0.32.13]: https://github.com/automattic/jetpack-forms/compare/v0.32.12...v0.32.13
[0.32.12]: https://github.com/automattic/jetpack-forms/compare/v0.32.11...v0.32.12
[0.32.11]: https://github.com/automattic/jetpack-forms/compare/v0.32.10...v0.32.11
[0.32.10]: https://github.com/automattic/jetpack-forms/compare/v0.32.9...v0.32.10
[0.32.9]: https://github.com/automattic/jetpack-forms/compare/v0.32.8...v0.32.9
[0.32.8]: https://github.com/automattic/jetpack-forms/compare/v0.32.7...v0.32.8
[0.32.7]: https://github.com/automattic/jetpack-forms/compare/v0.32.6...v0.32.7
[0.32.6]: https://github.com/automattic/jetpack-forms/compare/v0.32.5...v0.32.6
[0.32.5]: https://github.com/automattic/jetpack-forms/compare/v0.32.4...v0.32.5
[0.32.4]: https://github.com/automattic/jetpack-forms/compare/v0.32.3...v0.32.4
[0.32.3]: https://github.com/automattic/jetpack-forms/compare/v0.32.2...v0.32.3
[0.32.2]: https://github.com/automattic/jetpack-forms/compare/v0.32.1...v0.32.2
[0.32.1]: https://github.com/automattic/jetpack-forms/compare/v0.32.0...v0.32.1
[0.32.0]: https://github.com/automattic/jetpack-forms/compare/v0.31.4...v0.32.0
[0.31.4]: https://github.com/automattic/jetpack-forms/compare/v0.31.3...v0.31.4
[0.31.3]: https://github.com/automattic/jetpack-forms/compare/v0.31.2...v0.31.3
[0.31.2]: https://github.com/automattic/jetpack-forms/compare/v0.31.1...v0.31.2
[0.31.1]: https://github.com/automattic/jetpack-forms/compare/v0.31.0...v0.31.1
[0.31.0]: https://github.com/automattic/jetpack-forms/compare/v0.30.18...v0.31.0
[0.30.18]: https://github.com/automattic/jetpack-forms/compare/v0.30.17...v0.30.18
[0.30.17]: https://github.com/automattic/jetpack-forms/compare/v0.30.16...v0.30.17
[0.30.16]: https://github.com/automattic/jetpack-forms/compare/v0.30.15...v0.30.16
[0.30.15]: https://github.com/automattic/jetpack-forms/compare/v0.30.14...v0.30.15
[0.30.14]: https://github.com/automattic/jetpack-forms/compare/v0.30.13...v0.30.14
[0.30.13]: https://github.com/automattic/jetpack-forms/compare/v0.30.12...v0.30.13
[0.30.12]: https://github.com/automattic/jetpack-forms/compare/v0.30.11...v0.30.12
[0.30.11]: https://github.com/automattic/jetpack-forms/compare/v0.30.10...v0.30.11
[0.30.10]: https://github.com/automattic/jetpack-forms/compare/v0.30.9...v0.30.10
[0.30.9]: https://github.com/automattic/jetpack-forms/compare/v0.30.8...v0.30.9
[0.30.8]: https://github.com/automattic/jetpack-forms/compare/v0.30.7...v0.30.8
[0.30.7]: https://github.com/automattic/jetpack-forms/compare/v0.30.6...v0.30.7
[0.30.6]: https://github.com/automattic/jetpack-forms/compare/v0.30.5...v0.30.6
[0.30.5]: https://github.com/automattic/jetpack-forms/compare/v0.30.4...v0.30.5
[0.30.4]: https://github.com/automattic/jetpack-forms/compare/v0.30.3...v0.30.4
[0.30.3]: https://github.com/automattic/jetpack-forms/compare/v0.30.2...v0.30.3
[0.30.2]: https://github.com/automattic/jetpack-forms/compare/v0.30.1...v0.30.2
[0.30.1]: https://github.com/automattic/jetpack-forms/compare/v0.30.0...v0.30.1
[0.30.0]: https://github.com/automattic/jetpack-forms/compare/v0.29.2...v0.30.0
[0.29.2]: https://github.com/automattic/jetpack-forms/compare/v0.29.1...v0.29.2
[0.29.1]: https://github.com/automattic/jetpack-forms/compare/v0.29.0...v0.29.1
[0.29.0]: https://github.com/automattic/jetpack-forms/compare/v0.28.0...v0.29.0
[0.28.0]: https://github.com/automattic/jetpack-forms/compare/v0.27.0...v0.28.0
[0.27.0]: https://github.com/automattic/jetpack-forms/compare/v0.26.0...v0.27.0
[0.26.0]: https://github.com/automattic/jetpack-forms/compare/v0.25.0...v0.26.0
[0.25.0]: https://github.com/automattic/jetpack-forms/compare/v0.24.2...v0.25.0
[0.24.2]: https://github.com/automattic/jetpack-forms/compare/v0.24.1...v0.24.2
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
