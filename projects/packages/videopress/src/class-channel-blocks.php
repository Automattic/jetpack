<?php
/**
 * The VideoPress channel blocks.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Shared pieces of the blocks a VideoPress channel theme builds its pages
 * from: for now, the Video Playlist block's `source` ( a playlist published
 * on the site ) and the data its playlist picker reads in the editor.
 */
class Channel_Blocks {

	/**
	 * Resolve the Video Playlist block's `source` when it renders, and hand the editor the picker
	 * data. Like the All Playlists block, only where the Video Playlist block is; any theme.
	 *
	 * @return void
	 */
	public static function register() {
		if ( ! \WP_Block_Type_Registry::get_instance()->is_registered( Playlist_Index::BLOCK_NAME ) ) {
			return;
		}
		if ( ! has_filter( 'render_block_data', array( Channel::class, 'playlist_source_block' ) ) ) {
			add_filter( 'render_block_data', array( Channel::class, 'playlist_source_block' ) );
		}
		if ( ! has_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor_data' ) ) ) {
			add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor_data' ) );
		}
	}

	/**
	 * Hand the editor the site's playlists, most recently updated first, for the playlist pickers
	 * of the blocks that show one and for their canvas previews. An inline script rather than a
	 * REST route, so WordPress.com Simple's editor gets it too.
	 *
	 * @return void
	 */
	public static function enqueue_editor_data() {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return;
		}
		$handle = '';
		foreach ( array( Playlist_Index::BLOCK_NAME ) as $name ) {
			$block_type = \WP_Block_Type_Registry::get_instance()->get_registered( $name );
			if ( $block_type && ! empty( $block_type->editor_script_handles ) ) {
				$handle = $block_type->editor_script_handles[0];
				break;
			}
		}
		if ( '' === $handle ) {
			return;
		}

		$playlists = array();
		foreach ( Channel::playlists() as $playlist ) {
			$playlists[] = array(
				'key'    => $playlist['key'],
				'title'  => $playlist['title'],
				'videos' => $playlist['videos'],
			);
		}
		wp_add_inline_script(
			$handle,
			'window.videopressChannelEditor = ' . wp_json_encode( array( 'playlists' => $playlists ), JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ) . ';',
			'before'
		);
	}
}
