<?php
/**
 * No Results Variant block render.php tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Integration tests for the no-results-slot block render template.
 */
class No_Results_Slot_Render_Test extends TestCase {

	/**
	 * Register the variant block inline so `do_blocks()` can resolve it without
	 * depending on built artifacts.
	 */
	public static function setUpBeforeClass(): void {
		parent::setUpBeforeClass();
		\register_block_type(
			'jetpack-search/no-results-slot',
			array(
				'attributes'      => array(
					'condition' => array(
						'type'    => 'string',
						'default' => 'any',
					),
				),
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes, $content ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/no-results/slot/render.php';
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
		\unregister_block_type( 'jetpack-search/no-results-slot' );
		parent::tearDownAfterClass();
	}

	/**
	 * Reset the Interactivity state singleton between tests. Every render here
	 * seeds coverage flags and `wp_interactivity_state()` deep-merges, so
	 * without a hard reset one case's coverage bleeds into the next — and into
	 * any class that runs after this one.
	 */
	protected function setUp(): void {
		parent::setUp();
		self::reset_interactivity_state();
	}

	/**
	 * Same reset on the way out.
	 */
	protected function tearDown(): void {
		self::reset_interactivity_state();
		parent::tearDown();
	}

	/**
	 * Empty the private `state_data` on WP core's interactivity singleton.
	 */
	private static function reset_interactivity_state(): void {
		$interactivity = wp_interactivity();
		$ref           = new \ReflectionClass( $interactivity );
		if ( ! $ref->hasProperty( 'state_data' ) ) {
			return;
		}
		$prop = $ref->getProperty( 'state_data' );
		if ( PHP_VERSION_ID < 80100 ) {
			$prop->setAccessible( true );
		}
		$prop->setValue( $interactivity, array() );
	}

	/**
	 * Render one variant via `do_blocks`.
	 *
	 * @param array  $attributes   Block attributes.
	 * @param string $inner_blocks Serialized inner block markup.
	 * @return string Rendered markup.
	 */
	private function render( array $attributes = array(), string $inner_blocks = '' ): string {
		$json = empty( $attributes ) ? '' : wp_json_encode( $attributes, JSON_UNESCAPED_SLASHES );
		if ( '' === $inner_blocks ) {
			return do_blocks( '<!-- wp:jetpack-search/no-results-slot ' . $json . ' /-->' );
		}
		return do_blocks(
			'<!-- wp:jetpack-search/no-results-slot ' . $json . ' -->'
			. $inner_blocks
			. '<!-- /wp:jetpack-search/no-results-slot -->'
		);
	}

	/**
	 * Each condition binds to its own store getter — `data-wp-bind` only
	 * evaluates simple property paths, so the condition can't be inlined.
	 */
	public function test_condition_selects_the_matching_visibility_getter() {
		$this->assertStringContainsString(
			'data-wp-bind--hidden="!state.showNoResultsAny"',
			$this->render()
		);
		$this->assertStringContainsString(
			'data-wp-bind--hidden="!state.showNoResultsFiltered"',
			$this->render( array( 'condition' => 'filtered' ) )
		);
		$this->assertStringContainsString(
			'data-wp-bind--hidden="!state.showError"',
			$this->render( array( 'condition' => 'error' ) )
		);
	}

	/**
	 * An unknown `condition` (hand-edited markup, or an attribute from a future
	 * version) falls back to the unscoped getter rather than emitting a binding
	 * no getter answers, which would leave the region stuck open.
	 */
	public function test_unknown_condition_falls_back_to_any() {
		$markup = $this->render( array( 'condition' => 'bogus' ) );
		$this->assertStringContainsString( 'data-wp-bind--hidden="!state.showNoResultsAny"', $markup );
	}

	/**
	 * An empty unscoped variant covers both empty states, so it falls back to
	 * the same filter-aware pair `results-list` has always rendered.
	 */
	public function test_empty_unscoped_variant_renders_both_default_messages() {
		$markup = $this->render();
		$this->assertStringContainsString( 'No results found. Try a different search.', $markup );
		$this->assertStringContainsString( 'No results match these filters.', $markup );
		$this->assertStringContainsString( 'data-wp-bind--hidden="state.hasActiveFilters"', $markup );
	}

	/**
	 * A scoped variant narrows the fallback to the matching message.
	 */
	public function test_scoped_variants_render_one_default_message() {
		$filtered = $this->render( array( 'condition' => 'filtered' ) );
		$this->assertStringContainsString( 'No results match these filters.', $filtered );
		$this->assertStringNotContainsString( 'No results found. Try a different search.', $filtered );

		$error = $this->render( array( 'condition' => 'error' ) );
		$this->assertStringContainsString( 'Something went wrong. Please try again.', $error );
		$this->assertStringNotContainsString( 'No results found. Try a different search.', $error );
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
		$this->assertStringContainsString( 'jetpack-search-no-results--default', $this->render() );
		$this->assertStringNotContainsString(
			'jetpack-search-no-results--default',
			$this->render( array(), '<!-- wp:paragraph --><p>Nothing here.</p><!-- /wp:paragraph -->' )
		);
	}

	/**
	 * A failure is assertive, an empty result set is not — the same split
	 * `results-list` has always emitted between its two regions.
	 *
	 * Authored content gets a live region too. `results-list` announced its
	 * custom copy, so wrapping only the fallback would leave a screen reader
	 * silent on the transition to empty for exactly the authors who cared
	 * enough to write their own message. Results arrive client-side, so there
	 * is no page load to announce it instead.
	 */
	public function test_live_region_matches_the_condition_for_default_and_authored_copy() {
		$this->assertStringContainsString( 'role="status"', $this->render() );
		$this->assertStringContainsString(
			'role="alert"',
			$this->render( array( 'condition' => 'error' ) )
		);
		$this->assertStringContainsString(
			'role="status"',
			$this->render( array(), '<!-- wp:paragraph --><p>Nothing here.</p><!-- /wp:paragraph -->' )
		);
		$this->assertStringContainsString(
			'role="alert"',
			$this->render(
				array( 'condition' => 'error' ),
				'<!-- wp:paragraph --><p>Search is down.</p><!-- /wp:paragraph -->'
			)
		);
	}

	/**
	 * The region is hidden pre-hydration so the empty state never flashes on a
	 * page that is about to render results.
	 */
	public function test_region_is_hidden_pre_hydration() {
		$this->assertMatchesRegularExpression( '/<div[^>]*\shidden\s*>/', $this->render() );
	}

	/**
	 * An unscoped variant covers both empty states but claims neither
	 * exclusively — it is the fallback, so it must not suppress a scoped
	 * sibling.
	 */
	public function test_unscoped_variant_seeds_both_states_and_claims_neither() {
		$this->render();
		$state = wp_interactivity_state( 'jetpack-search' );
		$this->assertTrue( $state['hasNoResultsUnfiltered'] );
		$this->assertTrue( $state['hasNoResultsFiltered'] );
		$this->assertArrayNotHasKey( 'hasScopedNoResultsFiltered', $state );
		$this->assertArrayNotHasKey( 'hasErrorBlock', $state );
	}

	/**
	 * A filtered variant seeds coverage only for its own state and claims it,
	 * so the unscoped variant yields there instead of stacking on top.
	 */
	public function test_filtered_variant_seeds_and_claims_only_its_own_state() {
		$this->render( array( 'condition' => 'filtered' ) );
		$state = wp_interactivity_state( 'jetpack-search' );
		$this->assertTrue( $state['hasNoResultsFiltered'] );
		$this->assertTrue( $state['hasScopedNoResultsFiltered'] );
		$this->assertArrayNotHasKey( 'hasNoResultsUnfiltered', $state );
	}

	/**
	 * The error variant retires `results-list`'s legacy *error* region and
	 * covers neither no-results case — keeping the two disjoint is what lets a
	 * page without an error variant keep its legacy error copy.
	 */
	public function test_error_variant_seeds_only_the_error_claim() {
		$this->render( array( 'condition' => 'error' ) );
		$state = wp_interactivity_state( 'jetpack-search' );
		$this->assertTrue( $state['hasErrorBlock'] );
		$this->assertArrayNotHasKey( 'hasNoResultsUnfiltered', $state );
		$this->assertArrayNotHasKey( 'hasNoResultsFiltered', $state );
	}

	/**
	 * The suggested pairing composes into full coverage —
	 * `wp_interactivity_state()` deep-merges and nothing ever seeds `false`.
	 */
	public function test_variants_compose_into_full_coverage() {
		$this->render();
		$this->render( array( 'condition' => 'filtered' ) );
		$this->render( array( 'condition' => 'error' ) );
		$state = wp_interactivity_state( 'jetpack-search' );
		$this->assertTrue( $state['hasNoResultsUnfiltered'] );
		$this->assertTrue( $state['hasNoResultsFiltered'] );
		$this->assertTrue( $state['hasErrorBlock'] );
	}
}
