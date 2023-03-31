# Changelog

### This is a list detailing changes for all Jetpack CRM releases.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[5.6.0]: https://github.com/Automattic/jetpack-crm/compare/v5.5.4-a.1...v5.6.0
[5.5.4-a.1]: https://github.com/Automattic/jetpack-crm/compare/v5.5.3...v5.5.4-a.1
