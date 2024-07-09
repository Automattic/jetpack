<?php
/**
 * WPCOMP add support link to block descriptions.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;

define( 'MU_WPCOM_BLOCK_DESCRIPTION_LINKS', true );

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

	Connection_Initial_State::render_script( 'wpcom-block-description-links-script' );

	$status            = new Status();
	$connection        = new Connection_Manager();
	$tracking          = new Tracking( 'jetpack-mu-wpcom', $connection );
	$can_use_analytics = $tracking->should_enable_tracking( new Terms_Of_Service(), $status );

	if ( $can_use_analytics ) {
		Tracking::register_tracks_functions_scripts( true );
	}
}

add_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_block_description_links_assets', 100 );
