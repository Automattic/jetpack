<?php

if ( ! class_exists( 'Jetpack_SSO_Helpers' ) ) :

/**
 * A collection of helper functions used in the SSO module.
 *
 * @since 4.1.0
 */
class Jetpack_SSO_Helpers {
	/**
	 * Determine if the login form should be hidden or not
	 *
	 * @return bool
	 **/
	static function should_hide_login_form() {
		/**
		 * Remove the default log in form, only leave the WordPress.com log in button.
		 *
		 * @module sso
		 *
		 * @since 3.1.0
		 *
		 * @param bool get_option( 'jetpack_sso_remove_login_form', false ) Should the default log in form be removed. Default to false.
		 */
		return (bool) apply_filters( 'jetpack_remove_login_form', get_option( 'jetpack_sso_remove_login_form', false ) );
	}

	/**
	 * Returns a boolean value for whether logging in by matching the WordPress.com user email to a
	 * Jetpack site user's email is allowed.
	 *
	 * @return bool
	 */
	static function match_by_email() {
		$match_by_email = ( 1 == get_option( 'jetpack_sso_match_by_email', true ) ) ? true: false;
		$match_by_email = defined( 'WPCC_MATCH_BY_EMAIL' ) ? WPCC_MATCH_BY_EMAIL : $match_by_email;

		/**
		 * Link the local account to an account on WordPress.com using the same email address.
		 *
		 * @module sso
		 *
		 * @since 2.6.0
		 *
		 * @param bool $match_by_email Should we link the local account to an account on WordPress.com using the same email address. Default to false.
		 */
		return (bool) apply_filters( 'jetpack_sso_match_by_email', $match_by_email );
	}

	/**
	 * Returns a boolean for whether users are allowed to register on the Jetpack site with SSO,
	 * even though the site disallows normal registrations.
	 *
	 * @return bool
	 */
	static function new_user_override( $user_data = null ) {
		$new_user_override = defined( 'WPCC_NEW_USER_OVERRIDE' ) ? WPCC_NEW_USER_OVERRIDE : false;

		/**
		 * Allow users to register on your site with a WordPress.com account, even though you disallow normal registrations. 
		 * If you return a string that corresponds to a user role, the user will be given that role.
		 *
		 * @module sso
		 *
		 * @since 2.6.0
		 * @since 4.6   $user_data object is now passed to the jetpack_sso_new_user_override filter
		 *
		 * @param bool        $new_user_override Allow users to register on your site with a WordPress.com account. Default to false.
		 * @param object|null $user_data         An object containing the user data returned from WordPress.com.
		 */
		$role = apply_filters( 'jetpack_sso_new_user_override', $new_user_override, $user_data );

		if ( $role ) {
			if ( is_string( $role ) && get_role( $role ) ) {
				return $role;
			} else {
				return get_option( 'default_role' );
			}
		}

		return false;
	}

	/**
	 * Returns a boolean value for whether two-step authentication is required for SSO.
	 *
	 * @since 4.1.0
	 *
	 * @return bool
	 */
	static function is_two_step_required() {
		/**
		 * Is it required to have 2-step authentication enabled on WordPress.com to use SSO?
		 *
		 * @module sso
		 *
		 * @since 2.8.0
		 *
		 * @param bool get_option( 'jetpack_sso_require_two_step' ) Does SSO require 2-step authentication?
		 */
		return (bool) apply_filters( 'jetpack_sso_require_two_step', get_option( 'jetpack_sso_require_two_step', false ) );
	}

	/**
	 * Returns a boolean for whether a user that is attempting to log in will be automatically
	 * redirected to WordPress.com to begin the SSO flow.
	 *
	 * @return bool
	 */
	static function bypass_login_forward_wpcom() {
		/**
		 * Redirect the site's log in form to WordPress.com's log in form.
		 *
		 * @module sso
		 *
		 * @since 3.1.0
		 *
		 * @param bool false Should the site's log in form be automatically forwarded to WordPress.com's log in form.
		 */
		return (bool) apply_filters( 'jetpack_sso_bypass_login_forward_wpcom', false );
	}

	/**
	 * Returns a boolean for whether the SSO login form should be displayed as the default
	 * when both the default and SSO login form allowed.
	 *
	 * @since 4.1.0
	 *
	 * @return bool
	 */
	static function show_sso_login() {
		if ( self::should_hide_login_form() ) {
			return true;
		}

		/**
		 * Display the SSO login form as the default when both the default and SSO login forms are enabled.
		 *
		 * @module sso
		 *
		 * @since 4.1.0
		 *
		 * @param bool true Should the SSO login form be displayed by default when the default login form is also enabled?
		 */
		return (bool) apply_filters( 'jetpack_sso_default_to_sso_login', true );
	}

	/**
	 * Returns a boolean for whether the two step required checkbox, displayed on the Jetpack admin page, should be disabled.
	 *
	 * @since 4.1.0
	 *
	 * @return bool
	 */
	static function is_require_two_step_checkbox_disabled() {
		return (bool) has_filter( 'jetpack_sso_require_two_step' );
	}

