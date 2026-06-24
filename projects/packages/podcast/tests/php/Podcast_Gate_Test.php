<?php
/**
 * Tests for the Podcast_Gate product-access helper.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Podcast\Podcast_Gate;
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
		self::reset_purchases_cache();
	}

	protected function tearDown(): void {
		unset( $GLOBALS['jetpack_podcast_test_blog_details'] );
		Constants::clear_constants();
		WorDBless_Options::init()->clear_options();
		self::reset_active_plan_cache();
		self::reset_purchases_cache();
		parent::tearDown();
	}

	/**
	 * Switch the gate onto the self-hosted Jetpack path (no WordPress.com host).
	 */
	private static function as_self_hosted(): void {
		Constants::clear_single_constant( 'IS_WPCOM' );
	}

	/**
	 * Seed the cached `/upgrades` response the self-hosted path reads.
	 *
	 * @param array $slugs Product slugs to present as current purchases.
	 */
	private static function seed_purchases( array $slugs ): void {
		$purchases = array_map(
			static fn ( $slug ) => array( 'product_slug' => $slug ),
			$slugs
		);
		set_transient( Podcast_Gate::PURCHASES_TRANSIENT, $purchases );
		self::reset_purchases_cache();
	}

	/**
	 * `Current_Plan::get()` memoizes for the request, leaking option writes between tests.
	 */
	private static function reset_active_plan_cache(): void {
		$property = ( new \ReflectionClass( Current_Plan::class ) )->getProperty( 'active_plan_cache' );
		// @todo Remove once we drop PHP < 8.1 support.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}

	/**
	 * The gate memoizes purchases per request; clear it between tests.
	 */
	private static function reset_purchases_cache(): void {
		$property = ( new \ReflectionClass( Podcast_Gate::class ) )->getProperty( 'purchases_cache' );
		// @todo Remove once we drop PHP < 8.1 support.
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

	public function test_blog_registered_after_cutoff_with_plan_grants_access(): void {
		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = array( Podcast_Gate::FEATURE_SLUG );
		update_option( Current_Plan::PLAN_OPTION, $plan, true );

		$GLOBALS['jetpack_podcast_test_blog_details'][ get_current_blog_id() ] = array(
			'registered' => '2027-01-01 00:00:00',
		);

		$this->assertTrue( Podcast_Gate::has_product_access() );
	}

	public function test_blog_registered_after_cutoff_without_plan_denies_access(): void {
		$plan                       = Current_Plan::PLAN_DATA['free'];
		$plan['features']['active'] = array();
		update_option( Current_Plan::PLAN_OPTION, $plan, true );

		$GLOBALS['jetpack_podcast_test_blog_details'][ get_current_blog_id() ] = array(
			'registered' => '2027-01-01 00:00:00',
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

	public function test_self_hosted_no_purchases_denies_access(): void {
		self::as_self_hosted();
		self::seed_purchases( array() );

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
}
