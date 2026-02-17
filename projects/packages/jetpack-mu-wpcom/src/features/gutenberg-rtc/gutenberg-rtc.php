<?php
/**
 * Gutenberg RTC (Real-Time Collaboration) customizations
 * This handles RTC-related configurations for the Gutenberg editor on JP sites.
 *
 * Currently disables HTTP polling to prevent issues, but can be extended
 * in the future for other RTC-related customizations.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Enqueue block editor assets for Gutenberg RTC customizations.
 */
function wpcom_enqueue_gutenberg_rtc_assets() {
	$asset_file          = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/gutenberg-rtc/gutenberg-rtc.asset.php';
	$script_dependencies = $asset_file['dependencies'] ?? array();
	$version             = $asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/gutenberg-rtc/gutenberg-rtc.js' );

	wp_enqueue_script(
		'gutenberg-rtc-script',
		plugins_url( 'build/gutenberg-rtc/gutenberg-rtc.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$script_dependencies,
		$version,
		true
	);
}
add_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_gutenberg_rtc_assets' );
