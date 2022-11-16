<?php
require_jetpack_file( 'modules/subscriptions.php' );
require_jetpack_file( 'extensions/blocks/premium-content/_inc/subscription-service/include.php' );
require_jetpack_file( 'modules/memberships/class-jetpack-memberships.php' );

abstract class WP_Test_Jetpack_Subscriptions extends WP_UnitTestCase {

	protected $regular_non_subscriber_id;
	protected $regular_subscriber_id;
	protected $paid_subscriber_id;
	protected $admin_user_id;
	protected $plan_id;
	protected $product_id = 1234;

	public function setUp(): void {
		parent::setUp();
		Jetpack_Subscriptions::init();
		add_filter( 'test_jetpack_is_supported_jetpack_recurring_payments', '__return_true' );
	}

	public function tearDown(): void {
		// Clean up
		remove_all_filters( 'earn_get_user_subscriptions_for_site_id' );
		remove_all_filters( 'test_jetpack_is_supported_jetpack_recurring_payments' );
		parent::tearDown();
	}

	protected function setup_jetpack_paid_newsletters( $subscription_end_date = null ) {

		// We create a plan
		$this->plan_id = $this->factory->post->create(
			array(
				'post_type' => Jetpack_Memberships::$post_type_plan,
			)
		);
		update_post_meta( $this->plan_id, 'jetpack_memberships_product_id', $this->product_id );

		$this->regular_non_subscriber_id = $this->factory->user->create(
			array(
				'user_email' => 'test@example.com',
			)
		);

		$this->regular_subscriber_id = $this->factory->user->create(
			array(
				'user_email' => 'test-subscriber@example.com',
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
		$product_id         = $this->product_id;
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

}
