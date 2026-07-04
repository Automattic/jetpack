<?php
/**
 * Test double for CSVExportEmail that bypasses the WC_Email constructor.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

/**
 * Fake email: skips the parent WC_Email/CSVExportEmail constructor so the scheduler
 * can be built without a functioning WooCommerce email stack.
 */
class Fake_Email extends CSVExportEmail {

	/**
	 * Bypass the parent constructor.
	 */
	public function __construct() {} // phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Intentional no-op override.
}
