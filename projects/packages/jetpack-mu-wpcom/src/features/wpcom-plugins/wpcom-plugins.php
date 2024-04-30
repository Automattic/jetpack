<?php
/**
 * WordPress.com Plugins
 *
 * Adds a tiny WordPress.com Plugins integration to the plugin list.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Displays a banner before the theme browser that links to the WP.com Theme Showcase.
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
	$background_image = plugins_url( 'images/banner-background.png', __FILE__ );

	wp_enqueue_script(
		'wpcom-plugins-banner',
		plugins_url( 'js/banner.js', __FILE__ ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION,
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
			'description'      => esc_html__( "Access a variety of free and paid plugins that can ehance your site's functionality and features.", 'jetpack-mu-wpcom' ),
			'actionUrl'        => esc_url( "https://wordpress.com/plugins/$site_slug?ref=woa-plugin-banner" ),
			'actionText'       => esc_html__( 'Explore plugins', 'jetpack-mu-wpcom' ),
			'bannerBackground' => esc_url( $background_image ),
		)
	);
	wp_enqueue_style(
		'wpcom-plugins-banner',
		plugins_url( 'css/banner.css', __FILE__ ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION
	);
}
add_action( 'load-plugin-install.php', 'wpcom_plugins_show_banner' );
