<?php
/**
 * Content Guidelines AI — renders a "Generate With Jetpack" button
 * inside the Content Guidelines admin page via SlotFill.
 *
 * This file is auto-loaded by load_block_editor_extensions() via glob
 * from extensions/plugins/. It registers itself through the standard
 * Jetpack extension availability system and only enqueues assets on the
 * Content Guidelines admin page.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\ContentGuidelinesAI;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

const FEATURE_NAME = 'content-guidelines-ai';

/**
 * Register the Content Guidelines AI extension.
 *
 * @return void
 */
function register_plugin() {
	if ( is_jetpack_ai_available() ) {
		\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
	}
}
add_action( 'jetpack_register_gutenberg_extensions', __NAMESPACE__ . '\register_plugin' );

add_filter(
	'jetpack_set_available_extensions',
	function ( $extensions ) {
		return array_merge(
			(array) $extensions,
			array( FEATURE_NAME )
		);
	}
);

/**
 * Enqueue the JS bundle on the Content Guidelines admin page
 * when the extension is available.
 *
 * @param string $hook_suffix The current admin page hook suffix.
 */
function enqueue_assets( $hook_suffix ) {
	if ( 'settings_page_content-guidelines-wp-admin' !== $hook_suffix ) {
		return;
	}

	if ( ! is_jetpack_ai_available() ) {
		return;
	}

	$asset_file = JETPACK__PLUGIN_DIR . '_inc/build/content-guidelines-ai.min.asset.php';

	if ( ! file_exists( $asset_file ) ) {
		return;
	}

	$asset = include $asset_file;

	wp_enqueue_script(
		'jetpack-content-guidelines-ai',
		plugins_url( '_inc/build/content-guidelines-ai.min.js', JETPACK__PLUGIN_FILE ),
		$asset['dependencies'] ?? array(),
		$asset['version'] ?? false,
		false
	);
}
add_action( 'admin_enqueue_scripts', __NAMESPACE__ . '\enqueue_assets' );

/**
 * Check whether Jetpack AI is available on this site.
 *
 * @return bool
 */
function is_jetpack_ai_available() {
	if ( ! apply_filters( 'jetpack_ai_enabled', true ) ) {
		return false;
	}

	if ( ( new Host() )->is_wpcom_simple() ) {
		return true;
	}

	return ( new Connection_Manager( 'jetpack' ) )->has_connected_owner()
		|| ( new Status() )->is_offline_mode();
}
