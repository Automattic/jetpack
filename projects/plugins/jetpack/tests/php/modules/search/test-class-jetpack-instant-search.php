<?php
/**
 * Test Instant Search Class
 *
 * @package automattic/jetpack
 */

if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	require_once WPMU_PLUGIN_DIR . '/jetpack-plugin/vendor/autoload_packages.php';
}

require_jetpack_file( 'modules/search/class.jetpack-search.php' );
require_jetpack_file( 'modules/search/class.jetpack-search-helpers.php' );
require_jetpack_file( 'modules/search/class-jetpack-search-options.php' );
require_jetpack_file( 'modules/search/class-jetpack-instant-search.php' );

/**
 * Jetpack_Instant_Search test cases
 *
 * @since 9.8.0
 */
class WP_Test_Jetpack_Instant_Search extends WP_UnitTestCase {

	/**
	 * Jetpack Instant Search instance
	 *
	 * @var Jetpack_Instant_Search $instant_search
	 */
	public static $instant_search;

	/**
	 * Setup test instance
	 */
	public function setUp() {
		parent::setUp();
		static::$instant_search = Jetpack_Instant_Search::instance();
	}

	/**
	 * Unwanted widgets should be removed from Jetpack Search sidbar
	 *
	 * @since 9.8.0
	 */
	public function test_remove_wp_migrated_widgets() {
		$old_sidebars_widgets = array(
			'wp_inactive_widgets'            => array( 'search-2' ),
			'jetpack-instant-search-sidebar' => array( 'jetpack-search-filters-2' ),
			'sidebar-1'                      => array( 'jetpack-search-filters-1', 'recent-posts-2', 'recent-comments-2' ),
			'sidebar-2'                      => array( 'archives-2', 'categories-2', 'meta-2' ),
			'array_version'                  => 3,
		);
		$new_sidebars_widgets = array(
			'wp_inactive_widgets'            => array( 'search-2' ),
			'jetpack-instant-search-sidebar' => array( 'jetpack-search-filters-2', 'archives-2', 'categories-2', 'meta-2' ),
			'sidebar-1'                      => array( 'jetpack-search-filters-1', 'recent-posts-2', 'recent-comments-2' ),
			'sidebar-2'                      => array(),
			'array_version'                  => 3,
		);
		// Note: sidebar-2 widgets moved to wp_inactive_widgets.
		$expected_sidebars_widgets = array(
			'wp_inactive_widgets'            => array( 'archives-2', 'categories-2', 'meta-2', 'search-2' ),
			'jetpack-instant-search-sidebar' => array( 'jetpack-search-filters-2' ),
			'sidebar-1'                      => array( 'jetpack-search-filters-1', 'recent-posts-2', 'recent-comments-2' ),
			'sidebar-2'                      => array(),
			'array_version'                  => 3,
		);

		add_filter( 'option_sidebars_widgets', array( static::class, 'getOldSidebarsWidgets' ) );
		static::$instant_search->save_old_sidebars_widgets( $old_sidebars_widgets );

		$this->assertEquals(
			$expected_sidebars_widgets,
			static::$instant_search->remove_wp_migrated_widgets( $new_sidebars_widgets )
		);
	}
}
