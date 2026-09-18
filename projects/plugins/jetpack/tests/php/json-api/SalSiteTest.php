<?php

require_once JETPACK__PLUGIN_DIR . 'sal/class.json-api-platform.php';

class SalSiteTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

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

	public function test_get_difm_lite_site_options_is_null_without_active_difm_build() {
		// The test bootstrap mocks has_blog_sticker() as get_option(); the sticker option is unset here.
		$this->assertNull( self::$site->get_difm_lite_site_options() );
	}

	public function test_get_difm_lite_site_options_is_null_outside_wpcom() {
		// The mocked has_blog_sticker() reads this option, simulating an active DIFM build.
		update_option( 'difm-lite-in-progress', true );

		// Outside WordPress.com the options must still be null.
		$this->assertNull( self::$site->get_difm_lite_site_options() );

		delete_option( 'difm-lite-in-progress' );
	}

	/**
	 * Unlike its neighbours this reads no sticker of its own: the pre-2026 gating verdict ranks two
	 * markers and falls back to a blog-ID cutoff, so WPCOM_Features owns it. Off WordPress.com that
	 * class does not exist, and the method has to answer false rather than warn about a site it knows
	 * nothing about.
	 */
	public function test_is_legacy_gating_site_is_false_outside_wpcom() {
		if ( method_exists( 'WPCOM_Features', 'is_legacy_gating_site' ) ) {
			$this->markTestSkipped( 'WPCOM_Features is loaded here, so the fallback branch is unreachable.' );
		}

		$this->assertFalse( self::$site->is_legacy_gating_site() );
	}

	/**
	 * A boolean either way, since clients branch on it directly.
	 */
	public function test_is_legacy_gating_site_returns_a_boolean() {
		$this->assertIsBool( self::$site->is_legacy_gating_site() );
	}

	/**
	 * The mocked has_blog_sticker() returns get_option()'s raw value, hence the cast: on WordPress.com
	 * the real function answers with a boolean and these methods pass it straight through.
	 */
	public function test_is_gating_business_q1_reflects_the_sticker() {
		$this->assertFalse( self::$site->is_gating_business_q1() );

		update_option( 'gating-business-q1', true );
		$this->assertTrue( (bool) self::$site->is_gating_business_q1() );

		delete_option( 'gating-business-q1' );
	}

	public function test_is_a4a_dev_site_reflects_the_sticker() {
		$this->assertFalse( self::$site->is_a4a_dev_site() );

		update_option( 'a4a-is-dev-site', true );
		$this->assertTrue( (bool) self::$site->is_a4a_dev_site() );

		delete_option( 'a4a-is-dev-site' );
	}

	public function test_is_wpcom_flex_reflects_the_sticker() {
		$this->assertFalse( self::$site->is_wpcom_flex() );

		update_option( 'flex-cache-site', true );
		$this->assertTrue( (bool) self::$site->is_wpcom_flex() );

		delete_option( 'flex-cache-site' );
	}
}
