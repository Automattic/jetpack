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
use Automattic\Jetpack\Subscribers_Dashboard\Dashboard as Subscribers_Dashboard;

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

	$domain = wp_parse_url( home_url(), PHP_URL_HOST );
	// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
	add_menu_page( __( 'My Home', 'jetpack-mu-wpcom' ), __( 'My Home', 'jetpack-mu-wpcom' ), 'read', 'https://wordpress.com/home/' . $domain, null, 'dashicons-admin-home', 2.01 ); // The 2.01 position is to ensure it's above the VIP menu on P2 sites.'
}
add_action( 'admin_menu', 'wpcom_add_my_home_menu' );

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
		esc_attr__( 'Site Settings', 'jetpack-mu-wpcom' ),
		esc_attr__( 'Site Settings', 'jetpack-mu-wpcom' ),
		'manage_options',
		esc_url( "https://wordpress.com/sites/settings/site/$domain" ),
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
	$is_simple_site          = defined( 'IS_WPCOM' ) && IS_WPCOM;
	$uses_wp_admin_interface = get_option( 'wpcom_admin_interface' ) === 'wp-admin';

	$blog_id = Connection_Manager::get_site_id();
	if ( is_wp_error( $blog_id ) ) {
		return;
	}

	$domain = wp_parse_url( home_url(), PHP_URL_HOST );

	// Jetpack > Scan.
	wpcom_hide_submenu_page( 'jetpack', esc_url( Redirect::get_url( 'cloud-scan-history-wp-menu' ) ) );
	wpcom_hide_submenu_page( 'jetpack', esc_url( Redirect::get_url( 'calypso-scanner' ) ) );
	add_submenu_page(
		'jetpack',
		esc_attr__( 'Scan', 'jetpack-mu-wpcom' ),
		__( 'Scan', 'jetpack-mu-wpcom' ),
		'manage_options',
		'https://wordpress.com/scan/' . $domain,
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
	);

	// Jetpack > Backup.
	wpcom_hide_submenu_page( 'jetpack', esc_url( Redirect::get_url( 'calypso-backups' ) ) );
	add_submenu_page(
		'jetpack',
		esc_attr__( 'Backup', 'jetpack-mu-wpcom' ),
		__( 'Backup', 'jetpack-mu-wpcom' ),
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

	// Jetpack > Subscribers.
	if ( ! apply_filters( 'jetpack_wp_admin_subscriber_management_enabled', false ) ) {
		wpcom_hide_submenu_page( 'jetpack', esc_url( Redirect::get_url( 'jetpack-menu-jetpack-manage-subscribers', array( 'site' => $blog_id ) ) ) );
		add_submenu_page(
			'jetpack',
			__( 'Subscribers', 'jetpack-mu-wpcom' ),
			__( 'Subscribers', 'jetpack-mu-wpcom' ),
			'manage_options',
			'https://wordpress.com/subscribers/' . $domain,
			null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		);
	} else {
		$subscribers_dashboard = new Subscribers_Dashboard();
		$subscribers_dashboard->add_wp_admin_submenu();
	}

	// Jetpack > Podcasting
	add_submenu_page(
		'jetpack',
		__( 'Podcasting', 'jetpack-mu-wpcom' ),
		__( 'Podcasting', 'jetpack-mu-wpcom' ),
		'manage_options',
		'https://wordpress.com/settings/podcasting/' . $domain,
		null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
	);

	if ( $uses_wp_admin_interface ) {
		// Jetpack > Activity Log.
		wpcom_hide_submenu_page( 'jetpack', esc_url( Redirect::get_url( 'cloud-activity-log-wp-menu', array( 'site' => $blog_id ) ) ) );
		add_submenu_page(
			'jetpack',
			__( 'Activity Log', 'jetpack-mu-wpcom' ),
			__( 'Activity Log', 'jetpack-mu-wpcom' ),
			'manage_options',
			'https://wordpress.com/activity-log/' . $domain,
			null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		);

		// Jetpack > Newsletter.
		if ( $is_simple_site ) {
			add_submenu_page(
				'jetpack',
				__( 'Newsletter', 'jetpack-mu-wpcom' ),
				__( 'Newsletter', 'jetpack-mu-wpcom' ),
				'manage_options',
				'https://wordpress.com/settings/newsletter/' . $domain,
				null // @phan-suppress-current-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			);
		}
	}

	// Re-order menu.
	global $submenu;
	if ( ! isset( $submenu['jetpack'] ) ) {
		return;
	}

	$desired_order   = array(
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
		'podcasting',
		'jetpack#/settings',
		'jetpack#/dashboard',
	);
	$ordered_submenu = array();

	// Re-add submenu items in the desired order.
	foreach ( $desired_order as $slug ) {
		foreach ( $submenu['jetpack'] as $item ) {
			if ( str_contains( $item[2], $slug ) ) {
				$ordered_submenu[] = $item;
			}
		}
	}

	// Add any remaining submenu items.
	foreach ( $submenu['jetpack'] as $item ) {
		if ( ! in_array( $item, $ordered_submenu, true ) ) {
			$ordered_submenu[] = $item;
		}
	}

	// phpcs:ignore WordPress.WP.GlobalVariablesOverride
	$submenu['jetpack'] = $ordered_submenu;
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
	if ( ! $is_simple_site ) {
		return;
	}

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
}
add_action( 'admin_menu', 'wpcom_add_tools_menu' );

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
 * Displays a callout box in wp-admin.
 *
 * @param string $icon The Dashicons icon class to use within the callout.
 * @param string $title The title text to display in the callout.
 * @param array  $description List of paragraphs to display as description.
 * @param string $button_link URL of the CTA button.
 * @param string $button_text Text of the CTA button.
 * @param string $image The path of the image to include within the callout.
 */
function wpcom_display_callout( $icon, $title, $description, $button_link, $button_text, $image ) {
	?>
	<style>
		.wpcom-callout-container {
			height: max( calc( 100vh - 32px ), 400px );
			display: flex;
			justify-content: center;
			align-items: center;
		}

		.wpcom-callout {
			padding: 24px;
			margin-left: auto;
			margin-right: auto;
			max-width: 600px;
			box-sizing: border-box;
			display: flex;
			background-color: #fff;
			box-shadow: rgba(0, 0, 0, 0.1) 0 0 0 1px;
			border-radius: 7px;
			gap: 24px;
		}

		.wpcom-callout > * {
			width: 50%;
		}

		.wpcom-callout-content {
			display: flex;
			flex-direction: column;
			gap: 16px;
			align-items: flex-start;
		}

		.wpcom-callout-content > * {
			margin: 0;
		}

		.wpcom-callout-title {
			color: #1e1e1e;
			font-size: 15px;
			font-weight: 500;
			line-height: 20px;
		}

		.wpcom-callout-description {
			color: rgb(117, 117, 117);
			line-height: 1.4;
			text-wrap: pretty;
			font-size: 13px;
		}

		.wpcom-callout-image {
			position: relative;
		}

		.wpcom-callout-image > img {
			position: absolute;
			width: 100%;
			height: 100%;
			object-fit: cover;
			border-radius: 7px;
		}

		.wpcom-callout .button.button-primary {
			border-radius: 2px;
		}

		@media (max-width: 620px) {
			.wpcom-callout-container {
				align-items: flex-start;
			}

			.wpcom-callout {
				margin-top: 10px;
			}

			.wpcom-callout-content {
				width: 100%;
			}

			.wpcom-callout-image {
				display: none;
			}
		}
	</style>
	<div class="wpcom-callout-container">
		<div class="wpcom-callout">
			<div class="wpcom-callout-content">
				<div class="wpcom-callout-icon"><span class="dashicons <?php echo esc_attr( $icon ); ?>"></span></div>
				<h2 class="wpcom-callout-title"><?php echo esc_html( $title ); ?></h2>
				<?php foreach ( $description as $paragraph ) : ?>
					<p class="wpcom-callout-description"><?php echo esc_html( $paragraph ); ?></p>
				<?php endforeach; ?>
				<a class="button button-primary" href="<?php echo esc_url( $button_link ); ?>" data-target="wpcom-help-center"><?php echo esc_html( $button_text ); ?></a>
			</div>
			<div class="wpcom-callout-image"><img src="<?php echo esc_url( $image ); ?>"></div>
		</div>
	</div>
	<?php
}
