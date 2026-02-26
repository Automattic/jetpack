# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

This package provides WordPress.com Stats tracking and API integration for Jetpack sites.

- **Namespace**: `Automattic\Jetpack\Stats`
- **Text Domain**: `jetpack-stats`

## Project Structure

```text
src/
├── class-main.php            # Entry point, singleton, hooks initialization
├── class-tracking-pixel.php  # Tracking pixel embedding and data building
├── class-wpcom-stats.php     # WPCOM Stats API client with caching
├── class-rest-provider.php   # REST API endpoints
├── class-xmlrpc-provider.php # XML-RPC provider
├── class-options.php         # Options controlling tracking behaviors
└── class-transient-cleanup.php # Cron-based transient cleanup
```

## Architectural Decisions

- Post stats cached in post meta (not transients) to avoid bloating options table.
- Only wraps wpcom/v1.1 endpoints → no v2 endpoints.
- Backend only; frontend endpoints are in `stats-admin` package.

## Common Pitfalls

- **Simple site support** is limited to `get_total_post_views` for post list view counts.
- **Transient cleanup** only runs without persistent object cache (won't run on Simple sites).
