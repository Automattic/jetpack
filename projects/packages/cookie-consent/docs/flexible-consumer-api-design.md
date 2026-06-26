# Cookie Consent: Flexible Consumer API — Design

- **Linear:** WOOA7S-1597 (parent WOOA7S-1544; legal values WOOA7S-1543)
- **Package:** `projects/packages/cookie-consent`
- **Status:** Design / sign-off (no implementation in this issue)
- **Date:** 2026-06-26

## Purpose

`@automattic/jetpack-cookie-consent` is meant to be a plugin-agnostic package, but
today it is **config-by-global-filter + monolithic boot**:

- `Cookie_Consent::init()` is static and takes no arguments.
- Configuration is one global filter (`jetpack_cookie_consent_config`) merged over
  hardcoded defaults in `get_config()` (`class-cookie-consent.php`).
- `init()` wires up everything at once: asset enqueue, banner render, CCPA page
  auto-creation, footer block-hook links, geo cache filter, consent-log REST.
- No per-feature toggles, no injected config, no settings persistence, no events.

A consumer takes all-or-nothing and can only tweak values through a global filter.
This design makes the package **flexible and consumer-driven**, so a future
product/legal decision becomes a consumer-side config change, not a package edit.

### Decided direction (do not re-litigate)

- **Model = Hybrid / layered:** (1) stateless core `init($config)` with per-feature
  toggles; (2) one authoritative config schema shared PHP↔TS as the single contract;
  (3) optional, opt-in persistence + REST settings module.
- **Strategy = config-first:** every legal-gated decision (WOOA7S-1543) is a config
  knob with a conservative / most-protective default, so a legal answer is a value
  flip, not code.
- **Schema sharing mechanism = PHP-authoritative, JSON-Schema-shaped, codegen TS.**
- **Banner live-preview = iframe of the real server-rendered banner driven by a
  draft config** (not a React reimplementation of the banner).

## Deliverable 1 — Config schema

### Authoring & sharing mechanism

A PHP class `Config_Schema` (`src/schema/class-config-schema.php`) is the **single
source of truth**. It returns a **JSON-Schema-shaped array** (fields, types,
defaults, validation) that is:

1. Reused **verbatim** as the REST args/settings schema (WordPress
   `register_rest_route` / `register_setting` already consume this shape).
2. Resolved at runtime (`Config_Schema::resolve( $config )`) to fill defaults +
   validate, then the resolved **values** are emitted to the frontend via the
   existing `wp_interactivity_config()` path.
3. Compiled by a build script into two committed artifacts the JS side imports:
   `config-schema.json` and `config-schema.d.ts`. TS is **never hand-synced**; a
   contract test asserts PHP ↔ generated-JSON parity in CI.

**Why PHP-authoritative:** WordPress REST/settings APIs natively speak JSON-Schema
shape; defaults and i18n copy must live in PHP so they can use `__()`;
premium-analytics resolves its own config in PHP before calling `init($config)`.

### Schema shape

Nested groups with an independent per-feature toggle block. Validation is performed
by reusing WordPress' schema validators (`rest_validate_value_from_schema` /
`rest_sanitize_value_from_schema`).

```
enabled            bool   default true     // per-site master switch (WOOA7S-1544)
schema_version     int    default 1        // for proof-of-consent / migration

features:                                   // independently toggleable
  banner             bool  default true
  ccpa_page          bool  default true
  page_deletion_lock bool  default false   // page is now removable (#49916); flag reserved, default off
  footer_links       bool  default true
  consent_log        bool  default true
  tracks             bool  default true
  geo                bool  default true

geo:                                        // WOOA7S-1600 pluggable geo
  provider           enum('wpcom','custom') default 'wpcom'
  api_url            string(url) default 'https://public-api.wordpress.com/geo/'
  country_code_cookie string default 'country_code'
  region_cookie      string default 'region'
  cookie_duration    int(seconds) default 21600        // 6h
  gdpr_countries     string[] default [current 33-entry list]
  ccpa_regions       string[] default [current 13-entry list]
  show_on_error      bool default true                 // most-protective: show banner if geo fails

consent:                                    // WOOA7S-1599 categories, cadence, GPC
  categories         object[] default [functional(required/locked), analytics, marketing]
                       // each: { key, label(i18n), required:bool, wp_consent_map:string[] }
  expiration_days    int default 30          // mirrors WP Consent API wp_cookie_expiration; re-prompt cadence
  honor_gpc_in_gdpr  bool default true       // WOOA7S-1609 most-protective: honor GPC even on GDPR path

log:                                         // WOOA7S-1605 / 1606 + retention
  retention_days     int default 30
  ip_mode            enum('drop','hash','truncate','raw') default 'drop'  // most-protective: store no IP
  policy_version     string default '1'       // proof-of-consent
  banner_version     string default '1'

tracks:
  event_prefix       string default 'jetpack'  // premium-analytics uses 'woocommerceanalytics'

links:
  cookie_policy_url  string(url) default ''    // WOOA7S-1607: empty → fall back to site's own policy (wp_page_for_privacy_policy)

copy:                                          // WOOA7S-1601 injectable & translatable
  <string map>  default supplied by package via __()
```

