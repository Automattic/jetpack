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

/**
 * Enable Scheduled tasks for sites with the Scheduled tasks sticker.
 *
 * @param bool $enabled Whether the flag is already enabled.
 * @return bool Whether Scheduled tasks are enabled.
 */
function enable_scheduled_tasks( $enabled ) {
	return $enabled || wpcom_has_blog_sticker( 'wpcom-agent-scheduled-tasks', get_wpcom_blog_id() );
}

add_filter( 'jetpack_feature_flag_enabled_ai-hub-scheduled-tasks', __NAMESPACE__ . '\\enable_scheduled_tasks' );

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

	// Jetpack deploys separately, and a version predating Simple support skips the shell here on its own.
	// @phan-suppress-next-line PhanUndeclaredClassReference -- loaded from the sibling Jetpack plugin above and guarded at runtime.
	if ( method_exists( '\Jetpack_AI_Page', 'add_admin_shell_member' ) ) {
		// @phan-suppress-next-line PhanUndeclaredClassInCallable -- loaded from the sibling Jetpack plugin above and guarded at runtime.
		add_filter( 'jetpack_admin_shell_members', array( $page, 'add_admin_shell_member' ) );
	}
}

register();
