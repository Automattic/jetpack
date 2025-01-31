<?php
/**
 * WordPress.com Themes
 *
 * Adds a WordPress.com themes integration to the theme-related pages.
 *
 * @package automattic/jetpack-mu-wpcom
 */

require_once __DIR__ . '/wpcom-themes-api.php';

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

/**
 * Remove the core themes query-themes ajax action and replace it with our own,
 * which does not check `current_user_can( 'install_themes' )`.
 */
function wpcom_themes_ajax_query_themes() {
	// Remove the core function
	remove_action( 'wp_ajax_query-themes', 'wp_ajax_query_themes' );

	// Copy over the function content, minus the capability check.
	global $themes_allowedtags, $theme_field_defaults;

	$args = wp_parse_args(
		wp_unslash( $_REQUEST['request'] ),
		array(
			'per_page' => 20,
			'fields'   => array_merge(
				(array) $theme_field_defaults,
				array(
					'reviews_url' => true, // Explicitly request the reviews URL to be linked from the Add Themes screen.
				)
			),
		)
	);

	if ( isset( $args['browse'] ) && 'favorites' === $args['browse'] && ! isset( $args['user'] ) ) {
		$user = get_user_option( 'wporg_favorites' );
		if ( $user ) {
			$args['user'] = $user;
		}
	}

	$old_filter = isset( $args['browse'] ) ? $args['browse'] : 'search';

	/** This filter is documented in wp-admin/includes/class-wp-theme-install-list-table.php */
	$args = apply_filters( 'install_themes_table_api_args_' . $old_filter, $args );

	$api = themes_api( 'query_themes', $args );

	if ( is_wp_error( $api ) ) {
		wp_send_json_error();
	}

	$update_php = network_admin_url( 'update.php?action=install-theme' );

	$installed_themes = search_theme_directories();

	if ( false === $installed_themes ) {
		$installed_themes = array();
	}

	foreach ( $installed_themes as $theme_slug => $theme_data ) {
		// Ignore child themes.
		if ( str_contains( $theme_slug, '/' ) ) {
			unset( $installed_themes[ $theme_slug ] );
		}
	}

	foreach ( $api->themes as &$theme ) {
		$theme->install_url = add_query_arg(
			array(
				'theme'    => $theme->slug,
				'_wpnonce' => wp_create_nonce( 'install-theme_' . $theme->slug ),
			),
			$update_php
		);

		if ( current_user_can( 'switch_themes' ) ) {
			if ( is_multisite() ) {
				$theme->activate_url = add_query_arg(
					array(
						'action'   => 'enable',
						'_wpnonce' => wp_create_nonce( 'enable-theme_' . $theme->slug ),
						'theme'    => $theme->slug,
					),
					network_admin_url( 'themes.php' )
				);
			} else {
				$theme->activate_url = add_query_arg(
					array(
						'action'     => 'activate',
						'_wpnonce'   => wp_create_nonce( 'switch-theme_' . $theme->slug ),
						'stylesheet' => $theme->slug,
					),
					admin_url( 'themes.php' )
				);
			}
		}

		$is_theme_installed = array_key_exists( $theme->slug, $installed_themes );

		// We only care about installed themes.
		$theme->block_theme = $is_theme_installed && wp_get_theme( $theme->slug )->is_block_theme();

		if ( ! is_multisite() && current_user_can( 'edit_theme_options' ) && current_user_can( 'customize' ) ) {
			$customize_url = $theme->block_theme ? admin_url( 'site-editor.php' ) : wp_customize_url( $theme->slug );

			$theme->customize_url = add_query_arg(
				array(
					'return' => urlencode( network_admin_url( 'theme-install.php', 'relative' ) ),
				),
				$customize_url
			);
		}

		$theme->name        = wp_kses( $theme->name, $themes_allowedtags );
		$theme->author      = wp_kses( $theme->author['display_name'], $themes_allowedtags );
		$theme->version     = wp_kses( $theme->version, $themes_allowedtags );
		$theme->description = wp_kses( $theme->description, $themes_allowedtags );

		$theme->stars = wp_star_rating(
			array(
				'rating' => $theme->rating,
				'type'   => 'percent',
				'number' => $theme->num_ratings,
				'echo'   => false,
			)
		);

		$theme->num_ratings    = number_format_i18n( $theme->num_ratings );
		$theme->preview_url    = set_url_scheme( $theme->preview_url );
		$theme->compatible_wp  = is_wp_version_compatible( $theme->requires );
		$theme->compatible_php = is_php_version_compatible( $theme->requires_php );
	}

	wp_send_json_success( $api );
}
add_action( 'wp_ajax_query-themes', 'wpcom_themes_ajax_query_themes', 1 );

/**
 * Remove the core themes save-wporg-username ajax action and replace it with our own,
 * which does not check `current_user_can( 'install_themes' )`.
 */
function wpcom_themes_ajax_save_wporg_username() {
	// Remove the core function
	remove_action( 'wp_ajax_query-themes', 'wp_ajax_save_wporg_username' );

	// Copy over the `wp_ajax_save_wporg_username` function.

	// @patched Remove the capability check.

	check_ajax_referer( 'save_wporg_username_' . get_current_user_id() );

	$username = isset( $_REQUEST['username'] ) ? wp_unslash( $_REQUEST['username'] ) : false;

	if ( ! $username ) {
		wp_send_json_error();
	}

	wp_send_json_success( update_user_meta( get_current_user_id(), 'wporg_favorites', $username ) );
}
add_action( 'wp_ajax_save-wporg-username', 'wpcom_themes_ajax_save_wporg_username', 1 );
