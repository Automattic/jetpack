<?php

require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';
require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/subscriptions/subscriptions.php';

use Automattic\Jetpack\Extensions\Premium_Content\JWT;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Offline_Subscription_Service;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\WPCOM_Online_Subscription_Service;
use Tests\Automattic\Jetpack\Extensions\Premium_Content\Test_Jetpack_Token_Subscription_Service;
use function Automattic\Jetpack\Extensions\Subscriptions\register_block as register_subscription_block;
use const Automattic\Jetpack\Extensions\Subscriptions\META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS;
use const Automattic\Jetpack\Extensions\Subscriptions\META_NAME_FOR_POST_TIER_ID_SETTINGS;

define( 'EARN_JWT_SIGNING_KEY', 'whatever=' );

class WP_Test_Jetpack_Subscriptions extends WP_UnitTestCase {

	protected $regular_non_subscriber_id;
	protected $regular_subscriber_id;
	protected $paid_subscriber_id;
	protected $admin_user_id;
	protected $plan_id;
	protected $product_id = 1234;

	public function set_up() {
		parent::set_up();
		Jetpack_Subscriptions::init();
		add_filter( 'jetpack_is_connection_ready', '__return_true' );
		$this->set_up_users();
	}

	public function tear_down() {
		// Clean up
		remove_all_filters( 'earn_get_user_subscriptions_for_site_id' );
		remove_all_filters( 'jetpack_is_connection_ready' );

		parent::tear_down();
	}

	private function set_up_users() {
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

		get_user_by( 'id', $this->admin_user_id )->add_role( 'administrator' );
	}

