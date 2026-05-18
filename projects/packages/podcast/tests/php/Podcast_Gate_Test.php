<?php
/**
 * Tests for the Podcast_Gate product-access helper.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Tests;

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
		self::reset_active_plan_cache();
	}

	protected function tearDown(): void {
		unset( $GLOBALS['jetpack_podcast_test_blog_details'] );
		WorDBless_Options::init()->clear_options();
		self::reset_active_plan_cache();
		parent::tearDown();
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
}
