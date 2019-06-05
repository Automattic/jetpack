<?php

use Automattic\Jetpack\Constants\Manager as Constants_Manager;

require_once JETPACK__PLUGIN_DIR . '3rd-party/domain-mapping.php';

// Extend with a public constructor so we can test
class MockDomainMapping extends Jetpack_3rd_Party_Domain_Mapping  {
	public function __construct() {
	}
}

class WP_Test_Domain_Mapping extends WP_UnitTestCase {
	function tearDown() {
		Constants_Manager::clear_constants();
		foreach ( $this->get_jetpack_sync_filters() as $filter ) {
			remove_all_filters( $filter );
		}
	}

	function test_domain_mapping_should_not_try_to_hook_when_sunrise_disable() {
		$stub = $this->getMockBuilder( 'MockDomainMapping' )
			->setMethods( array( 'hook_wordpress_mu_domain_mapping', 'hook_wpmu_dev_domain_mapping' ) )
			->disableOriginalConstructor()
			->getMock();

		// Both of these methods should not be called
		$stub->expects( $this->exactly( 0 ) )
			->method( 'hook_wordpress_mu_domain_mapping' )
			->will( $this->returnValue( false ) );

		$stub->expects( $this->exactly( 0 ) )
			->method( 'hook_wpmu_dev_domain_mapping' )
			->will( $this->returnValue( false ) );

		$stub->attempt_to_hook_domain_mapping_plugins();
	}

	function test_domain_mapping_should_stop_search_after_hooking_once() {
		Constants_Manager::set_constant( 'SUNRISE', true );

		$stub = $this->getMockBuilder( 'MockDomainMapping' )
			->setMethods( array( 'hook_wordpress_mu_domain_mapping', 'hook_wpmu_dev_domain_mapping' ) )
			->disableOriginalConstructor()
			->getMock();

		// The first method in the array should be the only one called.
		$stub->expects( $this->exactly( 1 ) )
			->method( 'hook_wordpress_mu_domain_mapping' )
			->will( $this->returnValue( true ) );

		$stub->expects( $this->exactly( 0 ) )
			->method( 'hook_wpmu_dev_domain_mapping' )
			->will( $this->returnValue( false ) );

		$stub->attempt_to_hook_domain_mapping_plugins();
	}

	function test_domain_mapping_mu_domain_mapping_not_hooked_when_function_not_exists() {
		Constants_Manager::set_constant( 'SUNRISE_LOADED', true );

		$stub = $this->getMockBuilder( 'MockDomainMapping' )
			->setMethods( array( 'function_exists' ) )
			->disableOriginalConstructor()
			->getMock();

		$stub->expects( $this->once() )
			->method( 'function_exists' )
			->will( $this->returnValue( false ) );

		$this->assertFalse( $stub->hook_wordpress_mu_domain_mapping() );

		foreach ( $this->get_jetpack_sync_filters() as $filter ) {
			$this->assertFalse( $this->filter_has_hook( $filter ) );
		}
	}

	function test_domain_mapping_mu_domain_mapping_hooked_when_function_exists() {
		Constants_Manager::set_constant( 'SUNRISE_LOADED', true );

		$stub = $this->getMockBuilder( 'MockDomainMapping' )
			->setMethods( array( 'function_exists' ) )
			->disableOriginalConstructor()
			->getMock();

		$stub->expects( $this->once() )
			->method( 'function_exists' )
			->will( $this->returnValue( true ) );

		$this->assertTrue( $stub->hook_wordpress_mu_domain_mapping() );

		foreach ( $this->get_jetpack_sync_filters() as $filter ) {
			$this->assertTrue( $this->filter_has_hook( $filter ) );
		}
	}

	function test_domain_mapping_wpmu_dev_domain_mapping_not_hooked_when_functions_not_exist() {
		$stub = $this->getMockBuilder( 'MockDomainMapping' )
			->setMethods( array( 'class_exists', 'method_exists' ) )
			->disableOriginalConstructor()
			->getMock();

		$stub->expects( $this->once() )
			->method( 'class_exists' )
			->will( $this->returnValue( false ) );

		$stub->expects( $this->exactly( 0 ) )
			->method( 'method_exists' )
			->will( $this->returnValue( false ) );

		$this->assertFalse( $stub->hook_wpmu_dev_domain_mapping() );

		foreach ( $this->get_jetpack_sync_filters() as $filter ) {
			$this->assertFalse( $this->filter_has_hook( $filter ) );
		}
	}

	function test_domain_mapping_wpmu_dev_domain_mapping_hooked_when_functions_exist() {
		$stub = $this->getMockBuilder( 'MockDomainMapping' )
			->setMethods( array( 'class_exists', 'method_exists', 'get_domain_mapping_utils_instance' ) )
			->disableOriginalConstructor()
			->getMock();

		$stub->expects( $this->once() )
			->method( 'class_exists' )
			->will( $this->returnValue( true ) );

		$stub->expects( $this->once() )
			->method( 'method_exists' )
			->will( $this->returnValue( true ) );

		$stub->expects( $this->once() )
			->method( 'get_domain_mapping_utils_instance' )
			->will( $this->returnValue( new stdClass() ) );

		$this->assertTrue( $stub->hook_wpmu_dev_domain_mapping() );

		foreach ( $this->get_jetpack_sync_filters() as $filter ) {
			$this->assertTrue( $this->filter_has_hook( $filter ) );
		}
	}

	function filter_has_hook( $hook ) {
		global $wp_filter;
		return isset( $wp_filter[ $hook ] ) && ! empty( $wp_filter[ $hook ] );
	}

	function get_jetpack_sync_filters() {
		return array(
			'jetpack_sync_home_url',
			'jetpack_sync_site_url',
		);
	}
}
