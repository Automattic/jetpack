<?php
/**
 * WPCOM addition to Gutenberg post tags section.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Jetpack_Mu_Wpcom\Common;

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

	Common\wpcom_enqueue_tracking_scripts( 'wpcom-tags-education-script' );
}

add_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_tags_education_assets', 100 );
