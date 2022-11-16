<?php
require_jetpack_file( 'extensions/blocks/premium-content/_inc/subscription-service/include.php' );
require_jetpack_file( 'modules/memberships/class-jetpack-memberships.php' );

use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Offline_Subscription_Service;

class WP_Test_Jetpack_Subscriptions_Offline extends WP_UnitTestCase {

	private $regular_subscriber_id = 0;
	private $paid_subscriber_id    = 0;
	private $admin_user_id         = 0;

	public function setUp(): void {
		parent::setUp();
		add_filter( 'test_jetpack_is_supported_jetpack_recurring_payments', '__return_true' );
	}

	public function tearDown(): void {
		// Clean up
		remove_all_filters( 'earn_get_user_subscriptions_for_site_id' );
		remove_all_filters( 'test_jetpack_is_supported_jetpack_recurring_payments' );
		parent::tearDown();
	}

	private function setup_jetpack_paid_newsletters( $subscription_end_date = null ) {
		$product_id = 1234;

		// We create a plan
		$plan_id = $this->factory->post->create(
			array(
				'post_type' => Jetpack_Memberships::$post_type_plan,
			)
		);
		update_post_meta( $plan_id, 'jetpack_memberships_product_id', $product_id );

		$this->regular_subscriber_id = $this->factory->user->create(
			array(
				'user_email' => 'test@example.com',
			)
		);
		$this->paid_subscriber_id    = $this->factory->user->create(
			array(
				'user_email' => 'test-paid@example.com',
			)
		);

		$this->admin_user_id = $this->factory->user->create(
			array(
				'user_email' => 'test-admin@example.com',
			)
		);

		grant_super_admin( $this->admin_user_id );

		// Fake subscription for the paid user
		$paid_subscriber_id = $this->paid_subscriber_id;
		add_filter(
			'earn_get_user_subscriptions_for_site_id',
			static function ( $subscriptions, $subscriber_id ) use ( $paid_subscriber_id, $product_id, $subscription_end_date ) {
				if ( $subscriber_id === $paid_subscriber_id ) {
					$subscriptions[] =
						array(
							'status'     => 'active',
							'end_date'   => $subscription_end_date ?? time() + HOUR_IN_SECONDS,
							'product_id' => $product_id,
						);
				}

				return $subscriptions;
			},
			10,
			2
		);

		// Create a post
		return $this->factory->post->create();
	}

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
