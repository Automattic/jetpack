<?php
/**
 * VideoPress Extensions
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Constants;

/**
 * VideoPress IFrame API
 */
class VideoPress_IFrame_API {

	/**
	 * The handle used to enqueue the script
	 *
	 * @var string
	 */
	const SCRIPT_HANDLE = 'videopress-iframe-api';

	const VIDEOPRESS_IFRAME_API_URL = 'https://video.wordpress.com/wp-content/plugins/video/assets/js/videojs/videopress-iframe-api.js';

	/**
	 * Initializer
	 *
	 * This method should be called only once by the Initializer class. Do not call this method again.
	 */
	public static function init() {
		if ( ! Status::is_active() ) {
			return;
		}

		// Register the script in the front-end context.
		add_action( 'enqueue_block_assets', array( __CLASS__, 'enqueue_script' ), 1 );
	}

	/**
	 * Enqueues the script
	 *
	 * @return void
	 */
	public static function enqueue_script() {
		// let's enqueue the script only when BETA blocks is enabled.
		if ( ! Constants::is_true( 'JETPACK_BETA_BLOCKS' ) ) {
			return;
		}

		return wp_enqueue_script(
			self::SCRIPT_HANDLE,
			self::VIDEOPRESS_IFRAME_API_URL,
			array(),
			Package_Version::PACKAGE_VERSION,
			false
		);
	}
}
