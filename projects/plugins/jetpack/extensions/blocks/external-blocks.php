<?php
/**
 * Register blocks defined by exteral projects
 *
 * @package automattic/jetpack
 **/

use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Pgk_Initializer;

add_action(
	'init',
	function () {
		VideoPress_Pgk_Initializer::register_videopress_block();
	}
);