	/**
	 * Jetpack user identified by cookie.
	 */
	public function test_jetpack_cookie_user() {
		$this->markTestSkipped( 'setting cookies does not work well with tests. But the logic is here.' );
		// @phan-suppress-next-line PhanPluginUnreachableCode
		$post_id         = $this->setup_jetpack_paid_newsletters();
		$GLOBALS['post'] = get_post( $post_id );

		wp_set_current_user( 0 );

		$token_subscription_service = $this->set_returned_token(
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

		unset( $_COOKIE[ Test_Jetpack_Token_Subscription_Service::JWT_AUTH_TOKEN_COOKIE_NAME ] );

		$this->assertNotContains( Test_Jetpack_Token_Subscription_Service::JWT_AUTH_TOKEN_COOKIE_NAME, $_COOKIE );

		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), '' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'everybody' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'subscribers' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'paid_subscribers' ) );

		// Now we make sure we have the cookie
		$this->assertNotNull( $_COOKIE[ Test_Jetpack_Token_Subscription_Service::JWT_AUTH_TOKEN_COOKIE_NAME ] );

		// We remove the token
		unset( $_GET['token'] );

		// We make sure everything still works
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), '' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'everybody' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'subscribers' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'paid_subscribers' ) );

		// We remove the cookie
		unset( $_COOKIE[ Test_Jetpack_Token_Subscription_Service::JWT_AUTH_TOKEN_COOKIE_NAME ] );

		// We make sure everything nothing works anymore
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), '' ) );
		$this->assertTrue( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'everybody' ) );
		$this->assertFalse( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'subscribers' ) );
		$this->assertFalse( $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), 'paid_subscribers' ) );
	}

	public function test_publishing_post_first_time_does_not_set_do_not_send_subscription_flag() {
		$post_id = $this->factory->post->create();
		wp_publish_post( $post_id );
		$this->assertEmpty( get_post_meta( $post_id, '_jetpack_dont_email_post_to_subs', true ) );
	}

	/**
	 * A simple helpful function to get the parameters name when filling the array
	 *
	 * @param string      $user_id
	 * @param bool        $logged
	 * @param bool        $token_set
	 * @param bool        $post_access_level
	 * @param bool        $is_email_sent
	 * @param bool        $does_user_access_post
	 * @param string|null $subscription_end_date
	 * @param string|null $status
	 * @return array
	 */
	private function access_use_case( $user_id, $logged, $token_set, $post_access_level, $is_email_sent, $does_user_access_post, $subscription_end_date = null, $status = null ) {
		return array( $user_id, $logged, $token_set, $post_access_level, $is_email_sent, $does_user_access_post, $subscription_end_date, $status );
	}

	public function matrix_access() {
		$time_outdated = time() - HOUR_IN_SECONDS;

		return array(
			// The follow use cases are mainly yot be thourough and probably duplicates some former use cases
			// Admin
				// not-logged / no jwt
			$this->access_use_case( 'admin_user_id', false, false, '', true, true ),
			$this->access_use_case( 'admin_user_id', false, false, 'everybody', true, true ),
			$this->access_use_case( 'admin_user_id', false, false, 'subscribers', true, false ),
			$this->access_use_case( 'admin_user_id', false, false, 'paid_subscribers', true, false ),
			// logged
			$this->access_use_case( 'admin_user_id', true, false, '', true, true ),
			$this->access_use_case( 'admin_user_id', true, false, 'everybody', true, true ),
			$this->access_use_case( 'admin_user_id', true, false, 'subscribers', true, true ),
			$this->access_use_case( 'admin_user_id', true, false, 'paid_subscribers', true, true ),
			// token set
			$this->access_use_case( 'admin_user_id', false, true, '', true, true ),
			$this->access_use_case( 'admin_user_id', false, true, 'everybody', true, true ),
			// Skipped as there is no way to know this is admin from the JWT token
			// $this->accessUseCase( 'admin_user_id', false, true, 'subscribers', true,  true ), // phpcs:ignore Squiz.PHP.CommentedOutCode.Found
			// $this->accessUseCase( 'admin_user_id', false, true, 'paid_subscribers', true,  true ), // phpcs:ignore Squiz.PHP.CommentedOutCode.Found

			// Regular user
				// not-logged / no jwt
			$this->access_use_case( 'regular_non_subscriber_id', false, false, '', false, true ),
			$this->access_use_case( 'regular_non_subscriber_id', false, false, 'everybody', false, true ),
			$this->access_use_case( 'regular_non_subscriber_id', false, false, 'subscribers', false, false ),
			$this->access_use_case( 'regular_non_subscriber_id', false, false, 'paid_subscribers', false, false ),
			// logged
			$this->access_use_case( 'regular_non_subscriber_id', true, false, '', false, true ),
			$this->access_use_case( 'regular_non_subscriber_id', true, false, 'everybody', false, true ),
			$this->access_use_case( 'regular_non_subscriber_id', true, false, 'subscribers', false, false ),
			$this->access_use_case( 'regular_non_subscriber_id', true, false, 'paid_subscribers', false, false ),
			// token set
			$this->access_use_case( 'regular_non_subscriber_id', false, true, '', false, true ),
			$this->access_use_case( 'regular_non_subscriber_id', false, true, 'everybody', false, true ),
			$this->access_use_case( 'regular_non_subscriber_id', false, true, 'subscribers', false, false ),
			$this->access_use_case( 'regular_non_subscriber_id', false, true, 'paid_subscribers', false, false ),

			// Subscriber user
				// not-logged / no jwt
			$this->access_use_case( 'regular_subscriber_id', false, false, '', true, true ),
			$this->access_use_case( 'regular_subscriber_id', false, false, 'everybody', true, true ),
			$this->access_use_case( 'regular_subscriber_id', false, false, 'subscribers', true, false ),
			$this->access_use_case( 'regular_subscriber_id', false, false, 'paid_subscribers', false, false ),
			// logged
			$this->access_use_case( 'regular_subscriber_id', true, false, '', true, true ),
			$this->access_use_case( 'regular_subscriber_id', true, false, 'everybody', true, true ),
			$this->access_use_case( 'regular_subscriber_id', true, false, 'subscribers', true, true ),
			$this->access_use_case( 'regular_subscriber_id', true, false, 'paid_subscribers', false, false ),
			// token set
			$this->access_use_case( 'regular_subscriber_id', false, true, '', true, true ),
			$this->access_use_case( 'regular_subscriber_id', false, true, 'everybody', true, true ),
			$this->access_use_case( 'regular_subscriber_id', false, true, 'subscribers', true, true ),
			$this->access_use_case( 'regular_subscriber_id', false, true, 'paid_subscribers', false, false ),

			// Paid Subscriber user
				// not-logged / no jwt
			$this->access_use_case( 'paid_subscriber_id', false, false, '', true, true ),
			$this->access_use_case( 'paid_subscriber_id', false, false, 'everybody', true, true ),
			$this->access_use_case( 'paid_subscriber_id', false, false, 'subscribers', true, false ),
			$this->access_use_case( 'paid_subscriber_id', false, false, 'paid_subscribers', true, false ),
			// logged
			$this->access_use_case( 'paid_subscriber_id', true, false, '', true, true ),
			$this->access_use_case( 'paid_subscriber_id', true, false, 'everybody', true, true ),
			$this->access_use_case( 'paid_subscriber_id', true, false, 'subscribers', true, true ),
			$this->access_use_case( 'paid_subscriber_id', true, false, 'paid_subscribers', true, true ),
			// token set
			$this->access_use_case( 'paid_subscriber_id', false, true, '', true, true ),
			$this->access_use_case( 'paid_subscriber_id', false, true, 'everybody', true, true ),
			$this->access_use_case( 'paid_subscriber_id', false, true, 'subscribers', true, true ),
			$this->access_use_case( 'paid_subscriber_id', false, true, 'paid_subscribers', true, true ),

			// Outdated paid subscription --  only matters for 'paid_subscribers' post - they are treated as normal "subscribers"
				// loggued
			$this->access_use_case( 'paid_subscriber_id', true, false, '', true, true, $time_outdated ),
			$this->access_use_case( 'paid_subscriber_id', true, false, 'everybody', true, true, $time_outdated ),
			$this->access_use_case( 'paid_subscriber_id', true, false, 'subscribers', true, true, $time_outdated ),
			$this->access_use_case( 'paid_subscriber_id', true, false, 'paid_subscribers', false, false, $time_outdated ),
			// token
			$this->access_use_case( 'paid_subscriber_id', true, false, '', true, true, $time_outdated ),
			$this->access_use_case( 'paid_subscriber_id', false, true, 'everybody', true, true, $time_outdated ),
			$this->access_use_case( 'paid_subscriber_id', false, true, 'subscribers', true, true, $time_outdated ),
			$this->access_use_case( 'paid_subscriber_id', false, true, 'paid_subscribers', false, false, $time_outdated ),

			// inactive subscription status
			$this->access_use_case( 'paid_subscriber_id', true, false, 'paid_subscribers', false, false, null, 'inactive' ),

		);
	}

	/**
	 * Stubs Test_Jetpack_Token_Subscription_Service in order to return the provided token.
	 *
	 * @param array $payload
	 * @return mixed
	 */
	private function set_returned_token( $payload ) {
		// We remove anything else
		remove_all_filters( 'earn_get_user_subscriptions_for_site_id' );
		$service       = new Test_Jetpack_Token_Subscription_Service();
		$_GET['token'] = JWT::encode( $payload, $service->get_key() );
		return $service;
	}

	/**
	 * Retrieves payload for JWT token
	 *
	 * @param bool   $is_subscribed
	 * @param bool   $is_paid_subscriber
	 * @param int    $subscription_end_date
	 * @param string $status
	 * @param int    $product_id
	 * @return array
	 */
	private function get_payload( $is_subscribed, $is_paid_subscriber = false, $subscription_end_date = null, $status = null, $product_id = 0 ) {
		$product_id    = $product_id ? $product_id : $this->product_id;
		$subscriptions = ! $is_paid_subscriber ? array() : array(
			$product_id => array(
				'status'     => $status ? $status : 'active',
				'end_date'   => $subscription_end_date ? $subscription_end_date : time() + HOUR_IN_SECONDS,
				'product_id' => $product_id,
			),
		);

		return array(
			'blog_sub'      => $is_subscribed ? 'active' : 'inactive',
			'subscriptions' => $subscriptions,
		);
	}

	/**
	 * Test the whole matrix access
	 *
	 * @dataProvider matrix_access
	 */
	public function test_subscriber_access_level( $type_user_id, $logged, $token_set, $post_access_level, $should_email_be_sent, $should_user_access_post, $subscription_end_date = null, $status = null ) {
		if ( $type_user_id !== null ) {
			$user_id = $this->{$type_user_id};
		}

		$is_blog_subscriber = $user_id === $this->paid_subscriber_id || $user_id === $this->regular_subscriber_id;
		$is_paid_subscriber = $user_id === $this->paid_subscriber_id;
		$payload            = $this->get_payload( $is_blog_subscriber, $is_paid_subscriber, $subscription_end_date, $status );

		$post_id = $this->setup_jetpack_paid_newsletters();
		$this->set_returned_subscriptions( $payload );

		$GLOBALS['post'] = get_post( $post_id );
		update_post_meta( $post_id, '_jetpack_newsletter_access', $post_access_level );

		if ( 'regular_non_subscriber_id' === $type_user_id || empty( $type_user_id ) ) {
			$this->assertFalse( $should_email_be_sent, ' regular_non_subscriber_id won\'t be called in the async job on WPCOM' );
		} else {
			$subscription_service = new WPCOM_Offline_Subscription_Service();
			$this->assertEquals(
				$should_email_be_sent,
				$subscription_service->subscriber_can_receive_post_by_mail( $user_id, $post_id ),
				$should_email_be_sent ? 'email should be sent' : 'email should not be sent'
			);
		}

		if ( $token_set ) {
			$this->set_returned_token( $payload );
			$token_subscription_service = new Test_Jetpack_Token_Subscription_Service();
			$result                     = $token_subscription_service->visitor_can_view_content( array( $this->plan_id ), $post_access_level );
		} else {
			if ( $logged ) {
				wp_set_current_user( $user_id );
			} else {
				wp_set_current_user( 0 );
			}
			$online_subscription_service = new WPCOM_Online_Subscription_Service();
			$ref_method                  = new ReflectionMethod( $online_subscription_service, 'user_can_view_content' );
			$ref_method->setAccessible( true );
			$result = $ref_method->invoke( $online_subscription_service, array( $this->plan_id ), $post_access_level, $logged && $is_blog_subscriber, get_the_ID() );
		}

		$this->assertEquals(
			$should_user_access_post,
			$result,
			$should_user_access_post ? 'user should be able to access the content' : 'user should not be able to access the content'
		);
	}

	/**
	 * Tests for regression from https://github.com/Automattic/jetpack/commit/e2c3b99c39047a15de02ca82f23893185916e2d9
	 *
	 * @covers \Automattic\Jetpack\Extensions\Subscriptions\maybe_close_comments
	 *
	 * @return void
	 */
	public function test_comments_are_not_displaying_on_not_pages() {
		$this->setup_jetpack_paid_newsletters();
		register_subscription_block();

		// When no post id is set, the comments should default to whatever is passed as default
		$this->assertFalse( apply_filters( 'comments_open', false, null ) );
		$this->assertTrue( apply_filters( 'comments_open', true, null ) );
	}

	/**
	 * Tests for regression from https://github.com/Automattic/jetpack/commit/e2c3b99c39047a15de02ca82f23893185916e2d9
	 *
	 * @covers \Automattic\Jetpack\Extensions\Subscriptions\maybe_close_comments
	 *
	 * @return void
	 */
	public function test_comments_are_displaying_on_not_accessible_pages() {
		$enable_subscriptions_callback = function ( $active ) {
				return array_merge( $active, array( 'subscriptions' ) );
		};
		add_filter(
			'jetpack_active_modules',
			$enable_subscriptions_callback
		);

		$post_id = $this->setup_jetpack_paid_newsletters();
		register_subscription_block();

		// When post-id is passed, it should prevent access depending of the user access
		$is_user_subscribed   = false;
		$payload              = $this->get_payload( $is_user_subscribed );
		$subscription_service = $this->set_returned_token( $payload );
		$GLOBALS['post']      = get_post( $post_id );
		$post_access_level    = 'paid_subscribers';
		update_post_meta( $post_id, '_jetpack_newsletter_access', $post_access_level );

		$this->assertFalse( $subscription_service->visitor_can_view_content( array( $this->plan_id ), $post_access_level ) );
		$this->assertFalse( apply_filters( 'comments_open', true, $post_id ) );
		remove_filter(
			'jetpack_active_modules',
			$enable_subscriptions_callback
		);
	}

	/**
	 * Tests for regression from https://github.com/Automattic/jetpack/commit/e2c3b99c39047a15de02ca82f23893185916e2d9
	 *
	 * @covers \Automattic\Jetpack\Extensions\Subscriptions\maybe_close_comments
	 *
	 * @return void
	 */
	public function test_comments_are_not_displaying_for_paid_subscribers_when_defaults_to_false() {
		$post_id = $this->setup_jetpack_paid_newsletters();
		register_subscription_block();

		// When post-id is passed, it should prevent access depending of the user access
		$payload              = $this->get_payload( true, true, null, null );
		$post_id              = $this->setup_jetpack_paid_newsletters();
		$subscription_service = $this->set_returned_token( $payload );
		$GLOBALS['post']      = get_post( $post_id );
		$post_access_level    = 'paid_subscribers';
		update_post_meta( $post_id, '_jetpack_newsletter_access', $post_access_level );
		$this->assertTrue( $subscription_service->visitor_can_view_content( array( $this->plan_id ), $post_access_level ) );

		// The user has access, BUT it still does NOT display comments if defaults to false
		$this->assertFalse( apply_filters( 'comments_open', false, $post_id ) );
	}

	public function test_posts_in_loop_have_the_right_access() {
		/**
		 *
		 * This test was implemented to prvent issues in loop (either because of cache issue or other
		 * It pre supposes that  while ( have_posts() ) : the_post(); uses the same order as the post creation
		 */
		$first_post_id  = $this->setup_jetpack_paid_newsletters();
		$second_post_id = $this->factory->post->create();
		update_post_meta( $second_post_id, META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS, WPCOM_Offline_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS );
		$third_post_id = $this->factory->post->create();
		update_post_meta( $third_post_id, META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS, WPCOM_Offline_Subscription_Service::POST_ACCESS_LEVEL_SUBSCRIBERS );
		$fourth_post_id = $this->factory->post->create();
		update_post_meta( $fourth_post_id, META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS, WPCOM_Offline_Subscription_Service::POST_ACCESS_LEVEL_EVERYBODY );

		wp_publish_post( $first_post_id );
		wp_publish_post( $second_post_id );
		wp_publish_post( $third_post_id );
		wp_publish_post( $fourth_post_id );

		$posts_ids = array(
			$first_post_id,
			$second_post_id,
			$third_post_id,
			$fourth_post_id,
		);

		foreach ( $posts_ids as $current_post_id ) {

			$post            = get_post( $current_post_id );
			$GLOBALS['post'] =& $post;
			setup_postdata( $post );
			$level = get_post_meta( $current_post_id, META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS, true );
			if ( empty( $level ) ) {
				$level = Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_EVERYBODY;
			}

			$this->assertEquals( $level, Jetpack_Memberships::get_post_access_level() );
			$this->assertEquals( $current_post_id === $first_post_id || $current_post_id === $fourth_post_id, Jetpack_Memberships::user_can_view_post() );

			wp_reset_postdata();

		}
	}

	/**
	 * Setup the newsletter post
	 *
	 * @return mixed
	 */
	private function setup_jetpack_paid_newsletters() {
		// We create a plan
		$this->plan_id = WP_UnitTestCase_Base::factory()->post->create(
			array(
				'post_type' => Jetpack_Memberships::$post_type_plan,
			)
		);

		// Connect the plan to a product and mark the plan as a "newsletter" plan
		update_post_meta( $this->plan_id, 'jetpack_memberships_product_id', $this->product_id );
		update_post_meta( $this->plan_id, 'jetpack_memberships_site_subscriber', true );
		update_post_meta( $this->plan_id, 'jetpack_memberships_interval', '1 month' );
		update_post_meta( $this->plan_id, 'jetpack_memberships_type', Jetpack_Memberships::$type_tier );

		// Connect the site to Stripe
		update_option( Jetpack_Memberships::$has_connected_account_option_name, true );

		// Create a post
		return $this->factory->post->create();
	}

	/**
	 * Mock earn_get_user_subscriptions_for_site_id filter by returning subscriptions from the payload
	 *
	 * @param array $payload .
	 * @return WPCOM_Online_Subscription_Service
	 */
	private function set_returned_subscriptions( $payload ) {
		remove_all_filters( 'earn_get_user_subscriptions_for_site_id' );
		$paid_subscriber_id = $this->paid_subscriber_id;
		add_filter(
			'earn_get_user_subscriptions_for_site_id',
			static function ( $subscriptions, $subscriber_id ) use ( $paid_subscriber_id, $payload ) {
				if ( $subscriber_id === $paid_subscriber_id ) {
					$subscriptions = array_merge( $subscriptions, isset( $payload['subscriptions'] ) ? $payload['subscriptions'] : array() );
				}

				return $subscriptions;
			},
			10,
			2
		);

		return new WPCOM_Online_Subscription_Service();
	}

	/**
	 * Verifies that a premium content JWT can't be be used to access a Paid Newsletter post
	 *
	 * @return void
	 */
	public function test_verify_a_premium_content_token_cannot_grant_access_to_paid_newsletter_post() {
		/**
		 * Create a premium content plan
		 */
		$premium_content_product_id = 5678;
		$premium_content_plan_id    = $this->factory->post->create(
			array(
				'post_type' => Jetpack_Memberships::$post_type_plan,
			)
		);
		update_post_meta( $premium_content_plan_id, 'jetpack_memberships_product_id', $premium_content_product_id );
		$this->factory->post->create();

		/**
		 * Generate a payload based on the premium content product ID
		 * and create a JWT token based on the payload
		 */
		$premium_content_jwt_payload = $this->get_payload( true, true, null, null, $premium_content_product_id );
		$subscription_service        = $this->set_returned_token( $premium_content_jwt_payload );

		/**
		 * Setup a paid newsletter plan and post then verify a premium content customer cannot access a newsletter paid post
		 */
		$post_access_level       = 'paid_subscribers';
		$newsletter_paid_post_id = $this->setup_jetpack_paid_newsletters();
		update_post_meta( $newsletter_paid_post_id, '_jetpack_newsletter_access', $post_access_level );

		$GLOBALS['post'] = get_post( $newsletter_paid_post_id );
		$this->assertFalse( $subscription_service->visitor_can_view_content( Jetpack_Memberships::get_all_newsletter_plan_ids(), $post_access_level ) );
	}

	/**
	 * Create a tier
	 *
	 * @param int        $newsletter_product_id Plan id.
	 * @param int        $newsletter_annual_product_id Annual plan ID.
	 * @param float      $price plan price.
	 * @param float|null $annual_price annual plan price.
	 * @param string     $currency currency.
	 * @return int post tier ID
	 */
	private function setup_jetpack_tier( $newsletter_product_id, $newsletter_annual_product_id, $price, $annual_price = null, $currency = 'EUR' ) {
		/**
		 * Create a newsletter plan
		 */
		$newsletter_plan_id = $this->factory->post->create(
			array(
				'post_type' => Jetpack_Memberships::$post_type_plan,
			)
		);
		update_post_meta( $newsletter_plan_id, 'jetpack_memberships_product_id', $newsletter_product_id );
		update_post_meta( $newsletter_plan_id, 'jetpack_memberships_site_subscriber', true );
		update_post_meta( $newsletter_plan_id, 'jetpack_memberships_price', $price );
		update_post_meta( $newsletter_plan_id, 'jetpack_memberships_currency', $currency );
		update_post_meta( $newsletter_plan_id, 'jetpack_memberships_interval', '1 month' );
		update_post_meta( $newsletter_plan_id, 'jetpack_memberships_type', 'tier' );

		$this->factory->post->create();

		if ( $annual_price !== null ) {
			$newsletter_annual_plan_id = $this->factory->post->create(
				array(
					'post_type' => Jetpack_Memberships::$post_type_plan,
				)
			);
			update_post_meta( $newsletter_annual_plan_id, 'jetpack_memberships_product_id', $newsletter_annual_product_id );
			update_post_meta( $newsletter_annual_plan_id, 'jetpack_memberships_site_subscriber', true );
			update_post_meta( $newsletter_annual_plan_id, 'jetpack_memberships_price', $annual_price );
			update_post_meta( $newsletter_annual_plan_id, 'jetpack_memberships_currency', $currency );
			update_post_meta( $newsletter_annual_plan_id, 'jetpack_memberships_interval', '1 year' );
			update_post_meta( $newsletter_annual_plan_id, 'jetpack_memberships_tier', $newsletter_plan_id );
			update_post_meta( $newsletter_annual_plan_id, 'jetpack_memberships_type', 'tier' );

			$this->factory->post->create();
		}

		return $newsletter_plan_id;
	}

	public function test_newsletter_tiers() {
		$bronze_tier_plan_id        = 1000;
		$bronze_tier_annual_plan_id = 2000;
		$silver_tier_plan_id        = 3000;
		$silver_tier_annual_plan_id = 5000;
		$gold_tier_plan_id          = 6000;
		$gold_tier_annual_plan_id   = 7000;

		$this->setup_jetpack_tier( $bronze_tier_plan_id, $bronze_tier_annual_plan_id, 10, 100 );
		$silver_tier_id = $this->setup_jetpack_tier( $silver_tier_plan_id, $silver_tier_annual_plan_id, 20, 200 );
		$this->setup_jetpack_tier( $gold_tier_plan_id, $gold_tier_annual_plan_id, 30, 300 );

		/**
		 * Setup a paid newsletter plan and post then verify a premium content customer cannot access a newsletter paid post
		 */
		$post_access_level       = 'paid_subscribers';
		$newsletter_paid_post_id = $this->setup_jetpack_paid_newsletters();
		update_post_meta( $newsletter_paid_post_id, META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS, $post_access_level );

		$GLOBALS['post'] = get_post( $newsletter_paid_post_id );

		// No subscription
		$subscription_service = $this->set_returned_token(
			$this->get_payload( true, false, null, null, 0 )
		);
		$this->assertFalse( $subscription_service->visitor_can_view_content( Jetpack_Memberships::get_all_newsletter_plan_ids(), $post_access_level ) );

		// We now set the "middle" tier in price
		update_post_meta( $newsletter_paid_post_id, META_NAME_FOR_POST_TIER_ID_SETTINGS, $silver_tier_id );

		$this->assertFalse( $subscription_service->visitor_can_view_content( Jetpack_Memberships::get_all_newsletter_plan_ids(), $post_access_level ) );

		// Let's subscribe the user to the Bronze, monthly or annual
		$subscription_service = $this->set_returned_token(
			$this->get_payload( true, true, null, null, $bronze_tier_plan_id )
		);
		$this->assertFalse( $subscription_service->visitor_can_view_content( Jetpack_Memberships::get_all_newsletter_plan_ids(), $post_access_level ) );
		$subscription_service = $this->set_returned_token(
			$this->get_payload( true, true, null, null, $bronze_tier_annual_plan_id )
		);
		$this->assertFalse( $subscription_service->visitor_can_view_content( Jetpack_Memberships::get_all_newsletter_plan_ids(), $post_access_level ) );

		// Let subscribe to the silver, monthly and annual
		$subscription_service = $this->set_returned_token(
			$this->get_payload( true, true, null, null, $silver_tier_plan_id )
		);
		$this->assertTrue( $subscription_service->visitor_can_view_content( Jetpack_Memberships::get_all_newsletter_plan_ids(), $post_access_level ) );
		$subscription_service = $this->set_returned_token(
			$this->get_payload( true, true, null, null, $silver_tier_annual_plan_id )
		);
		$this->assertTrue( $subscription_service->visitor_can_view_content( Jetpack_Memberships::get_all_newsletter_plan_ids(), $post_access_level ) );

		// Let subscribe to the gold, monthly and annual
		$subscription_service = $this->set_returned_token(
			$this->get_payload( true, true, null, null, $gold_tier_plan_id )
		);
		$this->assertTrue( $subscription_service->visitor_can_view_content( Jetpack_Memberships::get_all_newsletter_plan_ids(), $post_access_level ) );
		$subscription_service = $this->set_returned_token(
			$this->get_payload( true, true, null, null, $gold_tier_annual_plan_id )
		);
		$this->assertTrue( $subscription_service->visitor_can_view_content( Jetpack_Memberships::get_all_newsletter_plan_ids(), $post_access_level ) );

		// Let's make sure date is taken into account
		$subscription_service = $this->set_returned_token(
			$this->get_payload( true, true, time() - HOUR_IN_SECONDS, null, $gold_tier_annual_plan_id )
		);
		$this->assertFalse( $subscription_service->visitor_can_view_content( Jetpack_Memberships::get_all_newsletter_plan_ids(), $post_access_level ) );

		// This was removed because subscriptions in JWT_token does not provide the subscription status
		// See https://github.com/Automattic/jetpack/pull/32710/commits/7e874089416d4d0f6b27d03420055f4b55d3c1e2
		// Let's make sure inactive subscriptions do not count
		// $subscription_service = $this->set_returned_token(
		// $this->get_payload( true, true, null, 'inactive', $gold_tier_annual_plan_id )
		// );
		// $this->assertFalse( $subscription_service->visitor_can_view_content( Jetpack_Memberships::get_all_newsletter_plan_ids(), $post_access_level ) );

		// Let's make sure non-paid subscribers do not count
		$subscription_service = $this->set_returned_token(
			$this->get_payload( true, false, null, null, $gold_tier_annual_plan_id )
		);
		$this->assertFalse( $subscription_service->visitor_can_view_content( Jetpack_Memberships::get_all_newsletter_plan_ids(), $post_access_level ) );
	}
}
