<?php

require_jetpack_file( 'sal/class.json-api-platform.php' );

class SalSiteTest extends WP_UnitTestCase {
	public static $token;
	public static $site;

	/**
	 * Set up before class.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$token = (object) array(
			'blog_id'          => get_current_blog_id(),
			'user_id'          => get_current_user_id(),
			'external_user_id' => 2,
			'role'             => 'administrator',
		);

		$platform = wpcom_get_sal_platform( self::$token );

		self::$site = $platform->get_site( self::$token->blog_id );
	}

	public function test_uses_synced_api_post_type_whitelist_if_available() {

		$this->assertFalse( self::$site->is_post_type_allowed( 'my_new_type' ) );
	}

	public function test_is_module_active() {

		// Picking random 3 modules from an array of existing ones to not slow down the test
		$modules = array_rand( Jetpack::get_available_modules(), 3 );

		foreach ( $modules as $module ) {
			Jetpack::deactivate_module( $module );

			$this->assertEquals(
				Jetpack::is_module_active( $module ),
				self::$site->is_module_active( $module )
			);

			Jetpack::activate_module( $module );

			$this->assertEquals(
				Jetpack::is_module_active( $module ),
				self::$site->is_module_active( $module )
			);
		}
	}

	public function test_interface() {
		$this->assertTrue( method_exists( 'SAL_Site', 'is_module_active' ) );
	}
}
