<?php
/**
 * Test double for Csv_Export_Scheduler that records scheduled jobs without Action Scheduler.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

/**
 * Fake scheduler: bypasses the parent constructor (and its dependencies) and
 * returns a canned job id (or WP_Error) so the controller's email path is testable.
 */
class Fake_Scheduler extends Csv_Export_Scheduler {

	/**
	 * Recorded schedule_export() calls.
	 *
	 * @var array[]
	 */
	public $calls = array();

	/**
	 * Value to return from schedule_export(): a job id or a WP_Error.
	 *
	 * @var mixed
	 */
	public $return_value = 123;

	/**
	 * Bypass the parent constructor so no real dependencies are needed.
	 */
	public function __construct() {} // phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Intentional no-op override.

	/**
	 * Record the call and return the canned value.
	 *
	 * @param string $report_type The report type.
	 * @param array  $params      Request parameters.
	 * @param int    $user_id     User id.
	 * @param string $user_email  User email.
	 * @return mixed
	 */
	public function schedule_export( string $report_type, array $params, int $user_id, string $user_email ) {
		$this->calls[] = array(
			'report_type' => $report_type,
			'user_id'     => $user_id,
			'user_email'  => $user_email,
		);
		return $this->return_value;
	}
}
