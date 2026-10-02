<?php
/**
 * Classic Search test cases
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

/**
 * Jetpack_Instant_Search test cases
 */
class Jetpack_Search_Test extends TestCase {

	/**
	 * Reset the main query global after each test.
	 */
	protected function tearDown(): void {
		parent::tearDown();

		$GLOBALS['wp_the_query'] = null;
	}

	/**
	 * Verify deprecated classes still exist.
	 *
	 * @since 10.6.1
	 */
	public function test_deprecated_jetpack_search_class() {
		$search = Classic_Search::instance();
		self::assertTrue( is_a( $search, 'Automattic\Jetpack\Search\Classic_Search' ) );
	}

	/**
	 * A plain main search query should be handled as usual.
	 */
	public function test_should_handle_query_true_for_a_normal_search() {
		$query                   = new \WP_Query( array( 's' => 'hello world' ) );
		$GLOBALS['wp_the_query'] = $query;

		self::assertTrue( Classic_Search::instance()->should_handle_query( $query ) );
	}

	/**
	 * A search combined with post__in should still be handled by Jetpack Search.
	 */
	public function test_should_handle_query_true_for_search_with_post_in() {
		$query = new \WP_Query( array( 's' => 'hello world' ) );
		$query->set( 'post__in', array( 1, 2, 3 ) );
		$GLOBALS['wp_the_query'] = $query;

		self::assertTrue( Classic_Search::instance()->should_handle_query( $query ) );
	}

	/**
	 * If a pre_get_posts callback set post__in and then cleared 's' (e.g. to restrict a
	 * search to SKU matches without also double-filtering on the term), Jetpack Search
	 * must not replace that restriction with an unrestricted ES result set.
	 */
	public function test_should_handle_query_false_when_post_in_restricts_a_cleared_search() {
		$query = new \WP_Query( array( 's' => 'sku-12345' ) );
		$query->set( 'post__in', array( 1, 2, 3 ) );
		$query->set( 's', '' );
		$GLOBALS['wp_the_query'] = $query;

		self::assertFalse( Classic_Search::instance()->should_handle_query( $query ) );
	}
}
