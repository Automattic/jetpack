<?php
/**
 * Filters Popover block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the filters-popover block's render template.
 *
 * Each test renders the block through `do_blocks()` so WordPress wires up the
 * block context (`WP_Block_Supports::$block_to_render`) the template relies on
 * via `get_block_wrapper_attributes()` — exercising the same path the front
 * end takes.
 */
class Filters_Popover_Render_Test extends TestCase {

	/**
	 * Register the filters-popover block inline (rather than from its block.json
	 * directory) so `do_blocks()` can resolve it without depending on the
	 * `build/` artifacts referenced by block.json's `viewScriptModule` and
	 * `style` entries — those aren't present in a fresh checkout, and our
	 * PHPUnit config has `failOnNotice` set, so any missing-asset notice
	 * during metadata resolution would fail the suite.
	 */
	public static function setUpBeforeClass(): void {
		\register_block_type(
			'jetpack-search/filters-popover',
			array(
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes, $content ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/filters-popover/render.php';
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
		\unregister_block_type( 'jetpack-search/filters-popover' );
	}

	/**
	 * Render the filters-popover block via `do_blocks` with the given attributes.
	 *
	 * @param array $attributes Block attributes (JSON-encoded into the comment delimiter).
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array() ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		// Pass an empty inner-block payload — render.php only cares about $content
		// being defined for the echo, not its contents.
		return do_blocks( '<!-- wp:jetpack-search/filters-popover ' . $json . ' --><!-- /wp:jetpack-search/filters-popover -->' );
	}

	/**
	 * The block renders as a popover at every viewport — no `is-mode-*` display
	 * mode class survives now that the responsive mode is gone.
	 */
	public function test_renders_without_a_display_mode_class() {
		$markup = $this->render();
		$this->assertStringContainsString( 'jetpack-search-filters-popover', $markup );
		$this->assertStringNotContainsString( 'is-mode-', $markup );
	}

	/**
	 * The trigger button + panel scaffolding must render so the Interactivity
	 * bindings (`data-wp-on--*`, `data-wp-class--*`) drive the runtime popover
	 * toggle.
	 */
	public function test_trigger_and_panel_scaffolding_render() {
		$markup = $this->render();
		$this->assertStringContainsString( 'jetpack-search-filters-popover__trigger', $markup );
		$this->assertStringContainsString( 'jetpack-search-filters-popover__panel', $markup );
		$this->assertStringContainsString( 'data-wp-on--click="actions.toggleFilterPopover"', $markup );
		$this->assertStringContainsString( 'data-wp-class--is-popover-open="state.isFilterPopoverOpen"', $markup );
	}

	/**
	 * The panel must NOT carry the `hidden` HTML attribute or `role="dialog"` —
	 * class-driven visibility via `.is-popover-open` keeps sighted and AT users
	 * in sync.
	 */
	public function test_panel_has_no_hidden_attribute_or_dialog_role() {
		$markup = $this->render();
		$this->assertSame(
			0,
			preg_match( '/<div[^>]*jetpack-search-filters-popover__panel[^>]*\bhidden\b[^>]*>/', $markup ),
			'panel must not carry the hidden attribute'
		);
		$this->assertSame(
			0,
			preg_match( '/<div[^>]*jetpack-search-filters-popover__panel[^>]*role="dialog"[^>]*>/', $markup ),
			'panel must not carry role="dialog"'
		);
		$this->assertStringNotContainsString( 'data-wp-bind--hidden="!state.isFilterPopoverOpen"', $markup );
	}

	/**
	 * The panel must expose a labelled landmark (`role="region"` +
	 * `aria-label="Search filters"`) so AT users navigating by landmarks can
	 * find the filter controls.
	 */
	public function test_panel_exposes_search_filters_landmark() {
		$markup = $this->render();
		$this->assertSame(
			1,
			preg_match( '/<div[^>]*jetpack-search-filters-popover__panel[^>]*role="region"[^>]*>/', $markup ),
			'panel must carry role="region"'
		);
		$this->assertSame(
			1,
			preg_match( '/<div[^>]*jetpack-search-filters-popover__panel[^>]*aria-label="Search filters"[^>]*>/', $markup ),
			'panel must carry aria-label="Search filters"'
		);
	}
}
