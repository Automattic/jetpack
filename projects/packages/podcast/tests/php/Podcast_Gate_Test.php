<?php
/**
 * Tests for the Podcast_Gate product-access helper.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Podcast\Podcast_Gate;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;
use WorDBless\Options as WorDBless_Options;

/**
 * @covers \Automattic\Jetpack\Podcast\Podcast_Gate
 */
#[CoversClass( Podcast_Gate::class )]
class Podcast_Gate_Test extends BaseTestCase {

	protected function setUp(): void {
		parent::setUp();
		$GLOBALS['jetpack_podcast_test_blog_details'] = array();
		// Default these tests to the WordPress.com (feature + grandfather) path;
		// self-hosted cases clear it explicitly via `as_self_hosted()`.
		Constants::set_constant( 'IS_WPCOM', true );
		self::reset_active_plan_cache();
	}

	protected function tearDown(): void {
		unset( $GLOBALS['jetpack_podcast_test_blog_details'] );
		remove_all_filters( 'pre_http_request' );
		Constants::clear_constants();
		WorDBless_Options::init()->clear_options();
		self::reset_active_plan_cache();
		parent::tearDown();
	}

	/**
	 * Switch the gate onto the self-hosted Jetpack path (no WordPress.com host).
	 */
	private static function as_self_hosted(): void {
		Constants::clear_single_constant( 'IS_WPCOM' );
	}

	/**
	 * Self-hosted path with a connected blog, so the gate's uncached lookup
	 * actually issues the `/upgrades` request (intercepted via `pre_http_request`).
	 */
	private static function as_connected_self_hosted(): void {
		self::as_self_hosted();
		( new Tokens() )->update_blog_token( 'test.test' );
		Jetpack_Options::update_option( 'id', 123 );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
	}

	/**
	 * A 200 `/upgrades` response carrying the given purchase slugs.
	 *
	 * @param string[] $slugs Product slugs to return as current purchases.
	 * @return callable A `pre_http_request` filter.
	 */
	private static function upgrades_response( array $slugs ): callable {
		$purchases = array();
		foreach ( $slugs as $slug ) {
			$purchases[] = array( 'product_slug' => $slug );
		}
		return static function () use ( $purchases ) {
			return array(
				'body'     => wp_json_encode( $purchases, JSON_UNESCAPED_SLASHES ),
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
			);
		};
	}

	/**
	 * Seed the cached `/upgrades` response the self-hosted path reads, so it
	 * resolves the given purchases without a fetch.
	 *
	 * @param array $slugs Product slugs to present as current purchases.
	 */
	private static function seed_purchases( array $slugs ): void {
		$purchases = array();
		foreach ( $slugs as $slug ) {
			$purchases[] = array( 'product_slug' => $slug );
		}
		set_transient( Podcast_Gate::PURCHASES_TRANSIENT, $purchases );
	}

