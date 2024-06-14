<?php
/**
 * WordPress.com Site Menu
 *
 * Add's a WordPress.com menu item to the admin menu linking back to the sites WordPress.com home page.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

/**
 * Check if the current user has a WordPress.com account connected.
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
 * Add a WordPress.com menu item to the wp-admin sidebar menu.
 *
 * Of note, we need the $parent_slug so that we can link the submenu items to the parent menu item. Using a URL
 * for the slug doesn't appear to work when registering submenus. Because we use the parent slug in the top
 * level menu item, we need to find a solution to link that menu out to WordPress.com.
 *
 * We accomplish this by:
 *
 * - Adding a submenu item that links to /sites.
 * - Hiding that submenu item with CSS.
 *
 * This works because the top level menu item links to wherever the submenu item links to.
 */
function wpcom_add_wpcom_menu_item() {
	if ( ! function_exists( 'wpcom_is_nav_redesign_enabled' ) || ! wpcom_is_nav_redesign_enabled() ) {
		return;
	}

	/**
	 * Don't show `Hosting` to administrators without a WordPress.com account being attached,
	 * as they don't have access to any of the pages.
	 */
	if ( ! current_user_has_wpcom_account() ) {
		return;
	}

	$parent_slug = 'wpcom-hosting-menu';
	$domain      = wp_parse_url( home_url(), PHP_URL_HOST );

	add_menu_page(
		esc_attr__( 'Hosting', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Hosting', 'jetpack-mu-wpcom' ),
		'manage_options',
		$parent_slug,
		null,
		'dashicons-cloud',
		3
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'My Home', 'jetpack-mu-wpcom' ),
		esc_attr__( 'My Home', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/home/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Overview', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Overview', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/overview/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Plans', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Plans', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/plans/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Add-ons', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Add-ons', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/add-ons/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Domains', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Domains', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/domains/manage/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Emails', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Emails', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/email/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Purchases', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Purchases', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/purchases/subscriptions/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Marketing', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Marketing', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/marketing/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Settings', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Settings', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/settings/general/$domain" ),
		null
	);

	// By default, WordPress adds a submenu item for the parent menu item, which we don't want.
	remove_submenu_page(
		$parent_slug,
		$parent_slug
	);
}
add_action( 'admin_menu', 'wpcom_add_wpcom_menu_item' );

/**
 * Add All Sites menu to the right side of the WP logo on the masterbar.
 *
 * @param WP_Admin_Bar $wp_admin_bar - The WP_Admin_Bar instance.
 */
function add_all_sites_menu_to_masterbar( $wp_admin_bar ) {
	if ( ! function_exists( 'wpcom_is_nav_redesign_enabled' ) || ! wpcom_is_nav_redesign_enabled() ) {
		return;
	}

	/**
	 * Don't show `All Sites` to administrators without a WordPress.com account being attached,
	 * as they don't have access to any of the pages.
	 */
	if ( ! current_user_has_wpcom_account() ) {
		return;
	}

	wp_enqueue_style(
		'wpcom-site-menu',
		plugins_url( 'build/wpcom-site-menu/wpcom-site-menu.css', Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION
	);

	$wp_admin_bar->add_node(
		array(
			'id'    => 'all-sites',
			'title' => __( 'All Sites', 'jetpack-mu-wpcom' ),
			'href'  => 'https://wordpress.com/sites',
			'meta'  => array(
				'class' => 'wp-admin-bar-all-sites',
			),
		)
	);
}
add_action( 'admin_bar_menu', 'add_all_sites_menu_to_masterbar', 15 );

/**
 * Replace the WP logo /about.php link with /wp-admin/.
 *
 * This is needed because on Simple Sites we don't expose the about and contribute pages.
 * Although really needed only on Simple, it would make sense to have the same behavior on AT.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar core object. On Simple sites it's a different class.
 *
 * @return void
 */
function replace_wp_logo_menu_on_masterbar( $wp_admin_bar ) {
	if ( ! function_exists( 'wpcom_is_nav_redesign_enabled' ) || ! wpcom_is_nav_redesign_enabled() ) {
		return;
	}

	$wp_admin_bar->remove_menu( 'wp-logo' );

	$wp_logo_menu_args = array(
		'id'    => 'wp-logo',
		'title' => '<span class="ab-icon" aria-hidden="true"></span><span class="screen-reader-text">' .
					/* translators: Hidden accessibility text. */
					__( 'About WordPress', 'jetpack-mu-wpcom' ) .
					'</span>',
		'href'  => get_dashboard_url(),
		'meta'  => array(
			'menu_title' => __( 'About WordPress', 'jetpack-mu-wpcom' ),
		),
	);

	$wp_admin_bar->add_node( $wp_logo_menu_args );
}

add_action( 'admin_bar_menu', 'replace_wp_logo_menu_on_masterbar', 11 );

/**
 * Enqueue scripts and styles needed by the WP.com menu.
 */
function wpcom_site_menu_enqueue_scripts() {
	if ( ! function_exists( 'wpcom_is_nav_redesign_enabled' ) || ! wpcom_is_nav_redesign_enabled() ) {
		return;
	}

	wp_enqueue_script(
		'wpcom-site-menu',
		plugins_url( 'wpcom-site-menu.js', __FILE__ ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION,
		array(
			'strategy'  => 'defer',
			'in_footer' => true,
		)
	);

	$notice = wpcom_get_sidebar_notice();
	if ( $notice ) {
		$link = $notice['link'];
		if ( str_starts_with( $link, '/' ) ) {
			$link = 'https://wordpress.com' . $link;
		}

		$user_id    = null;
		$user_login = null;

		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			global $current_user;
			$user_id    = $current_user->ID;
			$user_login = $current_user->user_login;
		} else {
			$connection_manager = new Connection_Manager();
			$wpcom_user_data    = $connection_manager->get_connected_user_data();
			if ( $wpcom_user_data ) {
				$user_id    = $wpcom_user_data['ID'];
				$user_login = $wpcom_user_data['login'];
			}
		}

		$data = array(
			'url'          => esc_url( $link ),
			'text'         => wp_kses( $notice['content'], array() ),
			'action'       => wp_kses( $notice['cta'], array() ),
			'dismissible'  => $notice['dismissible'],
			'dismissLabel' => esc_html__( 'Dismiss', 'jetpack-mu-wpcom' ),
			'id'           => $notice['id'],
			'featureClass' => $notice['feature_class'],
			'dismissNonce' => wp_create_nonce( 'wpcom_dismiss_sidebar_notice' ),
			'tracks'       => $notice['tracks'],
			'user'         => array(
				'ID'       => $user_id,
				'username' => $user_login,
			),
		);

		wp_add_inline_script(
			'wpcom-site-menu',
			'window.wpcomSidebarNotice = ' . wp_json_encode( $data ) . ';'
		);
	}
}
add_action( 'admin_enqueue_scripts', 'wpcom_site_menu_enqueue_scripts' );

/**
 * Returns the first available sidebar notice.
 *
 * @return array | null
 */
function wpcom_get_sidebar_notice() {
	$message_path = 'calypso:sites:sidebar_notice';

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		require_lib( 'jetpack-jitm/jitm-engine' );
		$jitm_engine = new \JITM\Engine();

		$current_user = wp_get_current_user();
		$user_id      = $current_user->ID;
		$user_roles   = implode( ',', $current_user->roles );
		$query_string = array( 'message_path' => $message_path );

		$message = $jitm_engine->get_top_messages( $message_path, $user_id, $user_roles, $query_string );
	} else {
		$jitm    = \Automattic\Jetpack\JITMS\JITM::get_instance();
		$message = $jitm->get_messages( $message_path, wp_json_encode( array( 'message_path' => $message_path ) ), false );
	}

	if ( ! isset( $message[0] ) ) {
		return null;
	}

	// Serialize message as object (on Simple sites we have an array, on Atomic sites we have an object).
	$message = json_decode( wp_json_encode( $message[0] ) );

	return array(
		'content'       => $message->content->message,
		'cta'           => $message->CTA->message, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		'link'          => $message->CTA->link, // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		'dismissible'   => $message->is_dismissible,
		'feature_class' => $message->feature_class,
		'id'            => $message->id,
		'tracks'        => $message->tracks ?? null,
	);
}

/**
 * Handle AJAX requests to dismiss a sidebar notice;
 */
function wpcom_dismiss_sidebar_notice() {
	check_ajax_referer( 'wpcom_dismiss_sidebar_notice' );
	if ( isset( $_REQUEST['id'] ) && isset( $_REQUEST['feature_class'] ) ) {
		$id            = sanitize_text_field( wp_unslash( $_REQUEST['id'] ) );
		$feature_class = sanitize_text_field( wp_unslash( $_REQUEST['feature_class'] ) );
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			require_lib( 'jetpack-jitm/jitm-engine' );
			\JITM\Engine::dismiss( $id, $feature_class );
		} else {
			$jitm = \Automattic\Jetpack\JITMS\JITM::get_instance();
			$jitm->dismiss( $id, $feature_class );
		}
	}
	wp_die();
}
add_action( 'wp_ajax_wpcom_dismiss_sidebar_notice', 'wpcom_dismiss_sidebar_notice' );

