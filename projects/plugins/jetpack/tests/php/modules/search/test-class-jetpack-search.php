<?php
/**
 * Instant Search test cases
 *
 * @package automattic/jetpack
 */

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	require_once WPMU_PLUGIN_DIR . '/jetpack-plugin/vendor/autoload_packages.php';
}

require_jetpack_file( 'modules/search.php' );

/**
 * Jetpack_Instant_Search test cases
 */
class WP_Test_Jetpack_Search extends WP_UnitTestCase {

	/**
	 * Verify deprecated classes still exist.
	 *
	 * @since 10.6.1
	 */
	public function test_deprecated_jetpack_search_class() {
		$search = Jetpack_Search::instance();
		self::assertTrue( is_a( $search, 'Automattic\Jetpack\Search\Classic_Search' ) );
	}

}
