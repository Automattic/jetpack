<?php
/**
 * Plugin Conflicts Guardian — pre-flight plugin compatibility check.
 *
 * Loads the comparison engine unconditionally (classes only — no
 * side-effects) so other code can construct a checker directly. The
 * admin page and WP-CLI command are gated behind `pcg_enable` so the
 * prototype ships dark on WP.com until someone flips the filter on.
 *
 * Layout:
 *   class-pcg-verdict.php         Value object for check results.
 *   class-pcg-site-state.php      Reads WP + PHP versions.
 *   class-pcg-wporg-source.php    Fetches api.wordpress.org plugin metadata.
 *   class-pcg-compat-checker.php  Orchestrator: runs the verdict rules.
 *   cli.php                       `wp plugin-compat check <slug>`.
 *   admin-page.php                Tools → Plugin Compat Check.
 *
 * @package automattic/jetpack-mu-wpcom
 */

// Dummy comment so PHPCS treats the block above as the file doc comment.
require_once __DIR__ . '/class-pcg-verdict.php';
require_once __DIR__ . '/class-pcg-site-state.php';
require_once __DIR__ . '/class-pcg-wporg-source.php';
require_once __DIR__ . '/class-pcg-compat-checker.php';

/**
 * Filter: whether to expose the Plugin Conflicts Guardian surfaces
 * (Tools page + WP-CLI command) on this site.
 *
 * Defaults to false so the prototype ships dark. Sites that want it
 * enable via:
 *
 *     add_filter( 'pcg_enable', '__return_true' );
 *
 * @param bool $enabled
 */
if ( apply_filters( 'pcg_enable', false ) ) {
	if ( is_admin() ) {
		require_once __DIR__ . '/admin-page.php';
	}
	if ( defined( 'WP_CLI' ) && WP_CLI ) {
		require_once __DIR__ . '/cli.php';
	}
}
