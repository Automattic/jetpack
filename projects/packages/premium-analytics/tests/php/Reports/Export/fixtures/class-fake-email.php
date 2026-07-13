<?php
/**
 * Test double for Csv_Export_Email that bypasses the WC_Email constructor.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

/**
 * Fake email: skips the parent WC_Email/Csv_Export_Email constructor so the scheduler
 * can be built without a functioning WooCommerce email stack.
 */
class Fake_Email extends Csv_Export_Email {

	/**
	 * Recorded send_export_email() calls.
	 *
	 * @var array[]
	 */
	public $sends = array();

	/**
	 * Value send_export_email() should return.
	 *
	 * @var bool
	 */
	public $return = true;

	/**
	 * Bypass the parent constructor.
	 */
	public function __construct() {} // phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Intentional no-op override.

	public function send_export_email( string $recipient, string $report_label, array $params, string $file_path ): bool { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Test double.
		$this->sends[] = array(
			'recipient'    => $recipient,
			'report_label' => $report_label,
			'params'       => $params,
			'file_path'    => $file_path,
		);
		return $this->return;
	}
}
