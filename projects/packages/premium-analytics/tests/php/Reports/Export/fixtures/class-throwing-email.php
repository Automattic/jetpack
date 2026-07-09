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

	/**
	 * Throw instead of sending the export email.
	 *
	 * @param string $recipient    Recipient email address.
	 * @param string $report_label Report label.
	 * @param array  $params       Report parameters.
	 * @param string $file_path    CSV file path.
	 * @return never
	 * @throws \Throwable Always throws the configured throwable.
	 */
	public function send_export_email( string $recipient, string $report_label, array $params, string $file_path ): bool {
		throw $this->throwable;
	}
}