	/**
	 * `Current_Plan::get()` memoizes for the request, leaking option writes between tests.
	 */
	private static function reset_active_plan_cache(): void {
		$property = ( new \ReflectionClass( Current_Plan::class ) )->getProperty( 'active_plan_cache' );
		// @todo Remove once we drop PHP < 8.1 support. `setAccessible()` is
		// deprecated in 8.5 (a no-op since 8.1), so only call it where it's needed.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}

	public function test_plan_supports_feature_grants_access(): void {
		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = array( Podcast_Gate::FEATURE_SLUG );
		update_option( Current_Plan::PLAN_OPTION, $plan, true );

		$this->assertTrue( Podcast_Gate::has_product_access() );
	}

	public function test_no_sticker_and_unsupported_plan_denies_access(): void {
		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = array();
		update_option( Current_Plan::PLAN_OPTION, $plan, true );

		$this->assertFalse( Podcast_Gate::has_product_access() );
	}

	public function test_blog_registered_before_cutoff_on_paid_plan_grants_access(): void {
		$plan                       = Current_Plan::PLAN_DATA['personal'];
		$plan['product_slug']       = 'jetpack_personal';
		$plan['features']['active'] = array();
		update_option( Current_Plan::PLAN_OPTION, $plan, true );

		$GLOBALS['jetpack_podcast_test_blog_details'][ get_current_blog_id() ] = array(
			'registered' => '2025-01-01 00:00:00',
		);

		$this->assertTrue( Podcast_Gate::has_product_access() );
	}

	public function test_blog_registered_before_cutoff_on_free_plan_denies_access(): void {
		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = array();
		update_option( Current_Plan::PLAN_OPTION, $plan, true );

		$GLOBALS['jetpack_podcast_test_blog_details'][ get_current_blog_id() ] = array(
			'registered' => '2025-01-01 00:00:00',
		);

		$this->assertFalse( Podcast_Gate::has_product_access() );
	}

	public function test_blog_registered_on_cutoff_falls_through_to_plan(): void {
		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = array();
		update_option( Current_Plan::PLAN_OPTION, $plan, true );

		$GLOBALS['jetpack_podcast_test_blog_details'][ get_current_blog_id() ] = array(
			'registered' => Podcast_Gate::GRANDFATHER_CUTOFF_DATE . ' 00:00:00',
		);

		$this->assertFalse( Podcast_Gate::has_product_access() );
	}

	public function test_self_hosted_growth_purchase_grants_access(): void {
		self::as_self_hosted();
		self::seed_purchases( array( 'jetpack_growth_yearly' ) );

		$this->assertTrue( Podcast_Gate::has_product_access() );
	}

	public function test_self_hosted_complete_purchase_grants_access(): void {
		self::as_self_hosted();
		self::seed_purchases( array( 'jetpack_complete' ) );

		$this->assertTrue( Podcast_Gate::has_product_access() );
	}

	public function test_self_hosted_non_qualifying_purchase_denies_access(): void {
		self::as_self_hosted();
		self::seed_purchases( array( 'jetpack_security_t1_yearly' ) );

		$this->assertFalse( Podcast_Gate::has_product_access() );
	}

	/**
	 * The `podcasting` plan feature maps to all Jetpack sites on WordPress.com,
	 * so it can't gate on self-hosted: a free site can report it active. The
	 * self-hosted path must ignore the feature and require a Growth purchase.
	 */
	public function test_self_hosted_ignores_podcasting_feature_without_purchase(): void {
		self::as_self_hosted();
		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = array( Podcast_Gate::FEATURE_SLUG );
		update_option( Current_Plan::PLAN_OPTION, $plan, true );
		self::seed_purchases( array() );

		$this->assertFalse( Podcast_Gate::has_product_access() );
	}

	public function test_self_hosted_fetches_growth_over_connection_grants_access(): void {
		self::as_connected_self_hosted();
		add_filter( 'pre_http_request', self::upgrades_response( array( 'jetpack_growth_yearly' ) ) );

		$this->assertTrue( Podcast_Gate::has_product_access() );
		// A successful fetch is cached so successive gate checks skip the request.
		$this->assertSame(
			array( array( 'product_slug' => 'jetpack_growth_yearly' ) ),
			get_transient( Podcast_Gate::PURCHASES_TRANSIENT )
		);
	}

	public function test_self_hosted_fetch_http_error_denies_access(): void {
		self::as_connected_self_hosted();
		add_filter(
			'pre_http_request',
			static function () {
				return array(
					'body'     => '',
					'response' => array(
						'code'    => 500,
						'message' => 'Internal Server Error',
					),
				);
			}
		);

		$this->assertFalse( Podcast_Gate::has_product_access() );
		// Fails closed without caching, so the next request retries.
		$this->assertFalse( get_transient( Podcast_Gate::PURCHASES_TRANSIENT ) );
	}

	public function test_self_hosted_fetch_malformed_body_denies_and_does_not_cache(): void {
		self::as_connected_self_hosted();
		add_filter(
			'pre_http_request',
			static function () {
				return array(
					'body'     => 'not-json',
					'response' => array(
						'code'    => 200,
						'message' => 'OK',
					),
				);
			}
		);

		$this->assertFalse( Podcast_Gate::has_product_access() );
		$this->assertFalse( get_transient( Podcast_Gate::PURCHASES_TRANSIENT ) );
	}
}
