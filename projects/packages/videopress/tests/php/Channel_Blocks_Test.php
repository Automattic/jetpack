<?php
/**
 * Tests for the VideoPress Channel blocks.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Channel;
use Automattic\Jetpack\VideoPress\Channel_Blocks;
use Automattic\Jetpack\VideoPress\Channel_Data;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

/**
 * Test suite for Channel_Blocks. Separate processes for the same reason as Channel_Test.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Channel_Blocks_Test extends BaseTestCase {

	/**
	 * Attachment IDs by GUID, oldest first.
	 *
	 * @var array<string, int>
	 */
	private $videos = array();

	/**
	 * Three videos and one playlist holding the last two, on a channel site.
	 */
	protected function set_up() {
		require_once __DIR__ . '/../../src/utility-functions.php';
		add_filter( 'videopress_channel_enabled', '__return_true' );
		Channel::register();
		\WP_Block_Supports::$block_to_render = array(
			'blockName' => 'videopress/channel-details',
			'attrs'     => array(),
		);

		foreach ( array(
			'aaaaaaa1' => 'Northshire',
			'bbbbbbb2' => 'Goldshire',
			'ccccccc3' => 'Deadmines',
		) as $guid => $title ) {
			$id = wp_insert_post(
				array(
					'post_type'      => 'attachment',
					'post_status'    => 'inherit',
					'post_mime_type' => Channel::MIME_TYPE,
					'post_title'     => $title,
				)
			);
			update_post_meta( $id, 'videopress_guid', $guid );
			set_transient( 'videopress_get_post_id_by_guid_' . $guid, $id, HOUR_IN_SECONDS );
			set_transient(
				'jetpack_videopress_' . $guid,
				(object) array(
					'guid'        => $guid,
					'title'       => $title . ' episode',
					'description' => 'About ' . $title . '.',
					'poster'      => 'https://videos.files.wordpress.com/' . $guid . '/poster.jpg',
				),
				HOUR_IN_SECONDS
			);
			$this->videos[ $guid ] = $id;
		}

		$records = array();
		foreach ( array_reverse( $this->videos, true ) as $guid => $id ) {
			$records[] = array(
				'id'          => $id,
				'guid'        => $guid,
				'durationMs'  => 600000,
				'height'      => 1080,
				'publishedAt' => time() - $id,
			);
		}
		add_filter(
			'videopress_channel_videos',
			function () use ( $records ) {
				return $records;
			}
		);
		add_filter(
			'videopress_channel_video_views',
			function () {
				return array( $this->videos['ccccccc3'] => 1500 );
			}
		);

		$source = wp_insert_post(
			array(
				'post_title'  => 'Dungeons',
				'post_status' => 'publish',
			)
		);
		update_option(
			'videopress_playlist_index',
			array(
				'dungeons' => array(
					'title'       => 'Classic dungeons',
					'description' => 'Full clears.',
					'videos'      => array(
						array(
							'guid'       => 'bbbbbbb2',
							'durationMs' => 600000,
						),
						array(
							'guid'       => 'ccccccc3',
							'durationMs' => 600000,
						),
					),
					'post_id'     => $source,
				),
			)
		);
	}

	/**
	 * Reset globals.
	 */
	protected function tear_down() {
		\WP_Block_Supports::$block_to_render = null;
		unset( $GLOBALS['post'] );
		Channel_Data::reset();
	}

	/**
	 * The editor gets the playlists ( key and title ) for the pickers, before the playlist block's script.
	 */
	public function test_editor_data_lists_the_playlists() {
		wp_register_script( 'videopress-playlist-editor-test', 'https://example.org/editor.js', array(), '1', true );
		register_block_type( 'videopress/playlist', array( 'editor_script_handles' => array( 'videopress-playlist-editor-test' ) ) );

		Channel_Blocks::enqueue_editor_data();
		$this->assertFalse( wp_scripts()->get_data( 'videopress-playlist-editor-test', 'before' ), 'Only for people who can edit posts.' );

		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'channel-editor',
					'user_pass'  => 'password',
					'role'       => 'editor',
				)
			)
		);
		Channel_Blocks::enqueue_editor_data();
		$this->assertContains(
			'window.videopressChannelEditor = {"playlists":[{"key":"dungeons","title":"Classic dungeons"}]};',
			(array) wp_scripts()->get_data( 'videopress-playlist-editor-test', 'before' )
		);
	}
}
