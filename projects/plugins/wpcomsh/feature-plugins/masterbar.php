<?php
/**
 * Customizations to the Masterbar module available in Jetpack.
 * We want that feature to always be available on Atomic sites.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Force-enable the Masterbar module
 * If you use a version of Jetpack that supports it,
 * and if it is not already enabled.
 */
function wpcomsh_activate_masterbar_module() {
	if ( ! defined( 'JETPACK__VERSION' ) || wpcom_is_nav_redesign_enabled() ) {
		return;
	}

	// Masterbar was introduced in Jetpack 4.8.
	if ( version_compare( JETPACK__VERSION, '4.8', '<' ) ) {
		return;
	}

	if ( ! Jetpack::is_module_active( 'masterbar' ) ) {
		Jetpack::activate_module( 'masterbar', false, false );
	}
}
add_action( 'init', 'wpcomsh_activate_masterbar_module', 0, 0 );

/**
 * Disable the Masterbar for nav redesign.
 *
 * @param array $modules Array of Jetpack modules.
 * @return array
 */
function atomic_masterbar_filter_jetpack_modules( $modules ) {
	if ( isset( $modules['masterbar'] ) && wpcom_is_nav_redesign_enabled() ) {
		unset( $modules['masterbar'] );
	}

	return $modules;
}
add_filter( 'jetpack_get_available_modules', 'atomic_masterbar_filter_jetpack_modules' );

/**
 * Remove Masterbar from the old Module list.
 * Available at wp-admin/admin.php?page=jetpack_modules
 *
 * @param array $items Array of Jetpack modules.
 * @return array
 */
function wpcomsh_rm_masterbar_module_list( $items ) {
	if ( isset( $items['masterbar'] ) ) {
		unset( $items['masterbar'] );
	}
	return $items;
}
add_filter( 'jetpack_modules_list_table_items', 'wpcomsh_rm_masterbar_module_list' );

/**
 * Check if the current request is an API request to the `wpcom/v2/admin-menu` endpoint.
 *
 * @return bool
 */
function wpcomsh_is_admin_menu_api_request() {
	// phpcs:ignore WordPress.Security
	return 0 === strpos( $_SERVER['REQUEST_URI'], '/?rest_route=%2Fwpcom%2Fv2%2Fadmin-menu' );
}

/**
 * Sets WP_ADMIN constant on API requests for admin menus.
 *
 * Attempt to increase our chances that third-party plugins will
 * register their menu items based on `is_admin()` returning true.
 *
 * This has to run before plugins are loaded.
 */
function wpcomsh_mimic_admin_page_load() {
	if ( wpcomsh_is_admin_menu_api_request() ) {
		// Display errors can cause the API request to fail due to the PHP notice
		// triggered by `$pagenow` not being correctly determined when `WP_ADMIN`
		// is forced on a non-WP Admin page.
		@ini_set( 'display_errors', false ); // phpcs:ignore

		define( 'WP_ADMIN', true );
		add_action(
			'wp_loaded',
			function () {
				require_once ABSPATH . 'wp-admin/includes/admin.php';
			}
		);
	}
}
add_action( 'muplugins_loaded', 'wpcomsh_mimic_admin_page_load' );

/**
 * Prints the calypso page link for changing a color scheme.
 **/
function wpcomsh_admin_color_scheme_picker_disabled() {
	printf(
		'<a target="_blank" href="%1$s">%2$s</a>',
		esc_url( 'https://wordpress.com/me/account' ),
		esc_html( __( 'Set your color scheme on WordPress.com.', 'wpcomsh' ) )
	);
}

/**
 * Hides the "Admin Color Scheme" entry on /wp-admin/profile.php,
 * and adds an action that prints a calypso page link.
 * This applies only to WPCOM connected users.
 **/
function wpcomsh_hide_color_schemes() {
	// Do nothing if the admin interface is wp-admin.
	if ( wpcom_is_nav_redesign_enabled() ) {
		return false;
	}

	// Do nothing if we can't tell whether the User is connected.
	if ( ! class_exists( 'Automattic\Jetpack\Connection\Manager' ) ) {
		return false;
	}
	$connection_manager        = new Connection_Manager( 'jetpack' );
	$user_id_from_query_string = $_GET['user_id'] ?? false; // phpcs:ignore WordPress.Security

	if ( ! $connection_manager->is_user_connected( $user_id_from_query_string ) ) {
		// If this is a local user, show the default UX.
		return;
	}

	remove_action( 'admin_color_scheme_picker', 'admin_color_scheme_picker' );

	if ( ! $user_id_from_query_string ) {
		// Show Calypso page link only to a user editing their profile.
		add_action( 'admin_color_scheme_picker', 'wpcomsh_admin_color_scheme_picker_disabled' );
	}
}
add_action( 'load-profile.php', 'wpcomsh_hide_color_schemes' );
add_action( 'load-user-edit.php', 'wpcomsh_hide_color_schemes' );

