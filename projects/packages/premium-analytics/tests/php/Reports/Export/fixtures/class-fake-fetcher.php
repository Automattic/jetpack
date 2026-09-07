<?php
/**
 * Test double for Report_Data_Fetcher that returns canned data instead of hitting the proxy.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

/**
 * Fake fetcher: returns a preset result (or WP_Error) so process_export_job() can be
 * exercised without network access.
 */
class Fake_Fetcher extends Report_Data_Fetcher {

	/**
	 * Canned value returned by fetch(). Set to a WP_Error to exercise the failure path.
	 *
	 * @var mixed
	 */
	public $result = array( 'data' => array( array( 'orders_no' => 5 ) ) );

	public function fetch( array $params, Csv_Report_Controller_Interface $controller ) { // phpcs:ignore Squiz.Commenting.FunctionComment.Missing -- Test double.
		return $this->result;
	}
}
