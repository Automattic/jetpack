<?php
/**
 * Tests for VideoPress playback authorization.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WorDBless\BaseTestCase;

/**
 * Authorization test suite for Access_Control::is_current_user_authed_for_video.
 */
class Video_Authorization_Test extends BaseTestCase {

	/**
	 * Clean up after each test.
	 */
	protected function tear_down() {
		wp_set_current_user( 0 );
		\WorDBless\Posts::init()->clear_all_posts();
	}

	/**
	 * A subscriber passing a post_id that has no relationship to the requested guid
	 * must not be authorized, even though the user can read that post.
	 */
	public function test_subscriber_with_unrelated_post_id_is_denied_for_private_video() {
		$guid = 'aBcDeF12';
		$this->create_private_videopress_attachment( $guid );
		$unrelated = wp_insert_post(
			array(
				'post_title'   => 'Unrelated',
				'post_content' => 'No video embedded here.',
				'post_status'  => 'publish',
			)
		);
		$this->set_current_user_role( 'subscriber' );

		$this->assertFalse( Access_Control::instance()->is_current_user_authed_for_video( $guid, $unrelated ) );
	}

	/**
	 * A post whose content contains a [videopress GUID] shortcode is a legitimate embedding context.
	 */
	public function test_subscriber_with_shortcode_embedded_post_id_is_authorized_for_private_video() {
		$guid = 'sHoRt123';
		$this->create_private_videopress_attachment( $guid );
		$embedding = wp_insert_post(
			array(
				'post_title'   => 'Shortcode embed',
				'post_content' => 'Intro [videopress ' . $guid . '] trailing.',
				'post_status'  => 'publish',
			)
		);
		$this->set_current_user_role( 'subscriber' );

		$this->assertTrue( Access_Control::instance()->is_current_user_authed_for_video( $guid, $embedding ) );
	}

	/**
	 * A core/embed block whose URL points at a VideoPress video is a legitimate embedding context.
	 */
	public function test_subscriber_with_videopress_url_embed_post_id_is_authorized_for_private_video() {
		$guid = 'eMbEd123';
		$this->create_private_videopress_attachment( $guid );
		$embedding = wp_insert_post(
			array(
				'post_title'   => 'oEmbed VideoPress URL',
				'post_content' => '<figure><div>https://videopress.com/v/' . $guid . '</div></figure>',
				'post_status'  => 'publish',
			)
		);
		$this->set_current_user_role( 'subscriber' );

		$this->assertTrue( Access_Control::instance()->is_current_user_authed_for_video( $guid, $embedding ) );
	}

	/**
	 * A file-host VideoPress URL (as produced by the core [video] shortcode override) is a legitimate embedding context.
	 */
	public function test_subscriber_with_file_host_videopress_url_embed_post_id_is_authorized_for_private_video() {
		$guid = 'fIleUrl1';
		$this->create_private_videopress_attachment( $guid );
		$embedding = wp_insert_post(
			array(
				'post_title'   => 'File-host VideoPress URL',
				'post_content' => '<figure><div>https://videos.videopress.com/' . $guid . '/original.mp4</div></figure>',
				'post_status'  => 'publish',
			)
		);
		$this->set_current_user_role( 'subscriber' );

		$this->assertTrue( Access_Control::instance()->is_current_user_authed_for_video( $guid, $embedding ) );
	}

	/**
	 * A guid that appears only as a substring of an unrelated URL must not be accepted as proof.
	 */
	public function test_subscriber_is_denied_when_guid_appears_only_in_unrelated_url() {
		$guid = 'uRlOnly1';
		$this->create_private_videopress_attachment( $guid );
		$embedding = wp_insert_post(
			array(
				'post_title'   => 'Unrelated URL',
				'post_content' => 'See https://example.com/path/' . $guid . '/extra for details.',
				'post_status'  => 'publish',
			)
		);
		$this->set_current_user_role( 'subscriber' );

		$this->assertFalse( Access_Control::instance()->is_current_user_authed_for_video( $guid, $embedding ) );
	}

	/**
	 * The [wpvideo GUID] legacy shortcode is also a legitimate embedding context.
	 */
	public function test_subscriber_with_wpvideo_shortcode_embedded_post_id_is_authorized_for_private_video() {
		$guid = 'wPvDo123';
		$this->create_private_videopress_attachment( $guid );
		$embedding = wp_insert_post(
			array(
				'post_title'   => 'Legacy shortcode',
				'post_content' => '[wpvideo ' . $guid . ']',
				'post_status'  => 'publish',
			)
		);
		$this->set_current_user_role( 'subscriber' );

		$this->assertTrue( Access_Control::instance()->is_current_user_authed_for_video( $guid, $embedding ) );
	}

	/**
	 * A shortcode that carries the requested guid as a named attribute (not the positional
	 * video id) must not be accepted as proof of embedding.
	 */
	public function test_subscriber_is_denied_when_guid_appears_only_as_named_shortcode_attribute() {
		$guid = 'nAmEd123';
		$this->create_private_videopress_attachment( $guid );
		$post_with_guid_as_attr_name = wp_insert_post(
			array(
				'post_title'   => 'Guid as attribute name',
				'post_content' => '[videopress other-video ' . $guid . '="1"]',
				'post_status'  => 'publish',
			)
		);
		$this->set_current_user_role( 'subscriber' );

		$this->assertFalse( Access_Control::instance()->is_current_user_authed_for_video( $guid, $post_with_guid_as_attr_name ) );
	}

