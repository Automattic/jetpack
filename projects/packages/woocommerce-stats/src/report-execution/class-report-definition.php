<?php
/**
 * What a store report is, independent of who serves it.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * A report's identity, contract version and routes.
 *
 * @since $$next-version$$
 */
class Report_Definition {

	/**
	 * Report id, e.g. `orders.by_date`.
	 *
	 * @var string
	 */
	public $id;

	/**
	 * Contract version; 0 until the contract is written down.
	 *
	 * @var int
	 */
	public $version;

	/**
	 * Regex patterns over the route below `analytics/reports/`.
	 *
	 * @var string[]
	 */
	public $routes;

	/**
	 * Constructor.
	 *
	 * @param string   $id      Report id.
	 * @param int      $version Contract version.
	 * @param string[] $routes  Route patterns.
	 */
	public function __construct( $id, $version, array $routes ) {
		$this->id      = $id;
		$this->version = $version;
		$this->routes  = $routes;
	}

	/**
	 * Whether a route names this report, with or without a trailing slash.
	 *
	 * @param string $route Route below `analytics/reports/`.
	 * @return bool
	 */
	public function matches_route( $route ) {
		foreach ( $this->routes as $pattern ) {
			if ( preg_match( '#^' . $pattern . '/?$#D', $route ) ) {
				return true;
			}
		}

		return false;
	}
}
