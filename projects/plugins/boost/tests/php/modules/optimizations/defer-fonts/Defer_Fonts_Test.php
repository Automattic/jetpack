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
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class Defer_Fonts_Test
 */
class Defer_Fonts_Test extends Base_TestCase {

	protected function set_up() {
		parent::set_up();
		Functions\when( 'wp_json_encode' )->alias( 'json_encode' );
		Functions\when( 'get_current_blog_id' )->justReturn( 3 );
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
		$this->assertStringContainsString( 'd.readyState==="complete"', $script, 'Fonts must still be added when the loader runs after `load`.' );
		$this->assertStringContainsString( '"jetpack-boost-defer-fonts-3"', $script, 'Each site on a multisite needs its own localStorage key.' );
		$this->assertStringContainsString( 'setTimeout(add,wait)', $script, 'A slow embed must not hold the fonts back past the cap.' );
		$this->assertStringEndsWith( ',' . Defer_Fonts::LOAD_WAIT_MS . ');', $script );
		$this->assertStringContainsString( 'if(done){return}', $script, 'The fonts must be added once, whichever of load and the cap comes first.' );
	}

	/**
	 * @dataProvider excluded_family_cases
	 */
	#[DataProvider( 'excluded_family_cases' )]
	public function test_saved_icon_fonts_are_left_to_load_normally( $saved, $expected_excluded ) {
		Functions\when( 'jetpack_boost_ds_get' )->justReturn( $saved );

		$fonts = array();
		foreach ( array( 'Inter', '"Font Awesome 6 Free"', 'fontawesome', 'Material Icons' ) as $family ) {
			$fonts[ $family ] = array( array( 'font-family' => $family ) );
		}

		list( $deferred, $excluded ) = Defer_Fonts::split_excluded( $fonts, Defer_Fonts::get_excluded_families() );

		$this->assertSame( $expected_excluded, array_keys( $excluded ) );
		$this->assertSame( array_values( array_diff( array_keys( $fonts ), $expected_excluded ) ), array_keys( $deferred ) );
	}

	public static function excluded_family_cases() {
		return array(
			'Font Awesome by default'    => array( Defer_Fonts::DEFAULT_EXCLUDES, array( '"Font Awesome 6 Free"', 'fontawesome' ) ),
			'site owner lists their own' => array( array( 'material icons' ), array( 'Material Icons' ) ),
			'site owner clears the list' => array( array(), array() ),
			'saved name typed in quotes' => array( array( '"Font Awesome"' ), array( '"Font Awesome 6 Free"' ) ),
		);
	}

	/**
	 * @dataProvider content_security_policy_cases
	 */
	#[DataProvider( 'content_security_policy_cases' )]
	public function test_detects_a_policy_that_blocks_the_inline_loader( $headers, $tag, $blocks ) {
		$this->assertSame( $blocks, Defer_Fonts::csp_blocks_inline_script( $headers, $tag ) );
	}

	public static function content_security_policy_cases() {
		$tag = '<script id="jetpack-boost-defer-fonts">';

		return array(
			'no policy'                            => array( array( 'Content-Type: text/html' ), $tag, false ),
			'unsafe-inline allowed'                => array( array( "Content-Security-Policy: script-src 'self' 'unsafe-inline'" ), $tag, false ),
			'default-src self only'                => array( array( "content-security-policy: default-src 'self'" ), $tag, true ),
			'nonce the tag carries'                => array( array( "Content-Security-Policy: script-src 'nonce-Ab12'" ), '<script nonce="Ab12" id="jetpack-boost-defer-fonts">', false ),
			'nonce the tag lacks'                  => array( array( "Content-Security-Policy: script-src 'nonce-Ab12' 'unsafe-inline'" ), $tag, true ),
			'hash makes unsafe-inline ignored'     => array( array( "Content-Security-Policy: script-src 'unsafe-inline' 'sha256-abc='" ), $tag, true ),
			'report-only does not block'           => array( array( "Content-Security-Policy-Report-Only: default-src 'self'" ), $tag, false ),
			'script-src-elem wins over script-src' => array( array( "Content-Security-Policy: script-src 'unsafe-inline'; script-src-elem 'self'" ), $tag, true ),
			'policy without script directives'     => array( array( 'Content-Security-Policy: img-src *' ), $tag, false ),
			'any one blocking policy is enough'    => array( array( "Content-Security-Policy: script-src 'unsafe-inline'", "Content-Security-Policy: default-src 'self'" ), $tag, true ),
		);
	}
}
