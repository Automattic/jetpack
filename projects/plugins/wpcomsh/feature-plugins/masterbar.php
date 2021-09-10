<?php
/**
 * Customizations to the Masterbar module available in Jetpack.
 * We want that feature to always be available on Atomic sites.
 *
 * @package wpcomsh
 */

use Automattic\Jetpack\Status;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;

/**
 * Force-enable the Masterbar module
 * If you use a version of Jetpack that supports it,
 * and if it is not already enabled.
 */
function wpcomsh_activate_masterbar_module() {
	if ( ! defined( 'JETPACK__VERSION' ) ) {
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
		add_action( 'wp_loaded', function() {
			require_once ABSPATH . 'wp-admin/includes/admin.php';
		} );
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
	// Do nothing if we can't tell whether the User is connected.
	if ( ! class_exists( 'Automattic\Jetpack\Connection\Manager' ) ) {
		return false;
	}
	$connection_manager        = new Connection_Manager( 'jetpack' );
	$user_id_from_query_string = isset( $_GET[ 'user_id' ] ) ? $_GET[ 'user_id' ] : false;

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
 * @param int    $expiration Time until expiration in seconds.
 */
function wpcomsh_set_connected_user_data_as_user_options( $transient, $value, $expiration ) {
	if ( 0 !== strpos( $transient, 'jetpack_connected_user_data_' . get_current_user_id() ) ) {
		return;
	}

	if ( ! $value || ! is_array( $value ) ) {
		return;
	}

	if ( isset( $value['color_scheme'] ) ) {
		update_user_option( get_current_user_id(), 'admin_color', $value['color_scheme'] );
	}

	if ( isset( $value['site_count'] ) ) {
		update_user_option( get_current_user_id(), 'wpcom_site_count', $value['site_count'] );
	}

	if ( isset( $value['sidebar_collapsed'] ) ) {
		set_user_setting( 'mfold', $value['sidebar_collapsed'] ? 'f' : 'o' );
	}
}
add_action( 'setted_transient', 'wpcomsh_set_connected_user_data_as_user_options', 10, 3 );

/**
 * Determines whether Nav Unification should be enabled (pbAPfg-Ou-p2).
 *
 * This function is hooked into the `jetpack_load_admin_menu_class` filter that lives in Jetpack.
 * See https://github.com/Automattic/jetpack/blob/507142b09bae12b58e84c0c2b7d20024563f170d/modules%2Fmasterbar.php#L29.
 *
 * @return bool Whether Nav Unification should be enabled.
 */
function wpcomsh_activate_nav_unification() {
	$user_id = get_current_user_id();

	// Loads for all API requests to the admin-menu endpoint (i.e. Calypso).
	if ( wpcomsh_is_admin_menu_api_request() ) {
		return true;
	}

	// Disable when explicitly requested. This is an escape hatch for HEs. See paYJgx-1p8-p2.
	if ( isset( $_GET['disable-nav-unification'] ) ) {
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
 *
 * Shown only if the user is able to activate new plugins.
 */
function wpcomsh_add_woocommerce_install_menu() {
	if ( is_plugin_active( 'woocommerce/woocommerce.php' ) ) {
		return;
	}

	if ( class_exists( 'Automattic\Jetpack\Status' ) ) {
		$woocommerce_icon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiPjxwYXRoIGZpbGw9IiNhMmFhYjIiIGQ9Ik02MTIuMTkyIDQyNi4zMzZjMC02Ljg5Ni0zLjEzNi01MS42LTI4LTUxLjYtMzcuMzYgMC00Ni43MDQgNzIuMjU2LTQ2LjcwNCA4Mi42MjQgMCAzLjQwOCAzLjE1MiA1OC40OTYgMjguMDMyIDU4LjQ5NiAzNC4xOTItLjAzMiA0Ni42NzItNzIuMjg4IDQ2LjY3Mi04OS41MnptMjAyLjE5MiAwYzAtNi44OTYtMy4xNTItNTEuNi0yOC4wMzItNTEuNi0zNy4yOCAwLTQ2LjYwOCA3Mi4yNTYtNDYuNjA4IDgyLjYyNCAwIDMuNDA4IDMuMDcyIDU4LjQ5NiAyNy45NTIgNTguNDk2IDM0LjE5Mi0uMDMyIDQ2LjY4OC03Mi4yODggNDYuNjg4LTg5LjUyek0xNDEuMjk2Ljc2OGMtNjguMjI0IDAtMTIzLjUwNCA1NS40ODgtMTIzLjUwNCAxMjMuOTJ2NjUwLjcyYzAgNjguNDMyIDU1LjI5NiAxMjMuOTIgMTIzLjUwNCAxMjMuOTJoMzM5LjgwOGwxMjMuNTA0IDEyMy45MzZWODk5LjMyOGgyNzguMDQ4YzY4LjIyNCAwIDEyMy41Mi01NS40NzIgMTIzLjUyLTEyMy45MnYtNjUwLjcyYzAtNjguNDMyLTU1LjI5Ni0xMjMuOTItMTIzLjUyLTEyMy45MmgtNzQxLjM2em01MjYuODY0IDQyMi4xNmMwIDU1LjA4OC0zMS4wODggMTU0Ljg4LTEwMi42NCAxNTQuODgtNi4yMDggMC0xOC40OTYtMy42MTYtMjUuNDI0LTYuMDE2LTMyLjUxMi0xMS4xNjgtNTAuMTkyLTQ5LjY5Ni01Mi4zNTItNjYuMjU2IDAgMC0zLjA3Mi0xNy43OTItMy4wNzItNDAuNzUyIDAtMjIuOTkyIDMuMDcyLTQ1LjMyOCAzLjA3Mi00NS4zMjggMTUuNTUyLTc1LjcyOCA0My41NTItMTA2LjczNiA5Ni40NDgtMTA2LjczNiA1OS4wNzItLjAzMiA4My45NjggNTguNTI4IDgzLjk2OCAxMTAuMjA4ek00ODYuNDk2IDMwMi40YzAgMy4zOTItNDMuNTUyIDE0MS4xNjgtNDMuNTUyIDIxMy40MjR2NzUuNzEyYy0yLjU5MiAxMi4wOC00LjE2IDI0LjE0NC0yMS44MjQgMjQuMTQ0LTQ2LjYwOCAwLTg4Ljg4LTE1MS40NzItOTIuMDE2LTE2MS44NC02LjIwOCA2Ljg5Ni02Mi4yNCAxNjEuODQtOTYuNDQ4IDE2MS44NC0yNC44NjQgMC00My41NTItMTEzLjY0OC00Ni42MDgtMTIzLjkzNkMxNzYuNzA0IDQzNi42NzIgMTYwIDMzNC4yMjQgMTYwIDMyNy4zMjhjMC0yMC42NzIgMS4xNTItMzguNzM2IDI2LjA0OC0zOC43MzYgNi4yMDggMCAyMS42IDYuMDY0IDIzLjcxMiAxNy4xNjggMTEuNjQ4IDYyLjAzMiAxNi42ODggMTIwLjUxMiAyOS4xNjggMTg1Ljk2OCAxLjg1NiAyLjkyOCAxLjUwNCA3LjAwOCA0LjU2IDEwLjQzMiAzLjE1Mi0xMC4yODggNjYuOTI4LTE2OC43ODQgOTQuOTYtMTY4Ljc4NCAyMi41NDQgMCAzMC40IDQ0LjU5MiAzMy41MzYgNjEuODI0IDYuMjA4IDIwLjY1NiAxMy4wODggNTUuMjE2IDIyLjQxNiA4Mi43NTIgMC0xMy43NzYgMTIuNDgtMjAzLjEyIDY1LjM5Mi0yMDMuMTIgMTguNTkyLjAzMiAyNi43MDQgNi45MjggMjYuNzA0IDI3LjU2OHpNODcwLjMyIDQyMi45MjhjMCA1NS4wODgtMzEuMDg4IDE1NC44OC0xMDIuNjQgMTU0Ljg4LTYuMTkyIDAtMTguNDQ4LTMuNjE2LTI1LjQyNC02LjAxNi0zMi40MzItMTEuMTY4LTUwLjE3Ni00OS42OTYtNTIuMjg4LTY2LjI1NiAwIDAtMy44ODgtMTcuOTItMy44ODgtNDAuODk2czMuODg4LTQ1LjE4NCAzLjg4OC00NS4xODRjMTUuNTUyLTc1LjcyOCA0My40ODgtMTA2LjczNiA5Ni4zODQtMTA2LjczNiA1OS4xMDQtLjAzMiA4My45NjggNTguNTI4IDgzLjk2OCAxMTAuMjA4eiIvPjwvc3ZnPg==';
		$woocommerce_slug = 'https://wordpress.com/woocommerce-installation/' . ( new Status() )->get_site_suffix();
		add_menu_page( 'WooCommerce', 'WooCommerce', 'activate_plugins', $woocommerce_slug, null, $woocommerce_icon, '55.5' );
	}
}
add_action( 'admin_menu', 'wpcomsh_add_woocommerce_install_menu' );

/**
 * Adds the Plugins menu when the site has a non-supported WPCOM plan, i.e. not business or ecommerce. On these sites,
 * the Plugins menu links to the Calypso plugins page.
 */
function wpcomsh_add_plugins_menu_non_supported_plans() {
	// Safety - don't alter anything if Nav Unification is not enabled.
	if ( ! class_exists( 'Automattic\Jetpack\Status' ) || ! wpcomsh_activate_nav_unification( false ) ) {
		return;
	}

	if ( current_user_can( 'activate_plugins' ) ) {
		// The site will have the normal wp-admin Plugins menu.
		return;
	}

	$plugins_slug = 'https://wordpress.com/plugins/' . ( new Automattic\Jetpack\Status() )->get_site_suffix();
	add_menu_page( 'Plugins', 'Plugins', 'manage_options', $plugins_slug, null, 'dashicons-admin-plugins', '65' );
}
add_action( 'admin_menu', 'wpcomsh_add_plugins_menu_non_supported_plans' );

// Enables the Upgrades -> Emails menu item in the sidebar for all users (temporary hotfix due to Jetpack monthly release cycle)
add_filter( 'jetpack_show_wpcom_upgrades_email_menu', '__return_true' );

/**
 * Checks if site sticker is toggled on/off.
 * For further information/context on Atomic_Persistent_Data and site_stickers please also see this diff: D66496-code
 * @return boolean
 */
function wpcomsh_is_site_sticker_active( $sticker_name ) {
	if ( ! class_exists( '\Atomic_Persistent_Data' ) ) {
		return false;
	}

	$persistent_data = new \Atomic_Persistent_Data();
	$is_sticker_enabled = array_key_exists( 'site_sticker_' . $sticker_name, $persistent_data );

	return $is_sticker_enabled;
}

/**
 * Returns new plugin submenus that we are going to update.
 * @return array
 */
function wpcomsh_get_plugin_updated_submenus( $submenus_to_update, $domain ) {
	// If we get an unexpected data type, or there is no domain then return an empty array.
	if ( ! is_array( $submenus_to_update ) || ! $domain) {
		return array();
	}

	$submenus_to_update['plugin-install.php'] = 'https://wordpress.com/plugins/' . $domain;
	return $submenus_to_update;
}

/**
 * Checks if the wpcom-marketplace sticker is active and if so it forces the plugin install link to be Calypso.
 * @return array
 */
function wpcomsh_update_plugin_submenus( $submenus_to_update ) {
	$should_update = wpcomsh_is_site_sticker_active( 'wpcom-marketplace' );
	if ( ! $should_update ) {
		return $submenus_to_update;
	}

	if ( ! class_exists( 'Automattic\Jetpack\Status' ) ) {
		return $submenus_to_update;
	}
	$domain = ( new Automattic\Jetpack\Status() )->get_site_suffix();

	return wpcomsh_get_plugin_updated_submenus( $submenus_to_update, $domain );
}

function wpcomsh_update_plugin_add_filter() {
	// We need to add the filter in a `admin_menu` action so that the rest api (Calypso)
	// shows the correct menu items.
	add_filter( 'wpcom_plugins_submenu_update', 'wpcomsh_update_plugin_submenus' );
}
add_action( 'admin_menu', 'wpcomsh_update_plugin_add_filter' );