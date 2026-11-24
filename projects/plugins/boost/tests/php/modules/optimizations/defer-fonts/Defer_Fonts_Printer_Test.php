<?php
/**
 * Tests for Defer_Fonts::print_deferred_font_faces() against WordPress's own font resolver.
 *
 * @package automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Optimizations\Defer_Fonts;

use Automattic\Jetpack_Boost\Modules\Optimizations\Defer_Fonts\Defer_Fonts;
use WorDBless\BaseTestCase;
use WP_Theme_JSON_Data;
use WP_Theme_JSON_Resolver;

/**
 * Class Defer_Fonts_Printer_Test
 */
class Defer_Fonts_Printer_Test extends BaseTestCase {

	public function set_up() {
		parent::set_up();
		add_filter( 'wp_theme_json_data_theme', array( $this, 'add_theme_fonts' ) );
		WP_Theme_JSON_Resolver::clean_cached_data();
	}

	public function tear_down() {
		remove_filter( 'wp_theme_json_data_theme', array( $this, 'add_theme_fonts' ) );
		WP_Theme_JSON_Resolver::clean_cached_data();
		parent::tear_down();
	}

	/**
	 * Register a text font and an icon font, as a block theme's theme.json would.
	 *
	 * @param WP_Theme_JSON_Data $theme_json Theme data.
	 * @return WP_Theme_JSON_Data
	 */
	public function add_theme_fonts( $theme_json ) {
		$data = $theme_json->get_data();

		$data['settings']['typography']['fontFamilies'] = array();
		foreach ( array( 'Inter', 'Font Awesome 6 Free' ) as $name ) {
			$data['settings']['typography']['fontFamilies'][] = array(
				'name'       => $name,
				'slug'       => sanitize_title( $name ),
				'fontFamily' => $name,
				'fontFace'   => array(
					array(
						'fontFamily' => $name,
						'fontWeight' => '400',
						'src'        => array( 'https://example.org/' . sanitize_title( $name ) . '.woff2' ),
					),
				),
			);
		}

		return new WP_Theme_JSON_Data( $data, 'theme' );
	}

	public function test_defers_text_fonts_and_prints_icon_fonts_normally() {
		ob_start();
		( new Defer_Fonts() )->print_deferred_font_faces();
		$html = (string) ob_get_clean();

		$this->assertSame( 1, preg_match( '#<noscript><style class="wp-fonts-local">(.*?)</style></noscript>#s', $html, $noscript ), 'Missing the <noscript> copy.' );
		$this->assertSame( 1, preg_match( '#<script[^>]*id="jetpack-boost-defer-fonts"[^>]*>(.*?)</script>#s', $html, $loader ), 'Missing the loader script.' );

		$printed_normally = str_replace( array( $noscript[0], $loader[0] ), '', $html );

		$this->assertStringContainsString( 'Font Awesome 6 Free', $printed_normally );
		$this->assertStringNotContainsString( 'Inter', $printed_normally );

		foreach ( array( $noscript[1], $loader[1] ) as $deferred ) {
			$this->assertStringContainsString( 'Inter', $deferred );
			$this->assertStringContainsString( 'font-display:swap', $deferred );
			$this->assertStringNotContainsString( 'Font Awesome', $deferred );
		}
	}

	public function test_falls_back_to_core_output_when_a_policy_blocks_the_loader() {
		$module = new class() extends Defer_Fonts {
			protected function get_response_headers() {
				return array( "Content-Security-Policy: script-src 'self'" );
			}
		};

		ob_start();
		$module->print_deferred_font_faces();
		$html = (string) ob_get_clean();

		$this->assertStringNotContainsString( 'jetpack-boost-defer-fonts', $html );
		$this->assertStringNotContainsString( '<noscript>', $html );
		$this->assertSame( 1, substr_count( $html, '<style class="wp-fonts-local">' ), 'Core should print every font once, in its normal block.' );
		$this->assertStringContainsString( 'Inter', $html );
		$this->assertStringContainsString( 'Font Awesome 6 Free', $html );
		$this->assertStringNotContainsString( 'font-display:swap', $html );
	}
}
