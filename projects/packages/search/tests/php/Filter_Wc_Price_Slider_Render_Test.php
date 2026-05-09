<?php
/**
 * Filter_Wc_Price_Slider block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the filter-wc-price-slider block's render template.
 *
 * Mirrors `Search_Input_Render_Test`: register the block inline so
 * `do_blocks()` can resolve it without depending on `build/` artifacts, then
 * render via the comment delimiter so the block context wires up the same way
 * as the front end. WooCommerce isn't available in this PHPUnit environment,
 * so the `function_exists( 'wc_get_product' )`-gated auto-bounds branch is
 * deliberately not exercised here — those code paths run on the front end
 * with WC loaded.
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
	 * Default render: empty label falls back to the translated "Price" copy and
	 * the seeded endpoints reflect the default 0–1000 range.
	 */
	public function test_default_renders_with_translated_label_and_default_bounds() {
		$markup = $this->render();
		$this->assertStringContainsString( '>Price</h3>', $markup );
		// Two range inputs, each with its own min/max attribute.
		$this->assertStringContainsString( 'jetpack-search-filter-wc-price-slider__input--min', $markup );
		$this->assertStringContainsString( 'jetpack-search-filter-wc-price-slider__input--max', $markup );
		$this->assertStringContainsString( 'min="0"', $markup );
		$this->assertStringContainsString( 'max="1000"', $markup );
	}

	/**
	 * A custom label round-trips into the heading.
	 */
	public function test_custom_label_renders_in_heading() {
		$markup = $this->render( array( 'label' => 'Filter by price' ) );
		$this->assertStringContainsString( '>Filter by price</h3>', $markup );
	}

	/**
	 * A custom currency symbol prefixes the value labels by default
	 * (left position is the WP fallback when `woocommerce_currency_pos` isn't set).
	 */
	public function test_custom_symbol_left_position_prefixes_value_labels() {
		$markup = $this->render( array( 'currencySymbol' => '€' ) );
		// Both endpoint spans render with the symbol prefixing the value.
		$this->assertMatchesRegularExpression(
			'~__value--min[^>]*>\s*€0\s*</span~u',
			$markup
		);
		$this->assertMatchesRegularExpression(
			'~__value--max[^>]*>\s*€1000\s*</span~u',
			$markup
		);
	}

	/**
	 * Symbol position `right` puts the symbol after the value.
	 */
	public function test_custom_position_right_appends_symbol() {
		$markup = $this->render(
			array(
				'currencySymbol'         => '€',
				'currencySymbolPosition' => 'right',
				'min'                    => 5,
				'max'                    => 25,
			)
		);
		$this->assertMatchesRegularExpression(
			'~__value--min[^>]*>\s*5€\s*</span~u',
			$markup
		);
		$this->assertMatchesRegularExpression(
			'~__value--max[^>]*>\s*25€\s*</span~u',
			$markup
		);
	}

	/**
	 * Symbols longer than two characters get trimmed by `mb_substr` so an
	 * oversized author input can't overflow the value adornment.
	 */
	public function test_oversized_symbol_is_trimmed_to_two_chars() {
		$markup = $this->render( array( 'currencySymbol' => 'KRX' ) );
		// 'KRX' → 'KR' as the displayed prefix.
		$this->assertStringContainsString( 'KR0', $markup );
		$this->assertStringContainsString( 'KR1000', $markup );
		$this->assertStringNotContainsString( 'KRX', $markup );
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
		// Both inputs share the same min/max attributes; after coercion the
		// pair is (10, 100).
		$this->assertStringContainsString( 'min="10"', $markup );
		$this->assertStringContainsString( 'max="100"', $markup );
		$this->assertStringNotContainsString( 'min="100"', $markup );
		$this->assertStringNotContainsString( 'max="10"', $markup );
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
	 * The screen-reader-only labels are present so a sighted-only-styled
	 * value adornment doesn't strand AT users without an accessible name.
	 */
	public function test_screen_reader_labels_are_present() {
		$markup = $this->render();
		$this->assertStringContainsString( 'Minimum price', $markup );
		$this->assertStringContainsString( 'Maximum price', $markup );
		// Both `screen-reader-text` labels exist (one per input).
		$this->assertSame(
			2,
			substr_count( $markup, 'class="screen-reader-text"' )
		);
	}

	/**
	 * `--low` / `--high` are seeded inline on the `__range` element so the
	 * colored active-range fill paints correctly before JS hydrates.
	 */
	public function test_track_style_seeds_low_high_custom_props() {
		$markup = $this->render(
			array(
				'min' => 0,
				'max' => 100,
			)
		);
		$this->assertMatchesRegularExpression(
			'~--low:0%;\s*--high:100%~',
			$markup
		);
	}

	/**
	 * The Interactivity API context payload threads `sliderMin` / `sliderMax`
	 * to the JS watcher so it can compute `--low`/`--high` without re-reading
	 * the DOM input attributes.
	 */
	public function test_interactivity_context_carries_slider_bounds() {
		$markup = $this->render(
			array(
				'min' => 5,
				'max' => 250,
			)
		);
		$this->assertStringContainsString( 'data-wp-context=', $markup );
		$this->assertStringContainsString( '&quot;sliderMin&quot;:5', $markup );
		$this->assertStringContainsString( '&quot;sliderMax&quot;:250', $markup );
	}

	/**
	 * Both inputs wire `data-wp-on--input` and `data-wp-on--change` to the
	 * matching actions so the drag-vs-release split lands at hydration.
	 */
	public function test_inputs_wire_input_and_change_handlers() {
		$markup = $this->render();
		$this->assertSame(
			2,
			substr_count( $markup, 'data-wp-on--input="actions.onPriceSliderInput"' )
		);
		$this->assertSame(
			2,
			substr_count( $markup, 'data-wp-on--change="actions.onPriceSliderChange"' )
		);
	}

	/**
	 * The wrapper opts into the Interactivity API so the watcher attached to
	 * `data-wp-watch` (the `updatePriceSliderUi` callback) actually runs.
	 */
	public function test_wrapper_declares_interactivity_namespace() {
		$markup = $this->render();
		$this->assertStringContainsString( 'data-wp-interactive="jetpack-search"', $markup );
		$this->assertStringContainsString( 'data-wp-watch="callbacks.updatePriceSliderUi"', $markup );
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
