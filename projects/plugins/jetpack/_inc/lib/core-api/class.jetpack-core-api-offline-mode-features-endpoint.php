<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Offline Mode feature endpoint.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Status;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Returns dashboard data for Offline Mode.
 */
class Jetpack_Core_API_Offline_Mode_Features_Endpoint {
	/**
	 * Get Offline Mode feature data.
	 *
	 * @return WP_REST_Response
	 */
	public function process() {
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-offline-mode-features.php';

		return rest_ensure_response( Jetpack_Offline_Mode_Features::get_dashboard_data() );
	}

	/**
	 * Check request permissions.
	 *
	 * @return bool|WP_Error
	 */
	public function can_request() {
		if ( ! current_user_can( 'jetpack_manage_modules' ) ) {
			return new WP_Error(
				'invalid_permission_offline_mode_features',
				esc_html__( 'You do not have permission to view Offline Mode features.', 'jetpack' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		if ( ! ( new Status() )->is_offline_mode() ) {
			return new WP_Error(
				'offline_mode_inactive',
				esc_html__( 'Offline Mode is not active.', 'jetpack' ),
				array( 'status' => 403 )
			);
		}

		return true;
	}
}
