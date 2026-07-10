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
	 * The media item title supplied by the uploader is used as the attachment post_title.
	 */
	public function test_create_media_item_uses_supplied_title() {
		$media = array(
			array(
				'url'   => 'https://videopress.com/v/original-file-name.mp4',
				'title' => 'Edited Library Title',
			),
		);

		$result = XMLRPC::init()->create_media_item( $media );

		$this->assertSame( 'Edited Library Title', $result['media'][0]['post']->post_title );
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
