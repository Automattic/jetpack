<?php
/**
 * Clear Filters block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the clear-filters block's render template.
 *
 * Each test renders the block through `do_blocks()` so WordPress wires up the
 * block context (`WP_Block_Supports::$block_to_render`) the template relies on
 * via `get_block_wrapper_attributes()` — exercising the same path the front
 * end takes, not just an isolated `include`.
 */
class Clear_Filters_Render_Test extends TestCase {

	/**
	 * Register the clear-filters block inline (rather than from its block.json
	 * directory) so `do_blocks()` can resolve it without depending on the
	 * `build/` artifacts referenced by block.json's `viewScriptModule` and
	 * `style` entries — those aren't present in a fresh checkout, and our
	 * PHPUnit config has `failOnNotice` set, so any missing-asset notice
	 * during metadata resolution would fail the suite. The render callback
	 * just delegates to render.php, which is the file under test.
	 */
	public static function setUpBeforeClass(): void {
		\register_block_type(
			'jetpack-search/clear-filters',
			array(
				'attributes'      => array(
					'label'            => array(
						'type'    => 'string',
						'default' => '',
					),
					'hideWhenInactive' => array(
						'type'    => 'boolean',
						'default' => true,
					),
				),
				// $attributes is consumed by the included render.php via the
				// closure's local scope — phpcs can't see that, hence the disable.
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/clear-filters/render.php';
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
		\unregister_block_type( 'jetpack-search/clear-filters' );
	}

	/**
	 * Render the clear-filters block with the given attributes via `do_blocks`.
	 *
	 * @param array $attributes Block attributes (JSON-encoded into the comment delimiter).
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array() ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		return do_blocks( '<!-- wp:jetpack-search/clear-filters ' . $json . ' /-->' );
	}

	/**
	 * An empty `label` must fall back to the translated default so existing
	 * posts (saved before the attribute existed) keep rendering the original
	 * "Clear filters" copy.
	 */
	public function test_empty_label_falls_back_to_default() {
		$markup = $this->render( array( 'label' => '' ) );
		$this->assertStringContainsString( 'Clear filters', $markup );
	}

	/**
	 * A missing `label` (not just empty) must also fall back. Block editor
	 * saves omit attributes that match their default, so old posts arrive
	 * here without the key at all.
	 */
	public function test_missing_label_falls_back_to_default() {
		$markup = $this->render();
		$this->assertStringContainsString( 'Clear filters', $markup );
	}

	/**
	 * A custom `label` must replace the default copy on the front end.
	 */
	public function test_custom_label_renders() {
		$markup = $this->render( array( 'label' => 'Reset all' ) );
		$this->assertStringContainsString( 'Reset all', $markup );
		$this->assertStringNotContainsString( 'Clear filters', $markup );
	}

	/**
	 * A whitespace-only label (e.g. user typed spaces and stopped) must fall
	 * back to the default — `sanitize_text_field()` trims, and a blank-looking
	 * value should render as the default rather than a visually empty button.
	 */
	public function test_whitespace_only_label_falls_back_to_default() {
		$markup = $this->render( array( 'label' => '   ' ) );
		$this->assertStringContainsString( 'Clear filters', $markup );
	}

	/**
	 * The label is user-controlled, so the template must defang HTML to
	 * prevent stored XSS. `sanitize_text_field()` strips full tags before
	 * the value reaches the template, and `esc_html()` on output handles
	 * stray special characters (`&`, `<`, `>`, quotes) that survive.
	 */
	public function test_label_is_html_escaped() {
		$markup = $this->render( array( 'label' => '<script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>', $markup );
		$this->assertStringNotContainsString( 'alert(1)', $markup );

		$markup = $this->render( array( 'label' => 'Reset & clear "all"' ) );
		$this->assertStringContainsString( 'Reset &amp; clear &quot;all&quot;', $markup );
		$this->assertStringNotContainsString( 'Reset & clear "all"', $markup );
	}

	/**
	 * Default `hideWhenInactive: true` with no seeded active filters must
	 * paint the wrapper `hidden` AND emit the data-wp-bind--hidden binding so
	 * JS keeps it in sync after hydration. Both halves matter — the bind is
	 * what flips visibility on a client-side filter selection; the static
	 * attribute is what avoids the flash before JS runs.
	 */
	public function test_hide_when_inactive_default_seeds_hidden_and_bind() {
		$markup = $this->render();
		$this->assertStringContainsString( 'hidden', $markup );
		$this->assertStringContainsString( 'data-wp-bind--hidden="!state.hasActiveFilters"', $markup );
	}

	/**
	 * Authors can pin the button visible by setting `hideWhenInactive: false`.
	 * The wrapper must drop both the static `hidden` attribute and the bind —
	 * leaving the bind in place would re-hide the button as soon as JS sees
	 * `state.hasActiveFilters` is false.
	 *
	 * Uses `preg_match` directly so the test runs on PHPUnit 8.5 (PHP 7.2),
	 * which predates `assertMatchesRegularExpression()`.
	 */
	public function test_hide_when_inactive_false_drops_hidden_and_bind() {
		$markup = $this->render( array( 'hideWhenInactive' => false ) );
		$this->assertStringNotContainsString( 'data-wp-bind--hidden', $markup );
		// Once the bind is gone, any `<div … hidden …>` would have to be a
		// bare `hidden` attribute — exactly what the toggle should suppress.
		$this->assertSame( 0, preg_match( '/<div[^>]*\bhidden\b[^>]*>/', $markup ) );
	}
}
