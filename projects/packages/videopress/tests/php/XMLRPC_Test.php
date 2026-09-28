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
}
