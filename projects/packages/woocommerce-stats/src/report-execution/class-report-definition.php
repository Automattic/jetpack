<?php
/**
 * What a store report is, independent of who serves it.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * A report's identity, routes and contract: its summary fields, the datasets it reads and the
 * semantics two handlers must share to be interchangeable.
 *
 * @since 0.3.3
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
	 * Summary fields by Premium Analytics metric type (`number`, `currency` or `average`), or null for an undescribed report.
	 *
	 * @var array<string, string>|null
	 */
	public $fields;

	/**
	 * What the report reads, such as `orders` or `sessions`.
	 *
	 * @var string[]
	 */
	public $datasets;

	/**
	 * Rules two handlers must share, such as `week_start => site`.
	 *
	 * @var array<string, string>
	 */
	public $semantics;

	/**
	 * Constructor.
	 *
	 * @param string                     $id        Report id.
	 * @param int                        $version   Contract version.
	 * @param string[]                   $routes    Route patterns.
	 * @param array<string, string>|null $fields    Summary fields by type, or null.
	 * @param string[]                   $datasets  Datasets it reads.
	 * @param array<string, string>      $semantics Shared rules.
	 */
	public function __construct( $id, $version, array $routes, $fields = null, array $datasets = array(), array $semantics = array() ) {
		$this->id        = $id;
		$this->version   = $version;
		$this->routes    = $routes;
		$this->fields    = $fields;
		$this->datasets  = $datasets;
		$this->semantics = $semantics;
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

	/**
	 * The contract's summary field names, none for an undescribed report.
	 *
	 * @return string[]
	 */
	public function get_field_names() {
		return null === $this->fields ? array() : array_keys( $this->fields );
	}

	/**
	 * The contract as the `X-Jetpack-Report-Contract` header names it.
	 *
	 * @return string `id@version`.
	 */
	public function get_contract() {
		return $this->id . '@' . $this->version;
	}
}
