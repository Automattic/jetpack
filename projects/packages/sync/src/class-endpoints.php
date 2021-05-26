<?php
/**
 * Sync package.
 *
 * @package  automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

/**
 * This class will handle Sync v4 REST Endpoints.
 *
 * @since 9.9.0
 */
class Endpoints {

	/**
	 * Initialize REST routes.
	 */
	public function initialize_rest_api() {

		// Confirm that a site in identity crisis should be in staging mode.
		register_rest_route(
			'jetpack/v4',
			'/sync/full-sync-start',
			array(
				'methods'             => WP_REST_Server::EDITABLE,
				'callback'            => __CLASS__ . '::verify_default_permissions',
				'permission_callback' => __CLASS__ . '::full_sync_start',
			)
		);

	}

	/**
	 * Verify that request has default permissions to perform sync actions.
	 *
	 * @since 9.9.0
	 *
	 * @return bool Whether user has capability 'manage_options' or a blog token is used.
	 */
	public static function identity_crisis_mitigation_permission_check() {
		if ( current_user_can( 'manage_options' ) ) { // TODO || check for valid blog token.
			return true;
		}

		return new WP_Error( 'invalid_user_permission_sync', self::$user_permissions_error_msg, array( 'status' => rest_authorization_required_code() ) );
	}

}
