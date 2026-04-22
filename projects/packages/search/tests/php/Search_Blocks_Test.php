<?php
/**
 * Search_Blocks class tests.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Tests for the Search_Blocks registration class.
 */
class Search_Blocks_Test extends TestCase {

	/**
	 * Verify that the keys required by the Interactivity API store are present.
	 */
	public function test_build_initial_state_shape() {
		$required_keys = array(
			'siteId',
			'apiRoot',
			'nonce',
			'isPrivateSite',
			'isWpcom',
			'homeUrl',
			'locale',
			'searchQuery',
			'sortOrder',
			'results',
			'totalResults',
			'pageHandle',
			'isLoading',
			'isLoadingMore',
			'hasError',
		);

		$this->assertTrue( class_exists( Search_Blocks::class ) );
		$state = Search_Blocks::build_initial_state();
		foreach ( $required_keys as $key ) {
			$this->assertArrayHasKey( $key, $state, "Missing key: $key" );
		}
	}

	/**
	 * A known `orderby` in the URL must seed sortOrder so SSR pre-fetches
	 * the correct ordering. Values must stay aligned with the UI keys in
	 * src/instant-search/lib/constants.js SORT_OPTIONS.
	 */
	public function test_build_initial_state_seeds_sort_order_from_url() {
		$original_get = $_GET;
		$_GET         = array( 'orderby' => 'newest' );
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( 'newest', $state['sortOrder'] );
		} finally {
			$_GET = $original_get;
		}
	}

	/**
	 * Unrecognized `orderby` values must fall back to the default `relevance`
	 * sort, not propagate into the Elasticsearch query.
	 */
	public function test_build_initial_state_rejects_unknown_sort_order() {
		$original_get = $_GET;
		$_GET         = array( 'orderby' => 'drop-tables' );
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( 'relevance', $state['sortOrder'] );
		} finally {
			$_GET = $original_get;
		}
	}

	/**
	 * Only filter keys registered by a filter-checkbox block on the current
	 * post may survive into the seeded state. An unrelated `?foo[]=bar`
	 * param (e.g. from another plugin) must be dropped so it doesn't get
	 * echoed back into subsequent search URLs.
	 */
	public function test_gate_active_filters_keeps_only_registered_keys() {
		$gated = Search_Blocks::gate_active_filters(
			array(
				'category'   => array( 'news' ),
				'post_types' => array( 'post' ),
				'foo'        => array( 'bar' ),
			),
			array(
				'category'   => array( 'filterKey' => 'category' ),
				'post_types' => array( 'filterKey' => 'post_types' ),
			)
		);
		$this->assertSame(
			array(
				'category'   => array( 'news' ),
				'post_types' => array( 'post' ),
			),
			$gated
		);
	}

	/**
	 * When no filter-checkbox blocks contribute a filterConfig (e.g. the
	 * post uses a template part instead of the bundled pattern), leave
	 * activeFilters alone — hydration may still register them client-side.
	 */
	public function test_gate_active_filters_passthrough_when_configs_empty() {
		$input = array( 'category' => array( 'news' ) );
		$this->assertSame( $input, Search_Blocks::gate_active_filters( $input, array() ) );
	}
}
