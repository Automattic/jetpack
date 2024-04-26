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
 * Removes actions from the active theme details added by Core to replicate our custom WP.com submenus.
 *
 * Core expect the menus to link to WP Admin, but our submenus point to wordpress.com so the actions won't work.
 *
 * @see https://github.com/WordPress/wordpress-develop/blob/80096ddf29d3ffa4d5654f5f788df7f598b48756/src/wp-admin/themes.php#L356-L412
 */
function wpcom_themes_remove_wpcom_actions() {
	wp_enqueue_script(
		'wpcom-theme-actions',
		plugins_url( 'js/theme-actions.js', __FILE__ ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION,
		array(
			'strategy'  => 'defer',
			'in_footer' => true,
		)
	);
}
add_action( 'load-themes.php', 'wpcom_themes_remove_wpcom_actions' );
