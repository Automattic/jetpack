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
use function Automattic\Jetpack\Extensions\Premium_Content\subscription_service;
use const Automattic\Jetpack\Extensions\Premium_Content\PAYWALL_FILTER;

/**
 * @covers ::Automattic\Jetpack\Extensions\Premium_Content\current_visitor_can_access
 */
#[CoversFunction( 'Automattic\\Jetpack\\Extensions\\Premium_Content\\current_visitor_can_access' )]
class Jetpack_Premium_Content_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	protected $product_id = 1234;

	/**
	 * Optional override for the refresh endpoint response. If null, refresh is blocked
	 * (simulates a transient 500). Tests can set this to control refresh behavior.
	 *
	 * @var array|null
	 */
	protected $refresh_response_override = null;

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
		// Block or mock refresh endpoint HTTP calls in tests.
		add_filter( 'pre_http_request', array( $this, 'mock_refresh_endpoint' ), 10, 3 );
	}

	public function tear_down() {
		// Clean up
		remove_all_filters( 'earn_get_user_subscriptions_for_site_id' );
		remove_all_filters( 'jetpack_is_connection_ready' );
		remove_all_filters( PAYWALL_FILTER );
		remove_all_filters( 'pre_http_request' );
		$this->refresh_response_override = null;
		unset( $_COOKIE['wp-jp-premium-content-session'] );
		parent::tear_down();
	}

	/**
	 * Intercept HTTP calls to the refresh endpoint. Returns the override if set,
	 * otherwise a transient 500 so refresh fails and existing behavior is preserved.
	 *
	 * @param mixed  $preempt Current preempt value.
	 * @param array  $args    Request args.
	 * @param string $url     Request URL.
	 * @return mixed
	 */
	public function mock_refresh_endpoint( $preempt, $args, $url ) {
		if ( false !== strpos( $url, 'memberships/jwt/refresh' ) ) {
			if ( null !== $this->refresh_response_override ) {
				return $this->refresh_response_override;
			}
			return array(
				'response' => array(
					'code'    => 500,
					'message' => 'blocked in tests',
				),
				'body'     => '',
				'headers'  => array(),
				'cookies'  => array(),
			);
		}
		return $preempt;
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

	/**
	 * Helper: build a mock 200 response from the refresh endpoint with a fresh JWT
	 * containing a subscription that expires in the future.
	 *
	 * @return array
	 */
	private function build_refresh_success_response() {
		$service       = subscription_service();
		$fresh_payload = array(
			'blog_sub'      => 'active',
			'subscriptions' => array(
				$this->product_id => array(
					'status'     => 'active',
					'end_date'   => time() + HOUR_IN_SECONDS,
					'product_id' => $this->product_id,
				),
			),
		);
		$fresh_token   = JWT::encode( $fresh_payload, $service->get_key() );
		return array(
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'body'     => wp_json_encode( array( 'jwt_token' => $fresh_token ), JSON_UNESCAPED_SLASHES ),
			'headers'  => array(),
			'cookies'  => array(),
		);
	}

	/**
	 * When the token contains a stale (expired) end_date and the refresh endpoint
	 * returns a fresh token with a valid subscription, access should be granted.
	 * This covers the core renewal lockout bug.
	 *
	 * @return void
	 */
	public function test_refresh_before_deny_grants_access_on_successful_refresh() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		// Stale token — end_date in the past.
		$stale_payload = $this->get_payload( true, true, time() - HOUR_IN_SECONDS );
		$this->set_returned_token( $stale_payload );

		// Refresh endpoint returns a fresh token with a valid future end_date.
		$this->refresh_response_override = $this->build_refresh_success_response();

		$this->assertTrue( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
	}

	/**
	 * When the refresh endpoint returns 200 with a token whose subscriptions no
	 * longer include the required plan (e.g. the subscription was cancelled),
	 * access should be denied.
	 *
	 * @return void
	 */
	public function test_refresh_before_deny_denies_when_fresh_token_has_no_subscription() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		$stale_payload = $this->get_payload( true, true, time() - HOUR_IN_SECONDS );
		$this->set_returned_token( $stale_payload );

		// Refresh returns a token with no subscriptions (cancelled).
		$service                         = subscription_service();
		$empty_token                     = JWT::encode(
			array(
				'blog_sub'      => 'active',
				'subscriptions' => array(),
			),
			$service->get_key()
		);
		$this->refresh_response_override = array(
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'body'     => wp_json_encode( array( 'jwt_token' => $empty_token ), JSON_UNESCAPED_SLASHES ),
			'headers'  => array(),
			'cookies'  => array(),
		);

		$this->assertFalse( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
	}

	/**
	 * When the refresh endpoint returns a transient failure (5xx), the original
	 * stale token behavior should apply — access denied, cookie left alone.
	 *
	 * @return void
	 */
	public function test_refresh_before_deny_denies_on_transient_failure() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		$stale_payload = $this->get_payload( true, true, time() - HOUR_IN_SECONDS );
		$this->set_returned_token( $stale_payload );

		// Refresh endpoint returns a 500 (the default mock behavior).
		$this->refresh_response_override = array(
			'response' => array(
				'code'    => 500,
				'message' => 'Server Error',
			),
			'body'     => '',
			'headers'  => array(),
			'cookies'  => array(),
		);

		$this->assertFalse( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
	}

	/**
	 * When the refresh endpoint returns 401 (bad signature), access is denied
	 * AND the cookie is cleared so the subscriber re-authenticates on next visit.
	 *
	 * @return void
	 */
	public function test_refresh_before_deny_clears_cookie_on_unauthorized() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		$stale_payload                            = $this->get_payload( true, true, time() - HOUR_IN_SECONDS );
		$service                                  = subscription_service();
		$token_string                             = JWT::encode( $stale_payload, $service->get_key() );
		$_COOKIE['wp-jp-premium-content-session'] = $token_string;
		$_GET['token']                            = $token_string;

		$this->refresh_response_override = array(
			'response' => array(
				'code'    => 401,
				'message' => 'Unauthorized',
			),
			'body'     => '',
			'headers'  => array(),
			'cookies'  => array(),
		);

		$this->assertFalse( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
		// Cookie should be cleared from $_COOKIE (cannot assert setcookie header from PHPUnit).
		$this->assertArrayNotHasKey( 'wp-jp-premium-content-session', $_COOKIE );
	}

	/**
	 * A WP_Error from the HTTP layer (e.g. network timeout) is treated as a
	 * transient failure — deny access, leave cookie alone.
	 *
	 * @return void
	 */
	public function test_refresh_before_deny_treats_wp_error_as_transient() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		$stale_payload = $this->get_payload( true, true, time() - HOUR_IN_SECONDS );
		$this->set_returned_token( $stale_payload );

		$this->refresh_response_override = new WP_Error( 'http_request_failed', 'cURL error 28: Operation timed out' );

		$this->assertFalse( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
	}

	/**
	 * An active subscription with a future end_date should not trigger a refresh
	 * at all — no HTTP call is made.
	 *
	 * @return void
	 */
	public function test_refresh_not_called_when_subscription_is_active() {
		$users_plans        = $this->set_up_users_and_plans();
		$paid_subscriber_id = $users_plans[2];
		$plan_id            = $users_plans[3];

		wp_set_current_user( $paid_subscriber_id );
		$valid_payload = $this->get_payload( true, true, time() + HOUR_IN_SECONDS );
		$this->set_returned_token( $valid_payload );

		// If a refresh call were made, this override would throw — proving it is not called.
		$this->refresh_response_override = new WP_Error( 'should_not_be_called', 'refresh should not be called for valid token' );

		$this->assertTrue( current_visitor_can_access( array( 'selectedPlanIds' => array( $plan_id ) ), array() ) );
	}
}
