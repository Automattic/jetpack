<?php
/**
 * Tests for the upgrade payload exposed to the Social UI.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan;
use ReflectionProperty;
use WorDBless\BaseTestCase;

/**
 * Testing Publicize_Script_Data::get_upgrade_data().
 */
class Publicize_Script_Data_Upgrade_Test extends BaseTestCase {

	/**
	 * Reset the plan state between tests: Current_Plan caches it in a private static
	 * that outlives one test.
	 */
	public function set_up() {
		parent::set_up();

		delete_option( 'jetpack_active_plan' );
		$this->reset_plan_cache();

		// Fail loudly rather than silently returning a null plan name if a lookup
		// ever reaches the network.
		add_filter( 'pre_http_request', array( $this, 'block_http' ), 10, 3 );
	}

	/**
	 * Clear constants and plan state between tests. IS_WPCOM in particular flips
	 * `Publicize_Utils::is_wpcom()` for the rest of the run.
	 */
	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'block_http' ), 10 );
		Constants::clear_constants();
		delete_option( 'jetpack_active_plan' );
		$this->reset_plan_cache();

		parent::tear_down();
	}

	/**
	 * Short-circuit any outbound HTTP request with an error.
	 *
	 * @param mixed  $preempt Whether to preempt the request.
	 * @param array  $args    Request arguments.
	 * @param string $url     Request URL.
	 * @return \WP_Error
	 */
	public function block_http( $preempt, $args, $url ) {
		return new \WP_Error( 'no_http_in_tests', 'Unexpected HTTP request to ' . $url );
	}

	/**
	 * Empty Current_Plan's per-request cache.
	 */
	private function reset_plan_cache() {
		$cache = new ReflectionProperty( Current_Plan::class, 'active_plan_cache' );
		$cache->setAccessible( true );
		$cache->setValue( null, null );
	}

	/**
	 * Pretend the current site is a WordPress.com Simple site.
	 */
	private function make_simple_site() {
		Constants::set_constant( 'IS_WPCOM', true );
	}

	/**
	 * Give the site a plan that already includes Social's paid features.
	 */
	private function grant_enhanced_publishing() {
		update_option(
			'jetpack_active_plan',
			array(
				'product_slug' => 'business-bundle',
				'features'     => array( 'active' => array( 'social-enhanced-publishing' ) ),
			),
			true
		);
		$this->reset_plan_cache();
	}

	/**
	 * Self-hosted and WoA sites upgrade through the Jetpack redirect service, which
	 * resolves the product itself.
	 */
	public function test_no_upgrade_data_for_non_simple_sites() {
		$this->assertNull( Publicize_Script_Data::get_upgrade_data() );
	}

	/**
	 * A Simple site without the feature needs the WordPress.com plan that unlocks it.
	 */
	public function test_simple_site_without_the_feature_gets_the_business_plan() {
		$this->make_simple_site();

		$upgrade = Publicize_Script_Data::get_upgrade_data();

		$this->assertIsArray( $upgrade );
		$this->assertSame( 'business-bundle', $upgrade['plan_slug'] );
		$this->assertArrayHasKey( 'plan_name', $upgrade );
	}

	/**
	 * Nothing to upsell once the site already has the feature.
	 */
	public function test_no_upgrade_data_when_the_site_already_has_the_feature() {
		$this->make_simple_site();
		$this->grant_enhanced_publishing();

		$this->assertNull( Publicize_Script_Data::get_upgrade_data() );
	}
}
