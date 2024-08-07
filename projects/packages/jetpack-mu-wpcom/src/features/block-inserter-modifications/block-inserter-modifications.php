<?php
/**
 * WPCOM Block Inserter Modifications
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Enqueue script for the Block Inserter modifications.
 */
function wpcom_enqueue_block_inserter_modifications_assets() {
	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/block-inserter-modifications/block-inserter-modifications.asset.php';

	wp_enqueue_script(
		'block-inserter-modifications-script',
		plugins_url( 'build/block-inserter-modifications/block-inserter-modifications.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/block-inserter-modifications/block-inserter-modifications.js' ),
		true
	);

	wp_set_script_translations( 'block-inserter-modifications-script', 'jetpack-mu-wpcom' );

	$style_name = 'block-inserter-modifications';
	$style_file = is_rtl() ? $style_name . '.rtl.css' : $style_name . '.css';

	wp_enqueue_style(
		'block-inserter-modifications-styles',
		plugins_url( 'build/block-inserter-modifications/' . $style_file, Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/block-inserter-modifications/' . $style_file )
	);
}

add_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_block_inserter_modifications_assets', 0 );
