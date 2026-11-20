<?php
/**
 * One report request.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * The report, route, params and fields a handler serves.
 *
 * @since 0.3.3
 */
class Report_Request {

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
	 * Summary fields the caller reads, or null when it named none and reads the whole contract.
	 *
	 * @var string[]|null
	 */
	public $fields;

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
	 * @param string[]|null     $fields        Summary fields the caller reads, or null.
	 */
	public function __construct( Report_Definition $definition, $route, array $params, $force_refresh = false, $fields = null ) {
		$this->definition    = $definition;
		$this->route         = $route;
		$this->params        = $params;
		$this->force_refresh = $force_refresh;
		$this->fields        = $fields;
	}

	/**
	 * The summary fields the request asks for: those named, or every field of the contract.
	 *
	 * @return string[]
	 */
	public function get_requested_fields() {
		return $this->fields ?? $this->definition->get_field_names();
	}
}
