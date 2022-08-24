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
		if ( ! $is_extension_available ) {
			return;
		}
		VideoPress_Pkg_Initializer::register_videopress_block();

	}
);
