<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Jetpack_Options;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

class Features_Banner_Rest_Test extends TestCase {

	const FLAG_FILTER = 'jetpack_feature_flag_enabled_' . Initializer::FEATURES_TAB_FEATURE_FLAG;

	const ROUTE = '/wpcom/v2/my-jetpack/site/features/banner/dismiss';

	private $server;

	public function setUp(): void {
		parent::setUp();

		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );
	}

	public function tearDown(): void {
		parent::tearDown();

		remove_all_filters( self::FLAG_FILTER );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	private function register_routes( $flag_enabled = true ) {
		if ( $flag_enabled ) {
			add_filter( self::FLAG_FILTER, '__return_true' );
		}

		global $wp_rest_server;
		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		Initializer::init();
		do_action( 'rest_api_init' );
	}

	private function create_user( $login, $role ) {
		return wp_insert_user(
			array(
				'user_login' => $login,
				'user_pass'  => '123',
				'role'       => $role,
			)
		);
	}

	private function dismiss() {
		return $this->server->dispatch( new WP_REST_Request( 'POST', self::ROUTE ) );
	}

	public function test_dismissing_hides_it_for_that_user_only() {
		$this->register_routes();

		$admin = $this->create_user( 'admin', 'administrator' );
		$other = $this->create_user( 'other_admin', 'administrator' );
		wp_set_current_user( $admin );

		$response = $this->dismiss();

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( REST_Main_Features::is_banner_dismissed() );

		wp_set_current_user( $other );
		$this->assertFalse( REST_Main_Features::is_banner_dismissed() );
	}

	public function test_dismissing_again_still_succeeds() {
		$this->register_routes();

		wp_set_current_user( $this->create_user( 'admin', 'administrator' ) );
		$this->dismiss();

		$this->assertSame( 200, $this->dismiss()->get_status() );
	}

	public function test_reports_a_failed_save() {
		$this->register_routes();

		wp_set_current_user( $this->create_user( 'admin', 'administrator' ) );
		add_filter( 'update_user_metadata', '__return_false' );

		$response = $this->dismiss();

		remove_filter( 'update_user_metadata', '__return_false' );
		$this->assertSame( 500, $response->get_status() );
	}

	public function test_forbids_users_who_cannot_see_my_jetpack() {
		$this->register_routes();

		wp_set_current_user( $this->create_user( 'subscriber', 'subscriber' ) );

		$this->assertSame( 403, $this->dismiss()->get_status() );
		$this->assertFalse( REST_Main_Features::is_banner_dismissed() );
	}

	public function test_the_route_is_absent_while_the_features_tab_is_off() {
		$this->register_routes( false );

		wp_set_current_user( $this->create_user( 'admin', 'administrator' ) );

		$this->assertSame( 404, $this->dismiss()->get_status() );
	}
}
