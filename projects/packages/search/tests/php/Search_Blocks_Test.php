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
			'searchQuery',
			'activeFilters',
			'results',
			'aggregations',
			'totalResults',
			'isLoading',
			'pageHandle',
			'hasError',
			'sortOrder',
		);

		$this->assertTrue( class_exists( Search_Blocks::class ) );
		$state = Search_Blocks::build_initial_state();
		foreach ( $required_keys as $key ) {
			$this->assertArrayHasKey( $key, $state, "Missing key: $key" );
		}
	}

	/**
	 * Filters in the URL must seed activeFilters so SSR pre-fetches the right set.
	 *
	 * Landing on /?s=boots&filter[category][]=shoes&filter[category][]=boots
	 * should yield activeFilters = [ 'category' => [ 'shoes', 'boots' ] ] — not
	 * an empty array, which would cause a second-fetch flash after hydration.
	 */
	public function test_build_initial_state_seeds_filters_from_url() {
		$original_get = $_GET;
		$_GET         = array(
			'filter'  => array(
				'category' => array( 'shoes', 'boots' ),
				'post_tag' => array( 'sale' ),
				// Invalid key / empty value entries are dropped.
				''         => array( 'ignored' ),
				'bad'      => array( '' ),
			),
			'orderby' => 'date',
		);
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( array( 'shoes', 'boots' ), $state['activeFilters']['category'] );
			$this->assertSame( array( 'sale' ), $state['activeFilters']['post_tag'] );
			$this->assertArrayNotHasKey( '', $state['activeFilters'] );
			$this->assertArrayNotHasKey( 'bad', $state['activeFilters'] );
			$this->assertSame( 'date', $state['sortOrder'] );
		} finally {
			$_GET = $original_get;
		}
	}
}
