<?php
/**
 * Test double for ReportDataFetcher that returns canned data instead of hitting the proxy.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

/**
 * Fake fetcher: returns a preset result (or WP_Error) so process_export_job() can be
 * exercised without network access.
 */
class Fake_Fetcher extends ReportDataFetcher {

	/**
	 * Canned value returned by fetch(). Set to a WP_Error to exercise the failure path.
	 *
	 * @var mixed
	 */
	public $result = array( 'data' => array( array( 'orders_no' => 5 ) ) );

	public function fetch( array $params, CSVReportControllerInterface $controller ) { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Test double.
		return $this->result;
	}
}
