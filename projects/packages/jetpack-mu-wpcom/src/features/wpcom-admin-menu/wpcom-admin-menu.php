<?php
/**
 * WordPress.com admin menu
 *
 * Adds WordPress.com-specific stuff to WordPress admin menu.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Newsletter\Settings as Newsletter_Settings;
use Automattic\Jetpack\Podcast\Admin_Page as Podcast_Admin_Page;
use Automattic\Jetpack\Redirect;

require_once __DIR__ . '/../../common/wpcom-callout.php';

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
 * Adds the Dashboard > Updates menu on Simple sites
 */
function wpcom_add_dashboard_updates_menu() {
	$is_simple_site = defined( 'IS_WPCOM' ) && IS_WPCOM;
	if ( ! $is_simple_site || ( function_exists( 'wpcom_is_vip' ) && wpcom_is_vip() ) ) {
		return;
	}

	add_submenu_page(
		'index.php',
		__( 'WordPress Updates', 'jetpack-mu-wpcom' ),
		__( 'Updates', 'jetpack-mu-wpcom' ),
		'manage_options',
		'wpcom-dashboard-updates',
		'wpcom_display_dashboard_updates_page'
	);
}
add_action( 'admin_menu', 'wpcom_add_dashboard_updates_menu' );

/**
 * Displays a WordPress Updates page for Simple sites.
 */
function wpcom_display_dashboard_updates_page() {
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'WordPress Updates', 'jetpack-mu-wpcom' ); ?></h1>
		<p><?php esc_html_e( "WordPress.com automatically keeps your site's plugins, themes, and WordPress version up to date.", 'jetpack-mu-wpcom' ); ?></p>
		<h2><?php esc_html_e( 'WordPress', 'jetpack-mu-wpcom' ); ?></h2>
		<p><?php esc_html_e( 'Your version of WordPress is up to date.', 'jetpack-mu-wpcom' ); ?></p>
		<h2><?php esc_html_e( 'Plugins', 'jetpack-mu-wpcom' ); ?></h2>
		<p><?php esc_html_e( 'Your plugins are all up to date.', 'jetpack-mu-wpcom' ); ?>
		<h2><?php esc_html_e( 'Themes', 'jetpack-mu-wpcom' ); ?></h2>
		<p><?php esc_html_e( 'Your themes are all up to date.', 'jetpack-mu-wpcom' ); ?>
	</div>
	<?php
}

/**
 * Checks if menu items can link to Calypso.
 *
 * This way we can avoid a broken nav experience for super admins who are not members of the current site,
 * since Calypso doesn't support this flow.
 */
function wpcom_can_link_to_calypso() {
	return is_user_member_of_blog();
}

/**
 * Adds a My Home menu.
 */
function wpcom_add_my_home_menu() {
	if ( ! wpcom_can_link_to_calypso() ) {
		return;
	}

	// Site Setup (manage_options) replaces My Home only for users who can see it; others keep My Home.
	if (
		current_user_can( 'manage_options' )
		&& function_exists( 'wpcom_ai_launchpad_is_eligible' )
		&& wpcom_ai_launchpad_is_eligible()
	) {
		return;
	}

	$domain = wp_parse_url( home_url(), PHP_URL_HOST );
	// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
	add_menu_page( __( 'My Home', 'jetpack-mu-wpcom' ), __( 'My Home', 'jetpack-mu-wpcom' ), 'read', 'https://wordpress.com/home/' . $domain, null, 'dashicons-admin-home', 2.01 ); // The 2.01 position is to ensure it's above the VIP menu on P2 sites.'
}
add_action( 'admin_menu', 'wpcom_add_my_home_menu' );

/**
 * Adds a Hosting menu.
 */
function wpcom_add_hosting_menu() {
	$domain = wp_parse_url( home_url(), PHP_URL_HOST );

	$menu_title = sprintf(
		'%1$s<span class="inline-icon dashicons dashicons-external"></span>',
		__( 'Hosting', 'jetpack-mu-wpcom' )
	);

	add_menu_page(
		__( 'Hosting', 'jetpack-mu-wpcom' ),
		$menu_title,
		'manage_options',
		esc_url( "https://wordpress.com/overview/$domain" ),
		null, // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
		'dashicons-cloud',
		2.98
	);
}
add_action( 'admin_menu', 'wpcom_add_hosting_menu' );

/**
 * Enqueues admin menu styles.
 */
