<?php
/**
 * Tests for the Plan class.
 *
 * @package automattic/jetpack-protect-status
 */

namespace Automattic\Jetpack\Protect_Status;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

/**
 * Each row runs in its own process: has_required_plan() caches its answer in a static.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Plan_Test extends BaseTestCase {

	/**
	 * Sites by the features WordPress.com gates and grants (null off WordPress.com), the plan's own features, and whether Scan's UI applies.
	 *
	 * @return array[]
	 */
	public static function provide_sites() {
		return array(
			'self-hosted, plan with scan'      => array( null, array( 'scan' ), true ),
			'WordPress.com, managed scan only' => array( array( 'scan' ), array( 'scan' ), false ),
			'WordPress.com, self-serve scan'   => array( array( 'scan', 'scan-self-serve' ), array( 'scan' ), true ),
		);
	}

	/**
	 * @dataProvider provide_sites
	 *
	 * @param string[]|null $entitled      Features the WordPress.com site has, or null off WordPress.com.
	 * @param string[]      $plan_features The plan's active features, as synced from WordPress.com.
	 * @param bool          $expected      Whether the site has the plan Scan's UI needs.
	 */
	#[DataProvider( 'provide_sites' )]
	public function test_has_required_plan_needs_self_serve_scan_on_wordpress_com( $entitled, $plan_features, $expected ) {
		if ( null !== $entitled ) {
			$GLOBALS['wpcom_test_features'] = array(
				'known'    => array( 'scan', 'scan-self-serve' ),
				'entitled' => $entitled,
			);
			require_once __DIR__ . '/stubs/wpcom-feature-functions.php';
		}
		update_option(
			'jetpack_active_plan',
			array(
				'product_slug' => 'jetpack_free',
				'features'     => array( 'active' => $plan_features ),
			)
		);

		$this->assertSame( $expected, Plan::has_required_plan() );
	}
}
