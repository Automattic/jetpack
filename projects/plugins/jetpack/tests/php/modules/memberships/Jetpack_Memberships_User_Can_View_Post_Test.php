<?php
/**
 * Tests for Jetpack_Memberships::user_can_view_post().
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/subscription-service/include.php';
require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';
require_once JETPACK__PLUGIN_DIR . 'tests/php/extensions/blocks/premium-content/class-test-jetpack-token-subscription-service.php';

use Automattic\Jetpack\Extensions\Premium_Content\JWT;
use Automattic\Jetpack\Extensions\Premium_Content\Subscription_Service\Abstract_Token_Subscription_Service;
use PHPUnit\Framework\Attributes\CoversClass;
use Tests\Automattic\Jetpack\Extensions\Premium_Content\Test_Jetpack_Token_Subscription_Service;
use const Automattic\Jetpack\Extensions\Premium_Content\PAYWALL_FILTER;

/**
 * @covers Jetpack_Memberships
 */
#[CoversClass( Jetpack_Memberships::class )]
class Jetpack_Memberships_User_Can_View_Post_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	public function set_up() {
		parent::set_up();
		Jetpack_Subscriptions::init();
		// Force the connection to be ready so recurring payments (and therefore
		// get_all_newsletter_plan_ids()) are enabled in the test environment.
		add_filter( 'jetpack_is_connection_ready', '__return_true', PHP_INT_MAX );
		Jetpack_Options::update_option( 'id', 12345 );
		add_filter(
			PAYWALL_FILTER,
			static function () {
				return new Test_Jetpack_Token_Subscription_Service();
			}
		);
	}

	public function tear_down() {
		remove_all_filters( 'jetpack_is_connection_ready' );
		remove_all_filters( PAYWALL_FILTER );
		Jetpack_Options::delete_option( 'id' );
		unset( $_GET['token'] );
		unset( $_COOKIE['wp-jp-premium-content-session'] );
		Jetpack_Memberships::clear_cache();
		parent::tear_down();
	}

	/**
	 * Create a newsletter tier plan so get_all_newsletter_plan_ids() is non-empty.
	 *
	 * @return int The plan post ID.
	 */
	private function create_newsletter_plan() {
		$plan_id = self::factory()->post->create(
			array( 'post_type' => Jetpack_Memberships::$post_type_plan )
		);
		update_post_meta( $plan_id, 'jetpack_memberships_type', Jetpack_Memberships::$type_tier );
		return $plan_id;
	}

	/**
	 * Create a post with the given newsletter access level.
	 *
	 * @param string $access_level The access level to store on the post.
	 * @return int The post ID.
	 */
	private function create_post_with_access_level( $access_level ) {
		$post_id = self::factory()->post->create();
		update_post_meta( $post_id, Jetpack_Memberships::$post_access_level_meta_name, $access_level );
		return $post_id;
	}

	/**
	 * Present the visitor to the paywall as a free (blog-only) subscriber with no paid plan.
	 *
	 * @return void
	 */
	private function set_free_subscriber_token() {
		$payload       = array(
			'blog_sub'      => 'active',
			'subscriptions' => array(),
		);
		$service       = new Test_Jetpack_Token_Subscription_Service();
		$_GET['token'] = JWT::encode( $payload, $service->get_key() );
	}

	/**
	 * Regression test for CM-856.
	 *
	 * When newsletter plans exist and a post is set to paid_subscribers_all_tiers, a free
	 * (blog-only) subscriber must be denied access. An operator precedence bug in
	 * user_can_view_post() downgraded the access level to `subscribers` whenever the level
	 * was `paid_subscribers_all_tiers`, regardless of whether plans existed — which would
	 * have granted this free subscriber access.
	 *
	 * @return void
	 */
	public function test_paid_all_tiers_not_downgraded_when_newsletter_plans_exist() {
		$this->create_newsletter_plan();
		$post_id = $this->create_post_with_access_level(
			Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS_ALL_TIERS
		);
		$this->set_free_subscriber_token();

		$this->assertFalse( Jetpack_Memberships::user_can_view_post( $post_id ) );
	}

	/**
	 * The legitimate downgrade path must be preserved: when no newsletter plans exist, a
	 * paid_subscribers_all_tiers post is downgraded to subscribers-only, so a free
	 * (blog-only) subscriber is granted access.
	 *
	 * @return void
	 */
	public function test_paid_all_tiers_downgraded_to_subscribers_when_no_plans() {
		// Intentionally create no newsletter plans.
		$post_id = $this->create_post_with_access_level(
			Abstract_Token_Subscription_Service::POST_ACCESS_LEVEL_PAID_SUBSCRIBERS_ALL_TIERS
		);
		$this->set_free_subscriber_token();

		$this->assertTrue( Jetpack_Memberships::user_can_view_post( $post_id ) );
	}
}
