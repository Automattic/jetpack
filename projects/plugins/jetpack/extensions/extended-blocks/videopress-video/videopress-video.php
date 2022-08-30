<?php
/**
 * Register VideoPress Video block.
 *
 * @package automattic/jetpack
 **/

namespace Automattic\Jetpack\Extensions\VideoPress_Video;

use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Pkg_Initializer;

add_action(
	'init',
	function () {
		$is_extension_available = in_array( 'videopress/video', \Jetpack_Gutenberg::get_available_extensions(), true );
		$is_proxied             = function_exists( 'wpcom_is_proxied_request' ) ? wpcom_is_proxied_request() : false;
		if ( ! $is_extension_available && ! $is_proxied ) {
			return;
		}

		if ( ! method_exists( 'Automattic\Jetpack\VideoPress\Initializer', 'register_videopress_video_block' ) ) {
			return;
		}

		VideoPress_Pkg_Initializer::register_videopress_video_block();
	}
);
