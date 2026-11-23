<?php
/**
 * Tests for the Defer_Fonts module.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Defer_Fonts;

use Automattic\Jetpack_Boost\Modules\Optimizations\Defer_Fonts\Defer_Fonts;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Functions;

/**
 * Class Defer_Fonts_Test
 */
class Defer_Fonts_Test extends Base_TestCase {

	protected function set_up() {
		parent::set_up();
		Functions\when( 'wp_json_encode' )->alias( 'json_encode' );
	}

	public function test_replaces_core_printer_at_the_same_priority() {
		add_action( 'wp_head', 'wp_print_font_faces', 50 );
		$module = new Defer_Fonts();

		$module->replace_core_font_faces();

		$this->assertFalse( has_action( 'wp_head', 'wp_print_font_faces' ) );
		$this->assertSame( 50, has_action( 'wp_head', array( $module, 'print_deferred_font_faces' ) ) );
	}

	public function test_sets_font_display_on_every_face_of_every_family() {
		$fonts = array(
			array(
				array(
					'font-family'  => 'Inter',
					'font-display' => 'fallback',
				),
			),
			array(
				array( 'font-family' => 'Cardo' ),
				array(
					'font-family' => 'Cardo',
					'font-style'  => 'italic',
				),
			),
		);

		$displays = array_column( array_merge( ...Defer_Fonts::with_font_display( $fonts, 'swap' ) ), 'font-display' );

		$this->assertSame( array( 'swap', 'swap', 'swap' ), $displays );
	}

	public function test_loader_script_cannot_be_closed_by_the_css() {
		$css = '@font-face{font-family:"</script><script>alert(1)</script>"}';

		$script = Defer_Fonts::get_loader_script( Defer_Fonts::extract_css( "<style class=\"wp-fonts-local\">\n$css\n</style>" ) );

		$this->assertStringNotContainsString( '</script>', $script );
		$this->assertStringContainsString( 'addEventListener("load",add)', $script );
	}
}
