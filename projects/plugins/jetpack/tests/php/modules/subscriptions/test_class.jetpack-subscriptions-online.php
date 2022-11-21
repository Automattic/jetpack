<?php
require_once __DIR__ . '/test_class.jetpack-subscriptions.php';

use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service;

class WP_Test_Jetpack_Subscriptions_Online extends \WP_Test_Jetpack_Subscriptions {

	/**
	 * Jetpack regular user.
	 */
	public function test_jetpack_non_subscriber_user() {
		$post_id         = $this->setup_jetpack_paid_newsletters();
		$GLOBALS['post'] = get_post( $post_id );

		$previous_user = wp_get_current_user();
		wp_set_current_user( $this->regular_non_subscriber_id );

		$token_subscription_service = $this->setReturnedSubscriptions(
			array(
				'blog_sub'      => 'inactive',
				'subscriptions' => array(),
			)
		);

		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), '', false ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'everybody', false ) );
		$this->assertFalse( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'subscribers', false ) );
		$this->assertFalse( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'paid_subscribers', false ) );

		wp_set_current_user( $previous_user->ID );
	}

	/**
	 * Jetpack subscriber user.
	 */
	public function test_jetpack_subscriber_user() {
		$post_id         = $this->setup_jetpack_paid_newsletters();
		$GLOBALS['post'] = get_post( $post_id );

		$previous_user = wp_get_current_user();
		wp_set_current_user( $this->regular_subscriber_id );

		$token_subscription_service = $this->setReturnedSubscriptions(
			array(
				'blog_sub'      => 'active',
				'subscriptions' => array(),
			)
		);

		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), '', true ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'everybody', true ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'subscribers', true ) );
		$this->assertFalse( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'paid_subscribers', true ) );

		wp_set_current_user( $previous_user->ID );
	}

	/**
	 * Jetpack paid user.
	 */
	public function test_jetpack_paid_user() {
		$post_id         = $this->setup_jetpack_paid_newsletters();
		$GLOBALS['post'] = get_post( $post_id );

		$previous_user = wp_get_current_user();
		wp_set_current_user( $this->paid_subscriber_id );

		$token_subscription_service = $this->setReturnedSubscriptions(
			array(
				'blog_sub'      => 'inactive',
				'subscriptions' => array(
					$this->product_id => array(
						'status'     => 'active',
						'end_date'   => time() + HOUR_IN_SECONDS,
						'product_id' => $this->product_id,
					),
				),
			)
		);

		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), '', true ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'everybody', true ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'subscribers', true ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'paid_subscribers', true ) );

		wp_set_current_user( $previous_user->ID );
	}

	/**
	 * Jetpack paid outdated user.
	 */
	public function test_jetpack_outdated_paid_user() {
		$post_id         = $this->setup_jetpack_paid_newsletters();
		$GLOBALS['post'] = get_post( $post_id );

		$previous_user = wp_get_current_user();
		wp_set_current_user( $this->paid_subscriber_id );

		$token_subscription_service = $this->setReturnedSubscriptions(
			array(
				'blog_sub'      => 'active',
				'subscriptions' => array(
					$this->product_id => array(
						'status'     => 'active',
						'end_date'   => time() - HOUR_IN_SECONDS,
						'product_id' => $this->product_id,
					),
				),
			)
		);

		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), '', true ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'everybody', true ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'subscribers', true ) );
		$this->assertFalse( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'paid_subscribers', true ) );

		wp_set_current_user( $previous_user->ID );
	}

	/**
	 * Jetpack admin user
	 */
	public function test_jetpack_admin_user() {
		$post_id         = $this->setup_jetpack_paid_newsletters();
		$GLOBALS['post'] = get_post( $post_id );
		$previous_user   = wp_get_current_user();
		wp_set_current_user( $this->admin_user_id );

		$token_subscription_service = $this->setReturnedSubscriptions(
			array(
				'blog_sub'      => 'inactive',
				'subscriptions' => array(),
			)
		);

		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), '', false ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'everybody', false ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'subscribers', false ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'paid_subscribers', false ) );

		wp_set_current_user( $previous_user->ID );
	}

	private function setReturnedSubscriptions( $payload ) {

		remove_all_filters( 'earn_get_user_subscriptions_for_site_id' );
		$paid_subscriber_id = $this->paid_subscriber_id;
		add_filter(
			'earn_get_user_subscriptions_for_site_id',
			static function ( $subscriptions, $subscriber_id ) use ( $paid_subscriber_id, $payload ) {
				if ( $subscriber_id === $paid_subscriber_id ) {
					//phpcs:ignore PHPCompatibility.Operators.NewOperators.t_coalesceFound
					$subscriptions = array_merge( $subscriptions, $payload['subscriptions'] ?? array() );
				}

				return $subscriptions;
			},
			10,
			2
		);

		return new WPCOM_Online_Subscription_Service();
	}

	/**
	 * Jetpack not logged user.
	 */
	public function test_jetpack_not_loggued_user() {
		$post_id         = $this->setup_jetpack_paid_newsletters();
		$GLOBALS['post'] = get_post( $post_id );

		$previous_user = wp_get_current_user();
		wp_set_current_user( 0 );

		$token_subscription_service = $this->setReturnedSubscriptions(
			array(
				'blog_sub'      => 'true',
				'subscriptions' => array(),
			)
		);

		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), '', false ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'everybody', false ) );
		$this->assertFalse( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'subscribers', false ) );
		$this->assertFalse( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'paid_subscribers', false ) );

		wp_set_current_user( $previous_user->ID );
	}
}
