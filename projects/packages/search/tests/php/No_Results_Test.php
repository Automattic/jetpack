<?php
/**
 * No_Results class tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the empty-state coverage helpers.
 *
 * The behaviour inside a self-contained render is covered where it shows —
 * `No_Results_Render_Test` for the block's own markup, `Results_List_Render_Test`
 * for the legacy regions it retires.
 */
class No_Results_Test extends TestCase {

	/**
	 * The block ships a variant per condition, which is what lets a render of
	 * that markup do without the legacy regions entirely.
	 */
	public function test_collect_coverage_reads_every_variant() {
		$coverage = No_Results::collect_coverage(
			'<!-- wp:jetpack-search/no-results -->'
			. '<!-- wp:jetpack-search/no-results-slot /-->'
			. '<!-- wp:jetpack-search/no-results-slot {"condition":"filtered"} /-->'
			. '<!-- wp:jetpack-search/no-results-slot {"condition":"error"} /-->'
			. '<!-- /wp:jetpack-search/no-results -->'
		);

		$this->assertSame(
			array(
				'any'      => true,
				'filtered' => true,
				'error'    => true,
			),
			$coverage
		);
	}

	/**
	 * The block sits several levels down in every shipped template, so the walk
	 * has to descend rather than scan the top level.
	 */
	public function test_collect_coverage_descends_into_inner_blocks() {
		$coverage = No_Results::collect_coverage(
			'<!-- wp:group --><div class="wp-block-group">'
			. '<!-- wp:jetpack-search/search-results -->'
			. '<!-- wp:jetpack-search/no-results -->'
			. '<!-- wp:jetpack-search/no-results-slot {"condition":"filtered"} /-->'
			. '<!-- /wp:jetpack-search/no-results -->'
			. '<!-- /wp:jetpack-search/search-results -->'
			. '</div><!-- /wp:group -->'
		);

		$this->assertTrue( $coverage['filtered'] );
		$this->assertFalse( $coverage['any'] );
		$this->assertFalse( $coverage['error'] );
	}

	/**
	 * A container with no variants stands in for an unscoped one — the shape the
	 * templates carried before they gained variants.
	 */
	public function test_collect_coverage_treats_an_empty_container_as_unscoped() {
		$coverage = No_Results::collect_coverage( '<!-- wp:jetpack-search/no-results /-->' );

		$this->assertTrue( $coverage['any'] );
		$this->assertFalse( $coverage['error'] );
	}

	/**
	 * Markup with no block at all covers nothing, which is what keeps the legacy
	 * regions rendering for content that predates it.
	 */
	public function test_collect_coverage_of_markup_without_the_block() {
		$coverage = No_Results::collect_coverage( '<!-- wp:jetpack-search/results-list /-->' );

		$this->assertSame(
			array(
				'any'      => false,
				'filtered' => false,
				'error'    => false,
			),
			$coverage
		);
	}

	/**
	 * An unrecognized or missing condition renders as the unscoped one, so
	 * coverage has to read it that way too — otherwise a hand-edited variant
	 * would leave the state it actually covers looking uncovered.
	 */
	public function test_collect_coverage_normalizes_an_unknown_condition() {
		$coverage = No_Results::collect_coverage(
			'<!-- wp:jetpack-search/no-results -->'
			. '<!-- wp:jetpack-search/no-results-slot {"condition":"bogus"} /-->'
			. '<!-- /wp:jetpack-search/no-results -->'
		);

		$this->assertTrue( $coverage['any'] );
		$this->assertFalse( $coverage['filtered'] );
	}

	/**
	 * A page render defers to the coverage flags each variant seeds, exactly as
	 * it did before self-contained renders had a scope of their own.
	 */
	public function test_a_page_render_defers_to_the_seeded_flags() {
		$this->assertSame( 'state.showLegacyNoResults', No_Results::legacy_no_results_getter() );
		$this->assertSame( 'state.showLegacyError', No_Results::legacy_error_getter() );
		$this->assertSame( 'state.showNoResultsAny', No_Results::visibility_getter( 'any' ) );
	}
}
