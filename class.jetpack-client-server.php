<?php

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Utils as Connection_Utils;
use Automattic\Jetpack\Roles;
use Automattic\Jetpack\Tracking;

/**
 * Client = Plugin
 * Client Server = API Methods the Plugin must respond to
 */
class Jetpack_Client_Server {

	/**
	 * Authorizations
	 */
	function client_authorize() {
		$data              = stripslashes_deep( $_GET );
		$data['auth_type'] = 'client';
		$roles             = new Roles();
		$role              = $roles->translate_current_user_to_role();
		$redirect          = isset( $data['redirect'] ) ? esc_url_raw( (string) $data['redirect'] ) : '';

		check_admin_referer( "jetpack-authorize_{$role}_{$redirect}" );

		$tracking = new Tracking();

		$manager = new Connection_Manager();
		$result  = $manager->authorize( $data );

		if ( is_wp_error( $result ) ) {
			Jetpack::state( 'error', $result->get_error_code() );

			$tracking->record_user_event(
				'jpc_client_authorize_fail',
				array(
					'error_code'    => $result->get_error_code(),
					'error_message' => $result->get_error_message(),
				)
			);
		} else {
			/**
			 * Fires after the Jetpack client is authorized to communicate with WordPress.com.
			 *
			 * @since 4.2.0
			 *
			 * @param int Jetpack Blog ID.
			 */
			do_action( 'jetpack_client_authorized', Jetpack_Options::get_option( 'id' ) );
		}

		if ( wp_validate_redirect( $redirect ) ) {
			// Exit happens below in $this->do_exit()
			wp_safe_redirect( $redirect );
		} else {
			// Exit happens below in $this->do_exit()
			wp_safe_redirect( Jetpack::admin_url() );
		}

		$tracking->record_user_event( 'jpc_client_authorize_success' );

		$this->do_exit();
	}

	/*
	 * @deprecated 8.0 Use Automattic\Jetpack\Connection\Manager::authorize() instead.
	 */
	function authorize( $data = array() ) {
		_deprecated_function( __METHOD__, 'jetpack-8.0', 'Automattic\\Jetpack\\Connection\\Manager::authorize' );
		$manager = new Connection_Manager();
		return $manager->authorize( $data );
	}

	public static function deactivate_plugin( $probable_file, $probable_title ) {
		include_once ABSPATH . 'wp-admin/includes/plugin.php';
		if ( is_plugin_active( $probable_file ) ) {
			deactivate_plugins( $probable_file );
			return 1;
		} else {
			// If the plugin is not in the usual place, try looking through all active plugins.
			$active_plugins = Jetpack::get_active_plugins();
			foreach ( $active_plugins as $plugin ) {
				$data = get_plugin_data( WP_PLUGIN_DIR . '/' . $plugin );
				if ( $data['Name'] == $probable_title ) {
					deactivate_plugins( $plugin );
					return 1;
				}
			}
		}

		return 0;
	}

	/**
	 * @deprecated since 8.0.0 Use Automattic\Jetpack\Connection\Manager::get_token() instead.
	 *
	 * @return object|WP_Error
	 */
	function get_token( $data ) {
		_deprecated_function( __METHOD__, 'jetpack-8.0', 'Automattic\\Jetpack\\Connection\\Manager\\get_token' );
		return Jetpack::connection()->get_token( $data );
	}

	/**
	 * Returns an instance of the Jetpack object.
	 *
	 * @return Automattic\Jetpack
	 */
	public function get_jetpack() {
		return Jetpack::init();
	}

	/**
	 * Kills the current process.
	 */
	public function do_exit() {
		exit;
	}
}
