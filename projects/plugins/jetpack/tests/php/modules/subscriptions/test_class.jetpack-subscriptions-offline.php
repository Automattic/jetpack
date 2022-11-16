<?php

require_once __DIR__ . '/test_class.jetpack-subscriptions.php';

use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Offline_Subscription_Service;

class WP_Test_Jetpack_Subscriptions_Offline extends \WP_Test_Jetpack_Subscriptions {

	/**
	 * Jetpack public newletters.
	 */
	public function test_jetpack_paid_newsletters_non_gated_post() {
		$blog_id = get_current_blog_id();
		$post_id = $this->setup_jetpack_paid_newsletters();

		$subscription_service = new WPCOM_Offline_Subscription_Service();
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->regular_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->paid_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->admin_user_id, $blog_id, $post_id ) );
	}

	/**
	 * Jetpack public newletters.
	 */
	public function test_jetpack_paid_newsletters_gated_public_newsletter() {
		$blog_id = get_current_blog_id();

		$post_id = $this->setup_jetpack_paid_newsletters();
		update_post_meta( $post_id, '_jetpack_newsletter_access', 'everybody' );

		$subscription_service = new WPCOM_Offline_Subscription_Service();
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->admin_user_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->regular_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->paid_subscriber_id, $blog_id, $post_id ) );
	}

	/**
	 * Jetpack paid newletters.
	 */
	public function test_jetpack_paid_newsletters_gated_paid_subscribers_newsletter() {
		$blog_id = get_current_blog_id();

		$post_id = $this->setup_jetpack_paid_newsletters();
		update_post_meta( $post_id, '_jetpack_newsletter_access', 'paid_subscribers' );

		$subscription_service = new WPCOM_Offline_Subscription_Service();
		$this->assertFalse( $subscription_service->subscriber_can_receive_post_by_mail( $this->regular_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->paid_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->admin_user_id, $blog_id, $post_id ) );
	}

	/**
	 * Jetpack paid newletters with outdated paid subscriptions
	 */
	public function test_jetpack_paid_newsletters_gated_paid_subscribers_newsletter_with_outdated_subscription() {
		$blog_id = get_current_blog_id();

		// Create an outdated subscription
		$post_id = $this->setup_jetpack_paid_newsletters( time() - HOUR_IN_SECONDS );
		update_post_meta( $post_id, '_jetpack_newsletter_access', 'paid_subscribers' );

		$subscription_service = new WPCOM_Offline_Subscription_Service();
		// All subscribers should not see the post
		$this->assertFalse( $subscription_service->subscriber_can_receive_post_by_mail( $this->paid_subscriber_id, $blog_id, $post_id ) );
	}

	/**
	 * Jetpack subscribed newletters.
	 */
	public function test_jetpack_paid_newsletters_gated_subscribers_newsletter() {
		$blog_id = get_current_blog_id();

		$post_id = $this->setup_jetpack_paid_newsletters();
		update_post_meta( $post_id, '_jetpack_newsletter_access', 'subscribers' );

		$subscription_service = new WPCOM_Offline_Subscription_Service();
		// All subscribers should see the post
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->regular_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->paid_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->admin_user_id, $blog_id, $post_id ) );
	}
}
