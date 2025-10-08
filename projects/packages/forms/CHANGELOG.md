# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [6.9.0] - 2025-10-08
### Added
- Forms: add actions on dashboard inbox's single response view [#45352]
- Forms: Added required indicator settings, made forms with a sinble input required by default. [#45300]

### Changed
- Forms: optimize inbox data loading with _fields parameter to reduce payload size. [#45376]

### Fixed
- Forms: fix telephone field block country selector dropdown so it shows in front of other blocks while selected [#45380]

## [6.8.0] - 2025-10-06
### Added
- Add loading spinner for integrations. [#45363]

### Changed
- Improve preloading for endpoints. [#45362]
- Update package dependencies. [#45334] [#45335]

### Fixed
- Forms: Fix integrations bottom border. [#45359]
- Forms: Remove integrations loading spinner. [#45373]

## [6.7.0] - 2025-09-30
### Changed
- Forms: Use localized number format for number of responses shown. [#45326]

## [6.6.0] - 2025-09-29
### Added
- Add options to disable "Go Back" link and summary after submission. [#45273]
- Add setting to enable or disable email notifications for form submissions. [#45230]
- Add withSyncEvent fallback for pre 6.8 compatibility. [#45320]

### Changed
- Remove unnecessary copy from exports modal. [#45280]
- Rename 'Manage responses' forms sidebar block panel to 'Responses storage'. [#45228]

### Removed
- Remove unused code `Dashboard_View_Switch` and move useful methods into Dashboard static methods. [#45282]

### Fixed
- Don't override field labels on transforms. [#45281]
- Fix 404 response for empty feedback. [#45289]
- Fix the missing `_links` attribute. [#45274]
- Hide border on last integration card. [#45305]
- Resolve conflict with WordPress 6.7.3. [#45320]

## [6.5.1] - 2025-09-22
### Fixed
- Address linting issues. [#45242]
- Fix image choice widths. [#45257]

## [6.5.0] - 2025-09-19
### Added
- Add extra layer of cache busting for interactivity API files (view.js) with hash suffix. [#45138]
- Add filter to enable integrations. [#45201]
- Add hidden field. [#45104]
- Allow custom search placeholder for phone field. [#45197]

### Changed
- Add scheduled deletion for submissions that skip the submission's inbox and are stored as temporary feedback. [#45178]
- Fix phone field whitespace lint. [#45194]
- Return integration titles from endpoint. [#45151]
- Track on .com how often forms get submitted without a JWT token. [#45221]
- Update Image Select Field to beta. [#45168]
- Use new rating block on Feedback variation and pattern. [#45215]
- Update @wordpress/dataviews package from v7 to v9. [#45213]
- Update package dependencies. [#45173] [#45229]

### Fixed
- Add cache busting on new version for interactivity API script file on top level context. [#45167]
- Address some wee issues on field error stylings. [#45187]
- Fix outline and animated styles for Image Select field. [#45189]
- Fix slider min/max editing. [#45219]
- Fix slider value position. [#45218]
- Improve button alignment when field width allows wrapping the submit button. [#45188]
- Remove input element height CSS rule after fixing form-styles hook attribute. [#45202]
- Restrict button flex setup after last changes to improve overall layout. [#45233]

## [6.4.0] - 2025-09-15
### Added
- Add new block toggle to skip saving form submisions on WP Admin. [#45072]
- Add searchable country selector dropdown (combobox). [#45120]

### Changed
- Add integrations feature flag. [#45037]
- Add integrations permissions check. [#45063]
- Add preloaded config endpoint. [#45091]
- Fix URL validation consistency between frontend and backend to prevent malformed URLs from passing validation. [#45093]
- Improve supported integrations filter. [#45123]
- Image Select field: Show option label on selected options. [#45122]
- Image Select field: Update data processing and UI. [#45080] [#45142]
- Update package dependencies. [#45127] [#45128]

### Fixed
- Address caching issue by adding a manual cache-busting suffix. [#45137]
- Ensure slashes are not errantly stripped. [#45153]
- Fix a warning and bad handling when JSON_DATA is not preceded by a new line. [#45110]
- Fix MailPoet string warning. [#45114]

## [6.3.0] - 2025-09-08
### Added
- Add hidden input block. [#44079]
- Make rating and slider fields available to self-hosted users. [#45094]
- Store the feedback in the new format. [#45047]
- Track form submission failures. [#45090]

### Changed
- Improve performance by splitting editor code into two chunks. [#45065]
- Move all international phone code and UI back into legacy telephone field. [#45061]
- Remove legacy menu item by defaulting the filter to true. [#44043]
- Render implicit consent as hidden field instead of a DOM-hidden checkbox. [#45078]
- Set button state to busy and ignore further clicks when exporting to Google Drive. [#45074]
- Show custom messages for empty inbox/spam/trash folders. [#45013]
- Update @wordpress/dataviews package from v5.0.0 to v7.0.0. [#45012]
- Update package dependencies. [#45027] [#45097]

## [6.2.2] - 2025-09-25
### Fixed
- Resolved conflict with WordPress 6.7.3

## [6.2.1] - 2025-09-25
### Added
- Forms: add extra layer of cache busting for interactivity API files (view.js) with hash suffix [#45138]
- Forms: add searchable country selector dropdown (combobox) [#45120]
- Forms: try and fix deploy cache issue by adding a manual suffix for cache busting [#45137]

### Changed
- Forms: move all international phone code and UI back into legacy telephone field, keep backwards compat [#45061]

## [6.2.0] - 2025-09-03
### Changed
- Use sentence case in integrations panel CTAs. [#45054]

## [6.1.0] - 2025-09-02
### Added
- Release rating and slider fields on WP.com (not Jetpack yet). [#44998]

### Changed
- Tooling: Generate i18n function variants programmatically. [#45020]

### Fixed
- Switch to v3 and fix v2 encoding. [#44927]

## [6.0.0] - 2025-09-01
### Added
- Add default values when border radius style is missing. [#44978]
- Add input styles to image select field. [#45009]
- Add slider field typography controls. [#44967]
- Add styles for image select field on front end. [#44923]

### Changed
- Consolidate slider front end and editor styles. [#44947]
- Deprecate legacy feedback page and add redirect to new `jetpack-forms-admin` dashboard. [#44961]
- Improve checkbox validation for older checkboxes. [#44931]
- Improve slider range touch area. [#44985]
- Improve the showing of the error div to display correctly across themes. [#44939]
- Manage Google Drive connection in dashboard. [#44956]
- Send JSON with built-in WordPress functions. [#45002]

### Fixed
- Ensure slider default obeys step. [#44919]
- Fix dataview footer width and reset page on status change. [#45021]
- Fix default styles for image select field. [#44969]
- Fix fatal when checking for classic forms dashboard. [#44935]
- Fix file field test. [#44959]
- Fix form response line breaks. [#44966]
- Fix Google export on Simple sites. [#44960]
- Fix range slider mobile input. [#45010]
- Fix slider theme CSS conflicts. [#45024]
- Fix text wrapping in the slider tooltip. [#44988]

## [5.5.0] - 2025-08-25
### Added
- Add optional country selector to Phone field. [#44635]
- Add phone number validation on international phone number input. [#44854]
- Add slider min/max labels. [#44834]
- Preserve HTML IDs when processing feedback. [#44760]
- Remove MailPoet integration feature flag. [#44831]
- Show trash action alongside view action in list. [#44882]

### Changed
- Adjust slider field controls. [#44875]
- Allow new fields in step container. [#44864]
- Create form when inserting standalone slider field. [#44840]
- Create new field below when pressing enter on Slider or Rating fields. [#44781]
- Integrations: Adjust UI for opt-in toggle controls. [#44817]
- Let MailPoet handle old/new form data. [#44930]
- Remove call to unused font. [#44815]
- Rename 'Stars Rating' to 'Stars rating field'. [#44880]
- Reorganise shared lists of allowed inner blocks - core blocks. [#44879]
- Update MailPoet to use Feedback class. [#44852]
- Update slider default and step controls. [#44803]
- Use the new Feedback class to save the feedback entries in a new format. [#44821]
- Form step navigation button: Prevent wrapping of inner text. [#44926]
- Update specificity and CSS on the site editor to match the frontend for forms. [#44802]
- Update package dependencies. [#44899]

### Fixed
- Fix a case where fatal error might occur after form submission. [#44908]
- Fix MailPoet markup console error. [#44916]
- Fix null handling in `wp_style_engine_get_styles` to prevent PHP warnings. [#44827]
- Fix radio button validation. [#44836]
- Fix ratings field in small screens. [#44884]
- Fix undefined array key "blockName" warning in contact form pre-render hook. [#44833]
- Slider: Prevent JavaScript warning. [#44837]
- Phone field: Fix styling inconsistencies. [#44850]

## [5.4.0] - 2025-08-18
### Added
- Add slider field increment option. [#44782]
- Add "dots" style variant to form progress indicator block. [#44582]

### Changed
- Add styling and settings to "Image Select" field under feature flag. [#44786]
- Update method used to check for a valid MailPoet connection. [#44784]
- Improve the selected checkbox style. [#44743]

### Fixed
- Fix phone validation in responses. [#44806]
- Silence PHP warnings with more careful calls on expected values. [#44805]

## [5.3.0] - 2025-08-14
### Added
- Add several methods to the Feedback method. [#44713] [#44759] [#44768]
- MailPoet: Implement email consent. [#44744] [#44780]
- Slider: Make min/max editable. [#44715]

### Changed
- Defer loading JavaScript for more responsive page loading. [#44752]
- Enable SCSS processing for field assets. [#44763]
- Extract visually-hidden styles to shared SCSS partial for better code reuse. [#44769]
- Increase default consent field size. [#44690]
- Move CSS to SCSS files. [#44777]
- Slider: Add visually hidden labels for inputs. [#44779]
- Slider: Update `is-selected` styling. [#44783]
- Slider: Visual update to min/max/default value inputs. [#44778]
- Update package dependencies. [#44701]
- Update rating field implementation with improved styling and visual feedback. [#44757]

### Fixed
- Add radio input field backend validation. [#44739]
- Fix animated form style in Safari. [#44689]
- Fix minor CSS glitches in the ratings field. [#44738]
- Fix validation of jetpack multi-checkboxes [#44722]
- Use the new Feedback `get_all_legacy_values` method in `parse_fields_from_content`. [#44761]

## [5.2.0] - 2025-08-11
### Added
- Add initial image select field under feature flag. [#44675]
- Add Time field. [#44272]

### Changed
- Add Typescript support to all webpack files. [#44617]
- Introduce toolbar option to add image choice on image select field. [#44718]
- Revert back to the variation picker if the form only has the submit button. [#42479]
- Update rating field max field visually. [#44592]
- Update package dependencies. [#44677] [#44703]

### Fixed
- Disallow connecting MailPoet without key. [#44687]
- Do not show dropzone in the block picker. [#44695]
- Do not append form HTML ID on post-submission link. [#44683]
- Fix default checkboxes styles, and allow for "browser" styles as a choice. [#44408]
- Fix heart/star icons showing as filled instead of outlined in Twenty Sixteen theme. [#44672]
- Fix MailPoet icon border radius. [#44688]
- Fix ordering of fields on submit when JavaScript is disabled. [#44644]
- Fix rating field causing unsaved post state by replacing useEffect pattern with BlockContextProvider. [#44672]
- I18n: Improve context hints in comments for translators. [#44686]
- Prevent PHP errors when directly accessing various files. [#44646]
- Upgrade checkbox only on first try on Simple sites. [#44711]
- Validate form on submission. [#44562]

## [5.1.0] - 2025-08-04
### Added
- Add MailPoet/lists endpoint. [#44516]
- Add slider field block. [#44150]

### Changed
- Fix how form id is calculated. [#44501]
- Ratings field: Fix translation issues. [#44593]
- Submit forms without page reload. [#44422]
- Update @wordpress/dataviews to 5.0.0. [#44376]
- Update how the success messages to use the new Feedback class. [#44489]
- Update internal_personal_data_exporter to use new Feedback class. [#44488]
- Update to shorter way to get view.js path. [#44542]
- Use the new Feedback Class in feedback endpoint response. [#44485]
- Use the new Feedback Class when downloading a CSV file. [#44487]

### Fixed
- Add safeguards when getting post properties during AJAX calls. [#44533]
- Do not send AJAX submission if form has custom redirect. [#44557]
- Fix flaky CSV export test. [#44552]
- Fix label encoding issues, and handle empty and duplicate label names. [#44599]
- Fix PHP warning in forms admin class. [#44534]
- Fix PHP warnings in Contact_Form_Plugin class. [#44528]
- Handle placeholder for textareas in the editor the same way input tags do. [#44596]
- Remove a PHP notice when non-string is passed in. [#44523]
- Trim the value before validating if empty form. [#44579]

## [5.0.0] - 2025-07-28
### Added
- Add error message on network request failure for AJAX submission. [#44386]
- Add MailPoet integration. [#44425] [#44431] [#44439]
- Add new classes for the Feedback refactor. [#44483]

### Changed
- Clean up unused CSS. [#44471]
- Improve mobile interface. [#44381] [#44391]
- Remove all height hacks, clean up some style issues, and fix the footer to the bottom.
- Update integration modal links. [#44409]
- Update step divider to look more like UI element. [#44402]
- Use Badge component for badges. [#44347]

### Fixed
- Add a JWT token when submitting the form so that we are able to instantiate on submit. [#44399]
- Allow About page to grow width so content remains centered even on oversized screens. [#44477]
- Enqueue view script only when the form is rendered. [#44460]
- Fix Sass warning in inbox. [#44442]
- Fix padding on input and textarea fields. [#44401]
- Fix field order on success message. [#44482]
- Fix form ID collision check. [#44406]
- Improve CSS on the admin side. [#44478]
- Use a core variable to account for admin bar and CSS to account for folded sidebar. [#44470]

## [4.0.1] - 2025-07-21
### Changed
- Revert forms JWT usage for forms reconstruction from responses. [#44397]

## [4.0.0] - 2025-07-21
### Added
- Add "Empty spam" button to delete all responses marked as spam. [#44308]
- Add Gravatars in form responses. [#44270]
- Add tests for feedback endpoint. [#44318]
- Display success info after form submission without reload. [#44204]
- Include multistep form in Jetpack and WordPress.com plans. [#44309]

### Changed
- Add feature flag for MailPoet integration. [#44339]
- Consolidate a single hook for all inbox data, making it easier to share the store props and dispatches and removing the need to invalidate the entire store to get fresh listings after emptying trash. [#44293]
- Invert default disabled state on empty buttons for a cleaner transition to being available. [#44321]
- Make phone fields clickable [#44291]
- Update package dependencies. [#44338] [#44356]
- Use sentence case in default consent text. [#44078]

### Removed
- Prevent rendering of old menu entry once the migration page is shown and the user clicks on the new dashboard URL. [#43714]
- Remove unused editor CSS. [#44346]

### Fixed
- Add a JWT token when submitting the form so that we are able to instantiate on submit. [#44360]
- Fix export hooks error on mobile. [#44357]
- Fix integration card headers on mobile. [#44286]
- Fix excess padding next to Gravatar on mobile. [#44394]
- Prevent post_meta from being created. [#44332]
- Remove manual `DependencyExtractionWebpackPlugin` instantiation. [#44307]
- Show submission information after reload with AJAX submission. [#44342]

## [3.1.0] - 2025-07-14
### Added
- Add "Empty trash" button. [#44225]
- Add link to disconnect Google. [#44253]
- Add tests on component. [#44225]
- Add tip that spam will automatically be deleted after 15 days. [#44226]

### Changed
- Improve email copy-to-clipboard visually and make it less hidden. [#44264]
- Remove redundant "Manage responses" inspector panel from individual field blocks so it now only appears on the main Contact Form block. [#44212]
- Set max width for integrations panel. [#44261]
- Update integration links. [#44255] [#44258]
- Update dashboard response look. [#44262]
- Update package dependencies. [#44217]

### Removed
- Clean up code from dashboard. [#44244]

### Fixed
- Prevent React error by removing unneeded key when listing files. [#44263]

## [3.0.0] - 2025-07-07
### Added
- Contact Form: Introduce a new "Rating" field block that allows site owners to collect star/heart/smiley/emoji ratings from visitors. [#44094]

### Changed
- Disallow rich text formats in multistep form divider label. [#44209]
- Update date picker to remove the jQuery dependency. We now use a new more modern date picker that allows for keyboard navigation. [#43939]
- Update package dependencies. [#44148] [#44151]

### Fixed
- Accessibility: Update screen reader 'clip' property usage to 'clip-path'. [#44027]

## [2.1.0] - 2025-06-30
### Security
- Prevent form element attribute names from being set as field names. [#44113]

### Added
- Add items count to export button labels. [#44064]
- Add JSON response to form submission and AJAX request under feature flag. [#44118]
- Add MailPoet integrations nudge. [#44115]

### Changed
- Contact Form: Simplify multistep form detection and improve error wrapper placement for multistep navigation blocks. [#44076]

### Fixed
- Set correct unread count when there's another badge number on Jetpack menu item. [#44108]
- Load the initial steps as if the form has more than one step in it. [#44098]
- Remove broken group block tranformation. [#44083]

## [2.0.1] - 2025-06-24
### Added
- Add dashboard link to response email. [#43834]
- Add "mark as spam" link to response email. [#43866]

### Changed
- Improve the error validation animation. [#43968]

## [2.0.0] - 2025-06-23
### Added
- File Uploads block: Add Tracks event to upsell nudge. [#43860]
- Introduce multi-step forms. [#43918]

### Changed
- Allow super admins see form submissions. [#43998]
- Convert various cards and components to TypeScript. [#43986] [#43992] [#43993]
- Hide legacy Feedback menu on new sites. [#44060]
- Scripts: Change imports for hosting checks. [#43972]
- Update type handling for integrations. [#43969]
- Update package dependencies. [#44020] [#44040]

### Fixed
- Fix HTML support to labels in animated style. [#43966]
- Fix the overlay z-index for date picker. [#43967]
- Make outline style notched labels more selectable. [#43956]

## [1.3.0] - 2025-06-16
### Added
- Add a preview link to the response view for files. [#43730]
- Add TypeScript type checking to the package. [#43867]
- Add Akismet refresh status button. [#43937]
- Add button to create Salesforce form. [#43911]
- Add variables to be translated. [#43957]
- Show central integrations dashboard. [#43936]

### Changed
- Add inline docs for Salesforce. [#43909]
- Change form creation method. [#43944]
- Consolidate TypeScript types. [#43733]
- Move components that are shared across blocks from the contact-form block folder to the shared folder. [#43895]
- Stop translating Forms product name in the sidebar. [#43925]
- Switch to `Request::is_frontend()` method from Jetpack Status package. [#43873]
- Update package dependencies. [#43892] [#43914] [#43951]
- Use interactivity API for form validation. [#43893]

### Removed
- Remove old duplicated components. [#43895]

### Fixed
- Adjust "About" page layout to fit any text on feature cards. [#43943]
- Catch PHP warning when parsed block data is malformed. [#43865]
- Ensure that the select control uses the correct padding. [#43919]
- Fix a PHP warning. [#43960]
- Fix interactivity bug where the field is not registed yet. [#43959]
- Fix plugin connection badges. [#43856]
- Fix Saleforce badge. [#43862]
- Fix Salesforce form fields. [#43915]
- Fix styling of the select input in animated styles. [#43938]
- Prevent PHP warning when rendering blocks. [#43890]

## [1.2.0] - 2025-06-09
### Added
- Add "Remove" button for dropdown options and prevent dropdowns with no options. [#43616]
- New file uploads field released. [#43846]
- Show unread count on Jetpack > Forms submenu. [#43758]

### Changed
- Add section about developer documentation to FAQ. [#43654]
- Move `get_export_filename` method from Admin to Util. [#43823]
- Use sentence case where appropriate in UI. [#43818] [#43847]
- Update feedback pattern screenshot. [#43849]
- Update inbox fallback and redirect URLs. [#43757]

### Removed
- Remove unused code. [#43816] [#43838]

### Fixed
- Add line-height to migration page heading when it wraps. [#43827]
- Fix dropdown field background color on Windows. [#43848]
- Fix an error with poorly-formatted POST data. [#43835]
- Fix routing on new integrations tab. [#43822]
- Remove all admin notices from the Jetpack Forms admin. [#43776]

## [1.1.0] - 2025-06-05
### Added
- Add "undo" to all action snackbars in Inbox. [#43787]

### Changed
- Remove `is_admin` fencing for menu registration and move Forms down on submenu order. [#43755]
- Make emails clickable in Inbox. [#43771]
- Indicate when no files were uploaded to field with a dash. [#43770]
- Migrate form field blocks to use new inner label, input, option, and options blocks. [#43765]
- Update package dependencies. [#43766]

## [1.0.0] - 2025-06-03
### Added
- Forms: Add events for integrations toggling and card expansion. [#43716]

### Changed
- Update package dependencies. [#43718] [#43734]

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
- Add "Create Form" button to dashboard header. [#43529]
- Add feature filter flags and code for moving submenu item from Feedback > Forms responses to Jetpack > Forms. [#43295]
- Add Integration screen content. [#43530]
- Add integration tab with feature flag. [#43502]

### Changed
- Address styles design on integrations tabs and modal. [#43576]
- Update package dependencies. [#43516] [#43578]

### Fixed
- Apply maximum width on Salesforce ID input. [#43543]
- Ensure admin notice on classic view does not show on all screens. [#43582]
- Fix Akismet spam URL. [#43542]
- Remove the ability to upload multiple files at using the same file upload field. This field is not yet released. [#43555]

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
- Fixed PHP warnings that occurred when processing malformed data. [#34386]
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

[6.9.0]: https://github.com/automattic/jetpack-forms/compare/v6.8.0...v6.9.0
[6.8.0]: https://github.com/automattic/jetpack-forms/compare/v6.7.0...v6.8.0
[6.7.0]: https://github.com/automattic/jetpack-forms/compare/v6.6.0...v6.7.0
[6.6.0]: https://github.com/automattic/jetpack-forms/compare/v6.5.1...v6.6.0
[6.5.1]: https://github.com/automattic/jetpack-forms/compare/v6.5.0...v6.5.1
[6.5.0]: https://github.com/automattic/jetpack-forms/compare/v6.4.0...v6.5.0
[6.4.0]: https://github.com/automattic/jetpack-forms/compare/v6.3.0...v6.4.0
[6.3.0]: https://github.com/automattic/jetpack-forms/compare/v6.2.0...v6.3.0
[6.2.2]: https://github.com/automattic/jetpack-forms/compare/v6.2.1...v6.2.2
[6.2.1]: https://github.com/automattic/jetpack-forms/compare/v6.2.0...v6.2.1
[6.2.0]: https://github.com/automattic/jetpack-forms/compare/v6.1.0...v6.2.0
[6.1.0]: https://github.com/automattic/jetpack-forms/compare/v6.0.0...v6.1.0
[6.0.0]: https://github.com/automattic/jetpack-forms/compare/v5.5.0...v6.0.0
[5.5.0]: https://github.com/automattic/jetpack-forms/compare/v5.4.0...v5.5.0
[5.4.0]: https://github.com/automattic/jetpack-forms/compare/v5.3.0...v5.4.0
[5.3.0]: https://github.com/automattic/jetpack-forms/compare/v5.2.0...v5.3.0
[5.2.0]: https://github.com/automattic/jetpack-forms/compare/v5.1.0...v5.2.0
[5.1.0]: https://github.com/automattic/jetpack-forms/compare/v5.0.0...v5.1.0
[5.0.0]: https://github.com/automattic/jetpack-forms/compare/v4.0.1...v5.0.0
[4.0.1]: https://github.com/automattic/jetpack-forms/compare/v4.0.0...v4.0.1
[4.0.0]: https://github.com/automattic/jetpack-forms/compare/v3.1.0...v4.0.0
[3.1.0]: https://github.com/automattic/jetpack-forms/compare/v3.0.0...v3.1.0
[3.0.0]: https://github.com/automattic/jetpack-forms/compare/v2.1.0...v3.0.0
[2.1.0]: https://github.com/automattic/jetpack-forms/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/automattic/jetpack-forms/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/automattic/jetpack-forms/compare/v1.3.0...v2.0.0
[1.3.0]: https://github.com/automattic/jetpack-forms/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/automattic/jetpack-forms/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/automattic/jetpack-forms/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/automattic/jetpack-forms/compare/v0.56.0...v1.0.0
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
