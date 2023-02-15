# Changelog

### This is a list detailing changes for all Jetpack CRM releases.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.5.4-alpha] - 2023-02-15
### Added
- adds the necessary migration to move all files that were inside the zbscrm-store folder with a flat struture to the new jpcrm-storage folder that uses a hierarchical structure [#28350]
- Copy tests from old repo. [#28354]

### Changed
- Added webpack build step [#28578]
- CRM: changing variable declarations back to var [#28872]
- CRM: export vars that are referenced via window. [#28897]
- Updated package dependencies. [#28910]

### Fixed
- Client Portal bug that prevented access from being disabled using the contact page was fixed [#28675]
- CRM: add a missing < which prevented a <script> tag from being opened. [#28834]
- CRM: Adding a JS function to a list of exports so that it can be called outside the bundle it was declared in. [#28827]
- CRM: Adding exports to functions called externally, in all JS fiiles where it is needed. [#28860]
- CRM:  allows custom profile pictures to be shown in the dashboard. [#28802]
- CRM: Escaping an invoice ID in ZeroBSCRM.admin.invoicebuilder.js [#28830]
- CRM: Fix avatar getting removed when saving a contact [#28829]
- CRM: Fixes a contact fild issue when a Woo order subscription is updated. [#28800]
- CRM: Fix escape in contact list filters [#28836]
- CRM: Fixing minor admin only issue on placeholder fields. [#28811]
- CRM: fix issue  where exporting contacts shows "County" when it should show "State". [#28868]
- CRM:  fix the escape used in the "Bundle holder" notification when uploading files to a contact [#28831]
- Fixed numeric fields, date fields, and textareas in the Client Portal [#28796]

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

[5.5.4-beta]: https://github.com/Automattic/zero-bs-crm/compare/v5.5.3...v5.5.4-beta
