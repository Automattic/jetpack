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
		// @phan-suppress-next-line PhanUndeclaredFunction
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
		esc_attr__( 'Plans', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Plans', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/plans/$domain" ),
		null
	);

	if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
		add_submenu_page(
			$parent_slug,
			esc_attr__( 'Add-ons', 'jetpack-mu-wpcom' ),
			esc_attr__( 'Add-ons', 'jetpack-mu-wpcom' ),
			'manage_options',
			esc_url( "https://wordpress.com/add-ons/$domain" ),
			null
		);
	}

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
		esc_attr__( 'Configuration', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Configuration', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/hosting-config/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Monitoring', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Monitoring', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/site-monitoring/$domain" ),
		null
	);

	add_submenu_page(
		$parent_slug,
		esc_attr__( 'Connections', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Connections', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/marketing/connections/$domain" ),
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
 * Enqueue scripts and styles needed by the WP.com menu.
 */
function wpcom_site_menu_enqueue_scripts() {
	if ( ! function_exists( 'wpcom_is_nav_redesign_enabled' ) || ! wpcom_is_nav_redesign_enabled() ) {
		return;
	}

	wp_enqueue_style(
		'wpcom-site-menu',
		plugins_url( 'build/wpcom-site-menu/wpcom-site-menu.css', Jetpack_Mu_Wpcom::BASE_FILE ),
		array(),
		Jetpack_Mu_Wpcom::PACKAGE_VERSION
	);

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

		wp_localize_script(
			'wpcom-site-menu',
			'wpcomSidebarNotice',
			array(
				'url'          => esc_url( $link ),
				'text'         => wp_kses( $notice['content'], array() ),
				'action'       => wp_kses( $notice['cta'], array() ),
				'dismissible'  => $notice['dismissible'],
				'dismissLabel' => esc_html__( 'Dismiss', 'jetpack-mu-wpcom' ),
				'id'           => $notice['id'],
				'featureClass' => $notice['feature_class'],
				'dismissNonce' => wp_create_nonce( 'wpcom_dismiss_sidebar_notice' ),
			)
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
 * Helper function to determine if the admin notice should be shown.
 *
 * @return bool
 */
function wpcom_site_menu_should_show_notice() {
	if ( ! function_exists( 'wpcom_is_nav_redesign_enabled' ) || ! wpcom_is_nav_redesign_enabled() ) {
		return false;
	}

	/**
	 * Don't show the notice to administrators without a WordPress.com account being attached,
	 * as they don't have access to the `Hosting` menu.
	 */
	if ( ! current_user_has_wpcom_account() ) {
		return false;
	}

	/**
	 * Only administrators can access to the links in the `Hosting` menu.
	 */
	if ( ! current_user_can( 'manage_options' ) ) {
		return false;
	}

	if ( get_option( 'wpcom_site_menu_notice_dismissed' ) ) {
		return false;
	}

	$screen = get_current_screen();
	return 'dashboard' === $screen->id;
}

/**
 * Add a notice to the admin menu to inform users about the new WordPress.com menu item.
 */
function wpcom_add_hosting_menu_intro_notice() {
	if ( ! wpcom_site_menu_should_show_notice() || ! function_exists( 'wpcom_is_nav_redesign_enabled' ) || ! wpcom_is_nav_redesign_enabled() ) {
		return;
	}
	?>
	<style>

		body.no-js .wpcom-site-menu-intro-notice {
			display: none !important;
		}
		.wpcom-site-menu-intro-notice {
			display: none !important;
			padding: 8px 12px;
		}

		.wrap > .wpcom-site-menu-intro-notice {
			display: flex !important;
		}
		.wpcom-site-menu-intro-notice.notice.notice-info {
			border-left-color: #3858e9;
			display: flex;
			align-items: center;
			gap: 12px;
		}

		.wpcom-site-menu-intro-notice .dashicons-wordpress-alt {
			color: #3858e9;
			font-size: 32px;
			width: 32px;
			height: 32px;
		}

		.wpcom-site-menu-intro-notice span.title {
			font-size: 14px;
			font-weight: 600;
		}

		.wpcom-site-menu-intro-notice span {
			color: rgb(29, 35, 39);
			font-size: 14px;
		}

		.wpcom-site-menu-intro-notice a.close-button {
			height: 16px;
			margin-left: auto;
		}
	</style>
	<div class="wpcom-site-menu-intro-notice notice notice-info" role="alert">
		<div class="banner-icon">
			<span class="dashicons dashicons-wordpress-alt"></span>
		</div>
		<div>
			<span class="title"><?php esc_html_e( 'WordPress.com', 'jetpack-mu-wpcom' ); ?></span><br />
			<span>
				<?php esc_html_e( 'To access settings for plans, domains, emails, etc., click "Hosting" in the sidebar.', 'jetpack-mu-wpcom' ); ?>
			</span>
		</div>
		<a href="#" class="close-button" aria-label=<?php echo esc_attr__( 'Dismiss', 'jetpack-mu-wpcom' ); ?>>
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="12.7019" y="2.35547" width="1.53333" height="15.287" rx="0.766667" transform="rotate(45 12.7019 2.35547)" fill="#646970"></rect><rect x="13.6445" y="13.165" width="1.53333" height="15.287" rx="0.766667" transform="rotate(135 13.6445 13.165)" fill="#646970"></rect></svg>
		</a>
	</div>
	<?php
}
add_action( 'admin_notices', 'wpcom_add_hosting_menu_intro_notice' );

/**
 * Handles the AJAX request to dismiss the admin notice.
 */
function wpcom_add_hosting_menu_intro_notice_dismiss() {
	if ( ! wpcom_site_menu_should_show_notice() ) {
		return;
	}
	?>
	<script>
		document.addEventListener( 'DOMContentLoaded', function() {
			document.querySelector( '.wpcom-site-menu-intro-notice a.close-button' ).addEventListener( 'click', function( event ) {
				event.preventDefault();
				this.closest( '.wpcom-site-menu-intro-notice' ).remove();
				wp.ajax.post( 'dismiss_wpcom_site_menu_intro_notice' );
			} );
		} );
	</script>
	<?php
}
add_action( 'admin_footer', 'wpcom_add_hosting_menu_intro_notice_dismiss' );

/**
 * Acts as the AJAX callback to set an option for dismissing the admin notice.
 */
function wpcom_site_menu_handle_dismiss_notice() {
	update_option( 'wpcom_site_menu_notice_dismissed', 1 );
	wp_die();
}
add_action( 'wp_ajax_dismiss_wpcom_site_menu_intro_notice', 'wpcom_site_menu_handle_dismiss_notice' );

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
