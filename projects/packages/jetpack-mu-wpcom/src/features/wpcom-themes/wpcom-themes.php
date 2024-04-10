<?php
/**
 * WordPress.com Themes
 *
 * Adds a WordPress.com themes integration to the theme-related pages.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

/**
 * Displays a banner before the theme browser that links to the WP.com Theme Showcase.
 */
function wpcom_themes_show_banner() {
	if ( ! function_exists( 'wpcom_is_nav_redesign_enabled' ) || ! wpcom_is_nav_redesign_enabled() ) {
		return;
	}

	$site_slug        = wp_parse_url( home_url(), PHP_URL_HOST );
	$wpcom_logo       = plugins_url( 'images/wpcom-logo.svg', __FILE__ );
	$background_image = plugins_url( 'images/banner-background.png', __FILE__ );

	wp_enqueue_script(
		'wpcom-themes-banner',
		plugins_url( 'js/banner.js', __FILE__ ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION,
		array(
			'strategy'  => 'defer',
			'in_footer' => true,
		)
	);
	wp_localize_script(
		'wpcom-themes-banner',
		'wpcomThemesBanner',
		array(
			'logo'             => esc_url( $wpcom_logo ),
			'title'            => esc_html__( 'Find the perfect theme for your site', 'jetpack-mu-wpcom' ),
			'description'      => esc_html__( 'Dive deep into the world of WordPress.com themes. Discover the responsive and stunning designs waiting to bring your site to life.', 'jetpack-mu-wpcom' ),
			'actionUrl'        => esc_url( "https://wordpress.com/themes/$site_slug?ref=wpcom-themes-banner" ),
			'actionText'       => esc_html__( 'Explore themes', 'jetpack-mu-wpcom' ),
			'bannerBackground' => esc_url( $background_image ),
		)
	);
	wp_enqueue_style(
		'wpcom-themes-banner',
		plugins_url( 'css/banner.css', __FILE__ ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION
	);
}
add_action( 'load-theme-install.php', 'wpcom_themes_show_banner' );
