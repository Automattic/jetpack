# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

This package provides the Stats Dashboard UI infrastructure for WordPress admin.

- **Namespace**: `Automattic\Jetpack\Stats_Admin`
- **Text Domain**: `jetpack-stats-admin`

## Project Structure

```text
src/
├── class-main.php                    # Entry point, singleton, hooks initialization
├── class-dashboard.php               # Stats dashboard page setup
├── class-odyssey-assets.php          # Odyssey dashboard asset loading
├── class-odyssey-config-data.php     # Config data for Odyssey React app
├── class-rest-controller.php         # REST API endpoints
├── class-wpcom-client.php            # General-purpose WPCOM API client with caching
├── class-notices.php                 # Admin notices handling
├── class-admin-post-list-column.php  # Post list view count column
└── class-wp-dashboard-odyssey-widget.php # WP Dashboard widget
```

## Commands

```bash
# Run PHP tests
composer test-php

# Run specific test file
composer phpunit -- --filter Dashboard_Test

# Lint PHP (run from the monorepo root)
jetpack lint-php
```

## Dependencies

This package depends on several Jetpack packages:

- `jetpack-connection` - WPCOM connection
- `jetpack-stats` - Backend stats tracking (see sibling `stats` package)
- `jetpack-blaze` - Blaze integration
- `jetpack-constants` - Shared constants and environment/context helpers
- `jetpack-plans` - Plan checking
- `jetpack-status` - Site status
- `jetpack-jitm` - Just In Time Messages

## Architectural Decisions

- **Odyssey Dashboard**: The main stats dashboard uses the Odyssey React app built in Calypso (wp-calypso repo) and loaded via the CDN at `https://widgets.wp.com/odyssey-stats/`. This package provides the PHP wrapper and config data.
- **REST API**: The `REST_Controller` proxies requests to WordPress.com stats APIs using two collaborators: `WPCOM_Stats` from the `jetpack-stats` package and this package’s `WPCOM_Client`. Calls routed through `WPCOM_Stats` are cached in transients with the `jetpack_restapi_stats_cache_` prefix, while calls made via `WPCOM_Client` use transients with the `STATS_REST_RESP_` prefix. Which client is used depends on the specific endpoint, not solely on the wpcom API version.
- **Relationship with `stats` package**: This package provides the WordPress admin UI infrastructure (PHP wrapper and integration for the Odyssey dashboard), while the `stats` package handles backend tracking and data fetching. They are separate but related.

## Common Pitfalls

- **Do NOT modify Odyssey React code here** - it lives in Calypso (`wp-calypso` repo - <https://github.com/Automattic/wp-calypso>), not this package.
- **Transient caching** - Stats responses may be cached in transients by both `WPCOM_Stats` (using the `jetpack_restapi_stats_cache_` prefix) and this package’s `WPCOM_Client` (using the `STATS_REST_RESP_` prefix). The `stats` package coordinates cleanup via the `jetpack_stats_transient_cleanup_prefixes` filter.
- **JITM disabled on Stats page** - JITMs are intentionally disabled on the stats page (handled separately by Calypso).
- **Simple vs Jetpack sites** - Some features may behave differently. Always check site context.
