<?php
/**
 * WPCOMP add support link to block descriptions.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Common;

/**
 * Enqueue assets
 */
function wpcom_enqueue_block_description_links_assets() {
	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-block-description-links/wpcom-block-description-links.asset.php';

	wp_enqueue_script(
		'wpcom-block-description-links-script',
		plugins_url( 'build/wpcom-block-description-links/wpcom-block-description-links.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-block-description-links/wpcom-block-description-links.js' ),
		true
	);

	Common\wpcom_enqueue_tracking_scripts( 'wpcom-block-description-links-script' );
}

add_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_block_description_links_assets', 100 );
