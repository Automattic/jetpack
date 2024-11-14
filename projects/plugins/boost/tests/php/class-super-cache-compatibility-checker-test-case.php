<?php

namespace Automattic\Jetpack_Boost\Tests;

use Automattic\Jetpack_Boost\Lib\Super_Cache_Config_Compatibility;
use ReflectionClass;

class Super_Cache_Compatibility_Checker_Test_Case extends Base_Test_Case {
	protected function set_up() {
		parent::set_up();
		// Initialize global variables to avoid undefined variable errors
		global $wp_cache_mobile_enabled, $wp_super_cache_late_init, $wpsc_rejected_cookies, $wp_cache_preload_on, $wp_cache_no_cache_for_get, $wp_cache_not_logged_in, $cache_acceptable_files, $wp_cache_pages, $cache_rejected_uri, $cache_rejected_user_agent;
		$wp_cache_mobile_enabled   = null;
		$wp_super_cache_late_init  = null;
		$wpsc_rejected_cookies     = null;
		$wp_cache_preload_on       = null;
		$wp_cache_no_cache_for_get = null;
		$wp_cache_not_logged_in    = null;
		$cache_acceptable_files    = null;
		$wp_cache_pages            = null;
		$cache_rejected_uri        = null;
		$cache_rejected_user_agent = null;
	}

	public function test_truthy_values_work() {
		global $wp_cache_mobile_enabled, $wp_super_cache_late_init, $wpsc_rejected_cookies, $wp_cache_preload_on, $wp_cache_no_cache_for_get;

		$wp_cache_mobile_enabled = 1;
		$this->assertTrue( $this->invoke_private_method( 'is_mobile_enabled' ) );

		$wp_super_cache_late_init = 0;
		$this->assertFalse( $this->invoke_private_method( 'is_late_init_enabled' ) );

		unset( $wpsc_rejected_cookies );
		$this->assertFalse( $this->invoke_private_method( 'is_rejected_cookies_configured' ) );

		$wp_cache_preload_on = true;
		$this->assertTrue( $this->invoke_private_method( 'is_preload_enabled' ) );

		$wp_cache_no_cache_for_get = false;
		$this->assertFalse( $this->invoke_private_method( 'is_no_cache_for_get_enabled' ) );
	}

	public function test_cache_acceptable_files_work() {
		global $cache_acceptable_files;

		$cache_acceptable_files = array( 'wp-links-opml.php', 'wp-comments-popup.php', 'wp-locations.php' );
		// Should return false as the default values are the same
		$this->assertFalse( $this->invoke_private_method( 'is_extra_acceptable_files_enabled' ) );

		$cache_acceptable_files = array( 'wp-comments-popup.php', 'wp-links-opml.php' );
		// Should return false since we didn't add anything new, only removed a default value
		$this->assertFalse( $this->invoke_private_method( 'is_extra_acceptable_files_enabled' ) );

		$cache_acceptable_files = array( 'foo' );
		// Should return true since we added a new value
		$this->assertTrue( $this->invoke_private_method( 'is_extra_acceptable_files_enabled' ) );

		$cache_acceptable_files = null;
		// Should return false since the value isn't configured
		$this->assertFalse( $this->invoke_private_method( 'is_extra_acceptable_files_enabled' ) );
	}

	public function test_extra_pages_check_works() {
		global $wp_cache_pages;
		// Should return false since the value isn't configured
		$this->assertFalse( $this->invoke_private_method( 'is_extra_pages_enabled' ) );
		$wp_cache_pages['search']    = 0;
		$wp_cache_pages['feed']      = 0;
		$wp_cache_pages['category']  = 0;
		$wp_cache_pages['home']      = 0;
		$wp_cache_pages['frontpage'] = 0;
		$wp_cache_pages['tag']       = 0;
		$wp_cache_pages['archives']  = 0;
		$wp_cache_pages['pages']     = 0;
		// Should return false since all values are 0
		$this->assertFalse( $this->invoke_private_method( 'is_extra_pages_enabled' ) );
		$wp_cache_pages['single'] = 1;
		// Should return true since one value is 1
		$this->assertTrue( $this->invoke_private_method( 'is_extra_pages_enabled' ) );
		$wp_cache_pages['author'] = 1;
		// Should return true since at least one value is 1
		$this->assertTrue( $this->invoke_private_method( 'is_extra_pages_enabled' ) );
	}

	private function invoke_private_method( $method_name ) {
		$class  = new ReflectionClass( Super_Cache_Config_Compatibility::class );
		$method = $class->getMethod( $method_name );
		$method->setAccessible( true );
		return $method->invoke( null );
	}
}
