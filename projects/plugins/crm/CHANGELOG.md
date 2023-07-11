# Changelog

### This is a list detailing changes for all Jetpack CRM releases.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [6.0.0] - 2023-06-21
### Added
- CRM: Revamped CRM User Interface - Merge the sleek aesthetics of Jetpack’s style, bringing a new level of sophistication and seamless navigation to your CRM experience [#30916]
- API: Now it retrieves contacts with tags [#31418]
- Contacts: Allow unsubscribe flag to be removed [#31029]

### Changed
- User roles: Further restricted capabilities on some roles [#31174]
- Contacts: Use sha256 instead of md5 for gravatar images [#31288]

### Fixed
- Client Portal: Fix a fatal error initializing endpoints and shortcodes [#30678]
- CRM: Fix new lines display in quote templates [#30974]
- CRM: Fix whitelabel bug with full menu layout [#31126]
- CRM: Page layout now has a max width of 1551px [#30961]
- CRM: Welcome tour now goes through all steps [#31178]
- Extensions: Catch PHP notice if offline [#31032]
- Invoices: Show assigned contact/company link [#31153]
- Listview: Per-page settings no longer reset
- Listview: PHP notice no longer shows when saving settings [#31154]
- Quotes: Fix sort by status [#31087]
- White label: JPCRM support and resources pages no longer show [#31155]

## [5.8.0] - 2023-05-18
### Added
- Composer: Added jetpack-forms as a required dependency to fix a Jetpack form compat issue [#30749]
- Segments: Adding a doesnotcontain condition for email segments, for better compatibility with Advanced Segments [#30422]

### Changed
- Code cleanup: Cleaning up WP Editor helper functions and wp_editor usage [#30306]
- General: Update link references to releases in changelog [#30634]
- Navigation: Changed Learn More button and Learn More link to be consistent with Jetpack styles [#30135]
- PDF generator: Objects in filenames are translated [#30295]
- WooSync: Improved status mapping logic [#30557]

### Fixed
- Companies: Fix company name prefill so add links - transaction, invoice and tasks - prefill company name [#30752]
- Contact / Company: Fix date styling for transactions, invoices and quotes [#30483]
- Contact / Company: Profile summary total value and invoice count now removes deleted invoices [#30178]
- Custom fields: Use native date pickers [#30643]
- Quotes: Use native date pickers [#30643]
- Export: Contact segments now export company info [#30393]
- Logs: Facebook, Twitter, Feedback, and Other Contact log types now update last contacted timestamp [#30470]
- Settings: Eliminate orphaned references to custom fields within field sorting settings when removing custom fields [#30114]
- Segments: Make sure total count is updated on tag changes [#30638]
- Tasks: Start and end times now show correctly throughout the CRM [#30431]
- Tasks: New migration to remove timezone offset from database [#30431]
- Tasks: Removed reliance on strftime for better PHP 8.1 compatibility [#30431]
- Tasks: Switch to native browser date and time inputs [#30431]
- Tasks: Catch moment.js notice due to using fallback date format [#30431]
- Tasks: Fix ##TASK-BODY## placeholder [#30431]
- Tooling: Allowing minification of JS files in development [#30119]
- Transactions: Always show current status in editor [#30644]
- WooSync: Fix the fee amount from a WooCommerce order is not added to the invoice [#29650]
- WooSync: Fix shipping tax and discount amounts from Woocommerce orders are not calculated in invoices [#29650]
- WooSync: Fix the subtotal amount from WooCommerce orders is not calculated in invoices [#29650]
- WooSync: Fix PHP Warning [#30572]
- Invoices: On invoice update the shipping tax selected is removed resulting on incorrect total amount [#29650]

## [5.7.0] - 2023-04-19
### Added
- Menus: Add back to list button on add and edit pages for companies, transactions, invoices, and quotes [#29999]
- Settings: Remove 'Restore default settings' from the General Settings page, add to settings page menu [#29999]
- Support Page: Add new support page for customers to submit support requests [#29545]

### Changed
- API: Add optional parameter to the API to set the external service name, and replace hyphens from the json response to underscores [#29316]
- Companies: Move status select from Actions to main edit section underneath ID [#29999]
- Contacts: Change location of save button and add Contact Actions metabox for contacts [#29999]
- Onboarding: Change onboarding wizard company name description to remove 'as shown below' [#29999]
- Quotes: Move Quote Status underneath Quote ID [#29999]
- Menus: Swap the stacked logo to the horizontal one [#30092]
- CSV Importer: Various UI/UX tweaks [#29851]
- Dashboard: Align the Latest Contacts and Revenue Chart buttons [#29999]
- Dashboard: Make spacing between panels more consistent [#29999]
- Invoices: Fix overflow issue in the edit invoice page [#29999]
- Invoices: Move status select HTML from Invoice Actions to main edit section under ID [#29999]
- OAuth: Dependencies are now downloaded to wp-content/jpcrm-storage/packages [#29734]
- Onboarding: Make all hint styles consistent [#29999]
- Transactions: Change location of import sub-menu item when CSV Pro is installed and active [#29999]
- Transactions: Move status select HTML from Transaction Actions to main edit section underneath ID [#29999]

### Removed
- Onboarding: Remove company name preview from onboarding wizard [#29999]

### Fixed
- UI: Change fonts to smaller size, and different font family [#29999]
- UI: Change form placeholder colors to a lighter shade of gray [#29999]
- Contacts: Fix 403 error if file was uploaded via Client Portal Pro using Apache web server [#29969]
- Menus: Remove border from top menu [#29999]
- Dashboard: Adjustments to first-use modals [#30065]
- Dashboard: Various fixes for the sales funnel [#29995]
- Email: Caught PHP notices if recipient was deleted [#29747]
- Exports: Catch PHP notice when exporting a subset of objects [#30111]
- UI: Fix content overflowing in contact view page [#29999]
- Support: Fix the Give Feedback link so that it sends to the reviews page on .org [#29873]
- General: Fix various corrupt JS files [#29705]
- Onboarding: Get updates (mailing list) changed from opt-out to opt-in in the onboarding wizard [#29999]
- Importer: Allow import of application/csv mime type
  Importer: Better parsing of CSV fields [#29822]
- General: Improved compatibility with PHP 8.1 [#29945]
- Invoices: Fix ability to remove logo from invoice edit page [#30099]
- Invoices: Fix PHP notice when sending contact an invoice via email [#30110]
- General: Fix broken link in bulk actions function in list view [#29623]
- Mailpoet Sync: Fix an issue where contact images would disappear after synchronization [#30091]
- Onboarding: Remove outdated YouTube video from welcome overlay [#29999]
- Quotes: Use current date if quote date is blank [#30032]
- Settings: Fix broken link on white label installs [#30160]
- Settings: Allow new tax rates to be added [#29938]
- Onboarding: Usage tracking changed from opt-out to opt-in in the onboarding wizard [#29999]
- WooSync: Tag existing contacts with new orders [#30107]

## [5.6.0] - 2023-03-23
### Changed
- Contacts: Change customer references to contact in all but Woo and commerce contexts [#29267]
- Compatibility: Indicate full compatibility with the latest version of WordPress, 6.2 [#29341]
- Move all files that were inside the zbscrm-store folder with a flat structure to the new jpcrm-storage folder that uses a hierarchical structure [#28350]
- Extensions: Highlight popular Woo extensions on extensions page, plus alphabetize results [#29199]

### Fixed
- Add a missing < which prevented a script tag from being opened. [#28834]
- Allowing XMLRPC and REST requests when the frontend is disabled [#28970]
- Client Portal: Fix bug that prevented access from being disabled using the contact page [#28675]
- Client Portal: Fix numeric fields, date fields, and textareas in the Client Portal [#28796]
- Change escape function for API generated activity [#29146]
- Contacts: Prevent JS error when custom avatars are not enabled [#29086]
- Contacts: Fix PHP error when using empty values for Address Custom Field (Date) [#29249]
- Contacts: Fix a contact field issue when a Woo order subscription is updated [#28800]
- Contacts: Fix avatar getting removed when saving a contact [#28829]
- Contacts: Fix escape in contact list filters [#28836]
- Contacts: Fix issue where exporting contacts shows "County" when it should show "State" [#28868]
- Contacts: Fix the escape used in the "Bundle holder" notification when uploading files to a contact [#28831]
- Dashboard:  Allow custom profile pictures to be shown in the dashboard [#28802]
- Invoices: Escape an invoice ID in ZeroBSCRM.admin.invoicebuilder.js [#28830]
- Tasks: Correct text where tasks where being referred to as events [#29267]
- Placeholders: Fix secondary address placeholders [#29396]
- Placeholders: Fix several placeholders throughout CRM [#29361]
- Placeholders: Fix minor admin only issue on placeholder fields [#28811]
- Exports: Fix some export cases by adding a check for the segment index [#29482]
- Taxes: Fix tax page deletion for single entries [#29227]
- Taxes: Fix tax rate creation link on tax rate settings page [#29209]
- Forms: Swapping edit and new form titles to correctly reflect page [#29274]
- Dashboard: Show default avatar under activity, when contact image mode set to none [#29067]
- Client Portal: Fix accept quote in Client Portal button not working for PHP versions 8.1 and up [#29055]
- Taxes: Fix potential XSS in the Tax Settings page [#29215]
- Contacts: Fix wrong naming from Customer ID to Contact ID in the Edit Contact page [#29267]
- Contacts: Importing contacts using CSV files no longer erases fields that are missing [#28886]
- Client Portal: Background for the menu in the Twenty Seventeen theme is no longer dark gray [#29052]
- OAuth Connections: No longer shows critical error after saving credentials [#29059]
- WooSync: Remove PHP notice when a WooCommerce order is in a Draft status [#29099]
- Segments: Fix list pagination [#29004]
- Fix special characters in textarea fields (contacts, transactions, quotes) to prevent producing visible HTML entities [#28941]
- WooSync: Change status only for contacts with the Lead status [#28908]

## 5.5.3 - 2023-01-26

- Fixed: CRM no longer breaks WordPress sites running on PHP 7.2
- Fixed: HTML escaped code in contact list filters for segments

## 5.5.2 - 2023-01-25

- Fixed: Custom profile images are now shown in the Latest Contacts dashboard
- Fixed: Potential XSS in the Custom Fields setting page
- Fixed: Custom profile pictures are no longer removed when updating contacts
- Fixed: Potential XSS in invoices with manual input references
- Fixed: Code snippet was removed from the top of the Forms new/edit page
- Fixed: Remove HTML code in the "Bundle holder" notification when uploading files to a contact
- Fixed: HTML escaped code in contact list filters for segments
- Fixed: Improved security regarding filenames for uploaded files
- Fixed: The creation date for contacts is updated on any WooCommerce subscription event
- Improved: Added translation for contact fields when exporting contacts
- Improved: Added Invoice Status to PDF Invoice template
- Added: Export Segments to .CSV
- Added: WooCommerce order status mapping to transaction status
- Added: WooCommerce order status mapping to invoice status

## 5.5.1 - 2022-12-16

- Fixed: Inline field editing no longer prevents listings from being displayed
- Improved: Security around phone numbers viewing
- Improved: Added a migration to remove outdated AKA lines

[5.5.4-a.1]: https://github.com/Automattic/jetpack-crm/compare/v5.5.3...v5.5.4-a.1
[6.0.0]: https://github.com/Automattic/jetpack-crm/compare/5.8.0...6.0.0
[5.8.0]: https://github.com/Automattic/jetpack-crm/compare/5.7.0...5.8.0
[5.7.0]: https://github.com/Automattic/jetpack-crm/compare/v5.6.0...v5.7.0
[5.6.0]: https://github.com/Automattic/jetpack-crm/compare/v5.5.4-a.1...v5.6.0