	/**
	 * Returns a boolean for whether the match by email checkbox, displayed on the Jetpack admin page, should be disabled.
	 *
	 * @since 4.1.0
	 *
	 * @return bool
	 */
	static function is_match_by_email_checkbox_disabled() {
		return defined( 'WPCC_MATCH_BY_EMAIL' ) || has_filter( 'jetpack_sso_match_by_email' );
	}

	/**
	 * Returns an array of hosts that SSO will redirect to.
	 *
	 * Instead of accessing JETPACK__API_BASE within the method directly, we set it as the
	 * default for $api_base due to restrictions with testing constants in our tests.
	 *
	 * @since 4.3.0
	 * @since 4.6.0 Added public-api.wordpress.com as an allowed redirect
	 *
	 * @param array $hosts
	 * @param string $api_base
	 *
	 * @return array
	 */
	static function allowed_redirect_hosts( $hosts, $api_base = JETPACK__API_BASE ) {
		if ( empty( $hosts ) ) {
			$hosts = array();
		}

		$hosts[] = 'wordpress.com';
		$hosts[] = 'jetpack.wordpress.com';
		$hosts[] = 'public-api.wordpress.com';

		if ( false === strpos( $api_base, 'jetpack.wordpress.com/jetpack' ) ) {
			$base_url_parts = parse_url( esc_url_raw( $api_base ) );
			if ( $base_url_parts && ! empty( $base_url_parts[ 'host' ] ) ) {
				$hosts[] = $base_url_parts[ 'host' ];
			}
		}

		return array_unique( $hosts );
	}

	static function generate_user( $user_data ) {
		$username = $user_data->login;

		/**
		 * Determines how many times the SSO module can attempt to randomly generate a user.
		 *
		 * @module sso
		 *
		 * @since 4.3.2
		 *
		 * @param int 5 By default, SSO will attempt to random generate a user up to 5 times.
		 */
		$num_tries = intval( apply_filters( 'jetpack_sso_allowed_username_generate_retries', 5 ) );

		$tries = 0;
		while ( ( $exists = username_exists( $username ) ) && $tries++ < $num_tries ) {
			$username = $user_data->login . '_' . $user_data->ID . '_' . mt_rand();
		}

		if ( $exists ) {
			return false;
		}

		$password = wp_generate_password( 20 );
		$user_id  = wp_create_user( $username, $password, $user_data->email );
		$user     = get_userdata( $user_id );

		$user->display_name = $user_data->display_name;
		$user->first_name   = $user_data->first_name;
		$user->last_name    = $user_data->last_name;
		$user->url          = $user_data->url;
		$user->description  = $user_data->description;

		if ( isset( $user_data->role ) && $user_data->role ) {
			$user->role     = $user_data->role;
		}

		wp_update_user( $user );

		update_user_meta( $user->ID, 'wpcom_user_id', $user_data->ID );
		
		return $user;
	}

	static function extend_auth_cookie_expiration_for_sso() {
		/**
		 * Determines how long the auth cookie is valid for when a user logs in with SSO.
		 *
		 * @module sso
		 *
		 * @since 4.4.0
		 *
		 * @param int YEAR_IN_SECONDS
		 */
		return intval( apply_filters( 'jetpack_sso_auth_cookie_expirtation', YEAR_IN_SECONDS ) );
	}

	/**
	 * Determines if the SSO form should be displayed for the current action.
	 *
	 * @since 4.6.0
	 *
	 * @param string $action
	 *
	 * @return bool  Is SSO allowed for the current action?
	 */
	static function display_sso_form_for_action( $action ) {
		/**
		 * Allows plugins the ability to overwrite actions where the SSO form is allowed to be used.
		 *
		 * @module sso
		 *
		 * @since 4.6.0
		 *
		 * @param array $allowed_actions_for_sso
		 */
		$allowed_actions_for_sso = (array) apply_filters( 'jetpack_sso_allowed_actions', array(
			'login',
			'jetpack-sso',
			'jetpack_json_api_authorization',
		) );
		return in_array( $action, $allowed_actions_for_sso );
	}

	/**
	 * This method returns an environment array that is meant to simulate `$_REQUEST` when the initial
	 * JSON API auth request was made.
	 *
	 * @since 4.6.0
	 *
	 * @return array|bool
	 */
	static function get_json_api_auth_environment() {
		if ( empty( $_COOKIE['jetpack_sso_original_request'] ) ) {
			return false;
		}

		$original_request = esc_url_raw( $_COOKIE['jetpack_sso_original_request'] );

		$parsed_url = wp_parse_url( $original_request );
		if ( empty( $parsed_url ) || empty( $parsed_url['query'] ) ) {
			return false;
		}

		$args = array();
		wp_parse_str( $parsed_url['query'], $args );

		if ( empty( $args ) || empty( $args['action'] ) ) {
			return false;
		}

		if ( 'jetpack_json_api_authorization' != $args['action'] ) {
			return false;
		}

		return array_merge(
			$args,
			array( 'jetpack_json_api_original_query' => $original_request )
		);
	}
}

endif;
