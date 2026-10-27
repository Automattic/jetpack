<?php
/**
 * What a store report is, independent of who serves it.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * The report contract: identity, version, its WordPress.com routes, its fields, the datasets it
 * reads and the semantics two handlers must share to be interchangeable.
 *
 * @since $$next-version$$
 */
class Report_Definition {

	/**
	 * Report id, e.g. `orders.by_date`. Requests may name the report by it.
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
	 * Patterns over the WordPress.com route below `analytics/reports/`; none for a local-only report.
	 *
	 * @var string[]
	 */
	public $routes;

	/**
	 * Summary fields by type, or null until the contract is written down.
	 *
	 * @var array<string, string>|null
	 */
	public $fields;

	/**
	 * What the report reads, for readiness and coverage.
	 *
	 * @var string[]
	 */
	public $datasets;

	/**
	 * Rules two handlers must share, e.g. `week_start`. A handler declares where it deviates.
	 *
	 * @var array<string, string>
	 */
	public $semantics;

	/**
	 * Constructor.
	 *
	 * @param string                     $id        Report id.
	 * @param int                        $version   Contract version.
	 * @param string[]                   $routes    WordPress.com route patterns.
	 * @param array<string, string>|null $fields    Summary fields by type.
	 * @param string[]                   $datasets  Datasets it reads.
	 * @param array<string, string>      $semantics Shared rules.
	 */
	public function __construct( $id, $version, array $routes, $fields, array $datasets, array $semantics = array() ) {
		$this->id        = $id;
		$this->version   = $version;
		$this->routes    = $routes;
		$this->fields    = $fields;
		$this->datasets  = $datasets;
		$this->semantics = $semantics;
	}

	/**
	 * Whether a route below `analytics/reports/` names this report on WordPress.com.
	 *
	 * @param string $route Report route.
	 * @return bool
	 */
	public function matches_route( $route ) {
		foreach ( $this->routes as $pattern ) {
			if ( preg_match( '#^' . $pattern . '$#', $route ) ) {
				return true;
			}
		}

		return false;
	}
}
