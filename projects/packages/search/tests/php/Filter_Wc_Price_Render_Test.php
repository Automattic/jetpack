<?php
/**
 * Filter_Wc_Price block render.php tests — covers both layouts the block
 * exposes (filter / slider) and pins the non-obvious server-side behaviors.
 * WooCommerce isn't loaded in this PHPUnit environment so the auto-bounds
 * SQL branch isn't exercised here — that runs on the front end with WC.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the merged price filter block's two layouts.
 */
class Filter_Wc_Price_Render_Test extends TestCase {

	/**
	 * Register the block inline so `do_blocks()` resolves render.php directly.
	 */
	public static function setUpBeforeClass(): void {
		\register_block_type(
			'jetpack-search/filter-wc-price',
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
					'showSlider'             => array(
						'type'    => 'boolean',
						'default' => false,
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
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/filter-wc-price/render.php';
					return (string) ob_get_clean();
				},
				// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			)
		);
	}

	public static function tearDownAfterClass(): void {
		\unregister_block_type( 'jetpack-search/filter-wc-price' );
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
		return do_blocks( '<!-- wp:jetpack-search/filter-wc-price ' . $json . ' /-->' );
	}

	/**
	 * Default rendering (no `showSlider`) is the inputs-only filter layout —
	 * what existing trunk instances saved before the slider variation was
	 * added serialize to. No slider DOM should leak into the markup.
	 */
	public function test_filter_mode_omits_slider_dom() {
		$markup = $this->render();
		$this->assertStringContainsString( '__input--min', $markup );
		$this->assertStringContainsString( '__input--max', $markup );
		$this->assertStringNotContainsString( '__slider', $markup );
		$this->assertStringNotContainsString( 'data-wp-watch', $markup );
	}

	/**
	 * Author-supplied label values must be HTML-escaped so a crafted attribute
	 * can't inject a script tag through the heading.
	 */
	public function test_label_is_escaped() {
		$markup = $this->render( array( 'label' => '<script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>alert(1)</script>', $markup );
	}

	/**
	 * The number inputs are bound via `data-wp-bind--value` to the shared
	 * `priceRangeMin/MaxInputValue` getters so a slider drag updates them
	 * automatically. They also wire change / keydown to the commit actions.
	 */
	public function test_number_inputs_are_wired_to_store_bindings() {
		$markup = $this->render();
		$this->assertStringContainsString( 'data-wp-bind--value="state.priceRangeMinInputValue"', $markup );
		$this->assertStringContainsString( 'data-wp-bind--value="state.priceRangeMaxInputValue"', $markup );
		$this->assertStringContainsString( 'data-wp-on--change="actions.onPriceRangeInputChange"', $markup );
		$this->assertStringContainsString( 'data-wp-on--keydown="actions.onPriceRangeInputKeydown"', $markup );
	}

	/**
	 * Slider mode renders the dual-thumb track above the number inputs and
	 * attaches the `updatePriceSliderUi` watcher to the wrapper. Filter mode
	 * doesn't pay that cost — the watch attribute is omitted.
	 */
	public function test_slider_mode_emits_slider_dom_and_watch() {
		$markup = $this->render(
			array(
				'showSlider' => true,
				'autoBounds' => false,
				'min'        => 0,
				'max'        => 500,
				'step'       => 5,
			)
		);
		$this->assertStringContainsString( '__slider', $markup );
		$this->assertStringContainsString( '__slider-bar', $markup );
		$this->assertStringContainsString( '__slider-input--min', $markup );
		$this->assertStringContainsString( '__slider-input--max', $markup );
		$this->assertStringContainsString( 'data-wp-watch="callbacks.updatePriceSliderUi"', $markup );
		$this->assertStringContainsString( 'data-wp-on--input="actions.onPriceSliderInput"', $markup );
		$this->assertStringContainsString( 'data-wp-on--change="actions.onPriceSliderChange"', $markup );
		$this->assertStringContainsString( 'min="0"', $markup );
		$this->assertStringContainsString( 'max="500"', $markup );
		$this->assertStringContainsString( 'step="5"', $markup );
	}

	/**
	 * Slider mode wraps the block in `--with-slider` so the inputs row gets
	 * the extra margin-block-start defined in style.scss. Filter mode skips
	 * the modifier to keep the wrapper class minimal.
	 */
	public function test_slider_mode_adds_with_slider_modifier() {
		$slider_markup = $this->render(
			array(
				'showSlider' => true,
				'autoBounds' => false,
			)
		);
		$this->assertStringContainsString( 'jetpack-search-filter-wc-price--with-slider', $slider_markup );

		$filter_markup = $this->render();
		$this->assertStringNotContainsString( '--with-slider', $filter_markup );
	}

	/**
	 * Slider mode coerces inverted author bounds (min > max) into an
	 * ascending pair so the slider stays renderable instead of producing a
	 * track the user can never drag back across.
	 */
	public function test_slider_inverted_bounds_are_swapped() {
		$markup = $this->render(
			array(
				'showSlider' => true,
				'autoBounds' => false,
				'min'        => 100,
				'max'        => 10,
			)
		);
		$this->assertStringContainsString( 'min="10"', $markup );
		$this->assertStringContainsString( 'max="100"', $markup );
		$this->assertStringNotContainsString( 'min="100"', $markup );
	}
}
