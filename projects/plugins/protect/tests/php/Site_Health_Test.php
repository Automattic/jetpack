<?php
/**
 * Tests for the Jetpack Protect Site Health check.
 *
 * @package automattic/jetpack-protect-plugin
 */

use Automattic\Jetpack\Protect\Site_Health;
use Automattic\Jetpack\Protect_Models\Status_Model;
use Automattic\Jetpack\Protect_Models\Threat_Model;
use Automattic\Jetpack\Protect_Status\Status;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Protect\Site_Health
 */
#[CoversClass( Site_Health::class )]
class Site_Health_Test extends BaseTestCase {

	/**
	 * Forget the status set by a test.
	 */
	public function tear_down() {
		Status::$status = null;
		parent::tear_down();
	}

	/**
	 * The status fetch's error code, whether the last scan failed, how many threats are open, and the check's expected status.
	 *
	 * @return array[]
	 */
	public static function provide_status_cases() {
		return array(
			'completed scan, no threats' => array( null, false, 0, 'good' ),
			'failed scan, no threats'    => array( null, true, 0, 'recommended' ),
			'failed scan, threats'       => array( null, true, 1, 'critical' ),
			'failed fetch, no threats'   => array( 'failed_fetching_status', false, 0, 'recommended' ),
			'site not connected'         => array( 'site_not_connected', false, 0, 'good' ),
		);
	}

	/**
	 * @dataProvider provide_status_cases
	 *
	 * @param string|null $error_code The status fetch's error code, or null when it succeeded.
	 * @param bool        $failed     Whether the last scan failed.
	 * @param int         $threats    How many threats are open.
	 * @param string      $expected   The check's expected status.
	 */
	#[DataProvider( 'provide_status_cases' )]
	public function test_check_status_follows_scan_and_fetch_failures( $error_code, $failed, $threats, $expected ) {
		Status::$status = new Status_Model(
			array(
				'last_checked'     => '2026-11-01 00:00:00',
				'error'            => null !== $error_code,
				'error_code'       => $error_code,
				'last_scan_failed' => $failed,
				'threats'          => array_fill( 0, $threats, new Threat_Model( array( 'title' => 'A threat' ) ) ),
			)
		);

		$this->assertSame( $expected, Site_Health::do_checks()['status'] );
	}
}
