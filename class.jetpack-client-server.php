<?php

/**
 * Client = Plugin
 * Client Server = API Methods the Plugin must respond to
 */
class Jetpack_Client_Server {

	function authorize( $data = false ) {
		if ( ! $data ) {
			$data = stripslashes_deep( $_GET );
		}

		$redirect = isset( $data['redirect'] ) ? esc_url_raw( (string) $data['redirect'] ) : '';

		$jetpack_unique_connection = Jetpack_Options::get_option( 'unique_connection' );
		// Checking if site has been active/connected previously before recording unique connection
		if ( ! $jetpack_unique_connection ) {
			// jetpack_unique_connection option has never been set
			$jetpack_unique_connection = array(
				'connected'     => 0,
				'disconnected'  => 0,
				'version'       => '3.6.1'
			);

			update_option( 'jetpack_unique_connection', $jetpack_unique_connection );

			//track unique connection
			$jetpack = Jetpack::init();

			$jetpack->stat( 'connections', 'unique-connection' );
			$jetpack->do_stats( 'server_side' );
		}

		// increment number of times connected
		$jetpack_unique_connection['connected'] += 1;
		Jetpack_Options::update_option( 'unique_connection', $jetpack_unique_connection );

		$authorize_error = array();
		$authorize_success = '';

		do {
			$jetpack = $this->get_jetpack();
			$role = $jetpack->translate_current_user_to_role();

			if ( ! $role ) {
				$authorize_error['code'] = 'no_role';
				break;
			}

			$cap = $jetpack->translate_role_to_cap( $role );
			if ( !$cap ) {
				$authorize_error['code'] = 'no_cap';
				break;
			}

			if ( isset( $data['remote'] ) ) {
				if ( ! wp_verify_nonce( $data['_wpnonce'], 'authorize' ) ) {
					$authorize_error['code'] = 'unauthorized';
				}
			} else {
				$this->check_admin_referer( "jetpack-authorize_{$role}_{$redirect}" );
			}

			if ( ! empty( $data['error'] ) ) {
				$authorize_error['code'] = $data['error'];
				break;
			}

			if ( empty( $data['state'] ) ) {
				$authorize_error['code'] = 'no_state';
				break;
			}

			if ( ! ctype_digit( $data['state'] ) && ! isset( $data['remote'] ) ) {
				$authorize_error['code'] = 'invalid_state';
				break;
			}

			$current_user_id = get_current_user_id();
			if ( $current_user_id != $data['state'] ) {
				$authorize_error['code'] = 'wrong_state';
				break;
			}

			if ( empty( $data['code'] ) ) {
				$authorize_error['code'] = 'no_code';
				break;
			}

			$token = $this->get_token( $data );

			if ( is_wp_error( $token ) ) {
				if ( $error = $token->get_error_code() )
					$authorize_error['code'] = $error;
				else
					$authorize_error['code'] = 'invalid_token';

				$authorize_error['description'] = $token->get_error_message();

				break;
			}

			if ( ! $token ) {
				$authorize_error['code'] = 'no_token';
				break;
			}

			$is_master_user = ! Jetpack::is_active();

			Jetpack::update_user_token( $current_user_id, sprintf( '%s.%d', $token, $current_user_id ), $is_master_user );


			if ( $is_master_user ) {
				$authorize_success = 'authorized';
			} else {
				$authorize_success = 'linked';
				// Don't activate anything since we are just connecting a user.
				break;
			}

			if ( $active_modules = Jetpack_Options::get_option( 'active_modules' ) ) {
				Jetpack_Options::delete_option( 'active_modules' );

				Jetpack::activate_default_modules( 999, 1, $active_modules );
			} else {
				Jetpack::activate_default_modules();
			}

			// Sync all registers options and constants
			/** This action is documented in class.jetpack.php */
			do_action( 'jetpack_sync_all_registered_options' );

			// Start nonce cleaner
			wp_clear_scheduled_hook( 'jetpack_clean_nonces' );
			wp_schedule_event( time(), 'hourly', 'jetpack_clean_nonces' );
		} while ( false );

		if ( isset( $data['remote'] ) ) {
			return array( 'error' => $authorize_error, 'result' => $authorize_success );
		} else {
			if ( isset( $authorize_error['code'] ) ) {
				Jetpack::state( 'error', $authorize_error['code'] );
			}

			if ( isset( $authorize_error['description'] ) ) {
				Jetpack::state( 'error_description', $authorize_error['description'] );
			}

			if ( ! empty( $authorize_success ) ) {
				Jetpack::state( 'message', $authorize_success );
			}
		}

		if ( wp_validate_redirect( $redirect ) ) {
			$this->wp_safe_redirect( $redirect );
		} else {
			$this->wp_safe_redirect( Jetpack::admin_url() );
		}

		$this->do_exit();
	}

