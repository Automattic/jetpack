<?php
/**
 * Playlist routes for WordPress.com's REST plugin loader.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Registers the `wpcom/v3/videopress/playlists` routes on WordPress.com, where
 * the dashboard reaches them through the public API. Jetpack and Atomic sites
 * register the same routes from Rest_Controller.
 *
 * @phan-constructor-used-for-side-effects
 */
class WPCOM_REST_API_V3_Endpoint_VideoPress_Playlists {

	/**
	 * Constructor.
	 */
	public function __construct() {
		add_action( 'rest_api_init', array( Playlist_Manager::class, 'register_rest_routes' ) );
	}
}

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	wpcom_rest_api_v2_load_plugin( __NAMESPACE__ . '\\WPCOM_REST_API_V3_Endpoint_VideoPress_Playlists' );
}
