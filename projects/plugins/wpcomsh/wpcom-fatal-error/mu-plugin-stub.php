<?php
/**
 * Plugin Name: WordPress.com Fatal-Error Deactivator (stub)
 * Description: Loads the fatal-plugin deactivator endpoint before any regular plugin, so the admin's "Deactivate" button on the fatal screen can short-circuit a broken plugin for the current request. Deploy this file to wp-content/mu-plugins/ on the target site — it delegates to wpcomsh's implementation.
 *
 * @package wpcomsh
 */

$wpcomsh_fatal_candidates = array(
	WP_CONTENT_DIR . '/plugins/wpcomsh/wpcom-fatal-error/fatal-plugin-deactivator.php',
	WP_CONTENT_DIR . '/mu-plugins/wpcomsh-dev/wpcom-fatal-error/fatal-plugin-deactivator.php',
);

foreach ( $wpcomsh_fatal_candidates as $wpcomsh_fatal_path ) {
	if ( is_readable( $wpcomsh_fatal_path ) ) {
		require_once $wpcomsh_fatal_path;
		break;
	}
}
unset( $wpcomsh_fatal_candidates, $wpcomsh_fatal_path );
