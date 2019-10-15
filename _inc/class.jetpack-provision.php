<?php //phpcs:ignore

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Roles;
use Automattic\Jetpack\Sync\Actions;

class Jetpack_Provision { //phpcs:ignore

	/**
	 * Responsible for checking pre-conditions, registering site, and returning an array of details
	 * that can be used to provision a plan for the site.
	 *
	 * @param array $named_args The array of arguments.
	 *
	 * @return WP_Error|array
	 */
	public static function register_and_build_request_body( $named_args ) {
		$url_args = array(
			'home_url' => 'WP_HOME',
			'site_url' => 'WP_SITEURL',
		);

		foreach ( $url_args as $url_arg => $constant_name ) {
			if ( isset( $named_args[ $url_arg ] ) ) {
				add_filter(
					$url_arg,
					function() use ( $url_arg, $named_args ) {
						return $named_args[ $url_arg ];
					},
					11
				);
			}
		}

		// If Jetpack is currently connected, and is not in Safe Mode already, kick off a sync of the current
		// functions/callables so that we can test if this site is in IDC.
		if ( Jetpack::is_active() && ! Jetpack::validate_sync_error_idc_option() && Actions::sync_allowed() ) {
			Actions::do_full_sync( array( 'functions' => true ) );
			Actions::$sender->do_full_sync();
		}

		if ( Jetpack::validate_sync_error_idc_option() ) {
			return new WP_Error(
				'site_in_safe_mode',
				__( 'Can not provision a plan while in safe mode. See: https://jetpack.com/support/safe-mode/', 'jetpack' )
			);
		}


		if ( ! Jetpack::connection()->is_registered() || ( isset( $named_args['force_register'] ) && intval( $named_args['force_register'] ) ) ) {
			// This code mostly copied from Jetpack::admin_page_load.
			Jetpack::maybe_set_version_option();
			$registered = Jetpack::try_registration();
			if ( is_wp_error( $registered ) ) {
				return $registered;
			} elseif ( ! $registered ) {
				return new WP_Error( 'registration_error', __( 'There was an unspecified error registering the site', 'jetpack' ) );
			}
		}

		// If the user isn't specified, but we have a current master user, then set that to current user.
		$master_user_id = Jetpack_Options::get_option( 'master_user' );
		if ( ! get_current_user_id() && $master_user_id ) {
			wp_set_current_user( $master_user_id );
		}

		$site_icon = get_site_icon_url();

		$auto_enable_sso = ( ! Jetpack::is_active() || Jetpack::is_module_active( 'sso' ) );

		/** This filter is documented in class.jetpack-cli.php */
		if ( apply_filters( 'jetpack_start_enable_sso', $auto_enable_sso ) ) {
			$redirect_uri = add_query_arg(
				array(
					'action'      => 'jetpack-sso',
					'redirect_to' => rawurlencode( admin_url() ),
				),
				wp_login_url() // TODO: come back to Jetpack dashboard?
			);
		} else {
			$redirect_uri = admin_url();
		}

		$request_body = array(
			'jp_version'   => JETPACK__VERSION,
			'redirect_uri' => $redirect_uri,
		);

		if ( $site_icon ) {
			$request_body['site_icon'] = $site_icon;
		}

		if ( get_current_user_id() ) {
			$user = wp_get_current_user();

			// Role.
			$roles       = new Roles();
			$role        = $roles->translate_current_user_to_role();
			$signed_role = Jetpack::connection()->sign_role( $role );

			$secrets = Jetpack::init()->generate_secrets( 'authorize' );

			// Jetpack auth stuff.
			$request_body['scope']  = $signed_role;
			$request_body['secret'] = $secrets['secret_1'];

			// User stuff.
			$request_body['user_id']    = $user->ID;
			$request_body['user_email'] = $user->user_email;
			$request_body['user_login'] = $user->user_login;
		}

		// Optional additional params.
		if ( isset( $named_args['wpcom_user_id'] ) && ! empty( $named_args['wpcom_user_id'] ) ) {
			$request_body['wpcom_user_id'] = $named_args['wpcom_user_id'];
		}

		// Override email of selected user.
		if ( isset( $named_args['wpcom_user_email'] ) && ! empty( $named_args['wpcom_user_email'] ) ) {
			$request_body['user_email'] = $named_args['wpcom_user_email'];
		}

		if ( isset( $named_args['plan'] ) && ! empty( $named_args['plan'] ) ) {
			$request_body['plan'] = $named_args['plan'];
		}

		if ( isset( $named_args['onboarding'] ) && ! empty( $named_args['onboarding'] ) ) {
			$request_body['onboarding'] = intval( $named_args['onboarding'] );
		}

		if ( isset( $named_args['force_connect'] ) && ! empty( $named_args['force_connect'] ) ) {
			$request_body['force_connect'] = intval( $named_args['force_connect'] );
		}

		if ( isset( $request_body['onboarding'] ) && (bool) $request_body['onboarding'] ) {
			Jetpack::create_onboarding_token();
		}

		return $request_body;
	}

