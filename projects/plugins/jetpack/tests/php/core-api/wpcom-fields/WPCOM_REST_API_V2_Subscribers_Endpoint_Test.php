<?php

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Constants;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

if ( ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) && defined( 'JETPACK__PLUGIN_DIR' ) && JETPACK__PLUGIN_DIR ) {
	require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions.php';
	require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/subscriptions/subscriptions.php';
}

/**
 * @group publicize
 * @group rest-api
 */
#[Group( 'publicize' )]
#[Group( 'rest-api' )]
class WPCOM_REST_API_V2_Subscribers_Endpoint_Test extends Jetpack_REST_TestCase {

	public static $editor_user_id;
	public static $subscriber_user_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$editor_user_id     = $factory->user->create( array( 'role' => 'editor' ) );
		self::$subscriber_user_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	public static function set_subscribers_counts( $total_subscribers, $email_subscribers, $social_followers ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			wp_cache_set( 'wpcom_blog_subscriber_total_' . get_current_blog_id(), $total_subscribers, 'subs' );
			wp_cache_set( 'wpcom_blog_social_followers_total_' . get_current_blog_id(), $social_followers, 'subs' );
			wp_cache_set( 'wpcom_wpcomuser_blog_paid_subscriber_total_' . get_current_blog_id(), 0, 'subs' );
			wp_cache_set( 'subscription_cache_version', 1 );
			wp_cache_set(
				'email_newsletter_subscribers_' . get_current_blog_id() . '_all_subscribers_active_subscriptions_1',
				$email_subscribers,
				'wpcom_subscriptions_helper'
			);

		} else {
			set_transient(
				'wpcom_subscribers_totals',
				array(
					'value'  => array(
						'total_subscribers' => $total_subscribers,
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
		self::set_subscribers_counts( 75, 50, 25 );
		$is_wpcom = defined( 'IS_WPCOM' ) && IS_WPCOM;
		if ( $is_wpcom ) {
			wp_cache_set( 'wpcom_blog_reach_total_' . get_current_blog_id(), 123, 'subs' );
		}

		try {
			$expected_count = $is_wpcom ? 123 : 100;
			$this->assertSame( $expected_count, Jetpack_Subscriptions_Widget::fetch_subscriber_count() );

			$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/wpcom/v2/subscribers/count' );
			$response = $this->server->dispatch( $request );
			$data     = $response->get_data();

			$this->assertSame( $expected_count, $data['count'] );
		} finally {
			if ( $is_wpcom ) {
				wp_cache_delete( 'wpcom_blog_reach_total_' . get_current_blog_id(), 'subs' );
			}
		}
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
		self::set_subscribers_counts( 100, 75, 200 );

		$request  = new WP_REST_Request( WP_REST_Server::READABLE, '/wpcom/v2/subscribers/counts' );
		$response = $this->server->dispatch( $request );
		$data     = $response->get_data();

		$this->assertEquals( 100, $data['counts']['total_subscribers'] );
		$this->assertEquals( 75, $data['counts']['email_subscribers'] );
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

	/**
	 * @dataProvider count_routes_provider
	 * @param string $route Count route suffix.
	 * @param array  $expected Expected response data.
	 * @return void
	 */
	#[DataProvider( 'count_routes_provider' )]
	public function test_count_routes_refresh_cached_counts( $route, $expected ) {
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$this->markTestSkipped( 'Native WordPress.com uses its own subscriber cache.' );
		}

		wp_set_current_user( self::$editor_user_id );
		self::set_subscribers_counts( 10, 8, 2 );
		$constants_mock = \Patchwork\redefine(
			Constants::class . '::is_defined',
			static function ( $name ) {
				return 'TESTING_IN_JETPACK' === $name ? false : \Patchwork\relay();
			}
		);
		$request_mock   = \Patchwork\redefine(
			Client::class . '::remote_request',
			static function () {
				$counts = new IXR_Value(
					array(
						'total_subscribers' => 75,
						'email_subscribers' => 50,
						'social_followers'  => 25,
					)
				);
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => '<methodResponse><params><param><value>' . $counts->getXml() . '</value></param></params></methodResponse>',
				);
			}
		);

		try {
			$response = $this->server->dispatch( new WP_REST_Request( WP_REST_Server::READABLE, '/wpcom/v2/subscribers/' . $route ) );
			$this->assertSame( 200, $response->get_status() );
			$this->assertSame( $expected, $response->get_data() );
			$this->assertSame( 75, get_transient( 'wpcom_subscribers_totals' )['value']['total_subscribers'] );
		} finally {
			foreach ( array( $request_mock, $constants_mock ) as $mock ) {
				if ( null !== $mock ) {
					\Patchwork\restore( $mock );
				}
			}
			delete_transient( 'wpcom_subscribers_totals' );
		}
	}

	public static function count_routes_provider() {
		return array(
			'combined count' => array( 'count', array( 'count' => 100 ) ),
			'split counts'   => array(
				'counts',
				array(
					'counts' => array(
						'total_subscribers' => 75,
						'email_subscribers' => 50,
						'social_followers'  => 25,
					),
				),
			),
		);
	}
}
