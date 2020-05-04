<?php

require_once dirname( dirname( __DIR__ ) ) . '/lib/class-wp-test-jetpack-rest-testcase.php';

/**
 * @group publicize
 * @group rest-api
 */
class Test_WPCOM_REST_API_V2_Subscribers_Endpoint extends WP_Test_Jetpack_REST_Testcase {

	static $editor_user_id;
	static $subscriber_user_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$editor_user_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$subscriber_user_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	public function setUp() {
		parent::setUp();
		self::set_subscribers_count( 100 );
	}

	public static function set_subscribers_count( $count ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			wp_cache_set( 'wpcom_blog_reach_total_' . get_current_blog_id(), $count, 'subs' );
		} else {
			set_transient( 'wpcom_subscribers_total', array('value' => $count, 'status' => 'success' ) );
		}
	}

	public function test_get_subscriber_count_with_edit_permission() {
		wp_set_current_user( self::$editor_user_id );

		$request  = wp_rest_request( WP_REST_Server::READABLE, '/wpcom/v2/subscribers/count' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( $data['count'], 100 );
	}

	public function test_get_subscriber_count_without_edit_permission() {
		wp_set_current_user( self::$subscriber_user_id );

		$request  = wp_rest_request( WP_REST_Server::READABLE, '/wpcom/v2/subscribers/count' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertFalse( isset( $data['count'] ) );
		$this->assertEquals( $data['data']['status'], 401 );
	}
}