/**
 * Gets data from the `wpcom.getUser` XMLRPC response and set it as user options. This is hooked
 * into the `setted_transient` action that is triggered everytime the XMLRPC response is read.
 *
 * @see https://github.com/Automattic/jetpack/blob/57ca1d524a6f6e446c5a3891d3024c71a6b0684b/projects/packages/connection/src/class-manager.php#L676
 *
 * @param string $transient  The name of the transient.
 * @param mixed  $value      Transient value.
 */
function wpcomsh_set_connected_user_data_as_user_options( $transient, $value ) {
	if ( 0 !== strpos( $transient, 'jetpack_connected_user_data_' . get_current_user_id() ) ) {
		return;
	}

	if ( ! $value || ! is_array( $value ) ) {
		return;
	}

	if ( isset( $value['color_scheme'] ) && ! wpcom_is_nav_redesign_enabled() ) {
		update_user_option( get_current_user_id(), 'admin_color', $value['color_scheme'] );
	}

	if ( isset( $value['site_count'] ) ) {
		update_user_option( get_current_user_id(), 'wpcom_site_count', $value['site_count'] );
	}

	if ( isset( $value['sidebar_collapsed'] ) ) {
		set_user_setting( 'mfold', $value['sidebar_collapsed'] ? 'f' : 'o' );
	}
}
add_action( 'setted_transient', 'wpcomsh_set_connected_user_data_as_user_options', 10, 2 );

/**
 * Determines whether Nav Unification should be enabled (pbAPfg-Ou-p2).
 *
 * This function is hooked into the `jetpack_load_admin_menu_class` filter that lives in Jetpack.
 * See https://github.com/Automattic/jetpack/blob/507142b09bae12b58e84c0c2b7d20024563f170d/modules%2Fmasterbar.php#L29.
 *
 * @return bool Whether Nav Unification should be enabled.
 */
function wpcomsh_activate_nav_unification() {
	// Disable when in the redesigned nav.
	if ( wpcom_is_nav_redesign_enabled() ) {
		return false;
	}

	$user_id = get_current_user_id();

	// Loads for all API requests to the admin-menu endpoint (i.e. Calypso).
	if ( wpcomsh_is_admin_menu_api_request() ) {
		return true;
	}

	// Disable when explicitly requested. This is an escape hatch for HEs. See paYJgx-1p8-p2.
	if ( isset( $_GET['disable-nav-unification'] ) ) { // phpcs:ignore WordPress.Security
		return false;
	}

	// Disable for users not connected to WP.com.
	if ( ! class_exists( 'Automattic\Jetpack\Connection\Manager' ) ) {
		return false;
	}
	$connection_manager = new Connection_Manager( 'jetpack' );
	if ( ! $connection_manager->is_user_connected( $user_id ) ) {
		return false;
	}

	// Enabled by default.
	return true;
}
add_filter( 'jetpack_load_admin_menu_class', 'wpcomsh_activate_nav_unification' );

/**
 * Adds WooCommerce menu item if WooCommerce plugin is not installed and activated.
 * The intention here is to redirect to Store installation UI in calypso.
 */
function wpcom_woop_show_woo_installer() {
	// If WooCommerce plugin is already active, return false. Don't add another WooCommerce menu item.
	if ( is_plugin_active( 'woocommerce/woocommerce.php' ) ) {
		return false;
	}

	return true;
}
add_filter( 'jetpack_show_wpcom_woocommerce_installation_menu', 'wpcom_woop_show_woo_installer' );

// Enables the Upgrades -> Emails menu item in the sidebar for all users (temporary hotfix due to Jetpack monthly release cycle)
add_filter( 'jetpack_show_wpcom_upgrades_email_menu', '__return_true' );

/**
 * Checks if site sticker is toggled on/off.
 * For further information/context on Atomic_Persistent_Data and site_stickers please also see this diff: D66496-code
 *
 * @param string $sticker_name Name of the site sticker to check.
 * @return boolean
 */
