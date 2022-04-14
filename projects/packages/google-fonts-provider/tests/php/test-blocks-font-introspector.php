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
			->shouldReceive( 'is_font_family_registered' )
			->with( 'Roboto' )
			->andReturn( true );

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