### Conservative defaults (config-first; legal supplies final values via WOOA7S-1543)

| Field                       | Default  | Rationale                                                                                                                                                                   |
| --------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `log.ip_mode`               | `'drop'` | Most-protective. **⚠ Behavior change** — current code stores raw IP. New conservative default; legal flips the value. Existing consumers inject their own resolved config. |
| `consent.honor_gpc_in_gdpr` | `true`   | Honor Global Privacy Control even on the GDPR path.                                                                                                                         |
| `geo.show_on_error`         | `true`   | Show banner when geolocation fails.                                                                                                                                         |
| `log.retention_days`        | `30`     | Current default; legal may adjust.                                                                                                                                          |
| `consent.expiration_days`   | `30`     | Inherits WP Consent API default; legal may extend/shorten the re-prompt cadence.                                                                                            |

## Deliverable 2 — Core `init($config)` API + feature toggles

```php
Cookie_Consent::init( array $config = array() ): void
```

- `Config_Schema::resolve( $config )` applies defaults, validates, and returns a
  normalized config. The **core is stateless** — it does not read or write its own
  option store on this path.
- `enabled === false` → bail; register nothing.
- Each `features.*` toggle gates a slice of what `init()` wires today:

| Toggle               | Wires (current code)                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `banner`             | `enqueue_assets` (banner parts) + `render_banner`                                                                        |
| `ccpa_page`          | `maybe_create_ccpa_page` + CCPA block filters + `exclude_ccpa_from_get_pages` + `register_ccpa_page_setting`             |
| `page_deletion_lock` | reserved; default off                                                                                                    |
| `footer_links`       | `register_footer_navigation_links` + attribute/render filters                                                            |
| `consent_log`        | `Consent_Log_Controller::init( $config['log'] )` — retention / ip_mode / versions come from config, not separate filters |
| `tracks`             | `w.js` enqueue (gated on consent later by WOOA7S-1608)                                                                   |
| `geo`                | geo cache filter + `geoApiUrl` emission + banner geo logic                                                               |

`enabled` is the per-site server-side enable switch tracked by WOOA7S-1544.

The banner becomes **config-driven**: `render_banner()` / `enqueue_assets()` consume
the normalized config (copy, categories, links, colors) instead of hardcoded values.
This is required by downstream issues (1599 / 1601 / 1607) regardless of preview.

### Lifecycle extension points (WOOA7S-1598, designed separately)

Events/hooks are **orthogonal to the config schema** and are not enumerated here.
The core will expose lifecycle extension points (PHP actions/filters + JS custom
events) as its own design under WOOA7S-1598. This spec only guarantees the
toggle/config boundaries are clean enough to hang those points on.

## Deliverable 3 — Back-compat plan

The legacy global filter keeps working as a deprecation shim:

- `Config_Schema::resolve()` applies `jetpack_cookie_consent_config` as a final
  **legacy override layer**, mapping the flat legacy keys onto the nested schema:

  | Legacy key            | Schema path               |
  | --------------------- | ------------------------- |
  | `geo_api_url`         | `geo.api_url`             |
  | `geo_cookie_duration` | `geo.cookie_duration`     |
  | `country_code_cookie` | `geo.country_code_cookie` |
  | `region_cookie`       | `geo.region_cookie`       |
  | `gdpr_countries`      | `geo.gdpr_countries`      |
  | `ccpa_regions`        | `geo.ccpa_regions`        |
  | `show_on_error`       | `geo.show_on_error`       |
  | `cookie_policy_url`   | `links.cookie_policy_url` |
  | `event_prefix`        | `tracks.event_prefix`     |

