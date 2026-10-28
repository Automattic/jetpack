<?php
/**
 * Tests for the Plan class.
 *
 * @package automattic/jetpack-protect-status
 */

namespace Automattic\Jetpack\Protect_Status;

use Automattic\Jetpack\Current_Plan;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use WorDBless\BaseTestCase;

/**
 * Each row runs in its own process: a stubbed WordPress.com feature function stays defined for the rest of the run.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class Plan_Test extends BaseTestCase {

	/**
	 * Sites by the features WordPress.com gates and grants (null off WordPress.com), the site's products, and whether the site has Scan.
	 *
	 * @return array[]
	 */
	public static function provide_sites() {
		return array(
			'self-hosted, plan with scan'           => array( null, array(), array(), true ),
			'WordPress.com, scan only'              => array( array( 'scan', 'scan-self-serve' ), array( 'scan' ), array(), false ),
			'WordPress.com, scan-self-serve'        => array( array( 'scan', 'scan-self-serve' ), array( 'scan', 'scan-self-serve' ), array(), true ),
			'WordPress.com, Scan product'           => array( array( 'scan', 'scan-self-serve' ), array( 'scan' ), array( 'jetpack_scan' ), true ),
			'WordPress.com, bi-yearly Scan'         => array( array( 'scan', 'scan-self-serve' ), array( 'scan' ), array( 'jetpack_scan_bi_yearly' ), true ),
			'WordPress.com, real-time Scan'         => array( array( 'scan', 'scan-self-serve' ), array( 'scan' ), array( 'jetpack_scan_realtime_monthly' ), true ),
			'WordPress.com, another product'        => array( array( 'scan', 'scan-self-serve' ), array( 'scan' ), array( 'jetpack_backup_t1_yearly' ), false ),
			'WordPress.com, no scan-self-serve yet' => array( array( 'scan' ), array( 'scan' ), array(), true ),
		);
	}

	/**
	 * @dataProvider provide_sites
	 *
	 * @param string[]|null $known    Features WordPress.com gates, or null off WordPress.com.
	 * @param string[]      $entitled Features the WordPress.com site has.
	 * @param string[]      $products The site's product slugs.
	 * @param bool          $expected Whether the site has Scan.
	 */
	#[DataProvider( 'provide_sites' )]
	public function test_has_required_plan( $known, $entitled, $products, $expected ) {
		if ( null !== $known ) {
			$GLOBALS['wpcom_test_features'] = array(
				'known'    => $known,
				'entitled' => $entitled,
			);
			require_once __DIR__ . '/stubs/wpcom-feature-functions.php';
		}
		update_option(
			'jetpack_active_plan',
			array(
				'product_slug' => 'jetpack_free',
				'features'     => array( 'active' => array( 'scan' ) ),
			)
		);
		update_option( 'jetpack_site_products', array_map( fn( $slug ) => array( 'product_slug' => $slug ), $products ) );

		$this->assertSame( $expected, Plan::has_required_plan() );
	}

	/**
	 * A plan refreshed mid-request, as My Jetpack's page render does, is read at once.
	 */
	public function test_has_required_plan_follows_a_refreshed_plan() {
		$this->assertFalse( Plan::has_required_plan() );

		Current_Plan::update_from_site_record(
			array(
				'plan' => array(
					'product_slug' => 'jetpack_free',
					'features'     => array( 'active' => array( 'scan' ) ),
				),
			)
		);

		$this->assertTrue( Plan::has_required_plan() );
	}
}
