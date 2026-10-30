<?php
/**
 * Report definitions and their handlers, registered by the code that owns them.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

/**
 * Definitions by report id, handlers by (report id, provider), and the providers themselves.
 *
 * @since $$next-version$$
 */
class Report_Registry {

	/**
	 * Action that fills a new registry.
	 */
	const REGISTER_ACTION = 'jetpack_analytics_register_reports';

	/**
	 * Report id under which a handler serves every report.
	 */
	const ANY_REPORT = '*';

	/**
	 * Providers, by name.
	 *
	 * @var array<string, Report_Provider>
	 */
	private $providers = array();

	/**
	 * Definitions, by report id.
	 *
	 * @var array<string, Report_Definition>
	 */
	private $definitions = array();

	/**
	 * Handlers, by report id and then provider name.
	 *
	 * @var array<string, array<string, Report_Handler>>
	 */
	private $handlers = array();

	/**
	 * A registry filled by every registrant.
	 *
	 * @return Report_Registry
	 */
	public static function create() {
		$registry = new self();

		/**
		 * Fires to register store reports, their handlers and providers.
		 *
		 * @since $$next-version$$
		 *
		 * @param Report_Registry $registry The registry to fill.
		 */
		do_action( self::REGISTER_ACTION, $registry );

		return $registry;
	}

	/**
	 * Register a provider. The first one registered under a name wins.
	 *
	 * @param Report_Provider $provider The provider.
	 * @return void
	 */
	public function register_provider( Report_Provider $provider ) {
		$this->providers[ $provider->get_name() ] ??= $provider;
	}

	/**
	 * Register a report. The first one registered under an id wins.
	 *
	 * @param Report_Definition $definition The report.
	 * @return void
	 */
	public function register_report( Report_Definition $definition ) {
		$this->definitions[ $definition->id ] ??= $definition;
	}

	/**
	 * Register a handler for a report, or for every report with `ANY_REPORT`. The last one
	 * registered for a pair wins, and a report's own handler beats the `ANY_REPORT` one.
	 *
	 * @param string         $report_id Report id, or `ANY_REPORT`.
	 * @param string         $provider  Provider name.
	 * @param Report_Handler $handler   The handler.
	 * @return void
	 */
	public function register_handler( $report_id, $provider, Report_Handler $handler ) {
		$this->handlers[ $report_id ][ $provider ] = $handler;
	}

	/**
	 * The report a route names.
	 *
	 * @param string $route Route below `analytics/reports/`.
	 * @return Report_Definition|null
	 */
	public function get_definition_for_route( $route ) {
		foreach ( $this->definitions as $definition ) {
			if ( $definition->matches_route( $route ) ) {
				return $definition;
			}
		}

		return null;
	}

	/**
	 * The handler of a report under a registered provider.
	 *
	 * @param string $report_id Report id.
	 * @param string $provider  Provider name.
	 * @return Report_Handler|null
	 */
	public function get_handler( $report_id, $provider ) {
		if ( ! isset( $this->providers[ $provider ] ) ) {
			return null;
		}

		return $this->handlers[ $report_id ][ $provider ] ?? $this->handlers[ self::ANY_REPORT ][ $provider ] ?? null;
	}

	/**
	 * A provider by name.
	 *
	 * @param string $name Provider name.
	 * @return Report_Provider|null
	 */
	public function get_provider( $name ) {
		return $this->providers[ $name ] ?? null;
	}
}