	/**
	 * A guid whose shortcode appears inside post content but for a DIFFERENT guid
	 * must not authorize a forged request.
	 */
	public function test_subscriber_with_post_embedding_different_guid_is_denied() {
		$target_guid = 'tArGet12';
		$other_guid  = 'oThEr123';
		$this->create_private_videopress_attachment( $target_guid );
		$this->create_private_videopress_attachment( $other_guid );
		$post_with_other_video = wp_insert_post(
			array(
				'post_title'   => 'Embeds a different video',
				'post_content' => '[videopress ' . $other_guid . ']',
				'post_status'  => 'publish',
			)
		);
		$this->set_current_user_role( 'subscriber' );

		$this->assertFalse( Access_Control::instance()->is_current_user_authed_for_video( $target_guid, $post_with_other_video ) );
	}

	/**
	 * Supplying post_id = 0 against a private video must deny access.
	 */
	public function test_subscriber_with_zero_post_id_is_denied_for_private_video() {
		$guid = 'zEr01234';
		$this->create_private_videopress_attachment( $guid );
		$this->set_current_user_role( 'subscriber' );

		$this->assertFalse( Access_Control::instance()->is_current_user_authed_for_video( $guid, 0 ) );
	}

	/**
	 * Public videos must remain accessible no matter what post_id the caller supplies.
	 */
	public function test_public_video_is_authorized_regardless_of_post_id() {
		$guid = 'pUbL1234';
		$this->create_public_videopress_attachment( $guid );
		$unrelated = wp_insert_post(
			array(
				'post_title'   => 'Unrelated',
				'post_content' => 'Nothing.',
				'post_status'  => 'publish',
			)
		);
		$this->set_current_user_role( 'subscriber' );

		$this->assertTrue( Access_Control::instance()->is_current_user_authed_for_video( $guid, $unrelated ) );
	}

	/**
	 * Users with upload_files continue to short-circuit to authorized for any guid.
	 */
	public function test_author_with_upload_files_is_authorized_via_shortcut() {
		$guid = 'aUtHr123';
		$this->create_private_videopress_attachment( $guid );
		$unrelated = wp_insert_post(
			array(
				'post_title'   => 'Unrelated',
				'post_content' => 'No video.',
				'post_status'  => 'publish',
			)
		);
		$this->set_current_user_role( 'author' );

		$this->assertTrue( Access_Control::instance()->is_current_user_authed_for_video( $guid, $unrelated ) );
	}

	/**
	 * When the guid does not correspond to any known attachment, access is denied.
	 */
	public function test_unknown_guid_is_denied() {
		$this->set_current_user_role( 'subscriber' );

		$this->assertFalse( Access_Control::instance()->is_current_user_authed_for_video( 'nOwHeRe0', 0 ) );
	}

	/**
	 * Create a VideoPress attachment with a given privacy setting.
	 *
	 * @param string $guid            The VideoPress guid to associate.
	 * @param int    $privacy_setting The privacy setting constant to seed.
	 * @return int The attachment post id.
	 */
	private function create_videopress_attachment( $guid, $privacy_setting ) {
		$attachment_id = (int) wp_insert_post(
			array(
				'post_title'     => $guid,
				'post_status'    => 'inherit',
				'post_type'      => 'attachment',
				'post_mime_type' => 'video/videopress',
			)
		);
		update_post_meta( $attachment_id, 'videopress_guid', $guid );
		wp_update_attachment_metadata(
			$attachment_id,
			array(
				'videopress' => array(
					'privacy_setting' => $privacy_setting,
				),
			)
		);

		// WorDBless does not fully emulate WP_Query meta_query; seed the guid->id cache that
		// videopress_get_post_id_by_guid() consults before querying.
		set_transient( 'videopress_get_post_id_by_guid_' . $guid, $attachment_id, HOUR_IN_SECONDS );
		wp_cache_delete( 'get_post_by_guid_' . $guid, 'videopress' );

		return $attachment_id;
	}

	/**
	 * Create a private VideoPress attachment.
	 *
	 * @param string $guid The VideoPress guid.
	 * @return int The attachment post id.
	 */
	private function create_private_videopress_attachment( $guid ) {
		return $this->create_videopress_attachment( $guid, \VIDEOPRESS_PRIVACY::IS_PRIVATE );
	}

	/**
	 * Create a public VideoPress attachment.
	 *
	 * @param string $guid The VideoPress guid.
	 * @return int The attachment post id.
	 */
	private function create_public_videopress_attachment( $guid ) {
		return $this->create_videopress_attachment( $guid, \VIDEOPRESS_PRIVACY::IS_PUBLIC );
	}

	/**
	 * Create a user with the given role and set as current user.
	 *
	 * @param string $role The user role.
	 */
	private function set_current_user_role( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => $role . '_user',
				'user_pass'  => 'pass',
				'user_email' => $role . '@test.com',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );
	}
}
