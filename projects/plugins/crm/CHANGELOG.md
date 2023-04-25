# Changelog

### This is a list detailing changes for all Jetpack CRM releases.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
[5.7.0]: https://github.com/Automattic/jetpack-crm/compare/v5.6.0...v5.7.0
[5.6.0]: https://github.com/Automattic/jetpack-crm/compare/v5.5.4-a.1...v5.6.0
