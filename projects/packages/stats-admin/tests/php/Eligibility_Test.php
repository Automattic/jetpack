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
		delete_option( Eligibility::DISMISSED_OPTION );
		delete_option( Eligibility::CONNECTED_AT_OPTION );
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
	 * A connected site without a recorded first connection (connected before
	 * this feature shipped) is not a new site.
	 */
	public function test_connected_site_without_recorded_connection_does_not_show_grid() {
		$this->assertFalse( Eligibility::is_new_site() );
		$this->assertFalse( Eligibility::should_show_pricing_grid() );
	}

	/**
	 * A site that first connected on/after the launch date without a plan should see the pricing grid.
	 */
	public function test_connected_site_connected_after_launch_shows_grid() {
		update_option( Eligibility::CONNECTED_AT_OPTION, strtotime( '2036-01-01' ) );

		$this->assertTrue( Eligibility::is_new_site() );
		$this->assertTrue( Eligibility::should_show_pricing_grid() );
	}

	/**
	 * Recording the connection time keeps the first value, so reconnecting an
	 * existing site doesn't turn it into a new one.
	 */
	public function test_record_connection_time_keeps_first_value() {
		update_option( Eligibility::CONNECTED_AT_OPTION, 12345 );
		Eligibility::record_connection_time();

		$this->assertSame( 12345, (int) get_option( Eligibility::CONNECTED_AT_OPTION ) );
	}

	/**
	 * A connected site whose pricing_grid_dismissed notice is hidden on wpcom
	 * should not see the grid, even without the local option.
	 */
	public function test_wpcom_dismissed_notice_hides_grid_on_connected_site() {
		update_option( Eligibility::CONNECTED_AT_OPTION, strtotime( '2036-01-01' ) );
		delete_transient( Notices::STATS_DASHBOARD_NOTICES_CACHE_KEY );
		add_filter( 'pre_http_request', array( $this, 'wpcom_notices_dismissed_fixture' ), 11, 3 );

		$this->assertTrue( Eligibility::is_eligible_site() );
		$this->assertTrue( Eligibility::is_dismissed() );
		$this->assertFalse( Eligibility::should_show_pricing_grid() );

		remove_filter( 'pre_http_request', array( $this, 'wpcom_notices_dismissed_fixture' ), 11 );
		delete_transient( Notices::STATS_DASHBOARD_NOTICES_CACHE_KEY );
	}

	/**
	 * Fixture marking the pricing_grid_dismissed notice as hidden on wpcom.
	 *
	 * @param array|false $response Existing response.
	 * @param array       $parsed_args Request args.
	 * @param string      $url Request URL.
	 * @return array|false
	 */
	public function wpcom_notices_dismissed_fixture( $response, $parsed_args, $url ) {
		if ( strpos( $url, '/jetpack-stats-dashboard/notices' ) !== false ) {
			return array(
				'response' => array(
					'code'    => 200,
					'message' => 'ok',
				),
				'body'     => '{"pricing_grid_dismissed":false}',
			);
		}
		return $response;
	}

	/**
	 * A dismissed pricing grid stays hidden while the site remains eligible
	 * (so the Stats menu keeps registering).
	 */
	public function test_dismissed_grid_stays_hidden_on_eligible_site() {
		$this->disconnect_site();
		Eligibility::dismiss();

		$this->assertTrue( Eligibility::is_eligible_site() );
		$this->assertFalse( Eligibility::should_show_pricing_grid() );
	}

	/**
	 * The jetpack_stats_pricing_grid_show filter can force the grid on, even
	 * when dismissed or ineligible.
	 */
	public function test_show_filter_forces_grid() {
		Eligibility::dismiss();
		add_filter( 'jetpack_stats_pricing_grid_show', '__return_true' );

		$this->assertTrue( Eligibility::should_show_pricing_grid() );

		remove_filter( 'jetpack_stats_pricing_grid_show', '__return_true' );
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
