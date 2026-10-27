<?php
/**
 * Picks the provider of a report request and runs it.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;

/**
 * Resolves `execution=auto|local|remote` against the report's definition and the providers' readiness.
 *
 * @since $$next-version$$
 */
class Report_Executor {

	/**
	 * Values the `execution` param accepts.
	 */
	const EXECUTION_VALUES = array( 'auto', 'local', 'remote' );

	/**
	 * Filter for the site-wide provider an `auto` request prefers.
	 */
	const SOURCE_FILTER = 'jetpack_analytics_dataset_source';

	/**
	 * Provider an `auto` request prefers unless the filter says otherwise.
	 */
	const DEFAULT_SOURCE = 'remote';

	/**
	 * The report definitions and their providers.
	 *
	 * @var Report_Registry
	 */
	private $registry;

	/**
	 * Constructor.
	 *
	 * @param Report_Registry $registry The report definitions.
	 */
	public function __construct( Report_Registry $registry ) {
		$this->registry = $registry;
	}

	/**
	 * Serve a report from the provider the request resolves to.
	 *
	 * @param string      $route     Report route below `analytics/reports/`.
	 * @param array       $params    Report query params, without `execution`.
	 * @param string|null $execution The validated override, or null when the request names none.
	 * @return array|WP_Error The provider's payload with its provenance, or an error with a `reason`.
	 */
	public function execute( $route, array $params, $execution = null ) {
		$definition = $this->registry->get_definition( $route );
		if ( null === $definition ) {
			return self::error( 'unknown_report', 404, 'no_definition', __( 'No report is defined for this route.', 'jetpack-woocommerce-stats-pkg' ) );
		}

		$provider = $this->resolve_provider( $definition, $execution );
		if ( is_wp_error( $provider ) ) {
			return $this->legacy_error( $provider, $execution );
		}

		$payload = $provider->run( $route, $params );
		if ( is_wp_error( $payload ) ) {
			return $payload;
		}

		return $this->with_provenance( $payload, $provider->get_name() );
	}

	/**
	 * The provider to run: the forced one, or for `auto` the site default when the report declares
	 * it and the declared one otherwise. Readiness is checked, never fallen back from.
	 *
	 * @param array       $definition The report definition.
	 * @param string|null $execution  The override.
	 * @return Report_Provider|WP_Error
	 */
	private function resolve_provider( array $definition, $execution ) {
		if ( null !== $execution && 'auto' !== $execution ) {
			if ( ! in_array( $execution, $definition['providers'], true ) ) {
				return self::error(
					'unsupported_provider',
					422,
					$execution . '_not_declared',
					/* translators: %s: provider name, local or remote. */
					sprintf( __( 'This report cannot be served by the %s provider.', 'jetpack-woocommerce-stats-pkg' ), $execution )
				);
			}

			return $this->ready_provider( $definition['route'], $execution );
		}

		// A request without `execution` comes from a widget that parses only the wpcom shape in full, so the filter never moves it.
		$preferred = null === $execution ? self::DEFAULT_SOURCE : $this->get_default_source( $definition['route'] );
		$name      = in_array( $preferred, $definition['providers'], true ) ? $preferred : $definition['providers'][0];

		return $this->ready_provider( $definition['route'], $name );
	}

	/**
	 * The named provider when its prerequisites hold.
	 *
	 * @param string $route Report route.
	 * @param string $name  Provider name.
	 * @return Report_Provider|WP_Error
	 */
	private function ready_provider( $route, $name ) {
		$provider = $this->registry->get_provider( $name );
		$ready    = $provider->check_ready( $route );

		return true === $ready ? $provider : $ready;
	}

	/**
	 * The provider an `auto` request prefers.
	 *
	 * @param string $route Report route.
	 * @return string `local` or `remote`.
	 */
	private function get_default_source( $route ) {
		/**
		 * Filters the provider a store report prefers when the request asks for `execution=auto`.
		 *
		 * A request without `execution` always goes to the default provider: its widget parses only the wpcom shape in full.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $source `remote` (WordPress.com) or `local` (WooCommerce on this site).
		 * @param string $route  Report route below `analytics/reports/`, e.g. `orders/by-date`.
		 */
		$source = apply_filters( self::SOURCE_FILTER, self::DEFAULT_SOURCE, $route );

		return in_array( $source, array( 'local', 'remote' ), true ) ? $source : self::DEFAULT_SOURCE;
	}

	/**
	 * A request that names no override keeps the proxy's old `no_connection` 403: the dashboard
	 * retries a 5xx three times and its error copy keys off that code.
	 *
	 * @param WP_Error    $error     The resolution error.
	 * @param string|null $execution The override.
	 * @return WP_Error
	 */
	private function legacy_error( WP_Error $error, $execution ) {
		if ( null !== $execution || 'needs_connection' !== $error->get_error_code() ) {
			return $error;
		}

		return self::error( 'no_connection', 403, 'needs_connection', __( 'This site is not connected to WordPress.com.', 'jetpack-woocommerce-stats-pkg' ) );
	}

	/**
	 * Add the provenance to the payload: a `provenance` key on an object body, and headers either way.
	 *
	 * @param array  $payload  The provider's payload.
	 * @param string $provider Provider name.
	 * @return array
	 */
	private function with_provenance( array $payload, $provider ) {
		$provenance = array(
			'provider'           => $provider,
			'generated_at'       => gmdate( 'c', (int) ( $payload['generated_at'] ?? time() ) ),
			'unsupported_fields' => $payload['unsupported_fields'] ?? array(),
		);

		if ( is_object( $payload['data'] ) ) {
			$payload['data']->provenance = $provenance;
		} elseif ( is_array( $payload['data'] ) && ! wp_is_numeric_array( $payload['data'] ) ) {
			$payload['data']['provenance'] = $provenance;
		}

		$payload['headers'] = array_merge(
			(array) $payload['headers'],
			array(
				'X-Jetpack-Report-Provider'     => $provenance['provider'],
				'X-Jetpack-Report-Generated-At' => $provenance['generated_at'],
			)
		);

		return $payload;
	}

	/**
	 * An execution error.
	 *
	 * @param string $code    Error code.
	 * @param int    $status  HTTP status.
	 * @param string $reason  Machine-readable reason.
	 * @param string $message Message.
	 * @return WP_Error
	 */
	public static function error( $code, $status, $reason, $message ) {
		return new WP_Error(
			$code,
			$message,
			array(
				'status' => $status,
				'reason' => $reason,
			)
		);
	}
}
