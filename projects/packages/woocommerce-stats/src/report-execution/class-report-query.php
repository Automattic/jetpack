<?php
/**
 * One report request.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * The report, route and params a handler serves.
 *
 * @since $$next-version$$
 */
class Report_Query {

	/**
	 * The report.
	 *
	 * @var Report_Definition
	 */
	public $definition;

	/**
	 * The route as requested, trailing slash included.
	 *
	 * @var string
	 */
	public $route;

	/**
	 * The report's query params, as sent.
	 *
	 * @var array
	 */
	public $params;

	/**
	 * Whether to skip caches.
	 *
	 * @var bool
	 */
	public $force_refresh;

	/**
	 * Constructor.
	 *
	 * @param Report_Definition $definition    The report.
	 * @param string            $route         The route as requested.
	 * @param array             $params        The report's query params, as sent.
	 * @param bool              $force_refresh Whether to skip caches.
	 */
	public function __construct( Report_Definition $definition, $route, array $params, $force_refresh = false ) {
		$this->definition    = $definition;
		$this->route         = $route;
		$this->params        = $params;
		$this->force_refresh = $force_refresh;
	}
}
