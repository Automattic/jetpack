<?php
/**
 * Plugin Conflicts Guardian — pre-flight plugin-activation check.
 *
 * See README.md for how it works.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Load dependencies.
 */
require_once __DIR__ . '/pcg-log.php';
require_once __DIR__ . '/class-pcg-load-tester.php';
require_once __DIR__ . '/class-pcg-rollout.php';
require_once __DIR__ . '/force-override.php';

// Probe endpoint must answer front-end requests, so it's not gated on is_admin().
require_once __DIR__ . '/probe-endpoint.php';

/*
 * Loaded unconditionally:
 *   - activation-guard.php's hooks (`load-plugins.php` / `load-update.php`)
 *     only fire on admin requests, but the file also defines the
 *     `pcg_guard_format_block_reason` helper used by update-healthcheck
 *     under cron auto-updates and WP-CLI.
 *   - The upgrade-time files (update-guard, snapshot, rollback,
 *     update-healthcheck) hook `upgrader_*` actions that fire for cron
 *     auto-updates and WP-CLI flows too, not just admin requests.
 */
require_once __DIR__ . '/activation-guard.php';
require_once __DIR__ . '/update-guard.php';
require_once __DIR__ . '/class-pcg-snapshot.php';
require_once __DIR__ . '/class-pcg-rollback.php';
require_once __DIR__ . '/update-healthcheck.php';
