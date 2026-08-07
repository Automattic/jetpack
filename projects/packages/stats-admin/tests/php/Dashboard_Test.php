<?php
namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Stats_Admin\TestCase as Stats_TestCase;
use ReflectionProperty;

/**
 * Unit tests for the Dashbaord class.
 *
 * @package automattic/jetpack-stats-admin
 */
class Dashboard_Test extends Stats_TestCase {
	/**
	 * Test that init sets $initialized.
	 */
	public function test_init_sets_initialized() {
		Dashboard::init();

		$rp = new ReflectionProperty( Dashboard::class, 'initialized' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$rp->setAccessible( true );
		}
		$this->assertTrue( $rp->getValue() );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		unset( $_GET['view'] );
		delete_option( Pricing_Grid\Eligibility::DISMISSED_OPTION );
		delete_option( Pricing_Grid\Eligibility::CONNECTED_AT_OPTION );
	}

	/**
	 * Test has root dom.
	 */
	public function test_render() {
		$this->expectOutputRegex( '/<div id="wpcom" class="jp-stats-dashboard".*>/i' );
		( new Dashboard() )->render();
	}

	/**
	 * Test that an eligible new site renders the pricing grid.
	 */
	public function test_render_pricing_grid_for_eligible_new_site() {
		update_option( Pricing_Grid\Eligibility::CONNECTED_AT_OPTION, strtotime( '2036-01-01' ) );
		( new Connection_Manager() )->reset_connection_status();

		$this->expectOutputRegex( '/<div id="jp-stats-pricing-grid".*>/i' );
		( new Dashboard() )->render();
	}

	/**
	 * Test that the purchase view renders Odyssey even when the pricing grid is eligible,
	 * so the paid CTA's #!/stats/purchase route can load.
	 */
	public function test_render_odyssey_for_purchase_view_on_eligible_new_site() {
		update_option( Pricing_Grid\Eligibility::CONNECTED_AT_OPTION, strtotime( '2036-01-01' ) );
		( new Connection_Manager() )->reset_connection_status();
		$_GET['view'] = 'purchase';

		$this->expectOutputRegex( '/<div id="wpcom" class="jp-stats-dashboard".*>/i' );
		( new Dashboard() )->render();
	}

	/**
	 * Test that loading the purchase view dismisses the pricing grid, so later
	 * visits (e.g. after "I will do it later") render Odyssey instead.
	 */
	public function test_purchase_view_dismisses_pricing_grid() {
		update_option( Pricing_Grid\Eligibility::CONNECTED_AT_OPTION, strtotime( '2036-01-01' ) );
		( new Connection_Manager() )->reset_connection_status();
		$dashboard = new Dashboard();

		$_GET['view'] = 'purchase';
		$dashboard->admin_init();
		unset( $_GET['view'] );

		$this->assertTrue( Pricing_Grid\Eligibility::is_dismissed() );
		$this->expectOutputRegex( '/<div id="wpcom" class="jp-stats-dashboard".*>/i' );
		$dashboard->render();
	}
}
