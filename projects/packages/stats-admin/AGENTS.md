# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Essential Documentation

**Primary Reference**: [Stats Admin README.md](./README.md) - Package overview and installation

**Additional Resources**:

- [Automated Testing Overview](../../../docs/automated-testing.md) - Testing patterns and strategies
- [Coding Standards & Guidelines](../../../docs/coding-guidelines.md) - Development best practices
- [Jetpack CLI Documentation](../../../tools/cli/README.md) - CLI commands and workflows

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
├── class-wpcom-client.php            # WPCOM API client with caching
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
- **REST API**: Proxies requests to WordPress.com stats APIs via the internal `WPCOM_Client`. Responses are cached using transients with prefix `STATS_REST_RESP_`.
- **Relationship with `stats` package**: This package provides the WordPress admin UI infrastructure (PHP wrapper and integration for the Odyssey dashboard), while the `stats` package handles backend tracking and data fetching. They are separate but related.

## Common Pitfalls

- **Do NOT modify Odyssey React code here** - it lives in Calypso (`wp-calypso` repo - <https://github.com/Automattic/wp-calypso>), not this package.
- **Transient caching** - The `WPCOM_Client` class uses transients for caching. The `stats` package handles cleanup via `jetpack_stats_transient_cleanup_prefixes` filter.
- **JITM disabled on Stats page** - JITMs are intentionally disabled on the stats page (handled separately by Calypso).
- **Simple vs Jetpack sites** - Some features may behave differently. Always check site context.
