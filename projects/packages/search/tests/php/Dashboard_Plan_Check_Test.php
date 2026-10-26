<?php
/**
 * Tests for the Dashboard's plan check on Jetpack admin pages.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Search\TestCase as Search_TestCase;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Tests `Dashboard::check_plan_deactivate_search_module()`.
 *
 * @covers \Automattic\Jetpack\Search\Dashboard
 */
#[CoversClass( Dashboard::class )]
class Dashboard_Plan_Check_Test extends Search_TestCase {

	/**
	 * Plan states and whether each should deactivate Search.
	 *
	 * @return array
	 */
	public static function provide_plan_states() {
		return array(
			'plan without search'    => array( array( 'supports_search' => false ), 1 ),
			'plan with search'       => array( array( 'supports_search' => true ), 0 ),
			'lookup failed, no plan' => array( 'failed', 0 ),
			'offline, no plan'       => array( 'offline', 1 ),
		);
	}

	/**
	 * Test that only a known plan without Search deactivates the module.
	 *
	 * @dataProvider provide_plan_states
	 *
	 * @param array|string $plan_info     - Stored plan, or 'failed' / 'offline' for no plan.
	 * @param int          $deactivations - Expected `deactivate()` calls.
	 */
	#[DataProvider( 'provide_plan_states' )]
	public function test_deactivates_only_for_known_unsupported_plan( $plan_info, $deactivations ) {
		if ( 'failed' === $plan_info ) {
			set_transient( Plan::PLAN_INFO_FETCH_FAILED_TRANSIENT, true, Plan::PLAN_INFO_FETCH_FAILED_TTL );
		} elseif ( 'offline' === $plan_info ) {
			Cache::set( 'is_offline_mode', true );
		} else {
			update_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY, $plan_info );
		}
		$module_control = $this->createMock( Module_Control::class );
		$module_control->expects( $this->exactly( $deactivations ) )->method( 'deactivate' );

		require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
		// WP_Screen is final and its constructor is private.
		$screen       = ( new \ReflectionClass( \WP_Screen::class ) )->newInstanceWithoutConstructor();
		$screen->base = 'jetpack_page_jetpack-search';

		( new Dashboard( new Plan(), $this->createStub( Connection_Manager::class ), $module_control ) )
			->check_plan_deactivate_search_module( $screen );
	}

	/**
	 * Reset offline mode.
	 */
	public function tearDown(): void {
		Cache::set( 'is_offline_mode', null );
		parent::tearDown();
	}
}
