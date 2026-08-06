<?php
/**
 * Unit tests for the pricing grid Eligibility class.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Stats_Admin\Pricing_Grid\Eligibility;
use ReflectionProperty;

/**
 * Unit tests for the pricing grid Eligibility class.
 */
class Eligibility_Test extends TestCase {
	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->reset_current_plan_cache();
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		delete_option( Current_Plan::PLAN_OPTION );
		delete_option( Current_Plan::SITE_PRODUCTS_OPTION );
		$this->reset_current_plan_cache();
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * Current_Plan caches the plan for the duration of a request; reset it between tests.
	 */
	private function reset_current_plan_cache() {
		$rp = new ReflectionProperty( Current_Plan::class, 'active_plan_cache' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$rp->setAccessible( true );
		}
		$rp->setValue( null, null );
	}

	/**
	 * Drop the mocked connection options so the site reads as unconnected.
	 */
	private function disconnect_site() {
		remove_filter( 'jetpack_options', array( $this, 'mock_jetpack_site_connection_options' ) );
		( new Connection_Manager() )->reset_connection_status();
	}

	/**
	 * An unconnected site without a plan should see the pricing grid.
	 */
	public function test_unconnected_site_without_plan_shows_grid() {
		$this->disconnect_site();

		$this->assertTrue( Eligibility::is_new_site() );
		$this->assertTrue( Eligibility::should_show_pricing_grid() );
	}

	/**
	 * A connected site created before the launch date is not a new site.
	 */
	public function test_connected_site_created_before_launch_does_not_show_grid() {
		set_transient( 'jetpack_assumed_site_creation_date', '2020-01-01 00:00:00' );

		$this->assertFalse( Eligibility::is_new_site() );
		$this->assertFalse( Eligibility::should_show_pricing_grid() );
	}

	/**
	 * A connected site created on/after the launch date without a plan should see the pricing grid.
	 */
	public function test_connected_site_created_after_launch_shows_grid() {
		set_transient( 'jetpack_assumed_site_creation_date', '2036-01-01 00:00:00' );

		$this->assertTrue( Eligibility::is_new_site() );
		$this->assertTrue( Eligibility::should_show_pricing_grid() );
	}

	/**
	 * A site with a Stats product should not see the pricing grid.
	 */
	public function test_site_with_stats_product_does_not_show_grid() {
		$this->disconnect_site();
		update_option(
			Current_Plan::SITE_PRODUCTS_OPTION,
			array(
				array( 'product_slug' => 'jetpack_stats_free_yearly' ),
			)
		);

		$this->assertTrue( Eligibility::has_stats_plan() );
		$this->assertFalse( Eligibility::should_show_pricing_grid() );
	}

	/**
	 * A site whose plan supports paid stats should not see the pricing grid.
	 */
	public function test_site_with_stats_paid_plan_feature_does_not_show_grid() {
		$this->disconnect_site();
		update_option(
			Current_Plan::PLAN_OPTION,
			array(
				'product_slug' => 'jetpack_complete',
				'features'     => array( 'active' => array( 'stats-paid' ) ),
			)
		);

		$this->assertTrue( Eligibility::has_stats_plan() );
		$this->assertFalse( Eligibility::should_show_pricing_grid() );
	}
}
