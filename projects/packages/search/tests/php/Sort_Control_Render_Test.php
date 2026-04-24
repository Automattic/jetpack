<?php
/**
 * Sort Control block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Yoast\PHPUnitPolyfills\TestCases\TestCase;

/**
 * Integration tests for the sort-control block's render template.
 *
 * Each test renders through `do_blocks()` so WordPress wires up the block
 * context `get_block_wrapper_attributes()` needs — exercising the same path
 * the front end takes, not just an isolated `include`.
 */
class Sort_Control_Render_Test extends TestCase {

	/**
	 * Register the sort-control block inline so `do_blocks()` can resolve it
	 * without requiring the `build/` artifacts referenced by block.json's
	 * `viewScriptModule` and `style` entries. The render callback forwards
	 * `$attributes` to the render.php under test.
	 */
	public static function setUpBeforeClass(): void {
		\register_block_type(
			'jetpack/sort-control',
			array(
				'attributes'      => array(
					'defaultSort'          => array(
						'type'    => 'string',
						'default' => 'relevance',
					),
					'availableSortOptions' => array(
						'type'    => 'array',
						'default' => array( 'relevance', 'newest', 'oldest' ),
					),
					'label'                => array(
						'type'    => 'string',
						'default' => '',
					),
					'displayAs'            => array(
						'type'    => 'string',
						'default' => 'select',
					),
				),
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/sort-control/render.php';
					return (string) ob_get_clean();
				},
				// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			)
		);
	}

	/**
	 * Release the block registration so subsequent test classes don't
	 * collide with our inline attribute schema.
	 */
	public static function tearDownAfterClass(): void {
		\unregister_block_type( 'jetpack/sort-control' );
	}

	/**
	 * Reset `$_GET` between tests so URL parsing never leaks across cases.
	 * Interactivity state carries across tests, but render.php always writes
	 * `sortOrder` deterministically from attrs + URL, so each render
	 * overwrites whatever the previous one left behind.
	 */
	protected function setUp(): void {
		parent::setUp();
		$_GET = array();
	}

	/**
	 * Render the sort-control block with the given attributes via `do_blocks`.
	 *
	 * @param array $attributes Block attributes (JSON-encoded into the comment delimiter).
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array() ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		return do_blocks( '<!-- wp:jetpack/sort-control ' . $json . ' /-->' );
	}

	/**
	 * Default render path: dropdown, legacy "Sort by" label, every base
	 * option present. Product-format keys are deferred to the WooCommerce
	 * integration (RSM-1082).
	 */
	public function test_default_attributes_render_select_with_base_options() {
		$markup = $this->render();
		$this->assertStringContainsString( '<select', $markup );
		$this->assertStringContainsString( 'Sort by', $markup );
		foreach ( array( 'relevance', 'newest', 'oldest' ) as $key ) {
			$this->assertStringContainsString( 'value="' . $key . '"', $markup );
		}
	}

	/**
	 * `displayAs=radio` must emit a `<fieldset>` of radios, not a dropdown.
	 */
	public function test_display_as_radio_renders_fieldset_with_radios() {
		$markup = $this->render( array( 'displayAs' => 'radio' ) );
		$this->assertStringContainsString( '<fieldset', $markup );
		$this->assertStringNotContainsString( '<select', $markup );
		$this->assertStringContainsString( 'type="radio"', $markup );
	}

	/**
	 * A URL `?orderby=oldest` must win over the block's `defaultSort` —
	 * deep links keep their meaning even when the block default differs.
	 */
	public function test_url_sort_wins_over_default_sort() {
		$_GET = array( 'orderby' => 'oldest' );
		try {
			$markup = $this->render( array( 'defaultSort' => 'newest' ) );
			$this->assertMatchesRegularExpression(
				'/<option[^>]*value="oldest"[^>]*selected/',
				$markup
			);
			$this->assertDoesNotMatchRegularExpression(
				'/<option[^>]*value="newest"[^>]*selected/',
				$markup
			);
		} finally {
			$_GET = array();
		}
	}

	/**
	 * Labels are user-controlled, so the template must escape HTML to
	 * prevent stored XSS through a crafted attribute value.
	 */
	public function test_label_is_html_escaped() {
		$markup = $this->render( array( 'label' => '<script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>alert(1)</script>', $markup );
		$this->assertStringContainsString( '&lt;script&gt;alert(1)&lt;/script&gt;', $markup );
	}
}