	/**
	 * Given an access token and an array of arguments, will provision a plan for this site.
	 *
	 * @param string $access_token The access token from the partner.
	 * @param array  $named_args   The arguments used for registering the site and then provisioning a plan.
	 *
	 * @return WP_Error|array
	 */
	public static function partner_provision( $access_token, $named_args ) {
		// First, verify the token.
		$verify_response = self::verify_token( $access_token );

		if ( is_wp_error( $verify_response ) ) {
			return $verify_response;
		}

		$request_body = self::register_and_build_request_body( $named_args );
		if ( is_wp_error( $request_body ) ) {
			return $request_body;
		}

		$request = array(
			'headers' => array(
				'Authorization' => "Bearer $access_token",
				'Host'          => 'public-api.wordpress.com',
			),
			'timeout' => 60,
			'method'  => 'POST',
			'body'    => wp_json_encode( $request_body ),
		);

		$blog_id = Jetpack_Options::get_option( 'id' );
		$url     = esc_url_raw( sprintf(
			'https://%s/rest/v1.3/jpphp/%d/partner-provision',
			self::get_api_host(),
			$blog_id
		) );
		if ( ! empty( $named_args['partner_tracking_id'] ) ) {
			$url = esc_url_raw( add_query_arg( 'partner_tracking_id', $named_args['partner_tracking_id'], $url ) );
		}

		// Add calypso env if set.
		$calypso_env = Jetpack::get_calypso_env();
		if ( ! empty( $calypso_env ) ) {
			$url = add_query_arg( array( 'calypso_env' => $calypso_env ), $url );
		}

		$result = Client::_wp_remote_request( $url, $request );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$response_code = wp_remote_retrieve_response_code( $result );
		$body_json     = json_decode( wp_remote_retrieve_body( $result ) );

		if ( 200 !== $response_code ) {
			if ( isset( $body_json->error ) ) {
				return new WP_Error( $body_json->error, $body_json->message );
			} else {
				return new WP_Error(
					'server_error',
					/* translators: %s is an HTTP status code retured from an API request. Ex. – 400 */
					sprintf( __( 'Request failed with code %s', 'jetpack' ), $response_code )
				);
			}
		}

		if ( isset( $body_json->access_token ) && is_user_logged_in() ) {
			// Check if this matches the existing token before replacing.
			$existing_token = Jetpack_Data::get_access_token( get_current_user_id() );
			if ( empty( $existing_token ) || $existing_token->secret !== $body_json->access_token ) {
				self::authorize_user( get_current_user_id(), $body_json->access_token );
			}
		}

		return $body_json;
	}

	private static function authorize_user( $user_id, $access_token ) {
		// authorize user and enable SSO
		Jetpack::update_user_token( $user_id, sprintf( '%s.%d', $access_token, $user_id ), true );

		/**
		 * Auto-enable SSO module for new Jetpack Start connections
		 *
		 * @since 5.0.0
		 *
		 * @param bool $enable_sso Whether to enable the SSO module. Default to true.
		 */
		$other_modules = apply_filters( 'jetpack_start_enable_sso', true )
			? array( 'sso' )
			: array();

		if ( $active_modules = Jetpack_Options::get_option( 'active_modules' ) ) {
			Jetpack::delete_active_modules();
			Jetpack::activate_default_modules( 999, 1, array_merge( $active_modules, $other_modules ), false );
		} else {
			Jetpack::activate_default_modules( false, false, $other_modules, false );
		}
	}

	private static function verify_token( $access_token ) {
		$request = array(
			'headers' => array(
				'Authorization' => "Bearer " . $access_token,
				'Host'          => 'public-api.wordpress.com',
			),
			'timeout' => 10,
			'method'  => 'POST',
			'body'    => ''
		);

		$url = sprintf( 'https://%s/rest/v1.3/jpphp/partner-keys/verify', self::get_api_host() );
		$result = Client::_wp_remote_request( $url, $request );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$response_code = wp_remote_retrieve_response_code( $result );
		$body_json     = json_decode( wp_remote_retrieve_body( $result ) );

		if( 200 !== $response_code ) {
			if ( isset( $body_json->error ) ) {
				return new WP_Error( $body_json->error, $body_json->message );
			} else {
				return new WP_Error( 'server_error', sprintf( __( 'Request failed with code %s', 'jetpack' ), $response_code ) );
			}
		}

		return true;
	}

	private static function get_api_host() {
		$env_api_host = getenv( 'JETPACK_START_API_HOST', true ); // phpcs:ignore PHPCompatibility.FunctionUse.NewFunctionParameters.getenv_local_onlyFound
		return $env_api_host ? $env_api_host : JETPACK__WPCOM_JSON_API_HOST;
	}
}
