<?php
/**
 * Tests for the /wpcom/v2/jetpack-ai/feature-settings endpoint.
 *
 * Locks down the permission gate, the GET payload shape (gate state + toggles),
 * partial POST semantics (only the keys present are written, both bare-boolean
 * and { enabled } forms accepted), and the host-gate write refusal.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Search\Plan as Search_Plan;
use PHPUnit\Framework\Attributes\CoversClass;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_AI_Feature_Settings_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_AI_Feature_Settings
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_AI_Feature_Settings::class )]
class WPCOM_REST_API_V2_Endpoint_AI_Feature_Settings_Test extends Jetpack_REST_TestCase {

	const ROUTE = '/wpcom/v2/jetpack-ai/feature-settings';

	/**
	 * Admin user id.
	 *
	 * @var int
	 */
	private static $admin_id;

	/**
	 * Subscriber user id.
	 *
	 * @var int
	 */
	private static $subscriber_id;

	/**
	 * Create fixture users.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id      = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$subscriber_id = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	/**
	 * Reset the options and filters this test touches.
	 */
	public function tear_down() {
		delete_option( Jetpack_AI_Settings::MASTER_OPTION );
		foreach ( Jetpack_AI_Settings::FEATURE_OPTIONS as $option ) {
			delete_option( $option );
		}
		remove_filter( 'wp_supports_ai', '__return_false' );

		delete_option( Search_Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );

		parent::tear_down();
	}

	/**
	 * Dispatch a request against the endpoint.
	 *
	 * @param string     $method HTTP method.
	 * @param array|null $body   JSON body for POST.
	 * @return WP_REST_Response
	 */
	private function dispatch( $method, $body = null ) {
		$request = new WP_REST_Request( $method, self::ROUTE );
		if ( null !== $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		}
		return $this->server->dispatch( $request );
	}

	/**
	 * The route is registered.
	 */
	public function test_route_is_registered() {
		$this->assertArrayHasKey( self::ROUTE, $this->server->get_routes() );
	}

	/**
	 * Non-admins are refused.
	 */
	public function test_requires_manage_options() {
		wp_set_current_user( self::$subscriber_id );

		$response = $this->dispatch( 'GET' );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * GET returns the full gate + toggles shape with the documented defaults.
	 */
	public function test_get_returns_gate_state_and_defaults() {
		wp_set_current_user( self::$admin_id );

		$response = $this->dispatch( 'GET' );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $data['host_allows_ai'] );
		$this->assertTrue( $data['master_enabled'] );
		$this->assertArrayHasKey( 'is_connected', $data );
		$this->assertArrayHasKey( 'supports_ai', $data['plan'] );
		$this->assertArrayHasKey( 'supports_search', $data['plan'] );

		$features = $data['features'];
		$this->assertTrue( $features['writing_assistant']['enabled'] );
		$this->assertTrue( $features['image_editor']['enabled'] );
		// The image label option is not part of the settings surface.
		$this->assertArrayNotHasKey( 'sub', $features['image_editor'] );
		$this->assertArrayNotHasKey( 'image_label', $features );
		$this->assertArrayNotHasKey( 'excerpt', $features );
		$this->assertFalse( $features['seo_enhancer']['enabled'] );
		$this->assertFalse( $features['ai_search']['enabled'] );
		// No paid Search product in the test environment.
		$this->assertTrue( $features['ai_search']['requires_upgrade'] );
	}

	/**
	 * The ai_search.requires_upgrade gate clears only when the paid Search product is
	 * provisioned: Instant Search supported and not the free tier. Mirrors the
	 * Search dashboard's own AI Answers upsell gate.
	 */
	public function test_ai_search_gate_clears_with_paid_search() {
		wp_set_current_user( self::$admin_id );

		update_option(
			Search_Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY,
			array(
				'supports_instant_search' => true,
				'supports_search'         => true,
				'effective_subscription'  => array( 'product_slug' => 'jetpack_search' ),
			)
		);

		$data = $this->dispatch( 'GET' )->get_data();

		$this->assertFalse( $data['features']['ai_search']['requires_upgrade'] );
		// The entitlement field keeps its own meaning.
		$this->assertTrue( $data['plan']['supports_search'] );
	}

	/**
	 * The free Search tier supports Instant Search but cannot run AI Answers,
	 * so the row keeps its upgrade gate. Same for a Classic-only paid plan,
	 * which lacks Instant Search.
	 */
	public function test_ai_search_gate_stays_without_paid_instant_search() {
		wp_set_current_user( self::$admin_id );

		// Free tier: Instant Search supported, free product slug.
		update_option(
			Search_Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY,
			array(
				'supports_instant_search' => true,
				'supports_search'         => true,
				'effective_subscription'  => array( 'product_slug' => Search_Plan::JETPACK_SEARCH_FREE_PRODUCT_SLUG ),
			)
		);
		$data = $this->dispatch( 'GET' )->get_data();
		$this->assertTrue( $data['features']['ai_search']['requires_upgrade'] );

		// Classic-only: entitled to Search, but no Instant Search.
		update_option(
			Search_Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY,
			array(
				'supports_instant_search' => false,
				'supports_search'         => true,
				'effective_subscription'  => array( 'product_slug' => 'jetpack_search' ),
			)
		);
		$data = $this->dispatch( 'GET' )->get_data();
		$this->assertTrue( $data['features']['ai_search']['requires_upgrade'] );
		$this->assertTrue( $data['plan']['supports_search'] );
	}

	/**
	 * POST writes only the keys present and returns the fresh shape. Both the
	 * bare-boolean and { enabled } forms are accepted.
	 */
	public function test_post_partial_update() {
		wp_set_current_user( self::$admin_id );

		$data = $this->dispatch(
			'POST',
			array(
				'features' => array(
					'writing_assistant' => false,
					'seo_enhancer'      => array( 'enabled' => true ),
					// A stale client may still send the removed excerpt key. It is ignored.
					'excerpt'           => false,
				),
			)
		)->get_data();

		$this->assertFalse( $data['features']['writing_assistant']['enabled'] );
		$this->assertTrue( $data['features']['seo_enhancer']['enabled'] );
		// Untouched keys keep their defaults.
		$this->assertTrue( $data['features']['image_editor']['enabled'] );

		// The options actually changed — this is what the load points read.
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'writing_assistant' ) );
		$this->assertTrue( Jetpack_AI_Settings::is_feature_enabled( 'seo_enhancer' ) );
	}

	/**
	 * Turning the master switch off through the endpoint flips the
	 * jetpack_ai_enabled filter every load point consults.
	 */
	public function test_post_master_switch() {
		wp_set_current_user( self::$admin_id );

		$data = $this->dispatch( 'POST', array( 'master_enabled' => false ) )->get_data();

		$this->assertFalse( $data['master_enabled'] );
		$this->assertFalse( apply_filters( 'jetpack_ai_enabled', true ) );
	}

	/**
	 * When the host has switched AI off there is nothing to configure: writes
	 * are refused.
	 */
	public function test_post_refused_when_host_disallows_ai() {
		if ( ! function_exists( 'wp_supports_ai' ) ) {
			$this->markTestSkipped( 'wp_supports_ai() is not available in this WordPress version.' );
		}

		wp_set_current_user( self::$admin_id );
		add_filter( 'wp_supports_ai', '__return_false' );

		$response = $this->dispatch( 'POST', array( 'master_enabled' => false ) );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'ai_disabled_by_host', $response->get_data()['code'] );
	}
}
