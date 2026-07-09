<?php
/**
 * Test double for Csv_Export_Email that throws while sending.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

/**
 * Throwing email fake for scheduler failure-path tests.
 */
class Throwing_Email extends Fake_Email {

	/**
	 * Throwable to raise from send_export_email().
	 *
	 * @var \Throwable
	 */
	private $throwable;

	/**
	 * Constructor.
	 *
	 * @param \Throwable $throwable Throwable to raise from send_export_email().
	 */
	public function __construct( \Throwable $throwable ) {
		$this->throwable = $throwable;
	}

	public function send_export_email( string $recipient, string $report_label, array $params, string $file_path ): bool { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing, Squiz.Commenting.FunctionComment.InvalidNoReturn -- Test double always throws.
		throw $this->throwable;
	}
}
