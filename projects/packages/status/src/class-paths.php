<?php
/**
 * A Path & URL utility class for Jetpack.
 *
 * @package automattic/jetpack-status
 */

namespace Automattic\Jetpack;

/**
 * Class Automattic\Jetpack\Paths
 *
 * Used to retrieve information about files.
 */
class Paths {
	/**
	 * Jetpack Admin URL.
	 *
	 * @param array $args Query string args.
	 *
	 * @return string Jetpack admin URL.
	 */
	public function admin_url( $args = null ) {
		$args = wp_parse_args( $args, array( 'page' => 'jetpack' ) );
		$url  = add_query_arg( $args, admin_url( 'admin.php' ) );
		return $url;
	}

	/**
	 * Determine if the current request is activating a plugin from the plugins page.
	 *
	 * @param string $plugin Plugin file path to check.
	 * @return bool
	 */
	public function is_current_request_activating_plugin_from_plugins_screen( $plugin ) {
		// Filter out common async request contexts
		if (
			wp_doing_ajax() ||
			( defined( 'REST_REQUEST' ) && REST_REQUEST ) ||
			( defined( 'REST_API_REQUEST' ) && REST_API_REQUEST ) ||
			( defined( 'WP_CLI' ) && WP_CLI )
		) {
			return false;
		}

		if ( isset( $_SERVER['SCRIPT_NAME'] ) ) {
			$request_file = esc_url_raw( wp_unslash( $_SERVER['SCRIPT_NAME'] ) );
		} elseif ( isset( $_SERVER['REQUEST_URI'] ) ) {
			list( $request_file ) = explode( '?', esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) );
		} else {
			return false;
		}

		// Not the plugins page
		if ( strpos( $request_file, 'wp-admin/plugins.php' ) === false ) {
			return false;
		}

		// Same method to get the action as used by plugins.php
		$wp_list_table = _get_list_table( 'WP_Plugins_List_Table' );
		$action        = $wp_list_table->current_action();

		// Not a singular activation
		// This also means that if the plugin is activated as part of a group ( bulk activation ), this function will return false here.
		if ( 'activate' !== $action ) {
			return false;
		}

		// Check the nonce associated with the plugin activation
		// We are not changing any data here, so this is not super necessary, it's just a best practice before using the form data from $_REQUEST.
		check_admin_referer( 'activate-plugin_' . $plugin );

		// Not the right plugin
		$requested_plugin = isset( $_REQUEST['plugin'] ) ? sanitize_text_field( wp_unslash( $_REQUEST['plugin'] ) ) : null;
		if ( $requested_plugin !== $plugin ) {
			return false;
		}

		return true;
	}
}
