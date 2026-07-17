<?php
/**
 * VideoPress Features Endpoint
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\My_Jetpack\Product;
use Automattic\Jetpack\Status\Host;

/**
 * VideoPress REST API class for fetching site features from WPCOM.
 */
class VideoPress_Rest_Api_V1_Features {
	/**
	 * Initializes the endpoints
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'rest_api_init', array( static::class, 'register_rest_endpoints' ) );
	}

	/**
	 * Register the REST API routes.
	 *
	 * @return void
	 */
	public static function register_rest_endpoints() {
		register_rest_route(
			'videopress/v1',
			'features',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => static::class . '::get_features',
				'permission_callback' => static::class . '::permissions_callback',
			)
		);
	}

	/**
	 * Checks whether the user has permissions to see the features.
	 *
	 * @return boolean
	 */
	public static function permissions_callback() {
		return current_user_can( 'read' );
	}

	/**
	 * Returns VideoPress feature flags fetched fresh from WPCOM.
	 *
	 * Uses My Jetpack's Product::get_site_features_from_wpcom() which calls
	 * WPCOM /sites/%d/features API with a 15-second transient cache.
	 *
	 * @return \WP_REST_Response The response object.
	 */
	public static function get_features() {
		$features = Product::get_site_features_from_wpcom();

		if ( is_wp_error( $features ) ) {
			return rest_ensure_response( $features );
		}

		$active = $features['active'] ?? array();

		return rest_ensure_response(
			array(
				'isVideoPressSupported'          => true, // Always true due to free tier.
				// Check videopress-1tb-storage (Jetpack) or videopress (WordPress.com).
				'isVideoPress1TBSupported'       => in_array( 'videopress-1tb-storage', $active, true )
					|| ( ( new Host() )->is_wpcom_platform() && in_array( 'videopress', $active, true ) ),
				'isVideoPressUnlimitedSupported' => in_array( 'videopress-unlimited-storage', $active, true ),
			)
		);
	}
}
