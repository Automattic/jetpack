<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Test methods from Automattic\Jetpack\WPcom\Posts\Thumbnail
 *
 * @package automattic/jetpack-wpcom-posts
 */

namespace Automattic\Jetpack\WPcom\Posts;

use PHPUnit\Framework\TestCase;

/**
 * Class Test_Thumbnail
 */
class Test_Thumbnail extends TestCase {

	/**
	 * Checks that the thumbnail enhancements are initialized.
	 *
	 * @covers ::setup_thumbnail
	 */
	public function test_setup_thumbnail() {
		$this->assertEquals( 10, has_action( 'init', __NAMESPACE__ . '\setup_thumbnail' ) );
	}
}
