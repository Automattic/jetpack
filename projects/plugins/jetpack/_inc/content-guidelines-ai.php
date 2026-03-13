<?php
/**
 * Content Guidelines AI — "Generate with Jetpack" button injection.
 *
 * Enqueues a standalone JS bundle on the Content Guidelines admin page
 * that injects AI-powered generate buttons next to each "Save guidelines" button.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Enqueue content-guidelines-ai script on the Content Guidelines admin page.
 *
 * @param string $hook_suffix The current admin page hook suffix.
 */
function jetpack_content_guidelines_ai_enqueue_scripts( $hook_suffix ) {
	// Only load on the Content Guidelines settings page.
	if ( 'settings_page_content-guidelines-wp-admin' !== $hook_suffix ) {
		return;
	}

	// Check Jetpack AI is enabled.
	if ( ! class_exists( 'Jetpack_AI_Helper' ) ) {
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-helper.php';
	}

	if ( ! \Jetpack_AI_Helper::is_enabled() ) {
		return;
	}

	// Check connection.
	if (
		! ( new Host() )->is_wpcom_simple()
		&& ( ! ( new Connection_Manager( 'jetpack' ) )->has_connected_owner() || ( new Status() )->is_offline_mode() )
	) {
		return;
	}

	$asset_file = JETPACK__PLUGIN_DIR . '_inc/build/content-guidelines-ai.min.asset.php';
	$asset      = file_exists( $asset_file ) ? require $asset_file : array(
		'dependencies' => array( 'wp-api-fetch', 'wp-components', 'wp-data', 'wp-element', 'wp-i18n' ),
		'version'      => JETPACK__VERSION,
	);

	wp_enqueue_script(
		'jetpack-content-guidelines-ai',
		plugins_url( '_inc/build/content-guidelines-ai.min.js', JETPACK__PLUGIN_FILE ),
		$asset['dependencies'],
		$asset['version'],
		true
	);
}

add_action( 'admin_enqueue_scripts', 'jetpack_content_guidelines_ai_enqueue_scripts' );
