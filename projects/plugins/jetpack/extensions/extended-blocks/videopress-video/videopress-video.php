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
		$is_extension_available = \Jetpack_Gutenberg::is_extension_available( 'jetpack/videopress' );
		if ( ! $is_extension_available ) {
			return;
		}

		VideoPress_Pkg_Initializer::register_videopress_block();
	}
);