- `_deprecated_hook()` raises a soft notice when the legacy filter is used.
- The existing **no-argument `init()` path is behavior-preserving**: defaults +
  legacy filter resolve to today's behavior (modulo the deliberate `ip_mode`
  default change, which only affects consumers that do not inject config).
- Other scattered filters map to schema fields and keep a shim:
  `jetpack_cookie_consent_log_retention_days` → `log.retention_days`;
  `jetpack_cookie_consent_allowed_consent_types` → `consent.categories`.
- Formal removal of the legacy filters is deferred to a future major, governed by
  the versioning policy in WOOA7S-1603.

## Deliverable 4 — Layering / package boundaries

```
Layer 0  @automattic/jetpack-cookie-consent        PHP core + Interactivity banner frontend
Layer 1  Schema contract: Config_Schema (PHP) ──build──▶ config-schema.json + config-schema.d.ts (TS)
Layer 2  Persistence + REST settings module (opt-in, mountable)
           Settings_Store (option) + Settings_Controller (REST GET/PUT, schema-validated)
           + per-site enable switch storage + preview endpoint feeding draft config
Layer 3  @automattic/jetpack-cookie-consent-settings (React, store-agnostic)
           form controls producing schema-shaped config + iframe live-preview harness
```

**Dependencies (single-directional):** `core → Layer 1`; `Layer 2 → Layer 1`;
`Layer 3 → Layer 1` (generated TS types only — store/REST injected by the consumer).

**Consumer scenarios:**

- **premium-analytics (self-managed panel):** resolves its own config → `init($config)`;
  **does not mount Layer 2**; its admin tab imports Layer 3 form components wired to
  its own store/REST.
- **Future install-and-use consumer:** mounts Layer 2 + a default settings page built
  from Layer 3; the site owner self-serves.

Both use the **same schema and same UI components**; only the settings _source_ differs.

**Scope note:** Layer 2 is defined here only at the **interface/boundary** level
(responsibilities, dependencies, the REST contract being schema-validated). Its full
implementation is owned by WOOA7S-1610. Layer 3 is a future package; it is not built
now, but the schema (Layer 1) and the preview path (Deliverable 5) are designed so it
can be added without reopening this design.

## Deliverable 5 — Banner live-preview path (decided)

- The banner is **config-driven** (Deliverable 2), so it can render from any config —
  stored or draft.
- The settings UI shows live preview via an **iframe pointing at the existing
  `?preview_cookie_consent=1` route**, passing the **draft config** (via query string /
  `postMessage`, or a short-lived preview transient/endpoint). In preview mode the
  banner reads the draft config instead of the stored config.
- The preview is therefore **the real server-rendered banner** — zero divergence.
- The React settings package (Layer 3) builds **only the form + iframe harness**; it
  never reimplements the banner. This directly resolves the issue's "two divergent
  UIs" concern.

## Downstream issue satisfiability

| Issue                      | Hook in this design                                                                     |
| -------------------------- | --------------------------------------------------------------------------------------- |
| 1598 events/hooks          | Core lifecycle extension points (designed in 1598; toggle/config boundaries kept clean) |
| 1599 categories            | `consent.categories` registry                                                           |
| 1600 geo provider          | `geo.provider` + `features.geo`                                                         |
| 1601 copy                  | `copy` map (i18n via PHP)                                                               |
| 1605 ip-mode               | `log.ip_mode`                                                                           |
| 1606 log version           | `log.policy_version` / `log.banner_version`                                             |
| 1607 cookie_policy_url     | `links.cookie_policy_url` (empty → site policy fallback)                                |
| 1608 Tracks gating         | `features.tracks` toggle                                                                |
| 1609 GPC-in-GDPR           | `consent.honor_gpc_in_gdpr`                                                             |
| 1610 settings UI           | Layer 2 + Layer 3                                                                       |
| 1603 public API/versioning | `schema_version` + legacy-filter deprecation timeline                                   |
| 1604 test foundation       | Stateless `resolve()` + toggle gating are unit-testable; schema parity contract test    |

## Out of scope

- No implementation in this issue. After sign-off, foundation work (stateless core,
  schema, persistence, JS components, preview) splits into follow-up sub-issues.
- Event/hook names (WOOA7S-1598), Layer 2 implementation (WOOA7S-1610), and the Layer 3
  React package are designed in their own issues.
- Final legal values for the conservative defaults arrive via WOOA7S-1543.
