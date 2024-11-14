<?php
/**
 * WPCOM overrides to Core documentation links.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Enqueue assets
 */
function wpcom_enqueue_documentation_links_assets() {
	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-documentation-links/wpcom-documentation-links.asset.php';

	wp_enqueue_script(
		'wpcom-documentation-links-script',
		plugins_url( 'build/wpcom-documentation-links/wpcom-documentation-links.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-documentation-links/wpcom-documentation-links.js' ),
		true
	);

	wp_enqueue_style(
		'wpcom-documentation-links-styles',
		plugins_url( 'build/wpcom-documentation-links/wpcom-documentation-links.css', Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-documentation-links/wpcom-documentation-links.css' )
	);

	// This is a way to get the data from the customize-controls script and change the link to the wpcom support page.
	global $wp_scripts;
	$data = $wp_scripts->get_data( 'customize-controls', 'data' );

	if ( $data ) {
		$data = str_replace( 'https:\\/\\/wordpress.org\\/documentation\\/article\\/site-editor\\/\\', 'https:\\/\\/wordpress.com\\/support\\/site-editor\\/\\', $data );
		$wp_scripts->registered['customize-controls']->extra['data'] = $data;
	}

	wp_set_script_translations( 'wpcom-documentation-links-script', 'jetpack-mu-wpcom' );
}

add_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_documentation_links_assets', 100 );
