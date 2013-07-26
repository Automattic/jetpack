<?php

/**
 * Client = Plugin
 * Client Server = API Methods the Plugin must respond to
 *
 * @todo Roll this into Jetpack?  There's only one 'public' method now: ::authorize().
 */
class Jetpack_Client_Server {
	function authorize() {
		$data = stripslashes_deep( $_GET );

		$args = array();

		$redirect = isset( $data['redirect'] ) ? esc_url_raw( (string) $data['redirect'] ) : '';

		do {
			$jetpack = Jetpack::init();
			$role = $jetpack->translate_current_user_to_role();
			if ( !$role ) {
				Jetpack::state( 'error', 'no_role' );
				break;
			}

			$cap = $jetpack->translate_role_to_cap( $role );
			if ( !$cap ) {
				Jetpack::state( 'error', 'no_cap' );
				break;
			}

			check_admin_referer( "jetpack-authorize_{$role}_{$redirect}" );

			if ( !empty( $data['error'] ) ) {
				Jetpack::state( 'error', $data['error'] );
				break;
			}

			if ( empty( $data['state'] ) ) {
				Jetpack::state( 'error', 'no_state' );
				break;
			}

			if ( !ctype_digit( $data['state'] ) ) {
				Jetpack::state( 'error', 'invalid_state' );
				break;
			}

			$current_user_id = get_current_user_id();
			if ( $current_user_id != $data['state'] ) {
				Jetpack::state( 'error', 'wrong_state' );
				break;
			}

			if ( empty( $data['code'] ) ) {
				Jetpack::state( 'error', 'no_code' );
				break;
			}

			$token = $this->get_token( $data );

			if ( is_wp_error( $token ) ) {
				if ( $error = $token->get_error_code() )
					Jetpack::state( 'error', $error );
				else
					Jetpack::state( 'error', 'invalid_token' );

				Jetpack::state( 'error_description', $token->get_error_message() );

				break;
			}

			if ( !$token ) {
				Jetpack::state( 'error', 'no_token' );
				break;
			}

			$is_master_user = ! Jetpack::is_active();

			Jetpack::update_user_token( $current_user_id, sprintf( '%s.%d', $token, $current_user_id ), $is_master_user );


			if ( $is_master_user ) {
				Jetpack::state( 'message', 'authorized' );
			} else {
				Jetpack::state( 'message', 'linked' );
				// Don't activate anything since we are just connecting a user.
				break;
			}

			if ( $active_modules = Jetpack::get_option( 'active_modules' ) ) {
				Jetpack::delete_option( 'active_modules' );

				Jetpack::activate_default_modules( 999, 1, $active_modules );
			} else {
				Jetpack::activate_default_modules();
			}

			$jetpack->sync->register( 'noop' ); // Spawn a sync to make sure the Jetpack Servers know what modules are active.

			// Start nonce cleaner
			wp_clear_scheduled_hook( 'jetpack_clean_nonces' );
			wp_schedule_event( time(), 'hourly', 'jetpack_clean_nonces' );
		} while ( false );

		if ( wp_validate_redirect( $redirect ) ) {
			wp_safe_redirect( $redirect );
		} else {
			wp_safe_redirect( Jetpack::admin_url() );
		}

		exit;
	}

	public static function deactivate_plugin( $probable_file, $probable_title ) {
		if ( is_plugin_active( $probable_file ) ) {
			deactivate_plugins( $probable_file );
			return 1;
		} else {
			// If the plugin is not in the usual place, try looking through all active plugins.
			$active_plugins = get_option( 'active_plugins', array() );
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
		$jetpack = Jetpack::init();
		$role = $jetpack->translate_current_user_to_role();

		if ( !$role ) {
			return new Jetpack_Error( 'role', __( 'An administrator for this blog must set up the Jetpack connection.', 'jetpack' ) );
		}

		$client_secret = Jetpack_Data::get_access_token();
		if ( !$client_secret ) {
			return new Jetpack_Error( 'client_secret', __( 'You need to register your Jetpack before connecting it.', 'jetpack' ) );
		}

		$redirect = isset( $data['redirect'] ) ? esc_url_raw( (string) $data['redirect'] ) : '';

		$body = array(
			'client_id' => Jetpack::get_option( 'id' ),
			'client_secret' => $client_secret->secret,
			'grant_type' => 'authorization_code',
			'code' => $data['code'],
			'redirect_uri' => add_query_arg( array(
				'action' => 'authorize',
				'_wpnonce' => wp_create_nonce( "jetpack-authorize_{$role}_{$redirect}" ),
				'redirect' => $redirect ? urlencode( $redirect ) : false,
			), menu_page_url( 'jetpack', false ) ),
		);

		$args = array(
			'method' => 'POST',
			'body' => $body,
			'headers' => array(
				'Accept' => 'application/json',
			),
		);
		$response = Jetpack_Client::_wp_remote_request( Jetpack::fix_url_for_bad_hosts( Jetpack::api_url( 'token' ), $args ), $args );

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
		if ( !current_user_can( $cap ) )
			return new Jetpack_Error( 'scope', 'current_user_cannot', $code );

		return (string) $json->access_token;
	}
}
