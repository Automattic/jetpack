# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.12.0.1] - 2026-10-06
### Security
- Simple Payments: Improve permission checks for orders.

## [0.12.0] - 2026-10-05
### Added
- Add additional analytics to Payment Buttons. [#52841]
- Payment Buttons: Link sellers to their PayPal transactions and to PayPal's refund instructions from the block's account menu and the Payment Links admin page. [#53091]
- PayPal Payment Buttons: Add a filter to override the partner attribution (BN) code while connected to the PayPal sandbox. [#52986]
- Warn in the editor when the PayPal account cannot receive payments or lacks required permissions, and refuse connections without them. [#53113]

### Changed
- Keep the product image on the site instead of sending it to PayPal. [#53054]
- Payment Buttons: Use PayPal's official logos, unmodified, and match the connect wizard to the design. [#53118]
- Payment Buttons: Use PayPal's prescribed wording in the disconnect and log out confirmations. [#53089]
- PayPal Payment Buttons: Onboard sellers as a third-party integration, so PayPal calls are made through WordPress.com and no credentials are stored on the site. [#52873] [#53103]
- Send the partner attribution ID, as resolved for the site's environment, with every Connect with PayPal referral. [#53021]
- Show PayPal's debug ID in API error messages and record it, so failed requests can be traced with PayPal support. [#53021]
- Update package dependencies. [#52999]

### Fixed
- Payment Buttons: Keep keyboard focus on the PayPal onboarding overlay while it is open, return it to the Connect button on close, and hide Close once the seller has finished at PayPal. [#53151]
- Payment Buttons: Spell "PayPal" with its own capitalization in the connect wizard headings and the wordmark's alt text. [#53090]
- Payment Buttons: Stop collecting a shipping address once shipping is turned off, instead of keeping the hidden checkbox ticked. [#53092]
- Payment Buttons: Tell the merchant when a payment link could not be loaded from PayPal, instead of silently showing stale details. [#53093]
- Payment Buttons: Tell the merchant when the browser blocks PayPal's onboarding window, instead of failing silently, and let the next Connect click open it. [#53152]

## [0.11.1] - 2026-09-29
### Changed
- Update dependencies. [#50841]

## [0.11.0] - 2026-09-28
### Added
- Add a "Change" item to a saved payment link's menu in the block settings sidebar, to switch the button to another of the account's payment links. [#52534]
- Add stacked buttons as a display format for PayPal payment buttons. [#52512]
- Ask whether to save or discard unsaved changes when leaving a saved payment link's form in the block settings sidebar. [#52553] [#52744]
- Give each link in the existing links list a menu to duplicate it into a new payment link or delete it, and let the new link's form go back to the list. [#52543]
- Show a snackbar after a post save that creates or changes a PayPal payment link. [#52740]

### Changed
- Hide the Styles tab until the block has a payment link. [#52668]
- Keep the existing links list in sync across blocks. [#52668]

### Fixed
- Allow http return URLs, and show an error in the block when a return URL is invalid. [#52774]
- Fit the QR code's link field and "Copy Link" button in narrow columns. [#52773]
- Make "Width" size the whole payment button, so the product and "Powered by PayPal" line up with it. [#52677]
- Make a percentage "Width" the same size in the editor as on the published page. [#52773]
- Mark the post as changed when a payment button is updated to match its link on PayPal, so the change can be saved and shown on the page. [#52553]
- Match the block's editor preview to the published button, and show "Powered by PayPal" by default. [#52671]
- Show a payment link's hosted ID without its PLB- prefix in the block settings sidebar, so it no longer wraps. [#52550]
- Show the right price on the "Send via Email" card for links priced per option, instead of just "$". [#52743]

### Removed
- Remove the connection status and Sandbox badge from the editor canvas. [#52773]

## [0.10.0] - 2026-09-21
### Added
- Add a PayPal account menu to the top of the block settings sidebar, with links to PayPal's checkout settings and transactions, and a "Log out" item showing the connected account. [#52509]
- Add a Product ID field, shipping and handling fees, a discount, and flat-amount tax, and check fees and tax rates against what the currency allows. [#52301]

### Changed
- Show a saved payment link's details in the block settings sidebar instead of its edit form. [#52372]
- Show the result of deleting a link, disconnecting, or picking an existing link in a snackbar. [#52464]
- Update package dependencies. [#52187]

### Fixed
- Keep a block's payment link at PayPal when the block is removed. [#52463]
- Prevent payment link settings from being overwritten on save before the block has loaded them, and keep values that were edited while the link is still loading. [#52418]
- Show a notice when opening a post picks up changes made to the payment link elsewhere. [#52302]

## [0.9.0] - 2026-09-15
### Added
- Accept only whole-number prices in currencies that do not use decimals. [#51656]
- Add a "Manage PayPal Payment Links" link to the block, opening the new admin page. [#52270] [#52273] [#52279]
- Add a feature flag for the API-managed payment buttons; the block keeps the paste-code editor while it is off. [#51982]
- Add a live editor preview and a "Styles" tab for each button format. [#52210]
- Add API-managed payment buttons behind a feature flag that is not yet enabled. [#52210] [#52170] [#52172]
- Add to every payment button a warning that changes apply to every button sharing the same payment link, wherever it is used. [#52022]
- Complete PayPal onboarding with PayPal's SDK, discarding connections that fail its final checks. [#51656]
- Connect a PayPal account from the block settings sidebar without reloading the editor. [#51656] [#52334]
- Create the onboarding referral through WordPress.com so PayPal platform credentials never reach the site. [#51656]
- Log a notice when stored PayPal credentials cannot be decrypted and are removed, instead of removing them silently. [#51656]
- Offer "Connect with PayPal" on WordPress.com and Jetpack-connected sites, with an API credentials step elsewhere. [#51656]
- Offer the account's existing payment links when a new block is added, so a block can reuse one instead of creating another. [#52329]
- Report PayPal connection errors with PayPal's own details, and stop retrying onboarding after an error. [#51656]
- Require confirmation before deleting a payment link, and stop showing buttons for deleted links. [#51656] [#52270] [#52280]
- Share payment links by link or QR code, with PayPal's partner attribution code. [#51656]
- Show the payment a duplicated block points at, so two blocks sharing one PayPal payment always show the same product and price. [#51656]
- Show when PayPal is disconnected, with a "Reconnect" button, and explain in a short summary that disconnecting applies to the whole site. [#51656]
- Support per-option product prices. [#51656]

### Changed
- Call option groups variants, with one checkbox to turn on per-variant pricing. [#52022]
- Create and update the PayPal payment when the post is saved instead of from a "Create New" button, and delete it when the post is saved without its block and no other published post uses it. [#52224]
- Move the product form fields into the block inspector and fit them to the sidebar column. [#52022]
- Pick a page for the return URL, or paste one, instead of typing the address by hand. [#52022]
- Update package dependencies. [#52297]

### Removed
- Remove Indian rupee (INR), which is not supported by PayPal. [#51656]
- Remove the "Tax name" field. [#52022]

## [0.8.2] - 2026-09-09
### Changed
- Internal updates.

## [0.8.1] - 2026-09-08
### Changed
- Update package dependencies. [#51701]

## [0.8.0] - 2026-09-01
### Changed
- Update package dependencies. [#51303] [#51802]

### Removed
- Minimum supported PHP version is now 7.4. [#51515]

## [0.7.12] - 2026-08-20
### Changed
- Update package dependencies. [#50509] [#51008]

## [0.7.11] - 2026-08-03
### Changed
- Update dependencies. [#50841]

## [0.7.10] - 2026-07-27
### Changed
- Update dependencies. [#50719]
- Update package dependencies. [#50751] [#50753]

## [0.7.9] - 2026-07-20
### Changed
- Update dependencies. [#50551]
- Update package dependencies. [#50529]

### Fixed
- Match the PayPal Payment Buttons block icon to the Payment Buttons block for a consistent inserter. [#50528]

## [0.7.8] - 2026-07-13
### Changed
- Update package dependencies. [#49272] [#50407]

## [0.7.7] - 2026-07-06
### Changed
- Update package dependencies. [#50097] [#50183]

## [0.7.6] - 2026-06-29
### Changed
- Internal updates.

## [0.7.5] - 2026-06-25
### Changed
- Update package dependencies. [#49831]

## [0.7.4] - 2026-06-22
### Changed
- Update package dependencies. [#49631] [#49691] [#49757]

## [0.7.3] - 2026-06-15
### Changed
- Update package dependencies. [#49273]

## [0.7.2] - 2026-06-08
### Security
- Simple Payments: Strip seller PayPal email (`spay_email`) from public REST responses while preserving editor read/write. [#49194]

### Changed
- Update dependencies. [#49354]

## [0.7.1] - 2026-06-01
### Changed
- Update package dependencies. [#48404]

## [0.7.0] - 2026-05-25
### Security
- Restrict REST API write access to `jp_pay_order` by using a read-only REST controller. [#48139]

### Changed
- Update package dependencies. [#48405] [#49012]

## [0.6.20] - 2026-05-19
### Changed
- Exclude development files from production builds. [#47365]
- Update package dependencies. [#48695]

## [0.6.19] - 2026-05-11
### Changed
- Components: Use Link from `@wordpress/ui` instead of ExternalLink. [#48529]

## [0.6.18] - 2026-05-04
### Changed
- Internal: No longer require automattic/jetpack-changelogger as a per-project dev dependency. [#48225]

## [0.6.17] - 2026-04-27
### Changed
- Update package dependencies. [#48302]

### Fixed
- Remove previous work that introduced an error. [#48322]

## [0.6.16] - 2026-04-20
### Changed
- Update package dependencies. [#48106]

## [0.6.15] - 2026-04-15
### Security
- Hide the creator email of the Simple Payments block from the REST endpoints. [#48090]

## [0.6.14] - 2026-04-11
### Changed
- Update package dependencies. [#47890] [#47998]

### Fixed
- PayPal Payments Button: fix escaping issue for stacked payments buttons [#47761]

## [0.6.13] - 2026-04-06
### Changed
- Update package dependencies. [#47899]

## [0.6.12] - 2026-03-30
### Changed
- Update package dependencies. [#47799]

## [0.6.11] - 2026-03-23
### Changed
- Update package dependencies. [#47684]

## [0.6.10] - 2026-03-16
### Changed
- Update dependencies. [#47472]

## [0.6.9] - 2026-03-09
### Changed
- Update package dependencies. [#47496] [#47499]

## [0.6.8] - 2026-03-02
### Changed
- Update dependencies. [#47038]

## [0.6.7] - 2026-02-26
### Changed
- Update package dependencies. [#47300]

## [0.6.6] - 2026-02-23
### Changed
- Update package dependencies. [#47173]

## [0.6.5] - 2026-02-16
### Changed
- Update package dependencies. [#47099]

### Fixed
- Compatibility: Clean up deprecated CSS. [#47067]

## [0.6.4] - 2026-02-10
### Changed
- Update dependencies. [#46931] [#47002]

## [0.6.3] - 2026-02-02
### Changed
- Update package dependencies. [#46854]

## [0.6.2] - 2026-01-26
### Changed
- Update package dependencies. [#46716]

## [0.6.1] - 2026-01-19
### Changed
- Update package dependencies. [#46552] [#46647]

## [0.6.0] - 2026-01-12
### Changed
- Gate PayPal payment buttons block behind conditional features. [#46536]
- Update package dependencies. [#46456]

## [0.5.18] - 2025-12-22
### Changed
- Update dependencies. [#46381]

## [0.5.17] - 2025-12-15
### Changed
- Replace use of confusing `esc_js` with `wp_json_encode`, or `intval` where appropriate. [#46229]

### Fixed
- Add back `#` selector to fix a broken selector for the container. [#46259]

## [0.5.16] - 2025-12-08
### Changed
- Internal updates.

## [0.5.15] - 2025-12-01
### Changed
- Update package dependencies. [#46072] [#46143]

## [0.5.14] - 2025-11-20
### Fixed
- Jetpack: Remove getIconColor functions from block icons. [#45992]

## [0.5.13] - 2025-11-18
### Changed
- Update dependencies. [#45745]

## [0.5.12] - 2025-11-17
### Changed
- Update package dependencies. [#45915] [#45958]

## [0.5.11] - 2025-11-10
### Changed
- Update dependencies. [#45745]

## [0.5.10] - 2025-11-03
### Changed
- Update dependencies. [#45664]

## [0.5.9] - 2025-10-20
### Changed
- Update dependencies. [#45488]

## [0.5.8] - 2025-10-06
### Security
- Improve PayPal SDK host validation for PayPal Payment Buttons. [#45343]

### Changed
- Update package dependencies. [#45334]

## [0.5.7] - 2025-09-29
### Changed
- Update dependencies. [#44736]

## [0.5.6] - 2025-09-22
### Changed
- Update dependencies. [#44736]

## [0.5.5] - 2025-09-19
### Changed
- Namespace PayPal SDK to minimize loading conflicts when using other PayPal blocks. [#45224]
- Update package dependencies. [#45173] [#45229]

## [0.5.4] - 2025-09-16
### Changed
- Improve robustness of PayPal payment buttons parsing [#45158]

## [0.5.3] - 2025-09-15
### Changed
- Update package dependencies. [#45127] [#45128]

## [0.5.2] - 2025-09-08
### Changed
- Update package dependencies. [#45027]

## [0.5.1] - 2025-09-01
### Changed
- Internal updates.

## [0.5.0] - 2025-08-25
### Changed
- Disallow inserting Simple Payments block via inserter. [#44724]

## [0.4.3] - 2025-08-18
### Changed
- Update dependencies. [#44736]

## [0.4.2] - 2025-08-14
### Changed
- Update package dependencies. [#44701]

## [0.4.1] - 2025-08-11
### Changed
- Update dependencies. [#44673]
- Update package dependencies. [#44677]

### Fixed
- I18n: Improve context hints in comments for translators. [#44686]

## [0.4.0] - 2025-08-04
### Changed
- Improve alignment of "Pay with PayPal" block labels. [#44560]
- Move link location to instructions. [#44585]
- Update copy of PayPal Payment Buttons block to add numbered steps. [#44564]
- Update dependencies. [#44551]

## [0.3.0] - 2025-07-28
### Changed
- Change copy and links for PayPal Payments Buttons block. [#44424]
- Clear PayPal Payment buttons block parameters when changing block type. [#44388]
- Update code entry inputs to mirror the PayPal.com UI. [#44387]
- Update PayPal Payment Buttons block copy to be simpler. [#44389]

## [0.2.0] - 2025-07-21
### Added
- Add new PayPal Payment block. [#43932]

### Changed
- Tests: Generate block test files with tab indents. [#44099]
- Update package dependencies. [#44337] [#44338] [#44356]
- Update PayPal Payment Buttons block to support rendering previews. [#44359]

## 0.1.0 - 2025-07-14
### Added
- Initial version. [#43315]

### Changed
- Simple Payments: Move Simple Payments block to PayPal Payments package. [#43413]

[0.12.0.1]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.12.0...v0.12.0.1
[0.12.0]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.11.1...v0.12.0
[0.11.1]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.11.0...v0.11.1
[0.11.0]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.8.2...v0.9.0
[0.8.2]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.8.1...v0.8.2
[0.8.1]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.7.12...v0.8.0
[0.7.12]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.7.11...v0.7.12
[0.7.11]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.7.10...v0.7.11
[0.7.10]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.7.9...v0.7.10
[0.7.9]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.7.8...v0.7.9
[0.7.8]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.7.7...v0.7.8
[0.7.7]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.7.6...v0.7.7
[0.7.6]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.7.5...v0.7.6
[0.7.5]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.7.4...v0.7.5
[0.7.4]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.7.3...v0.7.4
[0.7.3]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.20...v0.7.0
[0.6.20]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.19...v0.6.20
[0.6.19]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.18...v0.6.19
[0.6.18]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.17...v0.6.18
[0.6.17]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.16...v0.6.17
[0.6.16]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.15...v0.6.16
[0.6.15]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.14...v0.6.15
[0.6.14]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.13...v0.6.14
[0.6.13]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.12...v0.6.13
[0.6.12]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.11...v0.6.12
[0.6.11]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.10...v0.6.11
[0.6.10]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.9...v0.6.10
[0.6.9]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.8...v0.6.9
[0.6.8]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.7...v0.6.8
[0.6.7]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.6...v0.6.7
[0.6.6]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.5...v0.6.6
[0.6.5]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.4...v0.6.5
[0.6.4]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.18...v0.6.0
[0.5.18]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.17...v0.5.18
[0.5.17]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.16...v0.5.17
[0.5.16]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.15...v0.5.16
[0.5.15]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.14...v0.5.15
[0.5.14]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.13...v0.5.14
[0.5.13]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.12...v0.5.13
[0.5.12]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.11...v0.5.12
[0.5.11]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.10...v0.5.11
[0.5.10]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.9...v0.5.10
[0.5.9]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.8...v0.5.9
[0.5.8]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.7...v0.5.8
[0.5.7]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.6...v0.5.7
[0.5.6]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.5...v0.5.6
[0.5.5]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.4...v0.5.5
[0.5.4]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.3...v0.5.4
[0.5.3]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.2...v0.5.3
[0.5.2]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.1...v0.5.2
[0.5.1]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.4.3...v0.5.0
[0.4.3]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-paypal-payments/compare/v0.1.0...v0.2.0
