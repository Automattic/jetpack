<?php
/**
 * No Results block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Integration tests for the no-results block render template.
 */
class No_Results_Render_Test extends TestCase {

	/**
	 * Register the no-results block inline so `do_blocks()` can resolve it
	 * without depending on built artifacts.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		\register_block_type(
			'jetpack-search/no-results',
			array(
				'attributes'      => array(
					'filterState' => array(
						'type'    => 'string',
						'default' => 'any',
					),
				),
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes, $content ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/no-results/render.php';
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
		\unregister_block_type( 'jetpack-search/no-results' );
		parent::tearDownAfterClass();
	}

	/**
	 * Render the block via `do_blocks`.
	 *
	 * @param array  $attributes   Block attributes.
	 * @param string $inner_blocks Serialized inner block markup.
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array(), string $inner_blocks = '' ): string {
		$json = empty( $attributes )
			? ''
			: wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		if ( '' === $inner_blocks ) {
			return do_blocks( '<!-- wp:jetpack-search/no-results ' . $json . ' /-->' );
		}
		return do_blocks(
			'<!-- wp:jetpack-search/no-results ' . $json . ' -->'
			. $inner_blocks
			. '<!-- /wp:jetpack-search/no-results -->'
		);
	}

	/**
	 * A block with no inner blocks stands in for both empty states, so it
	 * renders the same filter-aware pair `results-list` has always shipped.
	 * Keeping the copy in PHP is what lets the block sit in a static template
	 * file and still translate.
	 */
	public function test_empty_block_renders_both_default_messages() {
		$markup = $this->render();
		$this->assertStringContainsString( 'No results found. Try a different search.', $markup );
		$this->assertStringContainsString(
			'No results match these filters. Try clearing some, or searching for something else.',
			$markup
		);
		$this->assertStringContainsString( 'data-wp-bind--hidden="state.hasActiveFilters"', $markup );
		$this->assertStringContainsString( 'data-wp-bind--hidden="!state.hasActiveFilters"', $markup );
	}

	/**
	 * Scoping an empty block to one filter state narrows the fallback to the
	 * matching message instead of rendering the pair.
	 */
	public function test_empty_block_scoped_to_filter_state_renders_one_default_message() {
		$unfiltered = $this->render( array( 'filterState' => 'unfiltered' ) );
		$this->assertStringContainsString( 'No results found. Try a different search.', $unfiltered );
		$this->assertStringNotContainsString( 'No results match these filters.', $unfiltered );

		$filtered = $this->render( array( 'filterState' => 'filtered' ) );
		$this->assertStringContainsString( 'No results match these filters.', $filtered );
		$this->assertStringNotContainsString( 'No results found. Try a different search.', $filtered );
	}

	/**
	 * Authored inner blocks replace the fallback copy entirely — that is the
	 * whole point of the block, so a link survives to the front end intact.
	 */
	public function test_inner_blocks_replace_the_default_message() {
		$markup = $this->render(
			array(),
			'<!-- wp:paragraph --><p>Try <a href="/archive">the archive</a>.</p><!-- /wp:paragraph -->'
		);
		$this->assertStringContainsString( '<a href="/archive">the archive</a>', $markup );
		$this->assertStringNotContainsString( 'No results found. Try a different search.', $markup );
	}

	/**
	 * The muted treatment is scoped to the fallback copy so a stock install
	 * keeps its existing look while authored content renders at full strength.
	 */
	public function test_default_modifier_class_tracks_authored_content() {
		$this->assertStringContainsString(
			'jetpack-search-no-results--default',
			$this->render()
		);
		$this->assertStringNotContainsString(
			'jetpack-search-no-results--default',
			$this->render( array(), '<!-- wp:paragraph --><p>Nothing here.</p><!-- /wp:paragraph -->' )
		);
	}

	/**
	 * Each filter state binds to its own store getter — `data-wp-bind` only
	 * evaluates simple property paths, so the condition can't be inlined.
	 */
	public function test_filter_state_selects_the_matching_visibility_getter() {
		$this->assertStringContainsString(
			'data-wp-bind--hidden="!state.showNoResults"',
			$this->render()
		);
		$this->assertStringContainsString(
			'data-wp-bind--hidden="!state.showNoResultsUnfiltered"',
			$this->render( array( 'filterState' => 'unfiltered' ) )
		);
		$this->assertStringContainsString(
			'data-wp-bind--hidden="!state.showNoResultsFiltered"',
			$this->render( array( 'filterState' => 'filtered' ) )
		);
	}

	/**
	 * An unknown `filterState` (hand-edited markup, or an attribute from a
	 * future version) falls back to the unscoped getter rather than emitting
	 * a binding no getter answers, which would leave the region stuck open.
	 */
	public function test_unknown_filter_state_falls_back_to_any() {
		$markup = $this->render( array( 'filterState' => 'bogus' ) );
		$this->assertStringContainsString( 'data-wp-bind--hidden="!state.showNoResults"', $markup );
	}

	/**
	 * The region is `role="status"` and hidden pre-hydration so it never
	 * paints on a page that does have results.
	 */
	public function test_region_is_hidden_and_announced() {
		$markup = $this->render();
		$this->assertStringContainsString( 'role="status"', $markup );
		$this->assertStringContainsString( 'hidden', $markup );
		$this->assertStringContainsString( 'data-wp-interactive="jetpack-search"', $markup );
	}

	/**
	 * Rendering seeds `hasNoResultsBlock`, which is what stands down
	 * `results-list`'s legacy message region on pages carrying this block.
	 */
	public function test_render_seeds_has_no_results_block_state() {
		$this->render();
		$state = wp_interactivity_state( 'jetpack-search' );
		$this->assertTrue( $state['hasNoResultsBlock'] );
	}
}
