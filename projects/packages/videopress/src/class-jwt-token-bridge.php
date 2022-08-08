<?php
/**
 * VideoPress Jwt_Token_Bridge
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Assets;

/**
 * VideoPress Jwt_Token_Bridge class.
 */
class Jwt_Token_Bridge {

	/**
	 * Initializer
	 *
	 * This method should be called only once by the Initializer class. Do not call this method again.
	 */
	public static function init() {

		if ( ! Status::is_active() ) {
			return;
		}

		add_action( 'wp_enqueue_scripts', array( __CLASS__, 'enqueue_jwt_token_bridge' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_jwt_token_bridge' ), 1 );

	}

	/**
	 * Enqueues the jwt bridge script.
	 */
	public static function enqueue_jwt_token_bridge() {
		global $post;
		$post_id = isset( $post->ID ) ? absint( $post->ID ) : 0;

		$bridge_url = Assets::get_file_url_for_environment(
			'js/videopress-token-bridge.js',
			'js/videopress-token-bridge.js',
			__FILE__
		);

		wp_enqueue_script(
			'media-video-jwt-bridge',
			$bridge_url,
			array(),
			Package_Version::PACKAGE_VERSION,
			false
		);

		wp_localize_script(
			'media-video-jwt-bridge',
			'videopressAjax',
			array(
				'ajaxUrl'   => admin_url( 'admin-ajax.php' ),
				'bridgeUrl' => $bridge_url,
				'post_id'   => $post_id,
			)
		);
	}
}
