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
 * The sticker branch is exercised through the `wpcom_has_blog_sticker` stub
 * in `bootstrap.php` — tests seed `$GLOBALS['jetpack_podcast_test_stickers']`
 * keyed by `get_current_blog_id()`. The plan-supports branch is exercised
 * through `Current_Plan::PLAN_OPTION`; with `wpcom_site_has_feature` undefined
 * in tests, `Current_Plan::supports` falls through to plan-data lookup.
 *
 * @covers \Automattic\Jetpack\Podcast\Podcast_Gate
 */
#[CoversClass( Podcast_Gate::class )]
class Podcast_Gate_Test extends BaseTestCase {

	protected function setUp(): void {
		parent::setUp();
		$GLOBALS['jetpack_podcast_test_stickers'] = array();
		self::reset_active_plan_cache();
	}

	protected function tearDown(): void {
		unset( $GLOBALS['jetpack_podcast_test_stickers'] );
		WorDBless_Options::init()->clear_options();
		self::reset_active_plan_cache();
		parent::tearDown();
	}

	/**
	 * `Current_Plan::get()` memoizes the resolved plan for the duration of the
	 * request, so option writes in one test would otherwise leak into the next.
	 */
	private static function reset_active_plan_cache(): void {
		$property = ( new \ReflectionClass( Current_Plan::class ) )->getProperty( 'active_plan_cache' );
		// @todo Remove once we drop PHP < 8.1 support.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}

	public function test_grandfather_sticker_grants_access(): void {
		$GLOBALS['jetpack_podcast_test_stickers'][ get_current_blog_id() ] = array( Podcast_Gate::GRANDFATHER_STICKER );

		$this->assertTrue( Podcast_Gate::has_product_access() );
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
}
