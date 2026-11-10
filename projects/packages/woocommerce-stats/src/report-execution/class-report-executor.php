<?php
/**
 * Picks the handler of a report request and runs it.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;

/**
 * Resolves a route to its report and a provider's handler, then runs it, without falling back.
 *
 * @since 0.3.3
 */
class Report_Executor {

	/**
	 * Values the `provider` param accepts.
	 */
	const PROVIDERS = array( 'local', 'wpcom' );

	/**
	 * Provider of a request that names none.
	 */
	private const DEFAULT_PROVIDER = 'wpcom';

	/**
	 * Reports, handlers and providers.
	 *
	 * @var Report_Registry
	 */
	private $registry;

	/**
	 * Constructor.
	 *
	 * @param Report_Registry $registry Reports, handlers and providers.
	 */
	public function __construct( Report_Registry $registry ) {
		$this->registry = $registry;
	}

	/**
	 * Serve a report from the handler the request resolves to.
	 *
	 * @param string      $route         Route below `analytics/reports/`.
	 * @param array       $params        The report's query params, without `provider` and `force_refresh`.
	 * @param string|null $provider      The validated `provider` param, or null when the request names none.
	 * @param bool        $force_refresh Whether to skip caches.
	 * @return array|WP_Error The handler's payload, or an error: `unknown_report` (404),
	 *                        `unsupported_provider` (422), the provider's when it is not ready, or the handler's.
	 */
	public function execute( $route, array $params, $provider = null, $force_refresh = false ) {
		$definition = $this->registry->get_definition_for_route( $route );
		if ( null === $definition ) {
			return new WP_Error(
				'unknown_report',
				__( 'No report is defined for this route.', 'jetpack-woocommerce-stats-pkg' ),
				array( 'status' => 404 )
			);
		}

		$name    = $provider ?? self::DEFAULT_PROVIDER;
		$handler = $this->registry->get_handler( $definition->id, $name );
		if ( null === $handler ) {
			return new WP_Error(
				'unsupported_provider',
				/* translators: %s: provider name, such as wpcom or local. */
				sprintf( __( 'This report cannot be served by the %s provider.', 'jetpack-woocommerce-stats-pkg' ), $name ),
				array( 'status' => 422 )
			);
		}

		// A request naming no provider leaves readiness to the handler: the forward serves its cache before checking the connection.
		if ( null !== $provider ) {
			$ready = $this->registry->get_provider( $name )->check_ready();
			if ( is_wp_error( $ready ) ) {
				return $ready;
			}
		}

		return $handler->run( new Report_Request( $definition, $route, $params, $force_refresh ) );
	}
}
