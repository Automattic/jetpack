<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Tags testing.
 *
 * @package automattic/jetpack-meta-tags
 */

namespace Automattic\Jetpack\Meta_Tags;

use WorDBless\BaseTestCase;

/**
 * Tags testing.
 */
class Tags_Test extends BaseTestCase {
	/**
	 * The Tags class.
	 *
	 * @var Tags
	 */
	protected $tags;

	/**
	 * Set up before each test
	 *
	 * @before
	 */
	protected function set_up() {
		parent::setUp();
		$this->tags = new Tags();
	}

	/**
	 * Test that tags are converted properly.
	 *
	 * @covers \Automattic\Jetpack\Meta_Tags\Tags
	 */
	public function test_tags_are_converted_properly() {
		$tags = array(
			'og:title' => 'Test Case',
			'og:image' => 'https://example.com/image.jpg',
		);
		$html = $this->tags->render_tags( $tags, false );

		$expected = '<meta property="og:title" content="Test Case" />\n<meta property="og:image" content="https://example.com/image.jpg" />';

		$this->assertEquals( $html, $expected );
	}

	/**
	 * Test that tags are rendered properly.
	 *
	 * @covers \Automattic\Jetpack\Meta_Tags\Tags
	 */
	public function test_tags_are_rendered_properly() {
		$tags = array(
			'og:title' => 'Test Case',
			'og:image' => 'https://example.com/image.jpg',
		);

		ob_start();
		$this->tags->render_tags( $tags, true );
		$html = ob_get_clean();

		$expected = '<meta property="og:title" content="Test Case" />\n<meta property="og:image" content="https://example.com/image.jpg" />';

		$this->assertEquals( $html, $expected );
	}
}
