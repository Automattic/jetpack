<?php
/**
 * Tests for the VideoPress Channel feature.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Channel;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

/**
 * Test suite for Channel. Separate processes for the same reason as
 * Playlist_Block_Test. The dbless environment answers no WP_Query, so the
 * GUID lookup and the video details are served from their transients.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Channel_Test extends BaseTestCase {

	/**
	 * Enable the feature and register it, as `init` would on a channel theme.
	 */
	protected function set_up() {
		require_once __DIR__ . '/../../src/utility-functions.php';
		add_filter( 'videopress_channel_enabled', '__return_true' );
		Channel::register();
	}

	/**
	 * Undo registration.
	 */
	protected function tear_down() {
		remove_filter( 'videopress_channel_enabled', '__return_true' );
		$_GET = array();
		unset( $GLOBALS['post'] );
	}

	/**
	 * Create a VideoPress attachment whose GUID lookup and VideoPress metadata
	 * are pre-cached, as they would be after one API round trip.
	 *
	 * @param string $guid  VideoPress GUID.
	 * @param string $title Title.
	 * @return int Attachment ID.
	 */
	private function video( $guid, $title = 'A video' ) {
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
				'guid'   => $guid,
				'title'  => $title . ' ( VideoPress )',
				'poster' => 'https://videos.files.wordpress.com/' . $guid . '/poster.jpg',
			),
			HOUR_IN_SECONDS
		);
		return $id;
	}

	/**
	 * The feature stays off without theme support or the filter.
	 */
	public function test_disabled_by_default() {
		remove_filter( 'videopress_channel_enabled', '__return_true' );
		$this->assertFalse( Channel::is_enabled() );
		add_filter( 'videopress_channel_enabled', '__return_true' );
		$this->assertTrue( Channel::is_enabled() );
	}

	/**
	 * Registration adds the query vars and the hooks; nothing is stored on the blog.
	 */
	public function test_register() {
		$this->assertContains( 'v', Channel::query_vars( array() ) );
		$this->assertNotFalse( has_action( 'parse_request', array( Channel::class, 'route_video_page' ) ) );
		$this->assertNotFalse( has_filter( 'render_block_data', array( Channel::class, 'queried_video_block' ) ) );
		$this->assertFalse( registered_meta_key_exists( 'post', 'videopress_duration', 'attachment' ) );
	}

	/**
	 * GUIDs and attachments map both ways, and only VideoPress attachments count.
	 */
	public function test_guid_and_url() {
		$id = $this->video( 'abcDEF12', 'Into the Deadmines' );

		$this->assertSame( 'abcDEF12', Channel::guid( $id ) );
		$this->assertSame( $id, Channel::attachment_id( 'abcDEF12' ) );
		$this->assertSame( 0, Channel::attachment_id( 'nope' ) );
		$this->assertSame( home_url( '/videopress?v=abcDEF12' ), Channel::video_url( $id ) );

		$text = wp_insert_post(
			array(
				'post_title'  => 'Text',
				'post_status' => 'publish',
			)
		);
		$this->assertSame( '', Channel::guid( $text ) );
		$this->assertSame( '', Channel::video_url( $text ) );
	}

	/**
	 * Attachment links and player-less playlist entries point to the video page.
	 */
	public function test_links() {
		$id = $this->video( 'abcDEF12' );

		$this->assertSame( home_url( '/videopress?v=abcDEF12' ), Channel::attachment_link( 'https://example.com/?attachment_id=' . $id, $id ) );
		$this->assertSame( 'https://x.test/keep', Channel::attachment_link( 'https://x.test/keep', 999999 ) );
		$this->assertSame( home_url( '/videopress?v=abcDEF12' ), Channel::playlist_entry_url( 'https://videopress.com/v/abcDEF12', 'abcDEF12' ) );
		$this->assertSame( 'https://videopress.com/v/zzzzzzzz', Channel::playlist_entry_url( 'https://videopress.com/v/zzzzzzzz', 'zzzzzzzz' ) );
	}

	/**
	 * `/videopress?v=<guid>` routes to the attachment; unknown GUIDs 404.
	 */
	public function test_video_page_routing() {
		$id = $this->video( 'abcDEF12' );

		$wp          = new \WP();
		$wp->request = 'videopress';
		$_GET['v']   = 'abcDEF12';
		Channel::route_video_page( $wp );
		$this->assertSame( $id, $wp->query_vars['attachment_id'] );
		$this->assertSame( 1, $wp->query_vars[ Channel::QUERY_VAR ] );

		$wp          = new \WP();
		$wp->request = 'videopress';
		$_GET['v']   = 'nope';
		Channel::route_video_page( $wp );
		$this->assertSame( array( 'error' => '404' ), $wp->query_vars );

		$wp             = new \WP();
		$wp->request    = 'about';
		$wp->query_vars = array( 'pagename' => 'about' );
		Channel::route_video_page( $wp );
		$this->assertSame( array( 'pagename' => 'about' ), $wp->query_vars );

		set_query_var( Channel::QUERY_VAR, 1 );
		$this->assertSame( array( 'videopress-video.php', 'attachment.php' ), Channel::template_hierarchy( array( 'attachment.php' ) ) );
		set_query_var( Channel::QUERY_VAR, 0 );
		$this->assertSame( array( 'attachment.php' ), Channel::template_hierarchy( array( 'attachment.php' ) ) );
	}

	/**
	 * A video block with useQueriedVideo plays the current video, with its
	 * title and poster from VideoPress.
	 */
	public function test_queried_video_block() {
		$id              = $this->video( 'abcDEF12', 'Into the Deadmines' );
		$GLOBALS['post'] = get_post( $id ); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited

		$block = Channel::queried_video_block(
			array(
				'blockName' => 'videopress/video',
				'attrs'     => array( 'useQueriedVideo' => true ),
			)
		);
		$this->assertSame( 'abcDEF12', $block['attrs']['guid'] );
		$this->assertSame( $id, $block['attrs']['id'] );
		$this->assertSame( 'Into the Deadmines ( VideoPress )', $block['attrs']['title'] );
		$this->assertSame( 'https://videos.files.wordpress.com/abcDEF12/poster.jpg', $block['attrs']['poster'] );
		$this->assertSame( '', get_post_meta( $id, 'videopress_duration', true ) );

		$fixed = array(
			'blockName' => 'videopress/video',
			'attrs'     => array( 'guid' => 'ghiJKL34' ),
		);
		$this->assertSame( $fixed, Channel::queried_video_block( $fixed ) );

		$GLOBALS['post'] = get_post(
			wp_insert_post(
				array(
					'post_title'  => 'Text',
					'post_status' => 'publish',
				)
			)
		); // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
		$none            = Channel::queried_video_block(
			array(
				'blockName' => 'videopress/video',
				'attrs'     => array( 'useQueriedVideo' => true ),
			)
		);
		$this->assertSame( '', $none['attrs']['guid'] );
	}
}
