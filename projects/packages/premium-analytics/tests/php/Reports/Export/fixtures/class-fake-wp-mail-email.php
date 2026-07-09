<?php
/**
 * Test double for Wp_Mail_Export_Email.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

/**
 * Fake wp_mail sender for the WP-Cron scheduler tests.
 */
class Fake_Wp_Mail_Email extends Wp_Mail_Export_Email {

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
