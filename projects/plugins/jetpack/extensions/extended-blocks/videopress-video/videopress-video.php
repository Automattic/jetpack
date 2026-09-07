<?php
/**
 * Register VideoPress Video block.
 *
 * @package automattic/jetpack
 **/

namespace Automattic\Jetpack\Extensions\VideoPress_Video;

use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Pkg_Initializer;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

// Set the videopress/video block availability, depending on the site plan.
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_availability_for_plan( 'videopress/video' );
	}
);

/**
 * Register the VideoPress blocks.
 *
 * Named so tests can invoke it directly without re-running the global init action.
 *
 * @param string|null $playlist_metadata_file Path to the playlist block.json; null uses the package default.
 */
function register_videopress_blocks( $playlist_metadata_file = null ) {
	$extensions                            = \Jetpack_Gutenberg::get_extensions();
	$is_videopress_video_extension_enabled = in_array( 'videopress/video', $extensions, true );

	if (
		$is_videopress_video_extension_enabled &&
		method_exists( 'Automattic\Jetpack\VideoPress\Initializer', 'register_videopress_video_block' )
	) {
		VideoPress_Pkg_Initializer::register_videopress_video_block();
	}

	// The playlist block has its own VideoPress-module-active guard inside
	// register_videopress_playlist_block(), so register it unconditionally here.
	if ( method_exists( 'Automattic\Jetpack\VideoPress\Initializer', 'register_videopress_playlist_block' ) ) {
		VideoPress_Pkg_Initializer::register_videopress_playlist_block( $playlist_metadata_file );
	}
}
// Ignore the empty argument supplied by do_action( 'init' ) so metadata uses the package default.
add_action( 'init', __NAMESPACE__ . '\register_videopress_blocks', 10, 0 );

// Register the `v6-video-frame-poster` extension.
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( 'v6-video-frame-poster' );
	}
);
