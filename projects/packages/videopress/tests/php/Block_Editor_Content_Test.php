<?php
/**
 * Tests for Block_Editor_Content.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;

/**
 * Tests that Block_Editor_Content registers the default_content handler in every
 * active context, not only when the standalone VideoPress plugin is present.
 */
class Block_Editor_Content_Test extends BaseTestCase {

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		parent::tear_down();
		remove_all_filters( 'default_content' );
		unset( $_GET['videopress_guid'], $_GET['_wpnonce'] ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	}

	/**
	 * init() must register the default_content filter even when the standalone
	 * VideoPress plugin class is absent (i.e. Jetpack plugin + module context).
	 *
	 * Runs in a separate process so the absent-class assertion cannot be
	 * polluted by another test in this suite that loaded the standalone stub.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_default_content_filter_registered_without_standalone_plugin() {
		$this->assertFalse(
			class_exists( 'Jetpack_VideoPress_Plugin', false ),
			'Pre-condition: standalone plugin class must not exist in this process.'
		);

		Block_Editor_Content::init();

		$this->assertNotFalse(
			has_filter( 'default_content', array( Block_Editor_Content::class, 'videopress_video_block_by_guid' ) ),
			'default_content filter must be registered even when the standalone plugin is not active.'
		);
	}

	/**
	 * videopress_video_block_by_guid() inserts the VideoPress block when a valid
	 * nonce and GUID are present in the query string.
	 */
	public function test_videopress_video_block_by_guid_injects_block_with_valid_nonce() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'vp_editor',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $user_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'draft',
			)
		);

		$_GET['videopress_guid'] = 'abcd1234'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$_GET['_wpnonce']        = wp_create_nonce( 'videopress-content-nonce' ); // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		$result = Block_Editor_Content::videopress_video_block_by_guid( '', get_post( $post_id ) );

		$this->assertStringContainsString( '<!-- wp:videopress/video {"guid":"abcd1234"} -->', $result );
		$this->assertStringContainsString( '<!-- /wp:videopress/video -->', $result );
	}

	/**
	 * videopress_video_block_by_guid() leaves content unchanged when the nonce is invalid.
	 */
	public function test_videopress_video_block_by_guid_no_injection_with_invalid_nonce() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'vp_editor2',
				'user_pass'  => 'password',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $user_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'draft',
			)
		);

		$_GET['videopress_guid'] = 'abcd1234'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$_GET['_wpnonce']        = 'bad-nonce'; // phpcs:ignore WordPress.Security.NonceVerification.Recommended

		$result = Block_Editor_Content::videopress_video_block_by_guid( '', get_post( $post_id ) );

		$this->assertSame( '', $result );
	}
}
