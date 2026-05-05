<?php
/**
 * Results Count block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the results-count block's render template.
 *
 * Mirrors the other block render tests: registered inline so `do_blocks()`
 * can resolve it without depending on built artifacts in `build/`.
 */
class Results_Count_Render_Test extends TestCase {

	/**
	 * Register the results-count block inline for the whole test class.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		\register_block_type(
			'jetpack/results-count',
			array(
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/results-count/render.php';
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
		\unregister_block_type( 'jetpack/results-count' );
		parent::tearDownAfterClass();
	}

	/**
	 * Render the results-count block via `do_blocks`.
	 *
	 * @return string Rendered markup.
	 */
	private function render(): string {
		return do_blocks( '<!-- wp:jetpack/results-count /-->' );
	}

	/**
	 * The wrapper carries `aria-busy` bound to the live `isLoading` flag and
	 * `aria-live="polite"` so assistive tech announces the resolved count
	 * once it lands instead of "Searching…" then a separate count.
	 */
	public function test_wrapper_carries_aria_busy_and_aria_live() {
		$markup = $this->render();
		$this->assertStringContainsString( 'data-wp-bind--aria-busy="state.isLoading"', $markup );
		$this->assertStringContainsString( 'aria-live="polite"', $markup );
	}

	/**
	 * The text node that paints the resolved count binds to
	 * `state.resultsCountText` — the only DOM affordance for the count
	 * string post-hydration. Hidden while a fetch is in flight so it
	 * never co-exists with the skeleton bar on screen.
	 */
	public function test_renders_text_node_bound_to_results_count_text() {
		$markup = $this->render();
		$this->assertStringContainsString( 'data-wp-text="state.resultsCountText"', $markup );
		$this->assertStringContainsString( 'data-wp-bind--hidden="state.isLoading"', $markup );
	}

	/**
	 * The skeleton bar is always emitted (not gated server-side on the
	 * URL-driven `is_initial_loading` heuristic) so it remains in the DOM
	 * for re-searches triggered post-hydration — filter changes, sort
	 * changes, etc. Visibility is owned by `data-wp-bind--hidden` against
	 * the live `state.isLoading` flag.
	 */
	public function test_renders_skeleton_bar_gated_by_is_loading() {
		$markup = $this->render();
		$this->assertStringContainsString( 'jetpack-search-skeleton--count', $markup );
		$this->assertStringContainsString( 'data-wp-bind--hidden="!state.isLoading"', $markup );
	}

	/**
	 * Pre-rename markup seeded `data-wp-text="state.resultsCountText"` on
	 * the wrapper itself with a "Searching…" string seeded into the same
	 * value, which flickered to empty when the resolved count was zero.
	 * The wrapper now owns no `data-wp-text` of its own — only the inner
	 * text node carries that binding — so a stale seed can't paint string
	 * content next to the skeleton bar.
	 */
	public function test_wrapper_does_not_carry_data_wp_text() {
		$markup = $this->render();
		// The match is anchored to the wrapper opening tag (the first `<p`
		// in the markup). The inner span's `data-wp-text` is fine; what we
		// guard against is the wrapper itself binding text.
		$this->assertMatchesRegularExpression(
			'/<p\b[^>]*>(?![^<]*data-wp-text)/',
			$markup,
			'Wrapper <p> must not carry data-wp-text — that binding lives on the inner text span.'
		);
	}
}
