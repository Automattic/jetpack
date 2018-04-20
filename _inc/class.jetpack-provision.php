<?php //phpcs:ignore

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
			// Anonymous functions were introduced in 5.3.0. So, if we're running on
			// >= 5.3.0, use an anonymous function to set the home/siteurl value%s.
			//
			// Otherwise, fallback to setting the home/siteurl value via the WP_HOME and
			// WP_SITEURL constants if the constant hasn't already been defined.
			if ( isset( $named_args[ $url_arg ] ) ) {
				if ( version_compare( phpversion(), '5.3.0', '>=' ) ) {
					add_filter( $url_arg, function() use ( $url_arg, $named_args ) {
						return $named_args[ $url_arg ];
					}, 11 );
				} elseif ( ! defined( $constant_name ) ) {
					define( $constant_name, $named_args[ $url_arg ] );
				}
			}
		}

		// If Jetpack is currently connected, and is not in Safe Mode already, kick off a sync of the current
		// functions/callables so that we can test if this site is in IDC.
		if ( Jetpack::is_active() && ! Jetpack::validate_sync_error_idc_option() && Jetpack_Sync_Actions::sync_allowed() ) {
			Jetpack_Sync_Actions::do_full_sync( array( 'functions' => true ) );
			Jetpack_Sync_Actions::$sender->do_full_sync();
		}

		if ( Jetpack::validate_sync_error_idc_option() ) {
			return new WP_Error(
				'site_in_safe_mode',
				__( 'Can not provision a plan while in safe mode. See: https://jetpack.com/support/safe-mode/', 'jetpack' )
			);
		}

		$blog_id = Jetpack_Options::get_option( 'id' );

		if ( ! $blog_id || ! Jetpack_Options::get_option( 'blog_token' ) || ( isset( $named_args['force_register'] ) && intval( $named_args['force_register'] ) ) ) {
			// This code mostly copied from Jetpack::admin_page_load.
			Jetpack::maybe_set_version_option();
			$registered = Jetpack::try_registration();
			if ( is_wp_error( $registered ) ) {
				return $registered;
			} elseif ( ! $registered ) {
				return new WP_Error( 'registration_error', __( 'There was an unspecified error registering the site', 'jetpack' ) );
			}

			$blog_id = Jetpack_Options::get_option( 'id' );
		}

		// If the user isn't specified, but we have a current master user, then set that to current user.
		$master_user_id = Jetpack_Options::get_option( 'master_user' );
		if ( ! get_current_user_id() && $master_user_id ) {
			wp_set_current_user( $master_user_id );
		}

		$site_icon = ( function_exists( 'has_site_icon' ) && has_site_icon() )
			? get_site_icon_url()
			: false;

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
			$role        = Jetpack::translate_current_user_to_role();
			$signed_role = Jetpack::sign_role( $role );

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
}
