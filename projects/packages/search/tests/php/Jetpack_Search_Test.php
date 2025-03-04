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
	 * Verify deprecated classes still exist.
	 *
	 * @since 10.6.1
	 */
	public function test_deprecated_jetpack_search_class() {
		$search = Classic_Search::instance();
		self::assertTrue( is_a( $search, 'Automattic\Jetpack\Search\Classic_Search' ) );
	}
}
