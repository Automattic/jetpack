<?php
/**
 * Remote handler: forwards a report to WordPress.com.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use Automattic\Jetpack\WooCommerceStats\Api_Proxy_Controller;

/**
 * One handler for every report WordPress.com serves, through the proxy controller's transport.
 *
 * @since $$next-version$$
 */
class Wpcom_Forward_Handler implements Report_Handler {

	/**
	 * The controller holding the cache, the connection check and the forward.
	 *
	 * @var Api_Proxy_Controller
	 */
	private $controller;

	/**
	 * Constructor.
	 *
	 * @param Api_Proxy_Controller $controller The transport.
	 */
	public function __construct( Api_Proxy_Controller $controller ) {
		$this->controller = $controller;
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Query $query The request.
	 */
	public function run( Report_Query $query ) {
		return $this->controller->fetch_remote( $query->route, $query->params, $query->force_refresh );
	}
}
