<?php

require_once JETPACK__PLUGIN_DIR . '3rd-party/class.jetpack-modules-overrides.php';

class WP_Test_Jetpack_Modules_Overrides extends WP_UnitTestCase {
	private $instance = null;

	public function setUp() {
		$this->instance = Jetpack_Modules_Overrides::instance();
	}

	public function tearDown() {
		remove_all_filters( 'option_jetpack_active_modules' );
		remove_all_filters( 'jetpack_active_modules' );
		$this->instance->clear_cache();
	}

	/**
	 * @dataProvider get_supported_filters
	 */
	public function test_do_overrides_exist( $filter_name ) {
		$this->assertFalse( $this->instance->do_overrides_exist() );

		add_filter( $filter_name, '__return_true' );
		$this->assertTrue( $this->instance->do_overrides_exist() );
		remove_filter( $filter_name, '__return_true' );
	}

	/**
	 * @dataProvider get_supported_filters
	 */
	public function test_get_overrides( $filter_name ) {
		$this->assertEmpty( $this->instance->get_overrides() );

		add_filter( $filter_name, array( $this, 'force_active_modules' ) );
		$expected = array(
			'photon' => 'active',
			'lazy-images' => 'active',
		);
		$this->assertSame( $expected, $this->instance->get_overrides( false ) );

		add_filter( $filter_name, array( $this, 'force_inactive_module' ) );
		$expected = array(
			'photon' => 'active',
			'lazy-images' => 'active',
			'sitemaps' => 'inactive',
		);
		$this->assertSame( $expected, $this->instance->get_overrides( false ) );

		remove_filter( $filter_name, array( $this, 'force_active_modules' ) );

		$expected = array(
			'sitemaps' => 'inactive',
		);
		$this->assertSame( $expected, $this->instance->get_overrides( false ) );

		remove_filter( $filter_name, array( $this, 'force_inactive_module' ) );

		$this->assertEmpty( $this->instance->get_overrides( false ) );
	}

	/**
	 * @dataProvider get_supported_filters
	 */
	public function test_get_overrides_cache( $filter_name ) {
		$this->assertEmpty( $this->instance->get_overrides() );

		add_filter( $filter_name, array( $this, 'force_active_modules' ) );
		$expected = array(
			'photon' => 'active',
			'lazy-images' => 'active',
		);
		$this->assertSame( $expected, $this->instance->get_overrides() );

		add_filter( $filter_name, array( $this, 'force_inactive_module' ) );

		$this->assertSame( $expected, $this->instance->get_overrides() );
	}

	/**
	 * @dataProvider get_supported_filters
	 */
	public function test_get_module_override( $filter_name ) {
		$this->assertFalse( $this->instance->get_module_override( 'photon' ) );
		$this->assertFalse( $this->instance->get_module_override( 'lazy-images' ) );
		$this->assertFalse( $this->instance->get_module_override( 'sitemaps' ) );

		add_filter( $filter_name, array( $this, 'force_active_modules' ) );
		add_filter( $filter_name, array( $this, 'force_inactive_module' ) );

		$this->assertSame( 'active', $this->instance->get_module_override( 'photon' ) );
		$this->assertSame( 'active', $this->instance->get_module_override( 'lazy-images' ) );
		$this->assertSame( 'inactive', $this->instance->get_module_override( 'sitemaps' ) );
	}

	/**
	 * Helpers
	 */

	function force_active_modules( $modules ) {
		return array_merge( $modules, array( 'photon', 'lazy-images' ) );
	}

	function force_inactive_module( $modules ) {
		$found = array_search( 'sitemaps', $modules );
		if ( $found ) {
			unset( $modules[ $found ] );
		}

		return $modules;
	}

	public function get_supported_filters() {
		return array(
			'option_jetpack_active_modules' => array( // Case for filtering the option via core filter.
				'option_jetpack_active_modules'
			),
			'jetpack_active_modules' => array( // Case for filtering using Jetpack filter.
				'jetpack_active_modules',
			)
		);
	}
}
