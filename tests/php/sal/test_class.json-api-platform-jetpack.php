<?php

require_once dirname( __FILE__ ) . '/../../../sal/class.json-api-platform.php';

class SalSiteTest extends WP_UnitTestCase {
	static $token;
	static $site;

	static function setUpBeforeClass( ) {
		parent::setUpBeforeClass();

		// temporarily disable https
		$_SERVER['HTTPS'] = 'off';

		static::$token = (object) array(
			'blog_id'          => get_current_blog_id(),
			'user_id'          => get_current_user_id(),
			'external_user_id' => 2,
			'role'             => 'administrator'
		);

		$platform = wpcom_get_sal_platform( static::$token );

		static::$site = $platform->get_site( static::$token->blog_id );
	}

	static function tearDownAfterClass() {
		// renable https
		$_SERVER['HTTPS'] = 'on';
		parent::tearDownAfterClass();
	}

	function test_uses_synced_api_post_type_whitelist_if_available() {

		$this->assertFalse( static::$site->is_post_type_allowed( 'my_new_type' ) );
	}
}
