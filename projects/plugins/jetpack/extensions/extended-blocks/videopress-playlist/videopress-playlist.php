<?php
/**
 * Register VideoPress Playlist block.
 *
 * @package automattic/jetpack
 **/

namespace Automattic\Jetpack\Extensions\VideoPress_Playlist;

use Automattic\Jetpack\VideoPress\Playlist_Block as VideoPress_Pkg_Playlist_Block;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Set the videopress/playlist block availability, depending on the site plan.
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_availability_for_plan( 'videopress/playlist' );
	}
);

// Register the videopress/playlist block.
add_action(
	'init',
	function () {
		$extensions                               = \Jetpack_Gutenberg::get_extensions();
		$is_videopress_playlist_extension_enabled = in_array( 'videopress/playlist', $extensions, true );

		if (
			$is_videopress_playlist_extension_enabled &&
			method_exists( 'Automattic\Jetpack\VideoPress\Playlist_Block', 'register' )
		) {
			VideoPress_Pkg_Playlist_Block::register();
		}
	}
);
