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
	if ( get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
		return;
	}

	$site_slug        = wp_parse_url( home_url(), PHP_URL_HOST );
	$wpcom_logo       = plugins_url( 'images/wpcom-logo.svg', __FILE__ );
	$background_image = plugins_url( 'images/banner-background.webp', __FILE__ );

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

/**
 * Registers an "Appearance > Theme Showcase" menu.
 */
function wpcom_themes_add_theme_showcase_menu() {
	if ( get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
		return;
	}

	$site_slug = wp_parse_url( home_url(), PHP_URL_HOST );
	add_submenu_page(
		'themes.php',
		esc_attr__( 'Theme Showcase', 'jetpack-mu-wpcom' ),
		__( 'Theme Showcase', 'jetpack-mu-wpcom' ),
		current_user_can( 'switch_themes' ) ? 'switch_themes' : 'edit_theme_options',
		"https://wordpress.com/themes/$site_slug?ref=wpcom-themes-menu"
	);
}
add_action( 'admin_menu', 'wpcom_themes_add_theme_showcase_menu' );

/**
 * Automatically opens the "Upload Theme" dialog on the theme installation page based on a 'wpcom-upload' query parameter.
 */
function wpcom_auto_open_upload_theme() {
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended
	if ( isset( $_GET['wpcom-upload'] ) && $_GET['wpcom-upload'] === '1' ) {
		if ( ! current_user_can( 'install_themes' ) ) {
			return;
		}
		add_filter(
			'admin_body_class',
			function ( $classes ) {
				return $classes . ' show-upload-view ';
			}
		);
	}
}
add_action( 'load-theme-install.php', 'wpcom_auto_open_upload_theme' );