	public static function deactivate_plugin( $probable_file, $probable_title ) {
		include_once( ABSPATH . 'wp-admin/includes/plugin.php' );
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
	 * @return object|WP_Error
	 */
	function get_token( $data ) {
		$jetpack = $this->get_jetpack();
		$role = $jetpack->translate_current_user_to_role();

		if ( !$role ) {
			return new Jetpack_Error( 'role', __( 'An administrator for this blog must set up the Jetpack connection.', 'jetpack' ) );
		}

		$client_secret = Jetpack_Data::get_access_token();
		if ( !$client_secret ) {
			return new Jetpack_Error( 'client_secret', __( 'You need to register your Jetpack before connecting it.', 'jetpack' ) );
		}

		$redirect = isset( $data['redirect'] ) ? esc_url_raw( (string) $data['redirect'] ) : '';

		if ( isset( $data['remote'] ) ) {
			$admin_url = add_query_arg( array( 'page' => 'jetpack' ), admin_url() . 'admin.php' );
			$nonce = $data['_wpnonce'];
		} else {
			$admin_url = menu_page_url( 'jetpack', false );
			$nonce = wp_create_nonce( "jetpack-authorize_{$role}_{$redirect}" );
		}

		$body = array(
			'client_id' => Jetpack_Options::get_option( 'id' ),
			'client_secret' => $client_secret->secret,
			'grant_type' => 'authorization_code',
			'code' => $data['code'],
			'redirect_uri' => add_query_arg( array(
				'action' => 'authorize',
				'_wpnonce' => $nonce,
				'redirect' => $redirect ? urlencode( $redirect ) : false,
			), $admin_url ),
		);

		$args = array(
			'method' => 'POST',
			'body' => $body,
			'headers' => array(
				'Accept' => 'application/json',
			),
		);
		$response = Jetpack_Client::_wp_remote_request( Jetpack::fix_url_for_bad_hosts( Jetpack::api_url( 'token' ) ), $args );

		if ( is_wp_error( $response ) ) {
			return new Jetpack_Error( 'token_http_request_failed', $response->get_error_message() );
		}

		$code = wp_remote_retrieve_response_code( $response );
		$entity = wp_remote_retrieve_body( $response );

		if ( $entity )
			$json = json_decode( $entity );
		else
			$json = false;

		if ( 200 != $code || !empty( $json->error ) ) {
			if ( empty( $json->error ) )
				return new Jetpack_Error( 'unknown', '', $code );

			$error_description = isset( $json->error_description ) ? sprintf( __( 'Error Details: %s', 'jetpack' ), (string) $json->error_description ) : '';

			return new Jetpack_Error( (string) $json->error, $error_description, $code );
		}

		if ( empty( $json->access_token ) || !is_scalar( $json->access_token ) ) {
			return new Jetpack_Error( 'access_token', '', $code );
		}

		if ( empty( $json->token_type ) || 'X_JETPACK' != strtoupper( $json->token_type ) ) {
			return new Jetpack_Error( 'token_type', '', $code );
		}

		if ( empty( $json->scope ) ) {
			return new Jetpack_Error( 'scope', 'No Scope', $code );
		}
		@list( $role, $hmac ) = explode( ':', $json->scope );
		if ( empty( $role ) || empty( $hmac ) ) {
			return new Jetpack_Error( 'scope', 'Malformed Scope', $code );
		}
		if ( $jetpack->sign_role( $role ) !== $json->scope ) {
			return new Jetpack_Error( 'scope', 'Invalid Scope', $code );
		}

		if ( !$cap = $jetpack->translate_role_to_cap( $role ) )
			return new Jetpack_Error( 'scope', 'No Cap', $code );
		if ( ! current_user_can( $cap ) )
			return new Jetpack_Error( 'scope', 'current_user_cannot', $code );

		/**
		 * Fires after user has successfully received an auth token.
		 *
		 * @since 3.9.0
		 */
		do_action( 'jetpack_user_authorized' );

		return (string) $json->access_token;
	}

	public function get_jetpack() {
		return Jetpack::init();
	}

	public function check_admin_referer( $action ) {
		return check_admin_referer( $action );
	}

	public function wp_safe_redirect( $redirect ) {
		return wp_safe_redirect( $redirect );
	}

	public function do_exit() {
		exit;
	}

}
