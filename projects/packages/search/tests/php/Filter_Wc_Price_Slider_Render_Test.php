<?php
/**
 * Filter_Wc_Price_Slider block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the filter-wc-price-slider block's render template — pinning the
 * non-obvious server-side behaviors only (mirrors how `Search_Input_Render_Test`
 * focuses on visible-from-the-template attributes rather than markup shape).
 *
 * WooCommerce isn't available in this PHPUnit environment, so the
 * `function_exists( 'wc_get_product' )`-gated auto-bounds branch isn't
 * exercised here — that path runs on the front end with WC loaded.
 */
class Filter_Wc_Price_Slider_Render_Test extends TestCase {

	/**
	 * Register the block inline. The render callback delegates to render.php
	 * so phpunit's coverage instrumentation tracks that file directly.
	 */
	public static function setUpBeforeClass(): void {
		\register_block_type(
			'jetpack-search/filter-wc-price-slider',
			array(
				'attributes'      => array(
					'label'                  => array(
						'type'    => 'string',
						'default' => '',
					),
					'currencySymbol'         => array(
						'type'    => 'string',
						'default' => '',
					),
					'currencySymbolPosition' => array(
						'type'    => 'string',
						'default' => '',
					),
					'min'                    => array(
						'type'    => 'number',
						'default' => 0,
					),
					'max'                    => array(
						'type'    => 'number',
						'default' => 1000,
					),
					'step'                   => array(
						'type'    => 'number',
						'default' => 1,
					),
					'autoBounds'             => array(
						'type'    => 'boolean',
						'default' => true,
					),
				),
				// $attributes is consumed by the included render.php via the
				// closure's local scope — phpcs can't see that, hence the disable.
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/filter-wc-price-slider/render.php';
					return (string) ob_get_clean();
				},
				// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			)
		);
	}

	/**
	 * Unregister so other test classes start clean.
	 */
	public static function tearDownAfterClass(): void {
		\unregister_block_type( 'jetpack-search/filter-wc-price-slider' );
	}

	/**
	 * Render the block with the given attributes via `do_blocks`.
	 *
	 * @param array $attributes Block attributes (JSON-encoded into the comment delimiter).
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array() ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		return do_blocks( '<!-- wp:jetpack-search/filter-wc-price-slider ' . $json . ' /-->' );
	}

	/**
	 * Inverted bounds (min > max) coerce to an ascending pair so the slider
	 * stays usable rather than emitting unrenderable markup.
	 */
	public function test_inverted_bounds_are_swapped() {
		$markup = $this->render(
			array(
				'autoBounds' => false,
				'min'        => 100,
				'max'        => 10,
			)
		);
		$this->assertStringContainsString( 'min="10"', $markup );
		$this->assertStringContainsString( 'max="100"', $markup );
		$this->assertStringNotContainsString( 'min="100"', $markup );
	}

	/**
	 * Symbols longer than two characters get trimmed by `mb_substr` so an
	 * oversized author input can't overflow the value adornment.
	 */
	public function test_oversized_symbol_is_trimmed_to_two_chars() {
		$markup = $this->render( array( 'currencySymbol' => 'KRX' ) );
		$this->assertStringContainsString( 'KR0', $markup );
		$this->assertStringNotContainsString( 'KRX', $markup );
	}

	/**
	 * `aria-valuetext` carries the currency-formatted label so screen readers
	 * announce "$25" instead of the bare numeric `value` ("25"). Pre-hydration
	 * seed; the JS watcher refreshes it reactively.
	 */
	public function test_aria_valuetext_carries_currency_formatted_label() {
		$markup = $this->render(
			array(
				'currencySymbol' => '$',
				'min'            => 0,
				'max'            => 250,
			)
		);
		$this->assertStringContainsString( 'aria-valuetext="$0"', $markup );
		$this->assertStringContainsString( 'aria-valuetext="$250"', $markup );
	}

	/**
	 * Author-supplied label values must be HTML-escaped so a crafted attribute
	 * can't inject a script tag through the heading.
	 */
	public function test_label_is_escaped() {
		$markup = $this->render( array( 'label' => '<script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>alert(1)</script>', $markup );
	}
}
