<?php

require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/access-check.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';
require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';
require_once __DIR__ . '/class-test-jetpack-token-subscription-service.php';

use Automattic\Jetpack\Extensions\Premium_Content\JWT;
use PHPUnit\Framework\Attributes\CoversFunction;
use Tests\Automattic\Jetpack\Extensions\Premium_Content\Test_Jetpack_Token_Subscription_Service;
use function Automattic\Jetpack\Extensions\Premium_Content\current_visitor_can_access;
use function Automattic\Jetpack\Extensions\Premium_Content\maybe_renew_session_cookie;
use function Automattic\Jetpack\Extensions\Premium_Content\subscription_service;
use const Automattic\Jetpack\Extensions\Premium_Content\PAYWALL_FILTER;

/**
 * @covers ::Automattic\Jetpack\Extensions\Premium_Content\current_visitor_can_access
 */
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Premium_Content\\current_visitor_can_access' )]
class Jetpack_Premium_Content_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	protected $product_id = 1234;

	public function set_up() {
		parent::set_up();
		Jetpack_Subscriptions::init();
		// Priority must be higher than wpcomsh's `WPCOMSH_Require_Connection_Owner` filter
		// (registered at 1000), which would otherwise force-return false in CI's wpcomsh
		// suite and break tier-aware tests that need `Jetpack_Memberships::get_all_*` to
		// see plans.
		add_filter( 'jetpack_is_connection_ready', '__return_true', PHP_INT_MAX );
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
	 * Atomic regression: a logged-in subscriber whose local user_id differs from their
	 * WPCOM user_id (the common case on Atomic, where the local wp_users table is
	 * autoincrement-independent from WPCOM global IDs) must still get access when their
	 * subscription is registered against the WPCOM id and the bridge is recorded in
	 * the `wpcom_user_id` user_meta.
	 *
	 * Without the fix, `current_visitor_can_access` only runs the
	 * `earn_get_user_subscriptions_for_site_id` filter when `is_wpcom_simple()` is true,
	 * so Atomic-hosted subscribers fall through to the JWT-cookie-only path and get gated.
	 *
	 * See https://linear.app/a8c/issue/CM-584
	 *
	 * @return void
	 */
	public function test_access_check_atomic_logged_in_tier_subscriber_uses_wpcom_user_id_meta() {
		$plan_id = $this->factory->post->create(
			array( 'post_type' => Jetpack_Memberships::$post_type_plan )
		);
		update_post_meta( $plan_id, 'jetpack_memberships_product_id', $this->product_id );
		update_post_meta( $plan_id, 'jetpack_memberships_type', Jetpack_Memberships::$type_tier );
		update_post_meta( $plan_id, 'jetpack_memberships_price', 15 );
		update_post_meta( $plan_id, 'jetpack_memberships_currency', 'CAD' );
		update_post_meta( $plan_id, 'jetpack_memberships_interval', '1 year' );

		$local_user_id = $this->factory->user->create(
			array( 'user_email' => 'atomic-subscriber@example.test' )
		);

		// Simulate Atomic: the WPCOM-side identity has a different ID than the local one.
		// SSO populates this user_meta as the bridge.
		$wpcom_user_id = 999999;
		update_user_meta( $local_user_id, 'wpcom_user_id', $wpcom_user_id );

		// The `earn_get_user_subscriptions_for_site_id` filter at WPCOM only knows about
		// WPCOM user IDs. It returns nothing when queried with a local Atomic user_id.
		$product_id = $this->product_id;
		add_filter(
			'earn_get_user_subscriptions_for_site_id',
			static function ( $subscriptions, $subscriber_id ) use ( $wpcom_user_id, $product_id ) {
				if ( (int) $subscriber_id === $wpcom_user_id ) {
					$subscriptions[] = array(
						'product_id' => $product_id,
						'status'     => 'active',
						'end_date'   => gmdate( 'Y-m-d H:i:s', time() + HOUR_IN_SECONDS ),
					);
				}
				return $subscriptions;
			},
			10,
			2
		);

		wp_set_current_user( $local_user_id );
		// Intentionally do NOT set a JWT token — this simulates a returning subscriber
		// whose premium-content cookie expired or was never issued.

		$this->assertTrue(
			current_visitor_can_access(
				array( 'selectedPlanIds' => array( $plan_id ) ),
				array()
			)
		);
	}

	/**
	 * Regression guard: a logged-in user without `wpcom_user_id` user_meta (the typical
	 * Jetpack self-hosted case) must still be granted access via the JWT cookie path.
	 *
	 * The fix for CM-584 introduces a logged-in branch that queries the
	 * `earn_get_user_subscriptions_for_site_id` filter. That filter is only registered on
	 * WPCOM-hosted sites; on Jetpack self-hosted it returns the empty default, so the
	 * code must fall back to the JWT-cookie subscription source.
	 *
	 * @return void
	 */
	public function test_access_check_logged_in_subscriber_falls_back_to_jwt_when_filter_returns_nothing() {
		$plan_id = $this->factory->post->create(
			array( 'post_type' => Jetpack_Memberships::$post_type_plan )
		);
		update_post_meta( $plan_id, 'jetpack_memberships_product_id', $this->product_id );
		update_post_meta( $plan_id, 'jetpack_memberships_type', Jetpack_Memberships::$type_tier );
		update_post_meta( $plan_id, 'jetpack_memberships_price', 5 );
		update_post_meta( $plan_id, 'jetpack_memberships_currency', 'USD' );
		update_post_meta( $plan_id, 'jetpack_memberships_interval', '1 month' );

		$user_id = $this->factory->user->create(
			array( 'user_email' => 'selfhosted-subscriber@example.test' )
		);
		// Intentionally no `wpcom_user_id` user_meta — simulating Jetpack self-hosted.
		// No filter registered for `earn_get_user_subscriptions_for_site_id` either.

		wp_set_current_user( $user_id );
		$this->set_returned_token( $this->get_payload( true, true ) );

		$this->assertTrue(
			current_visitor_can_access(
				array( 'selectedPlanIds' => array( $plan_id ) ),
				array()
			)
		);
	}

	/**
	 * `maybe_renew_session_cookie` mints a fresh JWT when authoritative subscriptions exist
	 * and the visitor has no premium-content session cookie. The encoded token must round-trip
	 * through `decode_token` and yield the same `user_id` and `subscriptions` that came in.
	 *
	 * @return void
	 */
	public function test_maybe_renew_session_cookie_mints_jwt_when_subscriptions_present_and_no_cookie() {
		unset( $_COOKIE['wp-jp-premium-content-session'] );

		$paywall     = subscription_service();
		$raw         = array(
			array(
				'product_id' => $this->product_id,
				'status'     => 'active',
				'end_date'   => gmdate( 'Y-m-d H:i:s', time() + DAY_IN_SECONDS ),
			),
		);
		$abbreviated = \Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service::abbreviate_subscriptions( $raw );

		$token = maybe_renew_session_cookie( $paywall, 999999, $raw, $abbreviated );

		$this->assertIsString( $token );
		$payload = $paywall->decode_token( $token );
		$this->assertIsArray( $payload );
		$this->assertSame( 999999, (int) $payload['user_id'] );
		$subscriptions = (array) $payload['subscriptions'];
		$this->assertArrayHasKey( $this->product_id, $subscriptions );
		$this->assertSame( 'active', $subscriptions[ $this->product_id ]->status );
	}

	/**
	 * `maybe_renew_session_cookie` no-ops when there are no subscriptions to wrap.
	 *
	 * @return void
	 */
	public function test_maybe_renew_session_cookie_returns_null_when_no_subscriptions() {
		unset( $_COOKIE['wp-jp-premium-content-session'] );
		$paywall = subscription_service();
		$this->assertNull( maybe_renew_session_cookie( $paywall, 999999, array(), array() ) );
	}

	/**
	 * `maybe_renew_session_cookie` no-ops when the visitor already has a session cookie —
	 * we don't want to clobber a valid token on every page load.
	 *
	 * @return void
	 */
	public function test_maybe_renew_session_cookie_returns_null_when_cookie_already_present() {
		$paywall                                  = subscription_service();
		$existing_token                           = JWT::encode( $this->get_payload( true, true ), $paywall->get_key() );
		$_COOKIE['wp-jp-premium-content-session'] = $existing_token;

		$raw         = array(
			array(
				'product_id' => $this->product_id,
				'status'     => 'active',
				'end_date'   => gmdate( 'Y-m-d H:i:s', time() + DAY_IN_SECONDS ),
			),
		);
		$abbreviated = \Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service::abbreviate_subscriptions( $raw );

		$this->assertNull( maybe_renew_session_cookie( $paywall, 999999, $raw, $abbreviated ) );

		unset( $_COOKIE['wp-jp-premium-content-session'] );
	}

	/**
	 * Test that plan id can be passed 2 ways
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
