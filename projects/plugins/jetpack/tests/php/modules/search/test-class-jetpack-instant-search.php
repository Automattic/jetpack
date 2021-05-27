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
require_once __DIR__ . '/class-jetpack-instant-search-child.php';

/**
 * Jetpack_Instant_Search test cases
 *
 * @since 9.8.0
 */
class WP_Test_Jetpack_Instant_Search extends WP_UnitTestCase {

	/**
	 * Jetpack Instant Search instance
	 *
	 * @var Jetpack_Instant_Search_Child $instant_search
	 */
	public static $instant_search;

	/**
	 * Setup test instance
	 */
	public function setUp() {
		parent::setUp();
		static::$instant_search = Jetpack_Instant_Search_Child::instance();
	}

	/**
	 * Unwanted widgets should be removed from Jetpack Search sidbar
	 *
	 * @since 9.8.0
	 */
	public function test_remove_wp_migrated_widgets() {
		static::$instant_search->set_old_sidebars_widgets();
		$old_sidebars_widgets = $this->get_old_sidebars_widgets_data();
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
		static::$instant_search->set_old_sidebars_widgets( $old_sidebars_widgets );

		$this->assertEquals(
			$expected_sidebars_widgets,
			static::$instant_search->remove_wp_migrated_widgets( $new_sidebars_widgets )
		);
	}

	/**
	 * Can set old_sidebars_widgets value when _wp_sidebars_changed action is set
	 */
	public function test_save_old_sidebars_widgets_with__wp_sidebars_changed() {
		static::$instant_search->set_old_sidebars_widgets();
		$old_sidebars_widgets = $this->get_old_sidebars_widgets_data();
		static::$instant_search->save_old_sidebars_widgets( $old_sidebars_widgets );

		$this->assertEquals( $old_sidebars_widgets, static::$instant_search->get_old_sidebars_widgets() );
	}

	/**
	 * Can not set old_sidebars_widgets value when _wp_sidebars_changed action is set
	 */
	public function test_save_old_sidebars_widgets_with_no__wp_sidebars_changed() {
		static::$instant_search->set_old_sidebars_widgets();
		$old_sidebars_widgets = $this->get_old_sidebars_widgets_data();
		remove_action( 'after_switch_theme', '_wp_sidebars_changed' );
		static::$instant_search->save_old_sidebars_widgets( $old_sidebars_widgets );

		$this->assertNull( static::$instant_search->get_old_sidebars_widgets() );
	}

	/**
	 * Mocked sidebars_widgets data
	 *
	 * @since 9.9.0
	 */
	private function get_old_sidebars_widgets_data() {
		return array(
			'wp_inactive_widgets'            => array( 'search-2' ),
			'jetpack-instant-search-sidebar' => array( 'jetpack-search-filters-2' ),
			'sidebar-1'                      => array( 'jetpack-search-filters-1', 'recent-posts-2', 'recent-comments-2' ),
			'sidebar-2'                      => array( 'archives-2', 'categories-2', 'meta-2' ),
			'array_version'                  => 3,
		);
	}
}
