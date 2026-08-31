<?php

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Search\TestCase as Search_TestCase;

/**
 * Unit tests for the Dashboard class.
 *
 * @package automattic/jetpack-search
 */
class Dashboard_Test extends Search_TestCase {

	/**
	 * Build a Dashboard wired to stubs/mocks, plus the (object) $current_screen
	 * check_plan_deactivate_search_module() expects.
	 *
	 * @param  boolean|array $plan_info         Value Plan::get_plan_info() should return.
	 * @param  boolean       $supports          Value Plan::supports_search() should return.
	 * @param  boolean       $must_upgrade      Value Plan::must_upgrade() should return.
	 * @param  string        $screen_base       $current_screen->base value.
	 * @param  boolean       $expect_deactivate Whether Module_Control::deactivate() should be called.
	 * @return array{0: Dashboard, 1: object}
	 */
	private function build( $plan_info, $supports, $must_upgrade, $screen_base, $expect_deactivate ) {
		$plan = $this->createStub( Plan::class );
		$plan->method( 'get_plan_info' )->willReturn( $plan_info );
		$plan->method( 'supports_search' )->willReturn( $supports );
		$plan->method( 'must_upgrade' )->willReturn( $must_upgrade );

		$module_control = $this->createMock( Module_Control::class );
		if ( $expect_deactivate ) {
			$module_control->expects( $this->once() )->method( 'deactivate' );
		} else {
			$module_control->expects( $this->never() )->method( 'deactivate' );
		}

		$dashboard = new Dashboard( $plan, $this->createStub( Connection_Manager::class ), $module_control );
		$screen    = (object) array( 'base' => $screen_base );

		return array( $dashboard, $screen );
	}

	/**
	 * A confirmed unsupported plan deactivates the module.
	 */
	public function test_deactivates_when_plan_confirms_unsupported() {
		list( $dashboard, $screen ) = $this->build( array( 'supports_search' => false ), false, false, 'jetpack_page_search', true );
		$dashboard->check_plan_deactivate_search_module( $screen );
	}

	/**
	 * A confirmed must-upgrade plan deactivates the module.
	 */
	public function test_deactivates_when_must_upgrade() {
		list( $dashboard, $screen ) = $this->build( array( 'supports_search' => true ), true, true, 'jetpack_page_search', true );
		$dashboard->check_plan_deactivate_search_module( $screen );
	}

	/**
	 * A supported, non-upgrade plan leaves the module alone.
	 */
	public function test_does_not_deactivate_when_plan_supported() {
		list( $dashboard, $screen ) = $this->build( array( 'supports_search' => true ), true, false, 'jetpack_page_search', false );
		$dashboard->check_plan_deactivate_search_module( $screen );
	}

	/**
	 * No cached plan answer (empty option, live fetch failed or backed off) must
	 * not be treated as "unsupported" — a temporary WPCOM failure shouldn't
	 * deactivate an active Search module.
	 */
	public function test_does_not_deactivate_when_plan_info_unknown() {
		list( $dashboard, $screen ) = $this->build( false, false, false, 'jetpack_page_search', false );
		$dashboard->check_plan_deactivate_search_module( $screen );
	}

	/**
	 * Only runs on Jetpack admin pages.
	 */
	public function test_does_not_run_on_non_jetpack_page() {
		list( $dashboard, $screen ) = $this->build( array( 'supports_search' => false ), false, false, 'edit-post', false );
		$dashboard->check_plan_deactivate_search_module( $screen );
	}
}
