<?php
/**
 * Tests that the channel's GUID lookup stays on its own site.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\VideoPress\Channel;
use WorDBless\BaseTestCase;

/**
 * Test suite for Channel's GUID lookup.
 */
class Channel_Data_Scoping_Test extends BaseTestCase {

	/**
	 * A VideoPress attachment.
	 *
	 * @param string $guid VideoPress GUID.
	 * @return int Attachment ID.
	 */
	private function video( $guid ) {
		$id = wp_insert_post(
			array(
				'post_type'      => 'attachment',
				'post_status'    => 'inherit',
				'post_mime_type' => Channel::MIME_TYPE,
				'post_title'     => $guid,
			)
		);
		update_post_meta( $id, 'videopress_guid', $guid );
		return $id;
	}

	/**
	 * WordPress.com's GUID lookup returns another blog's post ID; a local post with
	 * that ID but another GUID, or one that is not an attachment, is never used.
	 */
	public function test_attachment_id_only_returns_this_blogs_attachment_for_the_guid() {
		$local = $this->video( 'localGU1' );
		$page  = wp_insert_post(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'Not a video',
			)
		);

		set_transient( 'videopress_get_post_id_by_guid_localGU1', $local, HOUR_IN_SECONDS );
		set_transient( 'videopress_get_post_id_by_guid_remoteG1', $local, HOUR_IN_SECONDS );
		set_transient( 'videopress_get_post_id_by_guid_remoteG2', $page, HOUR_IN_SECONDS );

		$this->assertSame( $local, Channel::attachment_id( 'localGU1' ) );
		$this->assertSame( 0, Channel::attachment_id( 'remoteG1' ) );
		$this->assertSame( 0, Channel::attachment_id( 'remoteG2' ) );
	}
}
