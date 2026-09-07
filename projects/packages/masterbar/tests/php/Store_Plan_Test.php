<?php
/**
 * Tests for the Store_Plan class.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Class Store_Plan_Test.
 *
 * @covers Automattic\Jetpack\Masterbar\Store_Plan
 */
#[CoversClass( Store_Plan::class )]
class Store_Plan_Test extends TestCase {

	/**
	 * The Commerce and Commerce-trial slugs are recognized.
	 */
	public function test_get_commerce_plan_slugs_includes_commerce_and_trial() {
		$slugs = Store_Plan::get_commerce_plan_slugs();

		$this->assertContains( 'ecommerce-bundle', $slugs );
		$this->assertContains( 'ecommerce-bundle-monthly', $slugs );
		$this->assertContains( 'ecommerce-bundle-2y', $slugs );
		$this->assertContains( 'ecommerce-bundle-3y', $slugs );
		$this->assertContains( 'ecommerce-trial-bundle-monthly', $slugs );
	}

	/**
	 * Woo Express and other business plans are excluded.
	 */
	public function test_get_commerce_plan_slugs_excludes_woo_express_and_other_plans() {
		$slugs = Store_Plan::get_commerce_plan_slugs();

		$this->assertNotContains( 'business-bundle', $slugs );
		$this->assertNotContains( 'wooexpress-small-bundle-yearly', $slugs );
		$this->assertNotContains( 'wooexpress-medium-bundle-monthly', $slugs );
	}
}
