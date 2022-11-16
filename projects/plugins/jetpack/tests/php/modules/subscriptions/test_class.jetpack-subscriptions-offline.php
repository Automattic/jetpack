<?php
require_jetpack_file( 'modules/subscriptions.php' );
require_jetpack_file( 'extensions/blocks/premium-content/_inc/subscription-service/include.php' );
require_jetpack_file( 'modules/memberships/class-jetpack-memberships.php' );

use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Offline_Subscription_Service;

class WP_Test_Jetpack_Subscriptions_Offline extends WP_UnitTestCase {

	private $regular_non_subscriber_id;
	private $regular_subscriber_id;
	private $paid_subscriber_id;
	private $admin_user_id;

	/**
	 * Set up before class.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();
		Jetpack_Subscriptions::init();
	}

	public function test_publishing_post_first_time_does_not_set_do_not_send_subscription_flag() {
		$post_id = $this->factory->post->create();
		wp_publish_post( $post_id );
		$this->assertEmpty( get_post_meta( $post_id, '_jetpack_dont_email_post_to_subs', true ) );
	}

	private function setup_jetpack_paid_newsletters() {
		$this->regular_user_id        = $this->factory->user->create(
			array(
				'user_email' => 'test@example.com',
			)
		);
		$this->paid_member_user_id    = $this->factory->user->create(
			array(
				'user_email' => 'test-paid@example.com',
			)
		);
		$this->regular_member_user_id = $this->factory->user->create(
			array(
				'user_email' => 'test-member@example.com',
			)
		);
		$this->admin_user_id          = $this->factory->user->create(
			array(
				'user_email' => 'test-admin@example.com',
			)
		);

		grant_super_admin( $this->admin_user_id );

		$paid_member_user_id = $this->paid_member_user_id;
		// Fake subscription for the paid user
		add_filter(
			'earn_get_user_subscriptions_for_site_id',
			static function ( $subscriptions, $subscriber_id ) use ( $paid_member_user_id ) {
				if ( $subscriber_id === $paid_member_user_id ) {
					$subscriptions[] =
						array(
							'status'     => 'active',
							'end_time'   => time() + HOUR_IN_SECONDS,
							'product_id' => 234,
						);
				}

				return $subscriptions;
			},
			10,
			2
		);
	}

	/**
	 * Jetpack public newletters.
	 */
	public function test_jetpack_paid_newsletters_non_gated_post() {
		add_filter( 'tests_jetpack_is_supported_jetpack_recurring_payments', '__return_true' );
		$blog_id = get_current_blog_id();

		$post_id = $this->factory->post->create();
		$this->setup_jetpack_paid_newsletters();

		$subscription_service = new WPCOM_Offline_Subscription_Service();
		// All subscribers should see the post
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->regular_non_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->regular_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->paid_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->admin_user_id, $blog_id, $post_id ) );

		// Clean up
		remove_all_filters( 'earn_get_user_subscriptions_for_site_id' );
		remove_all_filters( 'tests_jetpack_is_supported_jetpack_recurring_payments' );
	}

	/**
	 * Jetpack public newletters.
	 */
	public function test_jetpack_paid_newsletters_gated_public_newsletter() {
		add_filter( 'tests_jetpack_is_supported_jetpack_recurring_payments', '__return_true' );
		$blog_id = get_current_blog_id();

		$post_id = $this->factory->post->create();
		$this->setup_jetpack_paid_newsletters();

		update_post_meta( $post_id, '_jetpack_newsletter_access', 'everybody' );

		$subscription_service = new WPCOM_Offline_Subscription_Service();
		// All subscribers should see the post
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->regular_non_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->regular_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->paid_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->admin_user_id, $blog_id, $post_id ) );

		// Clean up
		remove_all_filters( 'earn_get_user_subscriptions_for_site_id' );

		remove_all_filters( 'tests_jetpack_is_supported_jetpack_recurring_payments' );
	}

	/**
	 * Jetpack paid newletters.
	 */
	public function test_jetpack_paid_newsletters_gated_paid_subscribers_newsletter() {
		$blog_id = get_current_blog_id();
		$post_id = $this->factory->post->create();
		$this->setup_jetpack_paid_newsletters();

		update_post_meta( $post_id, '_jetpack_newsletter_access', 'paid_subscribers' );
		add_filter( 'test_jetpack_is_supported_jetpack_recurring_payments', '__return_true' );

		$subscription_service = new WPCOM_Offline_Subscription_Service();
		// All subscribers should see the post
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->paid_subscriber_id, $blog_id, $post_id ) );
		$this->assertFalse( $subscription_service->subscriber_can_receive_post_by_mail( $this->regular_non_subscriber_id, $blog_id, $post_id ) );
		$this->assertFalse( $subscription_service->subscriber_can_receive_post_by_mail( $this->regular_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->admin_user_id, $blog_id, $post_id ) );

		// Clean up
		remove_all_filters( 'test_jetpack_is_supported_jetpack_recurring_payments' );
		remove_all_filters( 'earn_get_user_subscriptions_for_site_id' );
	}

	/**
	 * Jetpack subscribed newletters.
	 */
	public function test_jetpack_paid_newsletters_gated_subscribers_newsletter() {
		add_filter( 'tests_jetpack_is_supported_jetpack_recurring_payments', '__return_true' );
		$blog_id = get_current_blog_id();
		$post_id = $this->factory->post->create();
		$this->setup_jetpack_paid_newsletters();

		update_post_meta( $post_id, '_jetpack_newsletter_access', 'subscribers' );

		$subscription_service = new WPCOM_Offline_Subscription_Service();
		// All subscribers should see the post
		$this->assertFalse( $subscription_service->subscriber_can_receive_post_by_mail( $this->regular_non_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->regular_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->paid_subscriber_id, $blog_id, $post_id ) );
		$this->assertTrue( $subscription_service->subscriber_can_receive_post_by_mail( $this->admin_user_id, $blog_id, $post_id ) );

		// Clean up
		remove_all_filters( 'earn_get_user_subscriptions_for_site_id' );
		remove_all_filters( 'tests_jetpack_is_supported_jetpack_recurring_payments' );
	}

}
