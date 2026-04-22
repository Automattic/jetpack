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

	/**
	 * When the URL carries only unregistered array params (e.g. from another
	 * plugin) and no search query, gating drops them — and build_seed_state
	 * must recompute isLoading so the JS store doesn't leave the loading
	 * spinner stuck forever (JS initialize() only fires a search when
	 * searchQuery or hasActiveFilters is truthy).
	 */
	public function test_build_seed_state_recomputes_is_loading_after_gating() {
		$original_get   = $_GET;
		$original_query = $GLOBALS['wp_query'] ?? null;
		$_GET           = array( 'foo' => array( 'bar' ) );
		// Reset the WP_Query global so `get_search_query()` can't leak an `s`
		// value from an earlier test and make isLoading look stuck on its own.
		$GLOBALS['wp_query'] = new \WP_Query( array( 's' => '' ) );
		try {
			$state = Search_Blocks::build_seed_state(
				array( 'category' => array( 'filterKey' => 'category' ) )
			);
			$this->assertSame( '', $state['searchQuery'] );
			$this->assertSame( array(), $state['activeFilters'] );
			$this->assertFalse( $state['isLoading'] );
		} finally {
			$_GET                = $original_get;
			$GLOBALS['wp_query'] = $original_query;
		}
	}

	/**
	 * A URL carrying a registered filter must leave isLoading=true so the
	 * JS store shows the spinner until the first fetch resolves.
	 */
	public function test_build_seed_state_keeps_is_loading_for_registered_filter() {
		$original_get        = $_GET;
		$original_query      = isset( $GLOBALS['wp_query'] ) ? $GLOBALS['wp_query'] : null;
		$_GET                = array( 'category' => array( 'news' ) );
		$GLOBALS['wp_query'] = new \WP_Query( array( 's' => '' ) );
		try {
			$state = Search_Blocks::build_seed_state(
				array( 'category' => array( 'filterKey' => 'category' ) )
			);
			$this->assertSame( array( 'category' => array( 'news' ) ), $state['activeFilters'] );
			$this->assertTrue( $state['isLoading'] );
		} finally {
			$_GET                = $original_get;
			$GLOBALS['wp_query'] = $original_query;
		}
	}
}
