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
				'attributes'      => array(
					'displayMode' => array(
						'type'    => 'string',
						'default' => 'responsive',
					),
				),
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
	 * Missing `displayMode` (block.json default takes over) must paint the
	 * responsive mode class so the desktop CSS path activates by default.
	 */
	public function test_missing_display_mode_renders_as_responsive() {
		$markup = $this->render();
		$this->assertStringContainsString( 'is-mode-responsive', $markup );
		$this->assertStringNotContainsString( 'is-mode-popover-always', $markup );
	}

	/**
	 * Explicit `popover-always` must paint the popover-only mode class so the
	 * responsive desktop CSS path stays off.
	 */
	public function test_popover_always_renders_popover_mode_class() {
		$markup = $this->render( array( 'displayMode' => 'popover-always' ) );
		$this->assertStringContainsString( 'is-mode-popover-always', $markup );
		$this->assertStringNotContainsString( 'is-mode-responsive', $markup );
	}

	/**
	 * An unknown / malformed `displayMode` value must fall back to responsive
	 * so a serialised typo can't end up with no styling applied.
	 */
	public function test_unknown_display_mode_falls_back_to_responsive() {
		$markup = $this->render( array( 'displayMode' => 'something-else' ) );
		$this->assertStringContainsString( 'is-mode-responsive', $markup );
		$this->assertStringNotContainsString( 'is-mode-popover-always', $markup );
		$this->assertStringNotContainsString( 'is-mode-something-else', $markup );
	}

	/**
	 * The trigger button + panel scaffolding must render in every mode — CSS
	 * and `.is-popover-open` toggle visibility, the markup itself doesn't
	 * change. Confirms the Interactivity bindings (`data-wp-on--*`,
	 * `data-wp-class--*`) are emitted so the runtime popover toggle keeps
	 * working below the breakpoint and in always-collapsed mode.
	 */
	public function test_trigger_and_panel_scaffolding_always_render() {
		foreach ( array( 'responsive', 'popover-always' ) as $mode ) {
			$markup = $this->render( array( 'displayMode' => $mode ) );
			$this->assertStringContainsString( 'jetpack-search-filters-popover__trigger', $markup, "mode=$mode" );
			$this->assertStringContainsString( 'jetpack-search-filters-popover__panel', $markup, "mode=$mode" );
			$this->assertStringContainsString( 'data-wp-on--click="actions.toggleFilterPopover"', $markup, "mode=$mode" );
			$this->assertStringContainsString( 'data-wp-class--is-popover-open="state.isFilterPopoverOpen"', $markup, "mode=$mode" );
		}
	}

	/**
	 * The panel must NOT carry the `hidden` HTML attribute or `role="dialog"` —
	 * those were the source of the original a11y bug, where responsive mode at
	 * ≥992px kept the panel `hidden` from screen readers even though CSS
	 * overrode the visual `display`. Class-driven visibility via
	 * `.is-popover-open` keeps sighted and AT users in sync. Regression guard
	 * for PR feedback by Copilot on filters-popover/style.scss.
	 */
	public function test_panel_has_no_hidden_attribute_or_dialog_role() {
		foreach ( array( 'responsive', 'popover-always' ) as $mode ) {
			$markup = $this->render( array( 'displayMode' => $mode ) );
			$this->assertSame(
				0,
				preg_match( '/<div[^>]*jetpack-search-filters-popover__panel[^>]*\bhidden\b[^>]*>/', $markup ),
				"mode=$mode: panel must not carry the hidden attribute"
			);
			$this->assertSame(
				0,
				preg_match( '/<div[^>]*jetpack-search-filters-popover__panel[^>]*role="dialog"[^>]*>/', $markup ),
				"mode=$mode: panel must not carry role=\"dialog\""
			);
			$this->assertStringNotContainsString( 'data-wp-bind--hidden="!state.isFilterPopoverOpen"', $markup, "mode=$mode" );
		}
	}

	/**
	 * The panel must expose a labelled landmark (`role="region"` +
	 * `aria-label="Search filters"`) so AT users navigating by landmarks can
	 * find the filter controls in both the inline-sidebar and popover forms.
	 * Regression guard for PR feedback by claude[bot] on filters-popover.
	 */
	public function test_panel_exposes_search_filters_landmark() {
		foreach ( array( 'responsive', 'popover-always' ) as $mode ) {
			$markup = $this->render( array( 'displayMode' => $mode ) );
			$this->assertSame(
				1,
				preg_match( '/<div[^>]*jetpack-search-filters-popover__panel[^>]*role="region"[^>]*>/', $markup ),
				"mode=$mode: panel must carry role=\"region\""
			);
			$this->assertSame(
				1,
				preg_match( '/<div[^>]*jetpack-search-filters-popover__panel[^>]*aria-label="Search filters"[^>]*>/', $markup ),
				"mode=$mode: panel must carry aria-label=\"Search filters\""
			);
		}
	}
}