function wpcomsh_is_site_sticker_active( $sticker_name ) {
	if ( ! class_exists( '\Atomic_Persistent_Data' ) ) {
		return false;
	}

	$persistent_data = new \Atomic_Persistent_Data();

	if ( $persistent_data->{"site_sticker_{$sticker_name}"} ) {
		return true;
	}

	return false;
}

/**
 * Forces the Add New (plugin install) link to be Calypso.
 *
 * @param string $url  The complete URL including scheme and path.
 * @param string $path Path relative to the URL. Blank string if no path is specified.
 *
 * @return string
 */
function wpcomsh_update_plugin_link_destination( $url, $path ) {
	// Run only for plugin-install.php links.
	if ( ! strpos( $url, '/plugin-install.php' ) ) {
		return $url;
	}

	// If Jetpack doesn't exist, stay in wp-admin
	if ( ! class_exists( 'Jetpack' ) ) {
		return $url;
	}

	// Run only if SSO is active
	if ( ! Jetpack::is_module_active( 'sso' ) ) {
		return $url;
	}

	// Return WP Admin url for example: plugin-install.php?tab=plugin-information&plugin=classic-editor&TB_iframe=true&width=600&height=550
	if ( strpos( $path, '?' ) ) {
		return $url;
	}

	return 'https://wordpress.com/plugins/' . ( new Automattic\Jetpack\Status() )->get_site_suffix();
}

/**
 * Adds filters so that Add New menu & button
 * redirect to Calypso.
 *
 * @return void
 */
function wpcomsh_update_plugin_add_filter() {
	// If site is not connected or nav redesign is enabled, return early.
	if ( ! class_exists( 'Automattic\Jetpack\Status' ) || wpcom_is_nav_redesign_enabled() ) {
		return;
	}

	// Update any plugin-install.php links appearing in /wp-admin/plugins.php or elsewhere.
	add_filter( 'self_admin_url', 'wpcomsh_update_plugin_link_destination', 10, 2 );
}
add_action( 'admin_menu', 'wpcomsh_update_plugin_add_filter' );

/**
 * Enable the mailbox in WPCOMSH sites.
 */
add_filter( 'jetpack_show_wpcom_inbox_menu', '__return_true' );

/**
 * Ensure that when getting the wpcom_admin_interface option, we return a value from the persistent data store if
 * available, otherwise fall back to the option value.
 *
 * @return false|string|null
 */
function wpcomsh_get_wpcom_admin_interface_option() {

	if ( class_exists( '\Atomic_Persistent_Data' ) ) {
		$persistent_data = new \Atomic_Persistent_Data();

		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		if ( isset( $persistent_data->WPCOM_ADMIN_INTERFACE ) ) {
			// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			return $persistent_data->WPCOM_ADMIN_INTERFACE;
		}
	}

	// Fallback to the current option value.
	return false;
}
// This pre_option_{$option} hook runs before the option is retrieved from the database with get_option().
add_filter( 'pre_option_wpcom_admin_interface', 'wpcomsh_get_wpcom_admin_interface_option' );

/**
 * Color scheme from Calypso (/me/account) is stored as user option,
 * while color scheme from /wp-admin/profile.php is stored as user meta.
 *
 * When saving the color scheme from /wp-admin/profile.php, we want to unsync them:
 *
 * 1. Read the current color scheme from Calypso (if there's still any).
 * 2. Delete the color scheme from Calypso, effectively only using color scheme
 *    from wp-admin going forward.
 */
function wpcomsh_unsync_color_schemes_on_save() {
	if ( ! wpcom_is_nav_redesign_enabled() ) {
		return;
	}

	// Returns Calypso color scheme (if still exists),
	// or wp-admin color scheme otherwise.
	$maybe_synced_color_scheme = get_user_option( 'admin_color' );

	// Always return the (maybe) synced color scheme above.
	add_filter(
		'get_user_metadata',
		function ( $value, $user_id, $meta_key ) use ( $maybe_synced_color_scheme ) {
			if ( $meta_key === 'admin_color' ) {
				return $maybe_synced_color_scheme;
			}
		},
		999999,
		3
	);

	// Delete the synced color scheme.
	add_filter(
		'update_user_metadata',
		function ( $check, $user_id, $meta_key ) {
			if ( $meta_key === 'admin_color' ) {
				delete_user_option( $user_id, 'admin_color' );
			}
		},
		10,
		3
	);
}
add_action( 'wp_ajax_save-user-color-scheme', 'wpcomsh_unsync_color_schemes_on_save', 1 );
