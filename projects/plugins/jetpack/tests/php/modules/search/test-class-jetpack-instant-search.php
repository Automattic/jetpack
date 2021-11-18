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
	public function set_up() {
		parent::set_up();
		static::$instant_search = Jetpack_Instant_Search::instance();
	}

	/**
	 * Unwanted widgets should be removed from Jetpack Search sidbar
	 *
	 * @since 9.8.0
	 */
	public function test_remove_wp_migrated_widgets() {
		$old_sidebars_widgets = $this->get_old_sidebars_widgets_fixture();
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
		$this->set_private_member_value( static::$instant_search, 'old_sidebars_widgets', $old_sidebars_widgets );

		$this->assertEquals(
			$expected_sidebars_widgets,
			static::$instant_search->remove_wp_migrated_widgets( $new_sidebars_widgets )
		);
	}

	/**
	 * Can set old_sidebars_widgets value when _wp_sidebars_changed action is set
	 */
	public function test_save_old_sidebars_widgets_with__wp_sidebars_changed() {
		// Set old_sidebars_widgets to null.
		$this->set_private_member_value( static::$instant_search, 'old_sidebars_widgets' );
		$old_sidebars_widgets = $this->get_old_sidebars_widgets_fixture();
		static::$instant_search->save_old_sidebars_widgets( $old_sidebars_widgets );

		$this->assertEquals( $old_sidebars_widgets, $this->get_private_member_value( static::$instant_search, 'old_sidebars_widgets' ) );
	}

	/**
	 * Can not set old_sidebars_widgets value when no _wp_sidebars_changed action is set
	 */
	public function test_save_old_sidebars_widgets_with_no__wp_sidebars_changed() {
		// Set old_sidebars_widgets to null.
		$this->set_private_member_value( static::$instant_search, 'old_sidebars_widgets' );
		$old_sidebars_widgets = $this->get_old_sidebars_widgets_fixture();
		remove_action( 'after_switch_theme', '_wp_sidebars_changed' );
		static::$instant_search->save_old_sidebars_widgets( $old_sidebars_widgets );

		$this->assertNull( $this->get_private_member_value( static::$instant_search, 'old_sidebars_widgets' ) );
	}

	/**
	 * Mocked sidebars_widgets data
	 *
	 * @since 9.9.0
	 */
	private function get_old_sidebars_widgets_fixture() {
		return array(
			'wp_inactive_widgets'            => array( 'search-2' ),
			'jetpack-instant-search-sidebar' => array( 'jetpack-search-filters-2' ),
			'sidebar-1'                      => array( 'jetpack-search-filters-1', 'recent-posts-2', 'recent-comments-2' ),
			'sidebar-2'                      => array( 'archives-2', 'categories-2', 'meta-2' ),
			'array_version'                  => 3,
		);
	}

	/**
	 * Use reflection to get private member value.
	 *
	 * @since 9.9.0
	 *
	 * @param object $object The object to operate on.
	 * @param string $member_name Name of the private member.
	 *
	 * @return mixed The value of the private member.
	 */
	private function get_private_member_value( $object, $member_name ) {
		$ref = new ReflectionObject( $object );
		$m   = $ref->getProperty( $member_name );
		$m->setAccessible( true );
		return $m->getValue( $object );
	}

	/**
	 * Use reflection to set value to private member.
	 *
	 * @since 9.9.0
	 *
	 * @param object $object The object to operate on.
	 * @param string $member_name Name of the private member.
	 * @param mixed  $value Value of the private member.
	 */
	private function set_private_member_value( $object, $member_name, $value = null ) {
		$ref = new ReflectionObject( $object );
		$m   = $ref->getProperty( $member_name );
		$m->setAccessible( true );
		$m->setValue( $object, $value );
	}
}
