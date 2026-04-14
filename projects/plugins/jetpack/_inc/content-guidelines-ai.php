<?php
/**
 * Content Guidelines AI — Jetpack AI integration.
 *
 * Enqueues a standalone JS bundle on the Content Guidelines admin page
 * that adds AI-powered guideline generation via Jetpack.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Status\Visitor;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Check if the current user is an Automattician.
 *
 * - Simple sites: wpcom_is_proxied_request() + is_automattician()
 * - Atomic sites: Visitor::is_automattician_feature_flags_only()
 *
 * @return bool
 */
function jetpack_content_guidelines_ai_is_automattician() {
	// Allow access via query parameter.
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( isset( $_GET['enable_ai_generation'] ) && 'true' === $_GET['enable_ai_generation'] ) {
		return true;
	}

	// Simple sites.
	if ( function_exists( 'wpcom_is_proxied_request' )
		&& wpcom_is_proxied_request()
		&& function_exists( 'is_automattician' )
		&& is_automattician()
	) {
		return true;
	}

	// Atomic sites.
	return ( new Visitor() )->is_automattician_feature_flags_only();
}

/**
 * Enqueue content-guidelines-ai script on the Content Guidelines admin page.
 *
 * @since $$next-version$$
 *
 * @param string $hook_suffix The current admin page hook suffix.
 */
function jetpack_content_guidelines_ai_enqueue_scripts( $hook_suffix ) {
	if ( 'settings_page_guidelines-wp-admin' !== $hook_suffix ) {
		return;
	}

	// Temporarily gate to Automatticians only during internal rollout.
	if ( ! jetpack_content_guidelines_ai_is_automattician() ) {
		return;
	}

	$asset_file = JETPACK__PLUGIN_DIR . '_inc/build/content-guidelines-ai.min.asset.php';
	$asset      = file_exists( $asset_file ) ? require $asset_file : array(
		'dependencies' => array( 'wp-api-fetch', 'wp-components', 'wp-data', 'wp-element', 'wp-i18n', 'wp-notices' ),
		'version'      => JETPACK__VERSION,
	);

	wp_enqueue_script(
		'jetpack-content-guidelines-ai',
		plugins_url( '_inc/build/content-guidelines-ai.min.js', JETPACK__PLUGIN_FILE ),
		$asset['dependencies'],
		$asset['version'],
		true
	);

	wp_enqueue_style(
		'jetpack-content-guidelines-ai',
		plugins_url( '_inc/build/content-guidelines-ai.css', JETPACK__PLUGIN_FILE ),
		array( 'wp-components' ),
		$asset['version']
	);
}

add_action( 'admin_enqueue_scripts', 'jetpack_content_guidelines_ai_enqueue_scripts' );
