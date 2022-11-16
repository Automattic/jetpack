<?php

require_once __DIR__ . '/test_class.jetpack-subscriptions.php';

use Automattic\Jetpack\Extensions\Premium_Content\JWT;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Token_Subscription_Service;

define( 'EARN_JWT_SIGNING_KEY', 'whatever=' );

/**
 * This will test the WPCOM_Token_Subscription_Service and stubs the token logic.
 * Cookies and request layer won't be tested
 */
class WP_Test_Jetpack_Subscriptions_Online extends WP_Test_Jetpack_Subscriptions {

	public function test_publishing_post_first_time_does_not_set_do_not_send_subscription_flag() {
		$post_id = $this->factory->post->create();
		wp_publish_post( $post_id );
		$this->assertEmpty( get_post_meta( $post_id, '_jetpack_dont_email_post_to_subs', true ) );
	}

	/**
	 * Stubs WPCOM_Token_Subscription_Service in order to return the provided token.
	 *
	 * @param array $payload
	 * @return mixed
	 */
	private function setReturnedToken( $payload ) {
		$service       = new WPCOM_Token_Subscription_Service();
		$_GET['token'] = JWT::encode( $payload, $service->get_key() );
		return $service;
	}

	/**
	 * Jetpack regular user.
	 */
	public function test_jetpack_regular_user() {
		$post_id = $this->setup_jetpack_paid_newsletters();

		$previous_user = wp_get_current_user();
		wp_set_current_user( $this->regular_non_subscriber_id );

		$token_subscription_service = $this->setReturnedToken(
			array(
				'blog_sub'      => 'inactive',
				'subscriptions' => array(),
			)
		);

		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), '' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'everybody' ) );
		$this->assertFalse( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'subscribers' ) );
		$this->assertFalse( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'paid_subscribers' ) );

		wp_set_current_user( $previous_user->ID );
	}

	/**
	 * Jetpack subscriber user.
	 */
	public function test_jetpack_subscriber_user() {
		$post_id = $this->setup_jetpack_paid_newsletters();

		$previous_user = wp_get_current_user();
		wp_set_current_user( $this->regular_subscriber_id );

		$token_subscription_service = $this->setReturnedToken(
			array(
				'blog_sub'      => 'active',
				'subscriptions' => array(),
			)
		);

		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), '' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'everybody' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'subscribers' ) );
		$this->assertFalse( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'paid_subscribers' ) );

		wp_set_current_user( $previous_user->ID );
	}

	/**
	 * Jetpack paid user.
	 */
	public function test_jetpack_paid_user() {
		$post_id = $this->setup_jetpack_paid_newsletters();

		$previous_user = wp_get_current_user();
		wp_set_current_user( $this->regular_subscriber_id );

		$token_subscription_service = $this->setReturnedToken(
			array(
				'blog_sub'      => 'inactive',
				'subscriptions' => array(
					array(
						'status'     => 'active',
						'end_date'   => time() + HOUR_IN_SECONDS,
						'product_id' => $this->product_id,
					),
				),
			)
		);

		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), '' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'everybody' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'subscribers' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'paid_subscribers' ) );

		wp_set_current_user( $previous_user->ID );
	}

	/**
	 * Jetpack paid outdated user.
	 */
	public function test_jetpack_outdated_paid_user() {
		$post_id = $this->setup_jetpack_paid_newsletters();

		$previous_user = wp_get_current_user();
		wp_set_current_user( $this->admin_user_id );

		$token_subscription_service = $this->setReturnedToken(
			array(
				'blog_sub'      => 'inactive',
				'subscriptions' => array(
					'status'     => 'active',
					'end_date'   => time() - HOUR_IN_SECONDS,
					'product_id' => $this->product_id,
				),
			)
		);

		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), '' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'everybody' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'subscribers' ) );
		$this->assertFalse( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'paid_subscribers' ) );

		wp_set_current_user( $previous_user->ID );
	}

	/**
	 * Jetpack admin user
	 */
	public function test_jetpack_admin_user() {
		$post_id = $this->setup_jetpack_paid_newsletters();

		$previous_user = wp_get_current_user();
		wp_set_current_user( $this->admin_user_id );

		$token_subscription_service = $this->setReturnedToken(
			array(
				'blog_sub'      => 'inactive',
				'subscriptions' => array(),
			)
		);

		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), '' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'everybody' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'subscribers' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'paid_subscribers' ) );

		wp_set_current_user( $previous_user->ID );
	}

	/**
	 * Jetpack not logged user.
	 */
	// public function test_jetpack_not_loggued_user() {
	// $post_id = $this->setup_jetpack_paid_newsletters();
	//
	// $previous_user = wp_get_current_user();
	// wp_set_current_user(0);
	//
	// $token_subscription_service = $this->setReturnedToken(
	// [
	// 'blog_sub' => 'true',
	// 'subscriptions' => [],
	// ]
	// );
	//
	// $this->assertTrue( $token_subscription_service->visitor_can_view_content( [ $this->plan_id ], '' ) );
	// $this->assertTrue( $token_subscription_service->visitor_can_view_content( [ $this->plan_id ], 'everybody' ) );
	// $this->assertTrue( $token_subscription_service->visitor_can_view_content( [ $this->plan_id ], 'subscribers' ) );
	// $this->assertFalse( $token_subscription_service->visitor_can_view_content( [ $this->plan_id ], 'paid_subscribers' ) );
	//
	// wp_set_current_user( $previous_user->ID );
	// }
}
