# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-10-27
### Changed
- Update package dependencies. [#54118]

## [0.2.0] - 2026-10-26
### Changed
- Let a later enabled `init()` boot the package after a disabled one, including from another consumer. [#53796]
- Update package dependencies. [#53806]

### Fixed
- Honor Global Privacy Control on every page load, so a visitor who turns GPC on after allowing optional categories is opted out, and tell a GPC visitor in the banner and preferences that switching a category on overrides GPC for the site. [#53795]
- Stop sending the cookieless banner usage stats to pixel.wp.com when `features.tracks` is off. [#53795]

## [0.1.0] - 2026-10-15
### Security
- Secure the public consent-log write endpoint with per-IP rate limiting, URL/consent-type validation, and spoof-resistant IP detection. [#49850]

### Added
- Add a config-driven core: init( $config ) with per-feature feature toggles and a declarative Config_Schema. Keep the jetpack_cookie_consent_config and jetpack_cookie_consent_log_retention_days filters as override points for code that does not own the init() call. [#50114]
- Add AGENTS.md with guidance for AI coding agents working in this package. [#49990]
- Add classic-theme fallback for required privacy/CCPA/manage-preferences links. [#49854]
- Add the cookie-consent frontend Interactivity module (banner, modal, CCPA opt-out, consent logger, Tracks). [#49510]
- Add the cookie-consent PHP backend: banner/CCPA controls, Interactivity module enqueue, and consent log REST controller. [#49511]
- Document the public cookie consent lifecycle event and WP Consent API script-gating guidance. [#50076]
- GDPR: Honor Global Privacy Control (GPC) as an opt-out signal, denying non-essential cookies (configurable via `gdpr_honors_gpc`). [#49991]
- Geo: Add configurable provider and region settings. [#50038]
- Honor features.geo=false: show the banner to all visitors without a geolocation lookup. [#50117]
- Initial version: scaffold the cookie-consent package. [#49509]
- Lifecycle: Add consumer-callable cleanup APIs for deactivation and uninstall. [#49992]
- Register WP personal-data exporter and eraser for the consent log; rename the consent-log customer_id column to user_id. [#49852]

### Changed
- Add a configurable consent category registry. [#50039]
- Consent log: Add configurable IP address handling modes. [#49997]
- Consent log: Record policy and banner versions. [#49996]
- Docs: Restructure README to define the public API surface, an explicit internal (non-API) list, and a versioning/back-compat policy. [#50103]
- Improve Jetpack Boost page-cache hit rates by excluding Cookie Consent geolocation cookies from the cache key and ensuring geolocation lookups aren’t cached. [#49853]
- Make banner and CCPA copy configurable. [#50000]
- Set up mirror repository and autotagger for package publishing. [#49737]
- Update package dependencies. [#49691] [#49831] [#50097] [#50183] [#50510] [#50529] [#50751] [#50753] [#51008] [#51701] [#52187] [#52297] [#52999] [#53004]

### Removed
- Minimum supported PHP version is now 7.4. [#51515]

### Fixed
- Banner: Hide policy links in the preferences modal when their URL is not configured, so the Cookie Policy and Privacy Policy links never render an empty link. [#50036]
- CCPA: Make the auto-created "Your Privacy Choices" page removable. It is now created only once, is no longer locked from deletion, and the footer links for both the privacy-choices and Privacy Policy pages are hidden if their page is deleted. [#49916]
- Consent banner: Gate Tracks loading on analytics consent. [#50105]
- Consent log: send a REST nonce for logged-in visitors so the consent row records the real user ID instead of 0. [#50068]
- Consent log: unhook the personal-data exporter/eraser filters on deactivation. [#49852]
- Keep the classic-theme footer-links control hidden until needed so it no longer overlaps the consent banner. [#49854]
- Make the consent banner, modal, and controls render consistently across classic and block themes, and expose their colors, spacing, and stacking order as CSS custom properties so the appearance can be customized via Additional CSS. [#49960]
- Set host-only cookies instead of deriving a cross-subdomain domain, which browsers reject on multi-level TLDs such as .co.uk and .com.br. [#49851]

## 0.1.0-alpha - unreleased

- Initial version.

[0.2.1]: https://github.com/Automattic/jetpack-cookie-consent/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/Automattic/jetpack-cookie-consent/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Automattic/jetpack-cookie-consent/compare/v0.1.0-alpha...v0.1.0
