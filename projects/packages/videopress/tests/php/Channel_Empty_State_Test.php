<?php
/**
 * Tests for the channel blocks' empty states.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\All_Playlists_Block;
use Automattic\Jetpack\VideoPress\Channel;
use Automattic\Jetpack\VideoPress\Channel_Blocks;
use Automattic\Jetpack\VideoPress\Initializer;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

/**
 * Test suite for the `emptyState` attribute, on a channel site without videos or playlists.
 * Separate processes for the same reason as Channel_Test.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Channel_Empty_State_Test extends BaseTestCase {

	/**
	 * A channel site with no videos and no playlists.
	 */
	protected function set_up() {
		require_once __DIR__ . '/../../src/utility-functions.php';
		add_filter( 'videopress_channel_enabled', '__return_true' );
		add_filter( 'videopress_channel_videos', '__return_empty_array' );
		Channel::register();
		\WP_Block_Supports::$block_to_render = array(
			'blockName' => 'videopress/video-details',
			'attrs'     => array(),
		);
	}

	/**
	 * Log in a user with a role.
	 *
	 * @param string $role Role.
	 */
	private function log_in( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'channel-' . $role,
				'user_pass'  => 'password',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );
	}

	/**
	 * "none" renders nothing; "author" only for people who can act; "all" tells visitors too.
	 */
	public function test_modes_and_audiences() {
		$this->assertSame( '', Channel_Blocks::render_empty_state( 'videos', array() ) );
		$this->assertSame( '', Channel_Blocks::render_empty_state( 'videos', array( 'emptyState' => 'author' ) ) );

		$visitor = Channel_Blocks::render_empty_state( 'videos', array( 'emptyState' => 'all' ) );
		$this->assertStringContainsString( 'videopress-empty-state is-videos is-for-visitor', $visitor );
		$this->assertStringContainsString( 'No videos yet', $visitor );
		$this->assertStringNotContainsString( 'videopress-empty-state__action', $visitor );

		$this->log_in( 'contributor' );
		$this->assertSame( '', Channel_Blocks::render_empty_state( 'videos', array( 'emptyState' => 'author' ) ), 'Contributors cannot upload.' );
		$this->assertStringContainsString( 'is-for-author', Channel_Blocks::render_empty_state( 'playlists', array( 'emptyState' => 'author' ) ) );

		$this->log_in( 'author' );
		$author = Channel_Blocks::render_empty_state( 'videos', array( 'emptyState' => 'author' ), 'videopress-video-details' );
		$this->assertStringContainsString( 'videopress-video-details is-empty"', $author );
		$this->assertStringContainsString( 'Upload your first video', $author );
		$this->assertStringContainsString( 'href="' . esc_url( admin_url( 'media-new.php' ) ) . '"', $author );
	}

	/**
	 * Each block shows its empty state when the channel has nothing for it, and only when asked to.
	 */
	public function test_blocks_render_their_empty_state() {
		$this->log_in( 'administrator' );

		$this->assertStringContainsString(
			'is-videos is-for-author',
			Channel_Blocks::render_video_details(
				array(
					'source'     => 'latest',
					'emptyState' => 'author',
				)
			)
		);
		$this->assertSame( '', Channel_Blocks::render_video_details( array( 'emptyState' => 'author' ) ), 'The video page has no empty state.' );

		$this->assertStringContainsString(
			'is-playlists is-for-author',
			Channel_Blocks::render_playlist_details(
				array(
					'source'     => 'index',
					'emptyState' => 'author',
				)
			)
		);

		$latest = Initializer::render_videopress_latest_videos_playlist_block(
			array(
				'showBrowseControls' => true,
				'emptyState'         => 'all',
			)
		);
		$this->assertStringContainsString( 'Upload your first video', $latest );
		$this->assertStringNotContainsString( 'videopress-video-browser', $latest, 'No filters without videos to filter.' );
		$this->assertSame( '', Initializer::render_videopress_latest_videos_playlist_block( array( 'showBrowseControls' => true ) ) );

		$this->assertStringContainsString(
			'Create your first playlist',
			Initializer::render_videopress_playlist_block(
				array(
					'source'     => 'index',
					'emptyState' => 'author',
				)
			)
		);
		$this->assertStringContainsString( 'videopress-all-playlists is-empty', All_Playlists_Block::render( array( 'emptyState' => 'all' ) ) );
		$this->assertSame( '', All_Playlists_Block::render( array() ) );
	}
}
