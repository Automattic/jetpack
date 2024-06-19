<?php
/**
 * Adds a tiny WordPress.com Plugins integration to the plugin list.
 *
 * @package wpcomsh
 */

/**
 * Displays a banner before the plugin browser that links to the WP.com Plugins Marketplace.
 */
function wpcomsh_plugins_show_banner() {

	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( isset( $_GET['tab'] ) && 'favorites' === $_GET['tab'] ) {
		// no banner on the favorites tab, it's a bit overbearing given they presumably want
		// something specific.
		return;
	}

	$site_slug        = wp_parse_url( home_url(), PHP_URL_HOST );
	$wpcom_logo       = plugins_url( 'images/wpcom-logo.svg', __FILE__ );
	$background_image = plugins_url( 'images/banner-background.webp', __FILE__ );

	wp_enqueue_script(
		'wpcom-plugins-banner',
		plugins_url( 'js/banner.js', __FILE__ ),
		array(),
		WPCOMSH_VERSION,
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
			'title'            => esc_html__( "Flex your site's features with plugins", 'wpcomsh' ),
			'description'      => esc_html__( "Access a variety of free and paid plugins that can enhance your site's functionality and features.", 'wpcomsh' ),
			'actionUrl'        => esc_url( "https://wordpress.com/plugins/$site_slug?ref=woa-plugin-banner" ),
			'actionText'       => esc_html__( 'Explore plugins', 'wpcomsh' ),
			'bannerBackground' => esc_url( $background_image ),
		)
	);
	wp_enqueue_style(
		'wpcom-plugins-banner',
		plugins_url( 'css/banner.css', __FILE__ ),
		array(),
		WPCOMSH_VERSION,
	);
}
add_action( 'load-plugin-install.php', 'wpcomsh_plugins_show_banner' );
