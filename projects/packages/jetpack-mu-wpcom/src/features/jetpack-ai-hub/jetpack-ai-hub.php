<?php
/**
 * WordPress.com Simple integration for the Jetpack AI Hub.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Hub;

/**
 * Point the upstream Hub at WordPress.com's native site-scoped MCP API.
 *
 * @param array $config Upstream AI Hub host configuration.
 * @return array WordPress.com Simple configuration.
 */
function configure( $config ) {
	$blog_id = get_current_blog_id();

	$config['showGatedViews']  = false;
	$config['isUserConnected'] = true;
	$config['mcpSettingsApi']  = array(
		'path'   => '/wpcom/v2/sites/' . $blog_id . '/mcp-abilities',
		'format' => 'wpcom',
	);

	return $config;
}

// Scheduled tasks are a WordPress.com-backed experience and should be visible
// whenever the AI Hub integration is loaded on Simple sites.
add_filter( 'jetpack_feature_flag_enabled_ai-hub-scheduled-tasks', '__return_true' );

/**
 * Register the upstream AI Hub page on WordPress.com Simple.
 */
function register() {
	if ( ! defined( 'JETPACK__PLUGIN_DIR' ) ) {
		return;
	}

	$page_path = JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-ai-page.php';
	if ( ! file_exists( $page_path ) ) {
		return;
	}

	require_once $page_path;
	// @phan-suppress-next-line PhanUndeclaredClassReference -- loaded from the sibling Jetpack plugin above and guarded at runtime.
	if ( ! class_exists( '\Jetpack_AI_Page' ) || ! method_exists( '\Jetpack_AI_Page', 'add_actions' ) ) {
		return;
	}

	add_filter( 'jetpack_ai_admin_config', __NAMESPACE__ . '\\configure' );

	// @phan-suppress-next-line PhanUndeclaredClassMethod -- loaded from the sibling Jetpack plugin above and guarded at runtime.
	$page = new \Jetpack_AI_Page();
	// @phan-suppress-next-line PhanUndeclaredClassInCallable -- loaded from the sibling Jetpack plugin above and guarded at runtime.
	add_action( 'admin_menu', array( $page, 'add_actions' ), 998 );
}

register();
