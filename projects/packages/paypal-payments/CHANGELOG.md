# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.0] - 2026-09-14
### Added
- Add a feature flag for the API-managed payment buttons; the block keeps the paste-code editor while it is off. [#51982]
- Add API-managed payment buttons behind a feature flag that is not yet enabled. Once it is on, you can connect a PayPal account from WordPress, create and manage payment links without leaving the editor, choose a "Button", "Link", or "QR" format, and style it with your own colors, size and border. [#52210]
- Draw what the published block will look like in the editor canvas, and give each format its own settings in a new "Styles" tab: text and background colors with a contrast warning, a "Fill" or "Outline" style, text size, width, border, and a "Powered by PayPal" toggle. Part of the API-managed payment buttons, behind a feature flag that is not yet enabled. [#52210]

### Changed
- Call an option group a variant in "Product Options". [#52022]
- Create and update the PayPal payment when the post is saved instead of from a "Create New" button, and delete it when the post is saved without its block and no other published post uses it. [#52224]
- Hide the product price field when the product options carry their own prices, and stop a leftover value there from blocking "Update". [#52022]
- Move the product form fields into the block inspector and fit them to the sidebar column. The primary button is now "Create New" / "Save" instead of naming the display format. [#52022]
- Pick a page for the return URL, or paste one, instead of typing the address by hand. [#52022]
- Update package dependencies. [#52297]
- Use one checkbox to turn on per-variant pricing, with the price belonging to the first option group. [#52022]
- Warn on every payment button that changes apply to every button sharing the same payment link, wherever it is used. [#52022]

### Removed
- Remove the "Tax name" field. [#52022]

### Fixed
- Break the PayPal disconnect confirmation into a short summary and a list, so its consequences are readable at a glance. [#51656]
- Close PayPal's onboarding window with the Escape key or its "Close" button, instead of reloading the editor and losing unsaved changes. [#51656]
- Close the PayPal onboarding popup automatically when it returns, instead of leaving it open on a WP Admin screen. [#51656]
- Complete PayPal onboarding using PayPal's own onboarding SDK, so connecting an account finishes instead of stopping at "Merchant integration info not available". [#51656]
- Connect a PayPal account in a separate window, so finishing onboarding no longer reloads the editor and discards an unsaved post. [#51656]
- Discard a PayPal connection that fails its final checks, instead of leaving the site looking connected while reporting an error. [#51656]
- Encode the PayPal payment link in the QR code behind the button's "Show Link or QR Code" toggle, instead of the page the button sits on. [#51656]
- Fix "Connect with PayPal" always failing with "Request is not well-formed, syntactically incorrect, or violates schema." [#51656]
- Fix "Connect with PayPal" failing its final checks. [#51656]
- Fix "Connect with PayPal" failing with a 404, and create the onboarding referral through WordPress.com so PayPal platform credentials never reach the site. [#51656]
- Fix an error from PayPal when product options have their own prices. The product price is now optional in that case, and every option in the group must be priced. [#51656]
- Fix onboarding leaving the site connected but reporting "Merchant integration info not available". [#51656]
- Go straight to the API credentials step on a site with no WordPress.com connection, instead of offering "Connect with PayPal". [#51656]
- Include PayPal's own error and debug ID when Payment Links & Buttons access is refused, instead of guessing at the cause. [#51656]
- Include the PayPal partner attribution code in every copied and emailed payment link, matching the link the published button uses. [#51656]
- Keep the payment buttons block sources out of the published package mirror. [#51656]
- Keep the PayPal connection error dismissed, instead of showing it again and asking PayPal for another onboarding link. [#51656]
- Load PayPal's onboarding script into the editor canvas so the "Connect with PayPal" button opens PayPal's window instead of a new browser tab. [#51656]
- Log a notice when stored PayPal credentials cannot be decrypted and are removed, instead of removing them silently. [#51656]
- Make the "Copy Link" button work in the payment button's QR code panel, where clicking it previously did nothing. [#51656]
- Offer "Connect with PayPal" on WordPress.com and Jetpack-connected sites, instead of only after PayPal is already connected. [#51656]
- Open PayPal's onboarding window when you click "Connect with PayPal", instead of covering the editor with a blank overlay. [#51656]
- Open PayPal onboarding in a sized window instead of a stray browser tab when PayPal's onboarding script is unavailable. [#51656]
- Report a PayPal platform configuration problem directly instead of asking the merchant to try again, which could never help. [#51656]
- Say how many published posts embed a payment link before it is deleted from the admin. [#51656]
- Send the "Open PayPal Dashboard" link to the sandbox app list when connecting in sandbox, instead of always opening the live one. [#51656]
- Show that PayPal is disconnected instead of reporting a connected account, and offer a "Reconnect" button. Disconnecting now says it applies to the whole site. [#51656]
- Show the option price on the published page when the product options have their own prices. [#51656]
- Show the payment a duplicated block actually points at, so two blocks sharing one PayPal payment can no longer display different products or prices. [#51656]
- Stop accepting prices with decimals for Japanese yen, Hungarian forint and New Taiwan dollar, which PayPal rejects, and remove the Indian rupee, which PayPal does not support. [#51656]
- Stop the block retrying the PayPal onboarding link forever when the request fails. [#51656]
- Take the displayed price from the option group PayPal is actually pricing. [#51656]

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
