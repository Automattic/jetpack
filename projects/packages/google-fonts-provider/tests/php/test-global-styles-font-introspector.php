<?php
/**
 * Tests the Global Styles fonts introspector.
 *
 * @package automattic/jetpack-google-fonts-provider
 */

use Automattic\Jetpack\Fonts\Introspectors\Global_Styles;
use Brain\Monkey;
use Brain\Monkey\Functions;
use PHPUnit\Framework\TestCase;

/**
 * Global Styles fonts introspector test suite.
 */
class Test_Global_Styles_Font_Introspector extends TestCase {
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
	 * Test that a font family used in block presets is enqueued.
	 */
	public function test_enqueues_block_preset_fonts() {
		$global_styles = array(
			'blocks' => array(
				array(
					'typography' => array(
						'fontFamily' => 'Roboto',
					),
				),
			),
		);

		Functions\expect( 'gutenberg_get_global_styles' )
			->once()
			->andReturn( $global_styles );

		$this->webfonts
			->shouldReceive( 'get_registered_webfonts' )
			->andReturn( array( 'roboto' => array() ) );

		Functions\expect( 'wp_enqueue_webfont' )
			->once()
			->with( 'Roboto' );

		$this->assertNull( Global_Styles::enqueue_global_styles_fonts() );
	}

	/**
	 * Test that font family used in element font presets is enqueued.
	 */
	public function test_enqueues_element_preset_fonts() {
		$global_styles = array(
			'elements' => array(
				array(
					'typography' => array(
						'fontFamily' => 'Arvo',
					),
				),
			),
		);

		Functions\expect( 'gutenberg_get_global_styles' )
			->once()
			->andReturn( $global_styles );

		$this->webfonts
			->shouldReceive( 'get_registered_webfonts' )
			->andReturn( array( 'arvo' => array() ) );

		Functions\expect( 'wp_enqueue_webfont' )
			->once()
			->with( 'Arvo' );

		$this->assertNull( Global_Styles::enqueue_global_styles_fonts() );
	}

	/**
	 * Test that a font family used in Global Styles text settings is enqueued.
	 */
	public function test_enqueues_typography_fonts() {
		$global_styles = array(
			'typography' => array(
				'fontFamily' => 'Lato',
			),
		);

		Functions\expect( 'gutenberg_get_global_styles' )
			->once()
			->andReturn( $global_styles );

		$this->webfonts
			->shouldReceive( 'get_registered_webfonts' )
			->andReturn( array( 'lato' => array() ) );

		Functions\expect( 'wp_enqueue_webfont' )
			->once()
			->with( 'Lato' );

		$this->assertNull( Global_Styles::enqueue_global_styles_fonts() );
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
