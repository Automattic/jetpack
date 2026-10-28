<?php
/**
 * Register VideoPress Video block.
 *
 * @package automattic/jetpack
 **/

namespace Automattic\Jetpack\Extensions\VideoPress_Video;

use Automattic\Jetpack\VideoPress\Channel as VideoPress_Pkg_Channel;
use Automattic\Jetpack\VideoPress\Channel_Blocks as VideoPress_Pkg_Channel_Blocks;
use Automattic\Jetpack\VideoPress\Initializer as VideoPress_Pkg_Initializer;
use Automattic\Jetpack\VideoPress\Playlist_Index as VideoPress_Pkg_Playlist_Index;

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
 * @param string|null $playlist_metadata_file         Path to the playlist block.json; null uses the package default.
 * @param string|null $latest_videos_playlist_metadata_file Path to the latest videos playlist block.json; null uses the package default.
 */
function register_videopress_blocks( $playlist_metadata_file = null, $latest_videos_playlist_metadata_file = null ) {
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

	// Depends on the playlist block above: it registers only once that one is.
	if ( method_exists( 'Automattic\Jetpack\VideoPress\Initializer', 'register_videopress_latest_videos_playlist_block' ) ) {
		VideoPress_Pkg_Initializer::register_videopress_latest_videos_playlist_block( $latest_videos_playlist_metadata_file );
	}

	// The All Playlists block only registers once the playlist block has.
	if ( method_exists( 'Automattic\Jetpack\VideoPress\Initializer', 'register_videopress_all_playlists_block' ) ) {
		VideoPress_Pkg_Initializer::register_videopress_all_playlists_block();
	}

	// WordPress.com does not run the package initializer that keeps the playlist index current,
	// so the index starts wherever the playlist block is; hooking it twice is a no-op.
	if (
		method_exists( 'Automattic\Jetpack\VideoPress\Playlist_Index', 'init' ) &&
		\WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/playlist' )
	) {
		VideoPress_Pkg_Playlist_Index::init();
	}

	// The channel theme's blocks ( channel, video and playlist details, episode navigation ) and the playlist block's `source` also need the playlist block.
	if ( method_exists( 'Automattic\Jetpack\VideoPress\Channel_Blocks', 'register' ) ) {
		VideoPress_Pkg_Channel_Blocks::register();
	}
}
// Ignore the empty argument supplied by do_action( 'init' ) so metadata uses the package default.
add_action( 'init', __NAMESPACE__ . '\register_videopress_blocks', 10, 0 );

// The channel feature ( video durations and views, Query Loop filters, channel block
// bindings ) registers itself on init when the theme opts in; WordPress.com does not
// run the package initializer, so it starts here as well.
if ( method_exists( 'Automattic\Jetpack\VideoPress\Channel', 'init' ) ) {
	VideoPress_Pkg_Channel::init();
}

// Register the `v6-video-frame-poster` extension.
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( 'v6-video-frame-poster' );
	}
);
