<?php
/**
 * The `wpcom` handler: forwards a report to WordPress.com.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use Automattic\Jetpack\WooCommerceStats\Api_Proxy_Controller;

/**
 * One handler for every report WordPress.com serves, through the proxy controller's transport.
 *
 * @since 0.3.3
 */
class Wpcom_Forward_Handler implements Report_Handler, Report_Deviations {

	/**
	 * The controller holding the cache, the connection check and the forward.
	 *
	 * @var Api_Proxy_Controller
	 */
	private $controller;

	/**
	 * Deviations from each report's semantics, by report id.
	 *
	 * @var array<string, array<string, string>>
	 */
	private $deviations;

	/**
	 * Constructor.
	 *
	 * @param Api_Proxy_Controller                 $controller The transport.
	 * @param array<string, array<string, string>> $deviations Deviations by report id.
	 */
	public function __construct( Api_Proxy_Controller $controller, array $deviations = array() ) {
		$this->controller = $controller;
		$this->deviations = $deviations;
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Definition $definition The report.
	 */
	public function get_deviations( Report_Definition $definition ) {
		return $this->deviations[ $definition->id ] ?? array();
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Request $request The request.
	 */
	public function run( Report_Request $request ) {
		return $this->controller->fetch_remote( $request->route, $request->params, $request->force_refresh );
	}
}