function wpcom_admin_menu_enqueue_styles() {
	wp_enqueue_style(
		'wpcom-admin-menu',
		plugins_url( 'wpcom-admin-menu.css', __FILE__ ),
		array(),
		filemtime( __DIR__ . '/wpcom-admin-menu.css' )
	);
}
add_action( 'admin_enqueue_scripts', 'wpcom_admin_menu_enqueue_styles' );

/**
 * Adds an Upgrades menu.
 *
 * This centralizes the Upgrades menu registration for all admin interfaces (Calypso and wp-admin).
 * The masterbar classes defer to this function instead of registering their own Upgrades menu.
 */
function wpcom_add_upgrades_menu() {
	// Don't show Upgrades on staging sites.
	if ( get_option( 'wpcom_is_staging_site' ) ) {
		return;
	}

	$domain      = wp_parse_url( home_url(), PHP_URL_HOST );
	$parent_slug = 'paid-upgrades.php';

	// Build the menu title, optionally with the plan label.
	$plan = wpcom_get_current_plan_name();
	if ( $plan ) {
		// Add display:none as a default for cases when CSS is not loaded.
		// Calypso and the masterbar CSS override this to show the plan label.
		$menu_title = sprintf(
			'%1$s<span class="inline-text" style="display:none">%2$s</span>',
			__( 'Upgrades', 'jetpack-mu-wpcom' ),
			esc_html( $plan )
		);
	} else {
		$menu_title = __( 'Upgrades', 'jetpack-mu-wpcom' );
	}

	add_menu_page(
		__( 'Upgrades', 'jetpack-mu-wpcom' ),
		$menu_title,
		'manage_options',
		$parent_slug,
		null, // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
		'dashicons-cart',
		2.99
	);

	add_submenu_page(
		$parent_slug,
		__( 'Plans', 'jetpack-mu-wpcom' ),
		__( 'Plans', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/plans/$domain" ),
		null, // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
		1
	);

	add_submenu_page(
		$parent_slug,
		__( 'Add-ons', 'jetpack-mu-wpcom' ),
		__( 'Add-ons', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/add-ons/$domain" ),
		null, // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
		2
	);

	add_submenu_page(
		$parent_slug,
		__( 'Domains', 'jetpack-mu-wpcom' ),
		__( 'Domains', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/domains/manage/$domain" ),
		null, // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
		3
	);

	add_submenu_page(
		$parent_slug,
		__( 'Emails', 'jetpack-mu-wpcom' ),
		__( 'Emails', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/email/$domain" ),
		null, // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
		4
	);

	add_submenu_page(
		$parent_slug,
		__( 'Purchases', 'jetpack-mu-wpcom' ),
		__( 'Purchases', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/purchases/subscriptions/$domain" ),
		null, // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal
		5
	);

	// By default, WordPress adds a submenu item for the parent menu item, which we don't want.
	remove_submenu_page( $parent_slug, $parent_slug );

	// Remove legacy Upgrades submenus registered elsewhere on WP.com.
	remove_submenu_page( $parent_slug, 'premium-themes' );
	remove_submenu_page( $parent_slug, 'domains' );
	remove_submenu_page( $parent_slug, 'my-upgrades' );
	remove_submenu_page( $parent_slug, 'billing-history' );
}
add_action( 'admin_menu', 'wpcom_add_upgrades_menu', 140 ); // After hookpress hook at 130, needed to ensure the legacy submenus are removed.

/**
 * Gets the current plan's short name.
 *
 * @return string|null The plan name, or null if unavailable.
 */
function wpcom_get_current_plan_name() {
	// Simple sites: use WPCOM_Store_API.
	if ( class_exists( 'WPCOM_Store_API' ) ) {
		$current_plan = \WPCOM_Store_API::get_current_plan( get_current_blog_id() );
		if ( ! empty( $current_plan['product_name_short'] ) ) {
			return $current_plan['product_name_short'];
		}
	}

	// Atomic sites: use Jetpack Current_Plan.
	if ( class_exists( 'Automattic\Jetpack\Current_Plan' ) ) {
		$products = \Automattic\Jetpack\Current_Plan::get();
		if ( array_key_exists( 'product_name_short', $products ) ) {
			return $products['product_name_short'];
		}
	}

	return null;
}

/**
 * Re-order the submenu items of the given menu slug according to a sorted array of submenu slugs.
 *
 * @param string $menu_slug The menu slug.
 * @param array  $desired_order A list of the submenu slugs in the desired order.
 */
function wpcom_reorder_submenu( $menu_slug, $desired_order ) {
	// Re-order menu.
	global $submenu;
	if ( ! isset( $submenu[ $menu_slug ] ) ) {
		return;
	}

	$domain          = wp_parse_url( home_url(), PHP_URL_HOST );
	$ordered_submenu = array();

	// Re-add submenu items in the desired order. Dedupe because a slug in
	// $desired_order can be a substring of another item's URL, which would
	// otherwise match the same item twice.
	foreach ( $desired_order as $submenu_slug ) {
		foreach ( $submenu[ $menu_slug ] as $item ) {
			$clean_url = str_replace( $domain, '', $item[2] );
			if ( str_contains( $clean_url, $submenu_slug ) && ! in_array( $item, $ordered_submenu, true ) ) {
				$ordered_submenu[] = $item;
			}
		}
	}

	// Add any remaining submenu items.
	foreach ( $submenu[ $menu_slug ] as $item ) {
		if ( ! in_array( $item, $ordered_submenu, true ) ) {
			$ordered_submenu[] = $item;
		}
	}

	// phpcs:ignore WordPress.WP.GlobalVariablesOverride
	$submenu[ $menu_slug ] = $ordered_submenu;
}

/**
 * Adds WordPress.com submenu items related to Jetpack under the Jetpack admin menu.
 */
function wpcom_add_jetpack_submenu() {
	$is_simple_site = defined( 'IS_WPCOM' ) && IS_WPCOM;

	$blog_id = Connection_Manager::get_site_id();
	if ( is_wp_error( $blog_id ) ) {
		return;
	}

	$domain = wp_parse_url( home_url(), PHP_URL_HOST );

	// @codeCoverageIgnoreStart
	// Hide certain Jetpack submenus for Atomic sites on Personal or Premium plans.
	$is_personal_or_premium = false;
	if ( class_exists( '\\Automattic\\Jetpack\\Current_Plan' ) ) {
		$current_plan           = \Automattic\Jetpack\Current_Plan::get();
		$plan_class             = $current_plan['class'] ?? '';
		$is_personal_or_premium = in_array( $plan_class, array( 'personal', 'premium' ), true );
	}

	if ( ! $is_simple_site && $is_personal_or_premium ) {
		// Jetpack > My Jetpack.
		wpcom_hide_submenu_page( 'jetpack', 'my-jetpack' );

		// Jetpack > Settings.
		wpcom_hide_submenu_page( 'jetpack', admin_url( 'admin.php?page=jetpack#/settings' ) );

		// Redirect My Jetpack page to Stats for Atomic sites on Personal or Premium plans.
		add_action(
			'admin_init',
			function () {
				// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- No action taken, just checking page.
				if ( isset( $_GET['page'] ) && 'my-jetpack' === $_GET['page'] ) {
					wp_safe_redirect( admin_url( 'admin.php?page=stats' ) );
					exit;
				}
			}
		);

		// Jetpack > Traffic (Calypso).
		add_submenu_page(
			'jetpack',
			esc_attr__( 'Traffic', 'jetpack-mu-wpcom' ),
			__( 'Traffic', 'jetpack-mu-wpcom' ),
			'manage_options',
			'https://wordpress.com/marketing/traffic/' . $domain,
			null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		);

	}
	// @codeCoverageIgnoreEnd

	// Jetpack > Scan.
	wpcom_hide_submenu_page( 'jetpack', esc_url( Redirect::get_url( 'cloud-scan-history-wp-menu' ) ) );
	wpcom_hide_submenu_page( 'jetpack', esc_url( Redirect::get_url( 'calypso-scanner' ) ) );
	add_submenu_page(
		'jetpack',
		/** "Scan" is a product name, do not translate. */
		'Scan',
		'Scan',
		'manage_options',
		'https://wordpress.com/scan/' . $domain,
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
	);

	// Jetpack > Backup.
	wpcom_hide_submenu_page( 'jetpack', esc_url( Redirect::get_url( 'calypso-backups' ) ) );
	add_submenu_page(
		'jetpack',
		/** "Backup" is a product name, do not translate. */
		'Backup',
		'Backup',
		'manage_options',
		'https://wordpress.com/backup/' . $domain,
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
	);

	// Jetpack > Monetize.
	add_submenu_page(
		'jetpack',
		esc_attr__( 'Monetize', 'jetpack-mu-wpcom' ),
		__( 'Monetize', 'jetpack-mu-wpcom' ),
		'manage_options',
		'https://wordpress.com/earn/' . $domain,
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
	);

	// Jetpack > Subscribers. Always hide the auto-added Calypso redirect link.
	wpcom_hide_submenu_page( 'jetpack', esc_url( Redirect::get_url( 'jetpack-menu-jetpack-manage-subscribers', array( 'site' => $blog_id ) ) ) );

	// The unified Newsletter page now owns the Subscribers tab on every site: the
	// legacy Calypso "Subscribers" submenu is retired and replaced by a transitional
	// announcement page that points there. (The wp-admin subscriber-management variant
	// was removed with the subscribers-dashboard package and isn't restored.) Hosts
	// (and a11ns who want the legacy view back) can still force the old submenu back
	// with add_filter( 'rsm_jetpack_ui_modernization_newsletter', '__return_false' ).
	//
	// On WordPress.com (Simple and WoA) this menu is the canonical owner of the
	// Subscribers entry, so the announcement page is registered here for both
	// platforms; the standalone plugin's subscriptions module defers to it on
	// wpcom to avoid a duplicate.
	if ( ! apply_filters( 'rsm_jetpack_ui_modernization_newsletter', true ) ) {
		add_submenu_page(
			'jetpack',
			__( 'Subscribers', 'jetpack-mu-wpcom' ),
			__( 'Subscribers', 'jetpack-mu-wpcom' ),
			'manage_options',
			'https://wordpress.com/subscribers/' . $domain,
			null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		);
	} elseif ( class_exists( '\Automattic\Jetpack\Newsletter\Subscribers_Announcement' ) ) {
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- class_exists guarded above; provided by the sibling autoloader (bundled Jetpack on Simple, standalone plugin on Atomic).
		\Automattic\Jetpack\Newsletter\Subscribers_Announcement::add_wp_admin_submenu();
	}

	Podcast_Admin_Page::add_wp_admin_submenu();

	if ( $is_simple_site ) {
		// Jetpack > Newsletter.
		// Register the in-admin Newsletter settings page (with its own render callback
		// and admin hooks). This must be done here (at priority 999999) because the
		// Jetpack menu is created by this function and doesn't exist at earlier priorities.
		if ( class_exists( '\Automattic\Jetpack\Newsletter\Settings' ) ) {
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- class_exists guarded above; provided by sibling autoloader.
			$newsletter_settings = new Newsletter_Settings();
			// @phan-suppress-next-line PhanUndeclaredClassMethod -- class_exists guarded above; provided by sibling autoloader.
			$newsletter_settings->add_wp_admin_submenu();
		}

		// Jetpack > Traffic
		add_submenu_page(
			'jetpack',
			__( 'Traffic', 'jetpack-mu-wpcom' ),
			__( 'Traffic', 'jetpack-mu-wpcom' ),
			'manage_options',
			'https://wordpress.com/marketing/traffic/' . $domain,
			null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		);
	}

	// Jetpack > Activity Log. On WPCOM hosts we prefer the direct wordpress.com/activity-log link
	// below; hide the native Jetpack Activity Log page added by the `jetpack-activity-log` package.
	wpcom_hide_submenu_page( 'jetpack', 'jetpack-activity-log' );
	add_submenu_page(
		'jetpack',
		/** "Activity Log" is a product name, do not translate. */
		'Activity Log',
		'Activity Log',
		'manage_options',
		'https://wordpress.com/activity-log/' . $domain,
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
	);

	wpcom_reorder_submenu(
		'jetpack',
		array(
			'my-jetpack',
			'stats',
			'boost',
			'social',
			'akismet-key-config',
			'activity-log',
			'scan',
			'backup',
			'forms',
			'earn',
			'search',
			'subscribers',
			'newsletter',
			'podcast',
			'traffic',
			'jetpack#/settings',
		)
	);
}
add_action( 'admin_menu', 'wpcom_add_jetpack_submenu', 999999 );

/*
 * Prevents the Jetpack menu from being overridden on Simple sites.
 *
 * TODO: After deploying https://github.com/Automattic/jetpack/pull/39393, we can remove the `add_jetpack_submenu` function and this `remove_action` call.
 */
remove_action( 'admin_menu', 'add_jetpack_submenu', 999999 );

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

		remove_action( 'customize_register', 'Automattic\Jetpack\Masterbar\register_css_nudge_control' );

		remove_action( 'customize_register', array( 'Jetpack_Custom_CSS_Customizer', 'customize_register' ) );

		remove_action( 'customize_register', array( 'Jetpack_Custom_CSS_Enhancements', 'customize_register' ) );
	}
}

$customizer_removal_hook = defined( 'REST_API_REQUEST' ) && REST_API_REQUEST ? 'rest_pre_dispatch' : 'init';
add_action( $customizer_removal_hook, 'wpcom_hide_customizer_submenu_on_block_theme' );

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

/**
 * Adds some Tools menus that are missing on Simple sites.
 */
function wpcom_add_tools_menu() {
	$is_simple_site = defined( 'IS_WPCOM' ) && IS_WPCOM;
	if ( $is_simple_site ) {
		add_submenu_page(
			'tools.php',
			__( 'Export Personal Data', 'jetpack-mu-wpcom' ),
			__( 'Export Personal Data', 'jetpack-mu-wpcom' ),
			'manage_options',
			'wpcom-export-personal-data',
			'wpcom_display_export_erase_personal_data_page'
		);

		add_submenu_page(
			'tools.php',
			__( 'Erase Personal Data', 'jetpack-mu-wpcom' ),
			__( 'Erase Personal Data', 'jetpack-mu-wpcom' ),
			'manage_options',
			'wpcom-erase-personal-data',
			'wpcom_display_export_erase_personal_data_page'
		);

		add_submenu_page(
			'tools.php',
			__( 'Site Health', 'jetpack-mu-wpcom' ),
			__( 'Site Health', 'jetpack-mu-wpcom' ),
			'manage_options',
			'wpcom-site-health',
			'wpcom_display_site_health_page'
		);
	}

	wpcom_reorder_submenu(
		'tools.php',
		array(
			'tools.php',
			'advertising',
			'marketing',
			'monetize',
			'import',
			'export.php',
			'export-media-files',
			'site-health',
			'export-personal-data',
			'erase-personal-data',
			'theme-editor',
			'plugin-editor',
		)
	);
}
add_action( 'admin_menu', 'wpcom_add_tools_menu', 999999 );

/**
 * Displays an Export/Erase Personal Date page for Simple sites.
 */
function wpcom_display_export_erase_personal_data_page() {
	if ( str_contains( get_current_screen()->id, 'export-personal-data' ) ) {
		$page_title = __( 'Export Personal Data', 'jetpack-mu-wpcom' );
	} else {
		$page_title = __( 'Erase Personal Data', 'jetpack-mu-wpcom' );
	}

	wpcom_display_callout(
		'dashicons-id-alt',
		$page_title,
		array(
			__( 'WordPress.com gives you the tools to manage personal data from your dashboard, like viewing or deleting comments tied to a visitor.', 'jetpack-mu-wpcom' ),
			__( 'To support privacy requests, make sure people can reach you easily, whether through a contact form or an email in your Privacy Policy.', 'jetpack-mu-wpcom' ),
		),
		localized_wpcom_url( 'https://wordpress.com/support/your-site-and-the-gdpr/' ),
		__( 'Learn more', 'jetpack-mu-wpcom' ),
		plugins_url( 'images/performance.svg', __FILE__ )
	);
}

/**
 * Displays a callout on Simple Sites for Tools > Site Health menu.
 *
 * @return void
 */
function wpcom_display_site_health_page() {
	wpcom_display_callout(
		'dashicons-admin-site-alt3',
		__( 'Your site\'s in good hands', 'jetpack-mu-wpcom' ),
		array(
			__( 'No need to stress over performance or security checks, WordPress.com handles that for you behind the scenes.', 'jetpack-mu-wpcom' ),
			__( 'That way, your site stays fast, safe, and reliable, without any extra effort from you.', 'jetpack-mu-wpcom' ),
		),
		localized_wpcom_url( 'https://wordpress.com/support/choose-a-host/#frequently-asked-questions-about-managed-hosting-with-word-press-com' ),
		__( 'Learn more', 'jetpack-mu-wpcom' ),
		plugins_url( 'images/cloud.svg', __FILE__ )
	);
}

/**
 * Adjust the Settings submenus so they are sorted consistently.
 */
function wpcom_add_settings_menu() {
	wpcom_reorder_submenu(
		'options-general.php',
		array(
			'general',
			'writing',
			'reading',
			'discussion',
			'media',
			'permalink',
			'privacy',
			'sharing',
			'optimize',
			'crowdsignal',
			'rating',
			'newsletter',
		)
	);
}
add_action( 'admin_menu', 'wpcom_add_settings_menu', 999999 );

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	require_once __DIR__ . '/p2-admin-menu.php';
}
