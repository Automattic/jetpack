<?php
/**
 * Gutenberg's Block Theme Previews feature
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Always show the correct homepage when previewing a theme in the Site Editor
 *
 * @see https://github.com/Automattic/wp-calypso/issues/79221
 * @since 12.4
 */

if ( get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
	add_filter(
		'option_show_on_front',
		function () {
			return 'posts';
		}
	);
}

/**
 * Enqueue JS and CSS assets for this feature.
 */
function wpcom_enqueue_block_theme_previews_assets() {
	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/block-theme-previews/block-theme-previews.asset.php';

	wp_enqueue_script(
		'wpcom-block-theme-previews',
		plugins_url( 'build/block-theme-previews/block-theme-previews.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/block-theme-previews/block-theme-previews.js' ),
		true
	);
	wp_enqueue_style(
		'wpcom-block-theme-previews',
		plugins_url( 'build/block-theme-previews/block-theme-previews.css', Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/block-theme-previews/block-theme-previews.css' )
	);
}
add_action( 'enqueue_block_editor_assets', 'wpcom_enqueue_block_theme_previews_assets' );
