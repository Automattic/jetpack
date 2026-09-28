<?php
/**
 * Tests for the VideoPress XMLRPC class.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use PHPUnit\Framework\Attributes\BeforeClass;
use WorDBless\BaseTestCase;
use WorDBless\Posts;

/**
 * Class to test the VideoPress XMLRPC class.
 */
class XMLRPC_Test extends BaseTestCase {

	/**
	 * Sets up the test environment before the class tests begin.
	 *
	 * @beforeClass
	 */
	#[BeforeClass]
	public static function set_up_class() {
		require_once __DIR__ . '/../../src/utility-functions.php';
		Posts::init();
	}

	/**
	 * The media item title, description and caption supplied by the uploader are applied to the
	 * created attachment.
	 */
	public function test_create_media_item_uses_supplied_meta() {
		$media = array(
			array(
				'url'         => 'https://videopress.com/v/original-file-name.mp4',
				'title'       => 'Edited Library Title',
				'description' => 'Edited library description',
				'caption'     => 'Edited library caption',
			),
		);

		$post = XMLRPC::init()->create_media_item( $media )['media'][0]['post'];

		$this->assertSame( 'Edited Library Title', $post->post_title );
		$this->assertSame( 'Edited library description', $post->post_content );
		$this->assertSame( 'Edited library caption', $post->post_excerpt );
	}

	/**
	 * A supplied title of "0" is treated as a real title, not as a missing value.
	 */
	public function test_create_media_item_keeps_zero_string_title() {
		$media = array(
			array(
				'url'   => 'https://videopress.com/v/original-file-name.mp4',
				'title' => '0',
			),
		);

		$this->assertSame( '0', XMLRPC::init()->create_media_item( $media )['media'][0]['post']->post_title );
	}

	/**
	 * When no title is supplied, the attachment falls back to a title derived from the file name.
	 */
	public function test_create_media_item_falls_back_to_file_name() {
		$media = array(
			array(
				'url' => 'https://videopress.com/v/original-file-name.mp4',
			),
		);

		$result = XMLRPC::init()->create_media_item( $media );

		$this->assertSame( sanitize_title( 'original-file-name.mp4' ), $result['media'][0]['post']->post_title );
	}

	/**
	 * The VideoPress callbacks are added without dropping the methods Jetpack already registered.
	 */
	public function test_xmlrpc_methods_registers_videopress_callbacks() {
		$methods = XMLRPC::init()->xmlrpc_methods( array( 'existing.method' => '__return_true' ), array(), null );

		$this->assertSame( '__return_true', $methods['existing.method'] );
		$this->assertIsCallable( $methods['jetpack.createMediaItem'] );
		$this->assertIsCallable( $methods['jetpack.updateVideoPressMediaItem'] );
		$this->assertIsCallable( $methods['jetpack.updateVideoPressPosterImage'] );
	}

	/**
	 * A callback signed by a user creates the attachment as that user.
	 */
	public function test_create_media_item_runs_as_the_signing_user() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'videopress-uploader',
				'user_pass'  => 'password',
				'role'       => 'author',
			)
		);
		XMLRPC::init()->xmlrpc_methods( array(), array(), new \WP_User( $user_id ) );
		try {
			$post = XMLRPC::init()->create_media_item( array( array( 'url' => 'https://videopress.com/v/file.mp4' ) ) )['media'][0]['post'];

			$this->assertSame( $user_id, get_current_user_id() );
			$this->assertSame( $user_id, (int) $post->post_author );
		} finally {
			// The singleton keeps the signer, so reset it for later tests.
			XMLRPC::init()->xmlrpc_methods( array(), array(), new \WP_User( 0 ) );
			wp_set_current_user( 0 );
		}
	}
}
