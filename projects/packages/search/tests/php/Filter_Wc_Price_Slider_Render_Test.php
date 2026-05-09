<?php
/**
 * Filter_Wc_Price_Slider block render.php tests — pins the non-obvious
 * server-side behaviors (the rest is JS-driven post-hydration).
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Mirrors `Search_Input_Render_Test`. WooCommerce isn't loaded in this PHPUnit
 * environment, so the auto-bounds SQL branch isn't exercised here — that runs
 * on the front end with WC.
 */
class Filter_Wc_Price_Slider_Render_Test extends TestCase {

	/**
	 * Register the block inline so `do_blocks()` resolves render.php directly.
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
	 * stays renderable.
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
	 * Author-supplied label values must be HTML-escaped so a crafted attribute
	 * can't inject a script tag through the heading.
	 */
	public function test_label_is_escaped() {
		$markup = $this->render( array( 'label' => '<script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>alert(1)</script>', $markup );
	}
}
