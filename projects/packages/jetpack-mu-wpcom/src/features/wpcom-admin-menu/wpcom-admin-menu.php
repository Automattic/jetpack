<?php
/**
 * WordPress.com admin menu
 *
 * Adds WordPress.com-specific stuff to WordPress admin menu.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/**
 * Checks if the current user has a WordPress.com account connected.
 *
 * @return bool
 */
function current_user_has_wpcom_account() {
	$user_id = get_current_user_id();

	if ( function_exists( '\A8C\Billingdaddy\Users\get_wpcom_user' ) ) {
		// On Simple sites, use get_wpcom_user function to check if the user has a WordPress.com account.
		$user        = \A8C\Billingdaddy\Users\get_wpcom_user( $user_id );
		$has_account = isset( $user->ID );
	} else {
		// On Atomic sites, use the Connection Manager to check if the user has a WordPress.com account.
		$connection_manager = new Connection_Manager();
		$wpcom_user_data    = $connection_manager->get_connected_user_data( $user_id );
		$has_account        = isset( $wpcom_user_data['ID'] );
	}

	return $has_account;
}

/**
 * Adds a Hosting menu.
 */
function wpcom_add_hosting_menu() {
	if ( get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
		return;
	}

	$parent_slug = 'wpcom-hosting-menu';
	$domain      = wp_parse_url( home_url(), PHP_URL_HOST );

	add_menu_page(
		esc_attr__( 'Hosting', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Hosting', 'jetpack-mu-wpcom' ),
		'manage_options',
		$parent_slug,
		null, // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
		'dashicons-cloud',
		3
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'My Home', 'jetpack-mu-wpcom' ),
		esc_attr__( 'My Home', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/home/$domain" ),
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Overview', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Overview', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/overview/$domain" ),
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Plans', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Plans', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/plans/$domain" ),
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Add-ons', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Add-ons', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/add-ons/$domain" ),
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Domains', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Domains', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/domains/manage/$domain" ),
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Emails', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Emails', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/email/$domain" ),
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Purchases', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Purchases', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/purchases/subscriptions/$domain" ),
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Marketing', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Marketing', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/marketing/$domain" ),
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Settings', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Settings', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/settings/general/$domain" ),
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
	);

	// By default, WordPress adds a submenu item for the parent menu item, which we don't want.
	remove_submenu_page(
		$parent_slug,
		$parent_slug
	);
}
add_action( 'admin_menu', 'wpcom_add_hosting_menu' );

/**
 * Adds WordPress.com submenu items related to Jetpack under the Jetpack admin menu.
 */
function wpcom_add_jetpack_submenu() {
	/*
	 * Do not display any menu on WoA and WordPress.com Simple sites (unless Classic wp-admin is enabled).
	 * They already get a menu item under Users via nav-unification.
	 */
	if ( ( new Host() )->is_wpcom_platform() && get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
		return;
	}

	/*
	 * Do not display if we're in Offline mode, or if the user is not connected.
	 */
	if ( ( new Status() )->is_offline_mode() || ! ( new Connection_Manager( 'jetpack' ) )->is_user_connected() ) {
		return;
	}

	add_submenu_page(
		'jetpack',
		__( 'Monetize', 'jetpack-mu-wpcom' ),
		__( 'Monetize', 'jetpack-mu-wpcom' ) . ' <span class="dashicons dashicons-external"></span>',
		'manage_options',
		esc_url( Redirect::get_url( 'calypso-monetize' ) ),
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
	);
}
add_action( 'jetpack_admin_menu', 'wpcom_add_jetpack_submenu' );

/**
 * Ensures customizer menu and admin bar items are not visible on a block theme.
 */
function wpcom_hide_customizer_submenu_on_block_theme() {
	if ( wp_is_block_theme() && ! is_customize_preview() ) {
		remove_action( 'customize_register', 'add_logotool_button', 20 );
		remove_action( 'customize_register', 'footercredits_register', 99 );
		remove_action( 'customize_register', 'wpcom_disable_customizer_site_icon', 20 );

		if ( class_exists( '\Jetpack_Fonts' ) ) {
			$jetpack_fonts_instance = \Jetpack_Fonts::get_instance();
			remove_action( 'customize_register', array( $jetpack_fonts_instance, 'register_controls' ) );
			remove_action( 'customize_register', array( $jetpack_fonts_instance, 'maybe_prepopulate_option' ), 0 );
		}

		remove_action( 'customize_register', array( 'Jetpack_Fonts_Typekit', 'maybe_override_for_advanced_mode' ), 20 );

		remove_action( 'customize_register', 'Automattic\Jetpack\Dashboard_Customizations\register_css_nudge_control' );

		remove_action( 'customize_register', array( 'Jetpack_Custom_CSS_Enhancements', 'customize_register' ) );
	}
}
add_action( 'init', 'wpcom_hide_customizer_submenu_on_block_theme' );

/**
 * Links were removed in 3.5 core, but we've kept them active on dotcom.
 *
 * This function will check to see if Links should be enabled based on the number of links in the database
 * and then set an option to minimize repeat queries later. The Links menu is visible when the Link Manager is enabled.
 *
 * @return void
 */
function wpcom_maybe_enable_link_manager() {
	if ( get_option( 'link_manager_check' ) ) {
		return;
	}

	// The max ID number of the auto-generated links.
	// See /wp-content/mu-plugins/wpcom-wp-install-defaults.php in WP.com.
	$max_default_id = 10;

	// We are only checking the latest entry link_id so are limiting the query to 1.
	$link_manager_links = get_bookmarks(
		array(
			'orderby'        => 'link_id',
			'order'          => 'DESC',
			'limit'          => 1,
			'hide_invisible' => 0,
		)
	);

	$has_links = is_countable( $link_manager_links ) && count( $link_manager_links ) > 0 && $link_manager_links[0]->link_id > $max_default_id;

	update_option( 'link_manager_enabled', intval( $has_links ) );
	update_option( 'link_manager_check', time() );
}
add_action( 'init', 'wpcom_maybe_enable_link_manager' );

/**
 * Hides a submenu item.
 *
 * Useful in cases where we cannot remove a submenu item because there is external logic
 * that depends on the route registered by that submenu.
 *
 * @param string $menu_slug The slug of the parent menu.
 * @param string $submenu_slug The slug of the submenu that should be hidden.
 */
function wpcom_hide_submenu_page( string $menu_slug, string $submenu_slug ) {
	global $submenu;

	if ( ! isset( $submenu[ $menu_slug ] ) ) {
		return;
	}

	foreach ( $submenu[ $menu_slug ] as $i => $item ) {
		if ( $submenu_slug !== $item[2] ) {
			continue;
		}

		$css_hide_class = 'hide-if-js';
		$css_classes    = empty( $item[4] ) ? $css_hide_class : $item[4] . ' ' . $css_hide_class;

		// phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$submenu[ $menu_slug ][ $i ][4] = $css_classes;
		return;
	}
}

/**
 * Handles the Plugins menu.
 */
function wpcom_add_plugins_menu() {
	global $menu;
	$is_simple_site          = defined( 'IS_WPCOM' ) && IS_WPCOM;
	$is_atomic_site          = ! $is_simple_site;
	$uses_wp_admin_interface = get_option( 'wpcom_admin_interface' ) === 'wp-admin';

	if ( $is_simple_site ) {
		$has_plugins_menu = false;
		foreach ( $menu as &$menu_item ) {
			if ( 'plugins.php' === $menu_item[2] ) {
				$has_plugins_menu = true;
				break;
			}
		}

		if ( ! $has_plugins_menu ) {
			// TODO: Remove `remove_menu_page('plugins.php');` from `/wp-content/admin-plugins/wpcom-misc.php`.
			add_menu_page(
				__( 'Plugins', 'jetpack-mu-wpcom' ),
				__( 'Plugins', 'jetpack-mu-wpcom' ),
				'manage_options', // Roughly means "is a site admin"
				'plugins.php',
				null, // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
				'dashicons-admin-plugins',
				65
			);
		}

		if ( function_exists( 'wpcom_plugins_display_marketplace' ) ) {
			add_submenu_page(
				'plugins.php',
				__( 'Add New Plugin', 'jetpack-mu-wpcom' ),
				__( 'Add New Plugin', 'jetpack-mu-wpcom' ),
				'manage_options', // Roughly means "is a site admin"
				'wpcom-install-plugin',
				'wpcom_plugins_display_marketplace'
			);

			if ( ! $uses_wp_admin_interface ) {
				wpcom_hide_submenu_page( 'plugins.php', 'wpcom-install-plugin' );
			}
		}
	}

	$domain = wp_parse_url( home_url(), PHP_URL_HOST );
	if ( $uses_wp_admin_interface ) {
		add_submenu_page(
			'plugins.php',
			/* translators: Name of the Plugins submenu that links to the Plugins Marketplace */
				__( 'Marketplace', 'jetpack-mu-wpcom' ),
			/* translators: Name of the Plugins submenu that links to the Plugins Marketplace */
				__( 'Marketplace', 'jetpack-mu-wpcom' ),
			'manage_options', // Roughly means "is a site admin"
			'https://wordpress.com/plugins/' . $domain,
			null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
		);
	}

	if ( $is_atomic_site ) {
		if (
			! get_option( 'wpcom_is_staging_site' ) &&
			function_exists( 'wpcom_site_has_feature' ) &&
			wpcom_site_has_feature( \WPCOM_Features::SCHEDULED_UPDATES )
		) {
			add_submenu_page(
				'plugins.php',
				esc_attr__( 'Scheduled Updates', 'jetpack-mu-wpcom' ),
				__( 'Scheduled Updates', 'jetpack-mu-wpcom' ),
				'update_plugins',
				esc_url( "https://wordpress.com/plugins/scheduled-updates/$domain" ),
				null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
			);
		}
	}
}
add_action( 'admin_menu', 'wpcom_add_plugins_menu' );
