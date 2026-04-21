<?php
/**
 * Plugin Name: WordPress.com Fatal-Error Deactivator (stub)
 * Description: Loads the fatal-plugin deactivator endpoint before any regular plugin, so the admin's "Deactivate" button on the fatal screen can short-circuit a broken plugin for the current request. Deploy this file to wp-content/mu-plugins/ on the target site — it delegates to wpcomsh's implementation.
 *
 * @package wpcomsh
 */

$wpcomsh_fatal_deactivator = WP_PLUGIN_DIR . '/wpcomsh/wpcom-fatal-error/fatal-plugin-deactivator.php';
if ( is_readable( $wpcomsh_fatal_deactivator ) ) {
	require_once $wpcomsh_fatal_deactivator;
}
unset( $wpcomsh_fatal_deactivator );
