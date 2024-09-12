<?php

require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/access-check.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';
require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';
require_once __DIR__ . '/class-test-jetpack-token-subscription-service.php';

use Automattic\Jetpack\Extensions\Premium_Content\JWT;
use Tests\Automattic\Jetpack\Extensions\Premium_Content\Test_Jetpack_Token_Subscription_Service;
use function Automattic\Jetpack\Extensions\Premium_Content\current_visitor_can_access;
use function Automattic\Jetpack\Extensions\Premium_Content\subscription_service;
use const Automattic\Jetpack\Extensions\Premium_Content\PAYWALL_FILTER;

class WP_Test_Jetpack_Premium_Content extends WP_UnitTestCase {

	protected $product_id = 1234;

	public function set_up() {
		parent::set_up();
		Jetpack_Subscriptions::init();
		add_filter( 'jetpack_is_connection_ready', '__return_true' );
		add_filter(
			PAYWALL_FILTER,
			function () {
				return new Test_Jetpack_Token_Subscription_Service();
			}
		);
	}

	public function tear_down() {
		// Clean up
		remove_all_filters( 'earn_get_user_subscriptions_for_site_id' );
		remove_all_filters( 'jetpack_is_connection_ready' );
		remove_all_filters( PAYWALL_FILTER );
		parent::tear_down();
	}

	/**
	 * Retrieves payload for JWT token
	 *
	 * @param bool     $is_subscribed
	 * @param bool     $is_paid_subscriber
	 * @param int|null $subscription_end_date
	 * @return array
	 */
	private function get_payload( $is_subscribed, $is_paid_subscriber, $subscription_end_date = null, $status = null ) {
		$subscriptions = ! $is_paid_subscriber ? array() : array(
			$this->product_id => array(
				'status'     => $status ? $status : 'active',
				'end_date'   => $subscription_end_date ? $subscription_end_date : time() + HOUR_IN_SECONDS,
				'product_id' => $this->product_id,
			),
		);

		return array(
			'blog_sub'      => $is_subscribed ? 'active' : 'inactive',
			'subscriptions' => $subscriptions,
		);
	}

	/**
	 * Stubs Jetpack_Token_Subscription_Service in order to return the provided token.
	 *
	 * @param array $payload
	 * @return mixed
	 */
	private function set_returned_token( $payload ) {
		// We remove anything else
		$service = subscription_service();
		$this->assertTrue( is_a( $service, '\Tests\Automattic\Jetpack\Extensions\Premium_Content\Test_Jetpack_Token_Subscription_Service' ) );
		$_GET['token'] = JWT::encode( $payload, $service->get_key() );
	}

	private function set_up_users_and_plans() {
		// We create a paid subscriber
		$paid_subscriber_id = $this->factory->user->create(
			array(
				'user_email' => 'test-paid@example.com',
			)
		);

		$regular_subscriber_id = $this->factory->user->create(
			array(
				'user_email' => 'test-subscriber@example.com',
			)
		);

		$non_subscriber_id = $this->factory->user->create(
			array(
				'user_email' => 'test@example.com',
			)
		);

		// We create a plan
		$plan_id = $this->factory->post->create(
			array(
				'post_type' => Jetpack_Memberships::$post_type_plan,
			)
		);
		update_post_meta( $plan_id, 'jetpack_memberships_product_id', $this->product_id );
		$this->factory->post->create();

		// We set the plan to the paid_subscriber_id
		add_filter(
			'earn_get_user_subscriptions_for_site_id',
			static function ( $subscriptions, $subscriber_id ) use ( $paid_subscriber_id, $plan_id ) {
				if ( $subscriber_id === $paid_subscriber_id ) {
					$subscriptions = array_merge( $subscriptions, array( $plan_id ) );
				}

				return $subscriptions;
			},
			10,
			2
		);

		return array( $non_subscriber_id, $regular_subscriber_id, $paid_subscriber_id, $plan_id );
	}

	/**
	 * Admin has access all the time
	 *
	 * @covers \Automattic\Jetpack\Extensions\Premium_Content\current_visitor_can_access
	 *
	 * @return void
	 */
	public function test_access_check_current_visitor_can_access_admin() {
		$admin_user_id = $this->factory->user->create(
			array(
				'user_email' => 'test-admin@example.com',
			)
		);

		get_user_by( 'id', $admin_user_id )->add_role( 'administrator' );
		$post_id         = $this->factory->post->create();
		$GLOBALS['post'] = get_post( $post_id );
		wp_set_current_user( $admin_user_id );
		$this->assertTrue( current_visitor_can_access( array(), array() ) );
	}

	/**
	 * Test current_visitor_can_access works for different types of users
	 *
	 * @covers \Automattic\Jetpack\Extensions\Premium_Content\current_visitor_can_access
	 *
	 * @return void
	 */
	public function test_access_check_current_visitor_can_access_regular_users() {
		$users_plans           = $this->set_up_users_and_plans();
		$non_subscriber_id     = $users_plans[0];
		$regular_subscriber_id = $users_plans[1];
		$paid_subscriber_id    = $users_plans[2];
		$plan_id               = $users_plans[3];
		$selected_plan_ids     = array( $plan_id );

		// We setup the token for the regular user
		wp_set_current_user( $non_subscriber_id );
		$payload = $this->get_payload( false, false );
		$this->set_returned_token( $payload );
		$this->assertFalse( current_visitor_can_access( array( 'selectedPlanIds' => $selected_plan_ids ), array() ) );

		// We setup the token for the regular subscriber
		wp_set_current_user( $regular_subscriber_id );
		$payload = $this->get_payload( true, false );
		$this->set_returned_token( $payload );
		$this->assertFalse( current_visitor_can_access( array( 'selectedPlanIds' => $selected_plan_ids ), array() ) );

		// We setup the token for the paid user
		wp_set_current_user( $paid_subscriber_id );
		$payload = $this->get_payload( true, true );
		$this->set_returned_token( $payload );
		$this->assertTrue( current_visitor_can_access( array( 'selectedPlanIds' => $selected_plan_ids ), array() ) );
	}

	/**
	 * Test that plan id can be passed 2 ways
	 *
	 * @covers \Automattic\Jetpack\Extensions\Premium_Content\current_visitor_can_access
	 *
	 * @return void
	 */
	public function test_access_check_current_visitor_can_access_passing_plan_id() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		$payload = $this->get_payload( true, true );
		$this->set_returned_token( $payload );
		// We check it fails if the plan is not passed
		$this->assertFalse( current_visitor_can_access( array(), array() ) );

		// The plan id can be passed in 2 ways.
		$this->assertTrue( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
		$this->assertTrue( current_visitor_can_access( array(), (object) array( 'context' => array( 'premium-content/planIds' => array( $plan_id ) ) ) ) );
	}
}
