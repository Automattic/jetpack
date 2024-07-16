<?php
/**
 * WPCOM addition to Gutenberg post tags section.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;

define( 'MU_WPCOM_TAGS_EDUCATION', true );

/**
 * Enqueue assets
 */
function wpcom_enqueue_tags_education_assets() {
	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/tags-education/tags-education.asset.php';

	wp_enqueue_script(
		'wpcom-tags-education-script',
		plugins_url( 'build/tags-education/tags-education.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/tags-education/tags-education.js' ),
		true
	);

	wp_localize_script(
		'wpcom-tags-education-script',
		'wpcomTagsEducation',
		array( 'actionText' => __( 'Build your audience with tags', 'jetpack-mu-wpcom' ) )
	);

	Connection_Initial_State::render_script( 'wpcom-tags-education-script' );

	$status            = new Status();
	$connection        = new Connection_Manager();
	$tracking          = new Tracking( 'jetpack-mu-wpcom', $connection );
	$can_use_analytics = $tracking->should_enable_tracking( new Terms_Of_Service(), $status );

	if ( $can_use_analytics ) {
		Tracking::register_tracks_functions_scripts( true );
	}
}

add_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_tags_education_assets', 100 );
