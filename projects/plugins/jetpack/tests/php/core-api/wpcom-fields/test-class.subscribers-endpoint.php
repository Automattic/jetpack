<?php

require_once dirname( dirname( __DIR__ ) ) . '/lib/class-wp-test-jetpack-rest-testcase.php';

if ( ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) && defined( 'JETPACK__PLUGIN_DIR' ) && JETPACK__PLUGIN_DIR ) {
	require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions.php';
	require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/subscriptions/subscriptions.php';
}

/**
 * @group publicize
 * @group rest-api
 */
class Test_WPCOM_REST_API_V2_Subscribers_Endpoint extends WP_Test_Jetpack_REST_Testcase {

	public static $editor_user_id;
	public static $subscriber_user_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$editor_user_id     = $factory->user->create( array( 'role' => 'editor' ) );
		self::$subscriber_user_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	public static function set_subscribers_count( $count ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			wp_cache_set( 'wpcom_blog_reach_total_' . get_current_blog_id(), $count, 'subs' );
		} else {
			set_transient(
				'wpcom_subscribers_total',
				array(
					'value'  => $count,
					'status' => 'success',
				)
			);
		}
	}

	public static function set_subscribers_counts( $email_subscribers, $social_followers ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			wp_cache_set( 'wpcom_blog_subscriber_total_' . get_current_blog_id(), $email_subscribers, 'subs' );
			wp_cache_set( 'wpcom_blog_social_followers_total_' . get_current_blog_id(), $social_followers, 'subs' );

		} else {
			set_transient(
				'wpcom_subscribers_totals',
				array(
					'value'  => array(
						'email_subscribers' => $email_subscribers,
						'social_followers'  => $social_followers,
					),
					'status' => 'success',
				)
			);
		}
	}

	public function test_get_subscriber_count_with_edit_permission() {
		wp_set_current_user( self::$editor_user_id );
		self::set_subscribers_count( 100 );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/wpcom/v2/subscribers/count' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 100, $data['count'] );
	}

	public function test_get_subscriber_count_without_edit_permission() {
		wp_set_current_user( self::$subscriber_user_id );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/wpcom/v2/subscribers/count' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertFalse( isset( $data['count'] ) );
		$this->assertEquals( 401, $data['data']['status'] );
	}

	public function test_get_subscriber_counts_with_edit_permission() {
		wp_set_current_user( self::$editor_user_id );
		self::set_subscribers_counts( 100, 200 );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/wpcom/v2/subscribers/counts' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 100, $data['counts']['email_subscribers'] );
		$this->assertEquals( 200, $data['counts']['social_followers'] );

	}

	public function test_get_subscriber_counts_without_edit_permission() {
		wp_set_current_user( self::$subscriber_user_id );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/wpcom/v2/subscribers/counts' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertFalse( isset( $data['counts'] ) );
		$this->assertEquals( 401, $data['data']['status'] );
	}
}
