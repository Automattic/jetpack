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
				// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				'render_callback' => static function ( $attributes, $content, $block ) {
					ob_start();
					include __DIR__ . '/../../src/search-blocks/blocks/no-results/render.php';
					return (string) ob_get_clean();
				},
				// phpcs:enable VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
			)
		);
		// The container emits its variants' markup, so they have to render too.
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
		\unregister_block_type( 'jetpack-search/no-results' );
		\unregister_block_type( 'jetpack-search/no-results-slot' );
		parent::tearDownAfterClass();
	}

	/**
	 * Reset the Interactivity state singleton between tests. Every render here
	 * seeds coverage flags and `wp_interactivity_state()` deep-merges, so
	 * without a hard reset one case's coverage bleeds into the next — and into
	 * any class that runs after this one. Same Reflection handle
	 * `Search_Results_Render_Test` uses; `state_data` is private on WP core.
	 */
	protected function setUp(): void {
		parent::setUp();
		$interactivity = wp_interactivity();
		$ref           = new \ReflectionClass( $interactivity );
		if ( $ref->hasProperty( 'state_data' ) ) {
			$prop = $ref->getProperty( 'state_data' );
			if ( PHP_VERSION_ID < 80100 ) {
				$prop->setAccessible( true );
			}
			$prop->setValue( $interactivity, array() );
		}
	}

	/**
	 * Same reset on the way out — `setUp()` alone protects this class, but the
	 * last test's seeded coverage would still escape into whatever runs next.
	 */
	protected function tearDown(): void {
		$interactivity = wp_interactivity();
		$ref           = new \ReflectionClass( $interactivity );
		if ( $ref->hasProperty( 'state_data' ) ) {
			$prop = $ref->getProperty( 'state_data' );
			if ( PHP_VERSION_ID < 80100 ) {
				$prop->setAccessible( true );
			}
			$prop->setValue( $interactivity, array() );
		}
		parent::tearDown();
	}

	/**
	 * Render the block via `do_blocks`.
	 *
	 * @param string $inner_blocks Serialized inner block markup.
	 * @return string Rendered markup.
	 */
	private function render( string $inner_blocks = '' ): string {
		if ( '' === $inner_blocks ) {
			return do_blocks( '<!-- wp:jetpack-search/no-results /-->' );
		}
		return do_blocks(
			'<!-- wp:jetpack-search/no-results -->'
			. $inner_blocks
			. '<!-- /wp:jetpack-search/no-results -->'
		);
	}

	/**
	 * An empty container stands in for an unscoped variant, so it renders the
	 * same filter-aware pair `results-list` has always shipped. This is the
	 * shape the shipped templates carry — a self-closing block — so a stock
	 * install must read exactly as it did before the block existed.
	 */
	public function test_empty_container_renders_both_default_messages() {
		$markup = $this->render();
		$this->assertStringContainsString( 'No results found. Try a different search.', $markup );
		$this->assertStringContainsString( 'No results match these filters.', $markup );
		$this->assertStringContainsString( 'data-wp-bind--hidden="state.hasActiveFilters"', $markup );
		$this->assertStringContainsString( 'role="status"', $markup );
	}

	/**
	 * An empty container also seeds the coverage an unscoped variant would, so
	 * `results-list`'s legacy message stands down on a stock template.
	 */
	public function test_empty_container_seeds_unscoped_coverage() {
		$this->render();
		$state = wp_interactivity_state( 'jetpack-search' );
		$this->assertTrue( $state['hasNoResultsUnfiltered'] );
		$this->assertTrue( $state['hasNoResultsFiltered'] );
		// Disjoint from the error state, so the legacy error region survives.
		$this->assertArrayNotHasKey( 'hasErrorBlock', $state );
	}

	/**
	 * With variants present the container emits them instead of the fallback —
	 * each one carries its own condition binding.
	 */
	public function test_container_emits_its_variants() {
		$markup = $this->render(
			'<!-- wp:jetpack-search/no-results-slot --><!-- wp:paragraph --><p>Nothing matched.</p><!-- /wp:paragraph --><!-- /wp:jetpack-search/no-results-slot -->'
			. '<!-- wp:jetpack-search/no-results-slot {"condition":"error"} --><!-- wp:paragraph --><p>Search is down.</p><!-- /wp:paragraph --><!-- /wp:jetpack-search/no-results-slot -->'
		);
		$this->assertStringContainsString( 'Nothing matched.', $markup );
		$this->assertStringContainsString( 'Search is down.', $markup );
		$this->assertStringContainsString( 'data-wp-bind--hidden="!state.showNoResultsAny"', $markup );
		$this->assertStringContainsString( 'data-wp-bind--hidden="!state.showError"', $markup );
		// The container's own fallback stands down once a variant is present.
		$this->assertStringNotContainsString( 'No results found. Try a different search.', $markup );
	}

	/**
	 * A container holding variants must not seed coverage itself — each
	 * variant seeds only what it covers, so a page with a lone error variant
	 * still shows the legacy no-results message.
	 */
	public function test_container_with_variants_defers_seeding_to_them() {
		$this->render(
			'<!-- wp:jetpack-search/no-results-slot {"condition":"error"} /-->'
		);
		$state = wp_interactivity_state( 'jetpack-search' );
		$this->assertTrue( $state['hasErrorBlock'] );
		$this->assertArrayNotHasKey( 'hasNoResultsUnfiltered', $state );
		$this->assertArrayNotHasKey( 'hasNoResultsFiltered', $state );
	}

	/**
	 * Inner blocks that aren't variants — hand-edited markup, or content saved
	 * before the container took variants — are wrapped as one unscoped variant
	 * rather than emitted bare. Emitting them bare would leave them behind the
	 * region-level binding, so they would also show on a failed request.
	 */
	public function test_non_variant_content_is_treated_as_the_unscoped_condition() {
		$markup = $this->render( '<!-- wp:paragraph --><p>Hand-written copy.</p><!-- /wp:paragraph -->' );
		$this->assertStringContainsString( 'Hand-written copy.', $markup );
		$this->assertStringContainsString( 'data-wp-bind--hidden="!state.showNoResultsAny"', $markup );
		// Authored content keeps its own presentation, so no muted default class
		// and no live region wrapping someone's composition.
		$this->assertStringNotContainsString( 'jetpack-search-no-results--default', $markup );
		$this->assertStringNotContainsString( 'role="status"', $markup );

		$state = wp_interactivity_state( 'jetpack-search' );
		$this->assertTrue( $state['hasNoResultsUnfiltered'] );
		$this->assertTrue( $state['hasNoResultsFiltered'] );
	}

	/**
	 * The container spans every condition its variants cover, so it binds to
	 * the region-level getter and lets each variant hide itself.
	 */
	public function test_container_binds_to_the_region_getter() {
		$this->assertStringContainsString(
			'data-wp-bind--hidden="!state.showEmptyStateRegion"',
			$this->render()
		);
	}

	/**
	 * The region is hidden pre-hydration so the empty state never flashes on a
	 * page that is about to render results.
	 */
	public function test_region_is_hidden_pre_hydration() {
		$markup = $this->render();
		// Anchored per element: the default render emits two divs carrying a
		// bare `hidden`, so an unanchored match would keep passing with either
		// one of them stripped. `preg_match` rather than
		// `assertMatchesRegularExpression`, which was added in PHPUnit 9.1 —
		// the PHP 7.2 CI matrix still runs PHPUnit 8.5. `hidden` has to be
		// preceded by whitespace so `data-wp-bind--hidden` can't satisfy it.
		$this->assertSame(
			1,
			preg_match( '/<div[^>]*state\.showEmptyStateRegion[^>]*\shidden(?=\s|>)/', $markup ),
			'the container must be hidden pre-hydration'
		);
		$this->assertSame(
			1,
			preg_match( '/<div[^>]*\bjetpack-search-no-results__variant\b[^>]*\shidden(?=\s|>)/', $markup ),
			'the default copy must be hidden pre-hydration'
		);
	}

	/**
	 * A message holds arbitrary blocks, and alignment is a property of the
	 * layout its parent provides — without layout support an author can't
	 * centre an image inside one, and `alignwide`/`alignfull` never appear.
	 * `blockGap` is meaningful for the same reason.
	 */
	public function test_a_variant_supports_layout_so_its_content_can_be_aligned() {
		$block_json = (array) json_decode(
			(string) file_get_contents( __DIR__ . '/../../src/search-blocks/blocks/no-results/slot/block.json' ),
			true
		);
		$supports   = (array) ( $block_json['supports'] ?? array() );

		$this->assertSame( 'constrained', $supports['layout']['default']['type'] ?? null );
		$this->assertTrue( $supports['spacing']['blockGap'] ?? false );
	}

	/**
	 * Stray blocks alongside variants — the document Code Editor bypasses
	 * `allowedBlocks`, so this arrives from hand-edited or imported markup.
	 * Emitted bare they'd sit behind the region-level binding alone, showing on
	 * a failed request as well, and their lack of a `hidden` attribute would
	 * defeat the container's collapse rule for good.
	 */
	public function test_stray_blocks_beside_variants_are_wrapped_as_unscoped() {
		$markup = $this->render(
			'<!-- wp:paragraph --><p>STRAY COPY</p><!-- /wp:paragraph -->'
			. '<!-- wp:jetpack-search/no-results-slot {"condition":"filtered"} /-->'
		);

		// The stray sits inside a variant wrapper bound to the unscoped
		// condition, not loose in the container.
		$this->assertSame(
			1,
			preg_match(
				'/<div class="jetpack-search-no-results__variant"[^>]*>\s*<p>STRAY COPY<\/p>\s*<\/div>/',
				$markup
			),
			'the stray block must be wrapped in an unscoped variant'
		);
		$this->assertStringContainsString( 'data-wp-bind--hidden="!state.showNoResultsFiltered"', $markup );

		// And it now covers the unscoped condition, so the legacy region stands
		// down for it rather than rendering a second message.
		$state = wp_interactivity_state( 'jetpack-search' );
		$this->assertTrue( $state['hasNoResultsUnfiltered'] );
	}

	/**
	 * Document order survives the repair — an author's stray content stays
	 * where they put it rather than being collected at one end.
	 */
	public function test_stray_blocks_keep_their_position_among_the_variants() {
		$markup = $this->render(
			'<!-- wp:jetpack-search/no-results-slot {"condition":"filtered"} /-->'
			. '<!-- wp:paragraph --><p>STRAY COPY</p><!-- /wp:paragraph -->'
		);

		$this->assertLessThan(
			strpos( $markup, 'STRAY COPY' ),
			strpos( $markup, 'state.showNoResultsFiltered' ),
			'the variant must still render before the stray that followed it'
		);
	}

	/**
	 * The block-template overlay is pre-rendered on every front-end request, so
	 * its variants must not write coverage into the page-global state — that
	 * would retire the legacy regions of unrelated in-page results markup. It
	 * resolves against its own composition instead.
	 */
	public function test_a_self_contained_render_seeds_nothing() {
		$markup = No_Results::render_self_contained(
			'<!-- wp:jetpack-search/no-results -->'
			. '<!-- wp:jetpack-search/no-results-slot /-->'
			. '<!-- wp:jetpack-search/no-results-slot {"condition":"filtered"} /-->'
			. '<!-- /wp:jetpack-search/no-results -->'
		);

		$this->assertSame( array(), wp_interactivity_state( 'jetpack-search' ) );
		// The unscoped variant yields to the `filtered` one, which it can't read
		// off flags this render never wrote.
		$this->assertStringContainsString( 'data-wp-bind--hidden="!state.showNoResultsUnfiltered"', $markup );
		$this->assertStringContainsString( 'data-wp-bind--hidden="!state.showNoResultsFiltered"', $markup );
	}
}