/**
 * Add the WordPress.com submenu items related to Jetpack under the Jetpack menu on the wp-admin sidebar.
 */
function wpcom_add_jetpack_menu_item() {
	/*
	 * Do not display any menu on WoA and WordPress.com Simple sites (unless Classic wp-admin is enabled).
	 * They already get a menu item under Users via nav-unification.
	 */
	if ( ( new Host() )->is_wpcom_platform() && get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
		return;
	}

	/**
	 * Don't show to administrators without a WordPress.com account being attached,
	 * as they don't have access to any of the pages.
	 */
	if ( ! current_user_has_wpcom_account() ) {
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
		null
	);
}
add_action( 'jetpack_admin_menu', 'wpcom_add_jetpack_menu_item' );

/**
 * Ensures customizer menu and adminbar items are not visible on a block theme.
 */
function hide_customizer_menu_on_block_theme() {
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
add_action( 'init', 'hide_customizer_menu_on_block_theme' );

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
 * Handles the Plugins menu for WP.com sites.
 */
function wpcom_add_plugins_menu() {
	global $menu;
	$is_simple_site          = defined( 'IS_WPCOM' ) && IS_WPCOM;
	$is_atomic_site          = ! $is_simple_site;
	$is_nav_redesign_enabled = function_exists( 'wpcom_is_nav_redesign_enabled' ) && wpcom_is_nav_redesign_enabled();

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
				null,
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

			if ( ! $is_nav_redesign_enabled ) {
				wpcom_hide_submenu_page( 'plugins.php', 'wpcom-install-plugin' );
			}
		}
	}

	if ( ! $is_nav_redesign_enabled ) {
		return;
	}

	$domain = wp_parse_url( home_url(), PHP_URL_HOST );
	add_submenu_page(
		'plugins.php',
		/* translators: Name of the Plugins submenu that links to the Plugins Marketplace */
		__( 'Marketplace', 'jetpack-mu-wpcom' ),
		/* translators: Name of the Plugins submenu that links to the Plugins Marketplace */
		__( 'Marketplace', 'jetpack-mu-wpcom' ),
		'manage_options', // Roughly means "is a site admin"
		'https://wordpress.com/plugins/' . $domain,
		null
	);

	if ( $is_atomic_site ) {
		if (
			/**
			 * Don't show `Scheduled Updates` to administrators without a WordPress.com account being attached,
			 * as they don't have access to any of the pages.
			 */
			current_user_has_wpcom_account() &&
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
				null
			);
		}
	}
}
add_action( 'admin_menu', 'wpcom_add_plugins_menu' );
