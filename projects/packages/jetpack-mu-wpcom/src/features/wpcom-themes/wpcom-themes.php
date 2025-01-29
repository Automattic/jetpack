<?php
/**
 * WordPress.com Themes
 *
 * Adds a WordPress.com themes integration to the theme-related pages.
 *
 * @package automattic/jetpack-mu-wpcom
 */

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

/**
 * Renders a theme install page.
 */
function render_theme_install() {
	require_once __DIR__ . '/theme-install.php';
}

/**
 * Adds a "Add New Theme" menu item to the "Appearance" menu.
 */
function wpcom_add_theme_install_menu() {
	add_submenu_page(
		'themes.php',
		__( 'Add New Theme', 'jetpack-mu-wpcom' ),
		__( 'Add New Theme', 'jetpack-mu-wpcom' ),
		'manage_options', // Roughly means "is a site admin"
		'wpcom-install-theme',
		'render_theme_install'
	);
}
add_action( 'admin_menu', 'wpcom_add_theme_install_menu' );

/**
 * Enqueue the theme install script on the custom page.
 */
function wpcom_themes_enqueue_theme_install_script() {
	wp_enqueue_script(
		'wpcom-theme-install',
		plugin_dir_url( __FILE__ ) . '/js/wpcom-theme-install.js',
		array( 'theme' ),
		filemtime( __DIR__ . '/js/wpcom-theme-install.js' ),
		true
	);
}

add_action(
	'load-appearance_page_wpcom-install-theme',
	function () {
		add_action( 'admin_enqueue_scripts', 'wpcom_themes_enqueue_theme_install_script' );
	}
);
