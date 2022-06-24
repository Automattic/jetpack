<?php
/**
 * Tests the Blocks fonts introspector.
 *
 * @package automattic/jetpack-google-fonts-provider
 */

use Automattic\Jetpack\Fonts\Introspectors\Blocks;
use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

/**
 * Blocks fonts introspector test suite.
 */
class Test_Blocks_Font_Introspector extends TestCase {
	/**
	 * WP_Webfont instance.
	 *
	 * @var WP_Webfont
	 */
	protected $webfonts;

	/**
	 * Test setup.
	 *
	 * @before
	 */
	public function set_up() {
		Monkey\setUp();

		$this->webfonts = \Mockery::mock( 'WP_Webfonts' );

		Functions\stubs(
			array(
				'is_admin'    => false,
				'wp_webfonts' => $this->webfonts,
			)
		);
	}

	/**
	 * Test that a font family in block attributes is enqueued.
	 */
	public function test_enqueues_block_font_when_set() {
		$content      = 'foo';
		$parsed_block = array(
			'attrs' => array(
				'fontFamily' => 'Roboto',
			),
		);

		$this->webfonts
			->shouldReceive( 'get_registered_webfonts' )
			->andReturn( array( 'roboto' => array() ) );

		Functions\expect( 'wp_enqueue_webfont' )
			->once()
			->with( 'Roboto' );

		$this->assertEquals( $content, Blocks::enqueue_block_fonts( $content, $parsed_block ) );
	}

	/**
	 * Test that a block without font settings still returns the filtered content.
	 */
	public function test_does_not_enqueue_block_font_when_not_set() {
		$content      = 'foo';
		$parsed_block = array();

		Functions\expect( 'wp_enqueue_webfont' )
			->never();

		$this->assertEquals( $content, Blocks::enqueue_block_fonts( $content, $parsed_block ) );
	}

	/**
	 * Test teardown.
	 *
	 * @after
	 */
	public function tear_down() {
		Monkey\tearDown();
	}
}

// phpcs:disable

/**
 * Use stub so that method_exists checks will pass.
 *
 * This will not be needed if/when WP_Webfonts provides a check for
 * is_font_family_registered().
 *
 * @link https://github.com/WordPress/gutenberg/pull/39988
 * @link https://github.com/WordPress/gutenberg/blob/e94fffae0684aa5a6dc370ce3eba262cb77071d9/lib/experimental/class-wp-webfonts.php#L217
 */
class WP_Webfonts {
	public static function get_font_slug( $font ) {
		return strtolower( $font );
	}
}
