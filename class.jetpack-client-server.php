<?php

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
		$role              = Jetpack::translate_current_user_to_role();
		$redirect          = isset( $data['redirect'] ) ? esc_url_raw( (string) $data['redirect'] ) : '';

		check_admin_referer( "jetpack-authorize_{$role}_{$redirect}" );

		$result = $this->authorize( $data );
		if ( is_wp_error( $result ) ) {
			Jetpack::state( 'error', $result->get_error_code() );
			JetpackTracking::record_user_event( 'jpc_client_authorize_fail', array(
				'error_code' => $result->get_error_code(),
				'error_message' => $result->get_error_message()
			) );
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

		JetpackTracking::record_user_event( 'jpc_client_authorize_success' );

		$this->do_exit();
	}

	function authorize( $data = array() ) {
		$redirect = isset( $data['redirect'] ) ? esc_url_raw( (string) $data['redirect'] ) : '';

		$jetpack_unique_connection = Jetpack_Options::get_option( 'unique_connection' );
		// Checking if site has been active/connected previously before recording unique connection
		if ( ! $jetpack_unique_connection ) {
			// jetpack_unique_connection option has never been set
			$jetpack_unique_connection = array(
				'connected'     => 0,
				'disconnected'  => 0,
				'version'       => '3.6.1',
			);

			update_option( 'jetpack_unique_connection', $jetpack_unique_connection );

			//track unique connection
			$jetpack = $this->get_jetpack();

			$jetpack->stat( 'connections', 'unique-connection' );
			$jetpack->do_stats( 'server_side' );
		}

		// increment number of times connected
		$jetpack_unique_connection['connected'] += 1;
		Jetpack_Options::update_option( 'unique_connection', $jetpack_unique_connection );

		$role = Jetpack::translate_current_user_to_role();

		if ( ! $role ) {
			return new Jetpack_Error( 'no_role', 'Invalid request.', 400 );
		}

		$cap = Jetpack::translate_role_to_cap( $role );
		if ( ! $cap ) {
			return new Jetpack_Error( 'no_cap', 'Invalid request.', 400 );
		}

		if ( ! empty( $data['error'] ) ) {
			return new Jetpack_Error( $data['error'], 'Error included in the request.', 400 );
		}

		if ( ! isset( $data['state'] ) ) {
			return new Jetpack_Error( 'no_state', 'Request must include state.', 400 );
		}

		if ( ! ctype_digit( $data['state'] ) ) {
			return new Jetpack_Error( $data['error'], 'State must be an integer.', 400 );
		}

		$current_user_id = get_current_user_id();
		if ( $current_user_id != $data['state'] ) {
			return new Jetpack_Error( 'wrong_state', 'State does not match current user.', 400 );
		}

		if ( empty( $data['code'] ) ) {
			return new Jetpack_Error( 'no_code', 'Request must include an authorization code.', 400 );
		}

		$token = $this->get_token( $data );

		if ( is_wp_error( $token ) ) {
			$code = $token->get_error_code();
			if ( empty( $code ) ) {
				$code = 'invalid_token';
			}
			return new Jetpack_Error( $code, $token->get_error_message(), 400 );
		}

		if ( ! $token ) {
			return new Jetpack_Error( 'no_token', 'Error generating token.', 400 );
		}

		$is_master_user = ! Jetpack::is_active();

		Jetpack::update_user_token( $current_user_id, sprintf( '%s.%d', $token, $current_user_id ), $is_master_user );

		if ( ! $is_master_user ) {
			Jetpack::state( 'message', 'linked' );
			// Don't activate anything since we are just connecting a user.
			return 'linked';
		}

		// If redirect_uri is SSO, ensure SSO module is enabled
		parse_str( parse_url( $data['redirect_uri'], PHP_URL_QUERY ), $redirect_options );

		/** This filter is documented in class.jetpack-cli.php */
		$jetpack_start_enable_sso = apply_filters( 'jetpack_start_enable_sso', true );

		$activate_sso = (
			isset( $redirect_options['action'] ) &&
			'jetpack-sso' === $redirect_options['action'] &&
			$jetpack_start_enable_sso
		);
		$other_modules = $activate_sso
			? array( 'sso' )
			: array();

		$redirect_on_activation_error = ( 'client' === $data['auth_type'] ) ? true : false;
		if ( $active_modules = Jetpack_Options::get_option( 'active_modules' ) ) {
			Jetpack::delete_active_modules();

			Jetpack::activate_default_modules( 999, 1, array_merge( $active_modules, $other_modules ), $redirect_on_activation_error, false );
		} else {
			Jetpack::activate_default_modules( false, false, $other_modules, $redirect_on_activation_error, false );
		}

		// Since this is a fresh connection, be sure to clear out IDC options
		Jetpack_IDC::clear_all_idc_options();
		Jetpack_Options::delete_raw_option( 'jetpack_last_connect_url_check' );

		// Start nonce cleaner
		wp_clear_scheduled_hook( 'jetpack_clean_nonces' );
		wp_schedule_event( time(), 'hourly', 'jetpack_clean_nonces' );

		Jetpack::state( 'message', 'authorized' );
		return 'authorized';
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
		$role = Jetpack::translate_current_user_to_role();

		if ( ! $role ) {
			return new Jetpack_Error( 'role', __( 'An administrator for this blog must set up the Jetpack connection.', 'jetpack' ) );
		}

		$client_secret = Jetpack_Data::get_access_token();
		if ( ! $client_secret ) {
			return new Jetpack_Error( 'client_secret', __( 'You need to register your Jetpack before connecting it.', 'jetpack' ) );
		}

		$redirect = isset( $data['redirect'] ) ? esc_url_raw( (string) $data['redirect'] ) : '';
		$redirect_uri = ( 'calypso' === $data['auth_type'] )
			? $data['redirect_uri']
			: add_query_arg( array(
				'action' => 'authorize',
				'_wpnonce' => wp_create_nonce( "jetpack-authorize_{$role}_{$redirect}" ),
				'redirect' => $redirect ? urlencode( $redirect ) : false,
			), menu_page_url( 'jetpack', false ) );

		// inject identity for analytics
		$tracks_identity = jetpack_tracks_get_identity( get_current_user_id() );

		$body = array(
			'client_id' => Jetpack_Options::get_option( 'id' ),
			'client_secret' => $client_secret->secret,
			'grant_type' => 'authorization_code',
			'code' => $data['code'],
			'redirect_uri' => $redirect_uri,
			'_ui' => $tracks_identity['_ui'],
			'_ut' => $tracks_identity['_ut'],
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

		if ( $entity ) {
			$json = json_decode( $entity );
		} else {
			$json = false;
		}

		if ( 200 != $code || ! empty( $json->error ) ) {
			if ( empty( $json->error ) ) {
				return new Jetpack_Error( 'unknown', '', $code );
			}

			$error_description = isset( $json->error_description ) ? sprintf( __( 'Error Details: %s', 'jetpack' ), (string) $json->error_description ) : '';

			return new Jetpack_Error( (string) $json->error, $error_description, $code );
		}

		if ( empty( $json->access_token ) || ! is_scalar( $json->access_token ) ) {
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

		if ( Jetpack::sign_role( $role ) !== $json->scope ) {
			return new Jetpack_Error( 'scope', 'Invalid Scope', $code );
		}

		if ( ! $cap = Jetpack::translate_role_to_cap( $role ) ) {
			return new Jetpack_Error( 'scope', 'No Cap', $code );
		}

		if ( ! current_user_can( $cap ) ) {
			return new Jetpack_Error( 'scope', 'current_user_cannot', $code );
		}

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

	public function do_exit() {
		exit;
	}
}
