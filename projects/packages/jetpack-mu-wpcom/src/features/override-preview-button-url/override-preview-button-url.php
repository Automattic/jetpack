<?php
/**
 * Apply the new font-smoothing styles.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Check if the feature should be loaded.
 *
 * @return bool
 */
function should_load_override_preview_button_url() {
	if ( ! class_exists( 'Automattic\Jetpack\Status\Host' ) ) {
		return false;
	}

	$host = new Automattic\Jetpack\Status\Host();
	if ( ! $host->is_wpcom_simple() ) {
		return false;
	}

	global $pagenow;
	$allowed_pages = array(
		'post.php',
		'post-new.php',
	);
	return isset( $pagenow ) && in_array( $pagenow, $allowed_pages, true );
}

/**
 * Enqueue assets
 */
function wpcom_enqueue_override_preview_button_url_assets() {
	if ( ! should_load_override_preview_button_url() ) {
		return;
	}

	$asset_file          = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/override-preview-button-url/override-preview-button-url.asset.php';
	$script_dependencies = $asset_file['dependencies'] ?? array();
	$script_version      = $asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/override-preview-button-url/override-preview-button-url.js' );
	$script_id           = 'wpcom-override-preview-button-url-script';

	wp_enqueue_script(
		$script_id,
		plugins_url( 'build/override-preview-button-url/override-preview-button-url.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$script_dependencies,
		$script_version,
		true
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_enqueue_override_preview_button_url_assets' );
