<?php
/**
 * The VideoPress channel blocks.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Registers the server-side blocks a VideoPress channel theme builds its
 * pages from, and hands the editor the data their playlist pickers read.
 */
class Channel_Blocks {

	/**
	 * Blocks, by name, with their render method.
	 *
	 * @var array<string, string>
	 */
	const BLOCKS = array();

	/**
	 * Register the blocks. Like the All Playlists block, only where the Video Playlist block is.
	 *
	 * @param string|null $build_dir Directory holding each block's block.json; tests can point it at fixtures.
	 *
	 * @return void
	 */
	public static function register( $build_dir = null ) {
		if ( ! \WP_Block_Type_Registry::get_instance()->is_registered( Playlist_Index::BLOCK_NAME ) ) {
			return;
		}
		if ( null === $build_dir ) {
			$build_dir = __DIR__ . '/../build/block-editor/blocks';
		}

		foreach ( self::BLOCKS as $name => $method ) {
			$metadata_file = $build_dir . '/' . substr( $name, strlen( 'videopress/' ) ) . '/block.json';
			if ( ! file_exists( $metadata_file ) || \WP_Block_Type_Registry::get_instance()->is_registered( $name ) ) {
				continue;
			}
			register_block_type( $metadata_file, array( 'render_callback' => array( __CLASS__, $method ) ) );
		}

		if ( ! has_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor_data' ) ) ) {
			add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_editor_data' ) );
		}
	}

	/**
	 * Hand the editor the site's playlists, for the playlist pickers of the blocks that show one.
	 * An inline script rather than a REST route, so WordPress.com Simple's editor gets it too.
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
				'key'   => $playlist['key'],
				'title' => $playlist['title'],
			);
		}
		wp_add_inline_script(
			$handle,
			'window.videopressChannelEditor = ' . wp_json_encode( array( 'playlists' => $playlists ), JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ) . ';',
			'before'
		);
	}
}
