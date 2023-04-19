<?php
/**
 * Authentication functionality for the REST API.
 *
 * @package Automattic\Jetpack_CRM\REST_API
 */

namespace Automattic\Jetpack_CRM\REST_API\Util;

use WP_Error;
use WP_REST_Request;
use WP_User;

defined( 'ABSPATH' ) || exit;

/**
 * Handles API action authorization.
 *
 * Default authentication method is AUTH_API.
 *
 * @package Automattic\Jetpack_CRM\REST_API
 */
class Authentication {
	/**
	 * Public auth method.
	 *
	 * Any endpoint with this will be completely open and no authentication will be required to execute it.
	 *
	 * @var string
	 */
	const AUTH_NONE = 'none';

	/**
	 * Accepts a public and secret API key combination as the basic auth header argument.
	 *
	 * @var string
	 */
	const AUTH_API = 'api';

	/**
	 * Regular WP user (authenticated via the WP login cookie)
	 *
	 * This auth method requires individual capability checks. We only check if the user is logged in or not.
	 *
	 * @var string
	 */
	const AUTH_USER = 'user';

	/**
	 * Get the authenticated entity for the specified request.
	 *
	 * @param WP_REST_Request $request The request instace.
	 * @return WP_User|null|WP_Error
	 */
	public function get_authenticated_entity( WP_REST_Request $request ) {
		$attributes  = $request->get_attributes();
		$auth_method = $attributes['auth_method'] ? $attributes['auth_method'] : static::AUTH_API;

		switch ( $auth_method ) {
			case static::AUTH_API:
				return $this->auth_api( $request );

			case static::AUTH_USER:
				return $this->auth_user( $request );
		}

		return null;
	}

	/**
	 * Filter the REST response making sure route-specific authentication is satisfied before proceeding.
	 *
	 * @param mixed           $response The response to filter.
	 * @param WP_REST_Request $request The request instance.
	 * @return mixed
	 */
	public function apply_rules( $response, WP_REST_Request $request ) {
		$attributes  = $request->get_attributes();
		$auth_method = $attributes['auth_method'] ? $attributes['auth_method'] : static::AUTH_USER;

		// This endpoint requires no auth at all.
		if ( static::AUTH_NONE === $auth_method ) {
			return $response;
		}

		$authenticated_entity = $this->get_authenticated_entity( $request );

		if ( is_wp_error( $authenticated_entity ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to do that.', 'zero-bs-crm' ),
				array(
					'status'         => 403,
					'reason_code'    => $authenticated_entity->get_error_code(),
					'reason_message' => $authenticated_entity->get_error_message(),
				)
			);
		}

		// We return 403 to avoid leaking sensitive data when:
		// - Authentication checks did not pass.
		// - An unknown auth method was declared.
		if ( empty( $authenticated_entity ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'Sorry, you are not allowed to do that.', 'zero-bs-crm' ),
				array(
					'status' => 403,
				)
			);
		}

		return $response;
	}

	/**
	 * Determine if request is made by a valid WP user.
	 *
	 * This method guarantees that the request is made by an authenticated WP user,
	 * but does not guarantee that user has any specific privileges or capabilities.
	 *
	 * @param WP_REST_Request $request The request to authenticate.
	 * @return WP_User|WP_Error
	 */
	public function auth_user( WP_REST_Request $request ) {
		if ( ! is_user_logged_in() ) {
			return new WP_Error(
				'user_authentication_required',
				__( 'User authentication required.', 'zero-bs-crm' )
			);
		}

		$attributes            = $request->get_attributes();
		$required_capabilities = $attributes['user_capabilities'] ? $attributes['user_capabilities'] : array( 'administrator' );
		$user                  = wp_get_current_user();

		if ( is_string( $required_capabilities ) ) {
			$required_capabilities = array( $required_capabilities );
		}

		$roles = wp_get_current_user()->roles;
		foreach ( $required_capabilities as $capability ) {
			if ( in_array( $capability, $roles, true ) ) {
				return $user;
			}
		}

		return new WP_Error(
			'unauthorized',
			__( 'User does not have capabilities to use this endpoint.', 'zero-bs-crm' )
		);
	}

	/**
	 * Determine if request is using recognized authentication credentials (basic auth).
	 *
	 * @todo Refactor this to use OAuth2 bearer tokens with scopes.
	 *
	 * @param WP_REST_Request $request The request to authenticate.
	 * @return bool True if the request is authenticated, false otherwise.
	 */
	public function auth_api( WP_REST_Request $request ) {
		$possible_api_key    = null;
		$possible_api_secret = null;

		$basic_auth_header = $request->get_header( 'authorization' );
		if ( ! empty( $basic_auth_header ) ) {
			$auth_parts = explode( ' ', $basic_auth_header );
			if ( count( $auth_parts ) === 2 && strtolower( $auth_parts[0] ) === 'basic' ) {
				// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
				$auth_parts = explode( ':', base64_decode( $auth_parts[1] ) );
				if ( count( $auth_parts ) === 2 ) {
					$possible_api_key    = sanitize_text_field( $auth_parts[0] );
					$possible_api_secret = sanitize_text_field( $auth_parts[1] );
				}
			}
		}

		if (
			! empty( $possible_api_key ) &&
			! empty( $possible_api_secret ) &&
			hash_equals( $possible_api_key, zeroBSCRM_getAPIKey() ) &&
			hash_equals( $possible_api_secret, zeroBSCRM_getAPISecret() )
		) {
			return true;
		}

		return new WP_Error(
			'incorrect_authentication_header',
			__( 'Invalid authentication header provided.', 'zero-bs-crm' )
		);
	}

}
