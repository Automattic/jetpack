<?php

require_once JETPACK__PLUGIN_DIR . '3rd-party/class.jetpack-modules-overrides.php';

class WP_Test_Jetpack_Modules_Overrides extends WP_UnitTestCase {
	function tearDown() {
		remove_all_filters( 'option_jetpack_active_modules' );
		Jetpack_Modules_Overrides::clear_cache();
	}

	function test_do_overrides_exist() {
		$this->assertFalse( Jetpack_Modules_Overrides::do_overrides_exist() );

		add_filter( 'option_jetpack_active_modules', '__return_true' );
		$this->assertTrue( Jetpack_Modules_Overrides::do_overrides_exist() );
		remove_filter( 'option_jetpack_active_modules', '__return_true' );
	}

	function test_get_overrides() {
		$this->assertEmpty( Jetpack_Modules_Overrides::get_overrides() );

		add_filter( 'option_jetpack_active_modules', array( $this, 'force_active_modules' ) );
		$expected = array(
			'photon' => 'active',
			'lazy-images' => 'active',
		);
		$this->assertSame( $expected, Jetpack_Modules_Overrides::get_overrides( false ) );

		add_filter( 'option_jetpack_active_modules', array( $this, 'force_inactive_module' ) );
		$expected = array(
			'photon' => 'active',
			'lazy-images' => 'active',
			'sitemaps' => 'inactive',
		);
		$this->assertSame( $expected, Jetpack_Modules_Overrides::get_overrides( false ) );

		remove_filter( 'option_jetpack_active_modules', array( $this, 'force_active_modules' ) );

		$expected = array(
			'sitemaps' => 'inactive',
		);
		$this->assertSame( $expected, Jetpack_Modules_Overrides::get_overrides( false ) );

		remove_filter( 'option_jetpack_active_modules', array( $this, 'force_inactive_module' ) );

		$this->assertEmpty( Jetpack_Modules_Overrides::get_overrides( false ) );
	}

	function test_get_overrides_cache() {
		$this->assertEmpty( Jetpack_Modules_Overrides::get_overrides() );

		add_filter( 'option_jetpack_active_modules', array( $this, 'force_active_modules' ) );
		$expected = array(
			'photon' => 'active',
			'lazy-images' => 'active',
		);
		$this->assertSame( $expected, Jetpack_Modules_Overrides::get_overrides() );

		add_filter( 'option_jetpack_active_modules', array( $this, 'force_inactive_module' ) );

		$this->assertSame( $expected, Jetpack_Modules_Overrides::get_overrides() );
	}

	function test_get_module_override() {
		$this->assertFalse( Jetpack_Modules_Overrides::get_module_override( 'photon' ) );
		$this->assertFalse( Jetpack_Modules_Overrides::get_module_override( 'lazy-images' ) );
		$this->assertFalse( Jetpack_Modules_Overrides::get_module_override( 'sitemaps' ) );

		add_filter( 'option_jetpack_active_modules', array( $this, 'force_active_modules' ) );
		add_filter( 'option_jetpack_active_modules', array( $this, 'force_inactive_module' ) );

		$this->assertSame( 'active', Jetpack_Modules_Overrides::get_module_override( 'photon' ) );
		$this->assertSame( 'active', Jetpack_Modules_Overrides::get_module_override( 'lazy-images' ) );
		$this->assertSame( 'inactive', Jetpack_Modules_Overrides::get_module_override( 'sitemaps' ) );
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
}
