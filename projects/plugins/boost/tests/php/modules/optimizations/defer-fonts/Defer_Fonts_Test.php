<?php
/**
 * Tests for the Defer_Fonts module.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Defer_Fonts;

use Automattic\Jetpack_Boost\Modules\Optimizations\Defer_Fonts\Defer_Fonts;
use Automattic\Jetpack_Boost\Tests\Base_TestCase;
use Brain\Monkey\Filters;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\DataProvider;

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

		$displays = array_column( array_merge( ...Defer_Fonts::with_swap( $fonts ) ), 'font-display' );

		$this->assertSame( array( 'swap', 'swap', 'swap' ), $displays );
	}

	public function test_loader_script_cannot_be_closed_by_the_css() {
		$css = '@font-face{font-family:"</script><script>alert(1)</script>"}';

		$script = Defer_Fonts::get_loader_script( Defer_Fonts::extract_css( "<style class=\"wp-fonts-local\">\n$css\n</style>" ) );

		$this->assertStringNotContainsString( '</script>', $script );
		$this->assertStringContainsString( 'addEventListener("load",add)', $script );
	}

	/**
	 * @dataProvider excluded_family_cases
	 */
	#[DataProvider( 'excluded_family_cases' )]
	public function test_icon_fonts_are_left_to_load_normally( $filtered_prefixes, $expected_excluded ) {
		if ( null !== $filtered_prefixes ) {
			Filters\expectApplied( 'jetpack_boost_defer_fonts_excluded_families' )->andReturnUsing(
				function ( $prefixes ) use ( $filtered_prefixes ) {
					return array_merge( $prefixes, $filtered_prefixes );
				}
			);
		}

		$fonts = array();
		foreach ( array( 'Inter', '"Font Awesome 6 Free"', 'fontawesome', 'Material Icons' ) as $family ) {
			$fonts[ $family ] = array( array( 'font-family' => $family ) );
		}

		list( $deferred, $excluded ) = Defer_Fonts::split_excluded( $fonts );

		$this->assertSame( $expected_excluded, array_keys( $excluded ) );
		$this->assertSame( array_values( array_diff( array_keys( $fonts ), $expected_excluded ) ), array_keys( $deferred ) );
	}

	public static function excluded_family_cases() {
		return array(
			'Font Awesome by default'       => array( null, array( '"Font Awesome 6 Free"', 'fontawesome' ) ),
			'a site adds its own icon font' => array( array( 'Material Icons' ), array( '"Font Awesome 6 Free"', 'fontawesome', 'Material Icons' ) ),
		);
	}
}
