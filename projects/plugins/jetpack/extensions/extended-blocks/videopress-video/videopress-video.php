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

		/*
		 * This is a temporary solution to register the VideoPress Video block,
		 * until the next relase of Jetpack-on-dotcom happens.
		 * Todo: remove this code once the next release of Jetpack-on-dotcom lands.
		 */
		if ( method_exists( 'Automattic\Jetpack\VideoPress\Initializer', 'register_videopress_block' ) ) {
			return VideoPress_Pkg_Initializer::register_videopress_block();
		}

		if ( ! method_exists( 'Automattic\Jetpack\VideoPress\Initializer', 'register_videopress_video_block' ) ) {
			return;
		}

		VideoPress_Pkg_Initializer::register_videopress_video_block();
	}
);
