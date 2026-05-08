<?php
/**
 * Search Input block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the search-input block's render template.
 *
 * Each test renders the block through `do_blocks()` so WordPress wires up the
 * block context (`WP_Block_Supports::$block_to_render`) the template relies on
 * via `get_block_wrapper_attributes()` — exercising the same path the front
 * end takes.
 */
class Search_Input_Render_Test extends TestCase {

	/**
	 * Register the search-input block inline so `do_blocks()` can resolve it
	 * without depending on the `build/` artifacts referenced by block.json —
	 * those aren't present in a fresh checkout and our PHPUnit config has
	 * `failOnNotice` set. The render callback just delegates to render.php,
	 * which is the file under test.
	 */
	public static function setUpBeforeClass(): void {
		\register_block_type(
			'jetpack-search/search-input',
			array(
				'attributes'      => array(
					'placeholder' => array(
						'type'    => 'string',
						'default' => '',
					),
					'showIcon'    => array(
						'type'    => 'boolean',
						'default' => true,
					),
					'submitOnly'  => array(
						'type'    => 'boolean',
						'default' => false,
					),
				),
				// $attributes is consumed by the included render.php via the
				// closure's local scope — phpcs can't see that, hence the disable.
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/search-input/render.php';
					return (string) ob_get_clean();
				},
				// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			)
		);
	}

	/**
	 * Unregister the block so other test classes start from a clean slate.
	 */
	public static function tearDownAfterClass(): void {
		\unregister_block_type( 'jetpack-search/search-input' );
	}

	/**
	 * Render the search-input block with the given attributes via `do_blocks`.
	 *
	 * @param array $attributes Block attributes (JSON-encoded into the comment delimiter).
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array() ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		return do_blocks( '<!-- wp:jetpack-search/search-input ' . $json . ' /-->' );
	}

	/**
	 * The default render (no attributes) must emit the magnifying-glass icon
	 * so posts saved before `showIcon` existed keep their search glyph.
	 */
	public function test_default_renders_icon() {
		$markup = $this->render();
		$this->assertStringContainsString( 'jetpack-search-input__icon', $markup );
	}

	/**
	 * `showIcon: true` must emit the icon SVG — the explicit-true case.
	 */
	public function test_show_icon_true_renders_icon() {
		$markup = $this->render( array( 'showIcon' => true ) );
		$this->assertStringContainsString( 'jetpack-search-input__icon', $markup );
	}

	/**
	 * `showIcon: false` must omit the icon SVG entirely. The surrounding
	 * wrapper + input still render so the block stays functional.
	 */
	public function test_show_icon_false_hides_icon() {
		$markup = $this->render( array( 'showIcon' => false ) );
		$this->assertStringNotContainsString( 'jetpack-search-input__icon', $markup );
		// The input itself must still render.
		$this->assertStringContainsString( 'jetpack-search-input__field', $markup );
	}

	/**
	 * An empty placeholder must fall back to the translated default so posts
	 * saved before the attribute was declared keep rendering the "Search…"
	 * copy.
	 */
	public function test_empty_placeholder_falls_back_to_default() {
		$markup   = $this->render( array( 'placeholder' => '' ) );
		$expected = 'placeholder="' . esc_attr( __( 'Search…', 'jetpack-search-pkg' ) ) . '"';
		$this->assertStringContainsString( $expected, $markup );
	}

	/**
	 * A custom placeholder must replace the default copy on the front end.
	 */
	public function test_custom_placeholder_renders() {
		$markup = $this->render( array( 'placeholder' => 'Find recipes' ) );
		$this->assertStringContainsString( 'placeholder="Find recipes"', $markup );
	}

	/**
	 * The placeholder is user-controlled so the template must escape HTML
	 * to prevent stored XSS through a crafted attribute value.
	 */
	public function test_placeholder_is_attribute_escaped() {
		$markup = $this->render( array( 'placeholder' => '"><script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>alert(1)</script>', $markup );
	}

	/**
	 * `submitOnly: true` must emit the opt-in data attribute so view.js can
	 * skip the debounced live search for that input.
	 */
	public function test_submit_only_emits_data_attribute() {
		$markup = $this->render( array( 'submitOnly' => true ) );
		$this->assertStringContainsString( 'data-submit-only="true"', $markup );
	}

	/**
	 * The default (live search) must not emit the opt-in data attribute.
	 */
	public function test_submit_only_default_omits_data_attribute() {
		$markup = $this->render();
		$this->assertStringNotContainsString( 'data-submit-only', $markup );
	}
}
