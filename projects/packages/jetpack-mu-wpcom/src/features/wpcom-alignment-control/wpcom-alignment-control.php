<?php
/**
 * WPCOM Add justify text option to Alignment Control
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Enqueue script for the WPCOM Alignment Control modifications.
 */
function wpcom_enqueue_alignment_control_assets() {
	wp_enqueue_script(
		'wpcom-alignment-control-script',
		plugins_url( 'build/wpcom-alignment-control/wpcom-alignment-control.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-alignment-control/wpcom-alignment-control.js' ),
		true
	);
}

add_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_alignment_control_assets' );
