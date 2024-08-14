<?php
/**
 * Adds a tiny WordPress.com Plugins integration to the plugin list.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Displays a banner before the plugin browser that links to the WP.com Plugins Marketplace.
 */
function wpcom_plugins_show_banner() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( isset( $_GET['tab'] ) && 'favorites' === $_GET['tab'] ) {
		// no banner on the favorites tab, it's a bit overbearing given they presumably want
		// something specific.
		return;
	}

	$site_slug        = wp_parse_url( home_url(), PHP_URL_HOST );
	$wpcom_logo       = plugins_url( 'images/wpcom-logo.svg', __FILE__ );
	$background_image = plugins_url( 'images/banner-background.webp', __FILE__ );

	$asset_file = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-plugins-banner/wpcom-plugins-banner.asset.php';

	wp_enqueue_script(
		'wpcom-plugins-banner',
		plugins_url( 'build/wpcom-plugins-banner/wpcom-plugins-banner.js', Jetpack_Mu_Wpcom::BASE_FILE ),
		$asset_file['dependencies'] ?? array(),
		$asset_file['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-plugins-banner/wpcom-plugins-banner.js' ),
		array(
			'strategy'  => 'defer',
			'in_footer' => true,
		)
	);
	wp_localize_script(
		'wpcom-plugins-banner',
		'wpcomPluginsBanner',
		array(
			'logo'             => esc_url( $wpcom_logo ),
			'title'            => esc_html__( "Flex your site's features with plugins", 'jetpack-mu-wpcom' ),
			'description'      => esc_html__( "Access a variety of free and paid plugins that can enhance your site's functionality and features.", 'jetpack-mu-wpcom' ),
			'actionUrl'        => esc_url( "https://wordpress.com/plugins/$site_slug?ref=woa-plugin-banner" ),
			'actionText'       => esc_html__( 'Explore plugins', 'jetpack-mu-wpcom' ),
			'bannerBackground' => esc_url( $background_image ),
		)
	);

	$asset_file_style = include Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-plugins-banner/wpcom-plugins-banner.asset.php';
	wp_enqueue_style(
		'wpcom-plugins-banner-style',
		plugins_url( 'build/wpcom-plugins-banner-style/wpcom-plugins-banner-style.css', Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		$asset_file_style['version'] ?? filemtime( Jetpack_Mu_Wpcom::BASE_DIR . 'build/wpcom-plugins-banner-style/wpcom-plugins-banner-style.css' )
	);
}
add_action( 'load-plugin-install.php', 'wpcom_plugins_show_banner' );
