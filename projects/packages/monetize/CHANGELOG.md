# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-11-23
### Added
- Add and edit coupons in Payments. [#55102]
- Add the Ads tab, with ad eligibility, earnings and payouts. [#55105]
- List and delete coupons in Payments. [#55001]
- Paid subscribers: List paid subscribers, view their details, and cancel their payments. [#55155]
- Payments: Add and edit payment plans, including newsletter tiers. [#54996]
- Show the Ads settings on WordPress.com Simple sites, with their sidebar ad and an option to show ads only to logged-out visitors, and show there whether ads are on. [#55270]

### Changed
- Name the right plans on WordPress.com sites, record usage on Simple, and skip a plan check Simple cannot answer. [#55257]

### Fixed
- Payments: Warn when the connected Stripe account can't accept charges. [#54998]

## [0.2.0] - 2026-11-16
### Added
- Add a Settings tab with the Ads settings, behind the Monetize dashboard flag. [#54662]
- Add the Overview tab, with what the site has earned and the ways it can earn. [#54897]
- Add the Payments tab, with the Stripe connection, payment plans and the free newsletter tier. [#54932]
- Add the routes and client the dashboard uses to reach WordPress.com, and a prompt to connect a WordPress.com account. [#54684]
- Settings: Add a Payouts card for the PayPal address that ad earnings are paid to, and keep WordPress.com up to date with the Ads settings. [#54747]

### Changed
- Update package dependencies. [#54703]

## 0.1.0 - 2026-11-09
### Added
- Initial version. [#54433]

[0.3.0]: https://github.com/Automattic/jetpack-monetize/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Automattic/jetpack-monetize/compare/v0.1.0...v0.2.0
