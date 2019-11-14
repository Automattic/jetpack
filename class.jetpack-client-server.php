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
	 * @return object|WP_Error
	 */
	function get_token( $data ) {
		$roles = new Roles();
		$role  = $roles->translate_current_user_to_role();

		if ( ! $role ) {
			return new Jetpack_Error( 'role', __( 'An administrator for this blog must set up the Jetpack connection.', 'jetpack' ) );
		}

		$client_secret = Jetpack_Data::get_access_token();
		if ( ! $client_secret ) {
			return new Jetpack_Error( 'client_secret', __( 'You need to register your Jetpack before connecting it.', 'jetpack' ) );
		}

		$redirect     = isset( $data['redirect'] ) ? esc_url_raw( (string) $data['redirect'] ) : '';
		$redirect_uri = ( 'calypso' === $data['auth_type'] )
			? $data['redirect_uri']
			: add_query_arg(
				array(
					'action'   => 'authorize',
					'_wpnonce' => wp_create_nonce( "jetpack-authorize_{$role}_{$redirect}" ),
					'redirect' => $redirect ? urlencode( $redirect ) : false,
				),
				menu_page_url( 'jetpack', false )
			);

		// inject identity for analytics
		$tracks          = new Automattic\Jetpack\Tracking();
		$tracks_identity = $tracks->tracks_get_identity( get_current_user_id() );

		$body = array(
			'client_id'     => Jetpack_Options::get_option( 'id' ),
			'client_secret' => $client_secret->secret,
			'grant_type'    => 'authorization_code',
			'code'          => $data['code'],
			'redirect_uri'  => $redirect_uri,
			'_ui'           => $tracks_identity['_ui'],
			'_ut'           => $tracks_identity['_ut'],
		);

		$args     = array(
			'method'  => 'POST',
			'body'    => $body,
			'headers' => array(
				'Accept' => 'application/json',
			),
		);
		$response = Client::_wp_remote_request( Connection_Utils::fix_url_for_bad_hosts( Jetpack::connection()->api_url( 'token' ) ), $args );

		if ( is_wp_error( $response ) ) {
			return new Jetpack_Error( 'token_http_request_failed', $response->get_error_message() );
		}

		$code   = wp_remote_retrieve_response_code( $response );
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

		if ( Jetpack::connection()->sign_role( $role ) !== $json->scope ) {
			return new Jetpack_Error( 'scope', 'Invalid Scope', $code );
		}

		$cap = $roles->translate_role_to_cap( $role );
		if ( ! $cap ) {
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
