<?php
/**
 * Picks the handler of a report request and runs it.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;

/**
 * Normalizes the request into a `Report_Query`, picks a handler that can serve all of it, checks
 * readiness without falling back, runs it and validates the answer against the report's contract.
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
	 * @param string      $route         Report route below `analytics/reports/`, or a report id.
	 * @param array       $params        Report query params, without `execution`, `fields` and `force_refresh`.
	 * @param string|null $execution     The validated override, or null when the request names none.
	 * @param string|null $fields        Comma-separated fields the caller reads, or null for the whole report.
	 * @param bool        $force_refresh Whether to skip caches.
	 * @return array|WP_Error The handler's payload, described, or an error with a `reason`.
	 */
	public function execute( $route, array $params, $execution = null, $fields = null, $force_refresh = false ) {
		$definition = $this->registry->get_definition_for_route( $route );
		if ( null === $definition ) {
			return self::error( 'unknown_report', 404, 'no_definition', __( 'No report is defined for this route.', 'jetpack-woocommerce-stats-pkg' ) );
		}

		$query = Report_Query::from_request( $definition, $route, $params, $fields, $force_refresh );
		if ( is_wp_error( $query ) ) {
			return $query;
		}

		$choice = $this->choose( $query, $execution );
		if ( is_wp_error( $choice ) ) {
			return $this->legacy_error( $choice, $execution );
		}
		list( $provider, $handler ) = $choice;

		$payload = $handler->run( $query );
		if ( is_wp_error( $payload ) ) {
			return $payload;
		}

		$invalid = self::validate_response( $payload, $query );
		if ( is_wp_error( $invalid ) ) {
			return $invalid;
		}

		return self::describe_result( $payload, $provider, $handler, $query );
	}

	/**
	 * The handler to run: the forced provider's, or for `auto` the first that serves the whole
	 * request, the preferred provider's first. Readiness is checked after the choice, never fallen back from.
	 *
	 * @param Report_Query $query     The request.
	 * @param string|null  $execution The override.
	 * @return array|WP_Error [ provider name, handler ].
	 */
	private function choose( Report_Query $query, $execution ) {
		$handlers = $this->registry->get_handlers( $query->definition->id );

		if ( null !== $execution && 'auto' !== $execution ) {
			if ( ! isset( $handlers[ $execution ] ) ) {
				return self::error(
					'unsupported_provider',
					422,
					$execution . '_not_declared',
					/* translators: %s: provider name, local or remote. */
					sprintf( __( 'This report cannot be served by the %s provider.', 'jetpack-woocommerce-stats-pkg' ), $execution )
				);
			}

			$unsupported = self::check_support( $handlers[ $execution ], $query );

			return is_wp_error( $unsupported ) ? $unsupported : $this->ready( $query, $execution, $handlers[ $execution ] );
		}

		// A request without `execution` comes from a widget that parses only the wpcom shape, with its semantics, so the filter never moves it.
		$preferred = null === $execution ? self::DEFAULT_SOURCE : $this->get_default_source( $query->definition->id );
		uksort(
			$handlers,
			static function ( $a, $b ) use ( $preferred ) {
				return (int) ( $b === $preferred ) - (int) ( $a === $preferred );
			}
		);

		$first_error = null;
		foreach ( $handlers as $name => $handler ) {
			$unsupported = self::check_support( $handler, $query );
			if ( ! is_wp_error( $unsupported ) ) {
				return $this->ready( $query, $name, $handler );
			}
			$first_error ??= $unsupported;
		}

		return $first_error ?? self::error( 'unsupported_provider', 422, 'no_handler', __( 'No provider serves this report.', 'jetpack-woocommerce-stats-pkg' ) );
	}

	/**
	 * Whether a handler covers the request: its declared params and fields first, then its own
	 * per-request answer. No fields means every field of the contract.
	 *
	 * @param Report_Handler $handler The handler.
	 * @param Report_Query   $query   The request.
	 * @return true|WP_Error
	 */
	private static function check_support( Report_Handler $handler, Report_Query $query ) {
		$capability = $handler->get_capability();

		if ( '*' !== $capability['params'] ) {
			$unsupported = array_diff( $query->param_names(), $capability['params'] );
			if ( $unsupported ) {
				return self::error(
					'unsupported_parameter',
					422,
					'unsupported_parameter:' . implode( ',', $unsupported ),
					/* translators: %s: comma-separated query param names. */
					sprintf( __( 'No provider can apply: %s.', 'jetpack-woocommerce-stats-pkg' ), implode( ', ', $unsupported ) )
				);
			}
		}

		$wanted = $query->fields ?? ( null === $query->definition->fields ? array() : array_keys( $query->definition->fields ) );
		if ( '*' !== $capability['fields'] ) {
			$unsupported = array_values( array_diff( $wanted, $capability['fields'] ) );
			if ( $unsupported ) {
				return self::error(
					'unsupported_fields',
					422,
					'unsupported_fields:' . implode( ',', $unsupported ),
					/* translators: %s: comma-separated field names. */
					sprintf( __( 'This provider cannot produce: %s.', 'jetpack-woocommerce-stats-pkg' ), implode( ', ', $unsupported ) )
				);
			}
		}

		return $handler->supports( $query );
	}

	/**
	 * The chosen handler when its provider and it are both ready.
	 *
	 * @param Report_Query   $query   The request.
	 * @param string         $name    Provider name.
	 * @param Report_Handler $handler The handler.
	 * @return array|WP_Error [ provider name, handler ].
	 */
	private function ready( Report_Query $query, $name, Report_Handler $handler ) {
		$ready = $this->registry->get_provider( $name )->check_ready( $query );
		if ( true === $ready ) {
			$ready = $handler->check_ready( $query );
		}

		return true === $ready ? array( $name, $handler ) : $ready;
	}

	/**
	 * The provider an `auto` request prefers.
	 *
	 * @param string $report_id Report id.
	 * @return string `local` or `remote`.
	 */
	private function get_default_source( $report_id ) {
		/**
		 * Filters the provider a store report prefers when the request asks for `execution=auto`.
		 *
		 * The preferred provider is used only when its handler serves every requested field and
		 * param. A request without `execution` always goes to the default provider.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $source    `remote` (WordPress.com) or `local` (WooCommerce on this site).
		 * @param string $report_id Report id, e.g. `orders.by_date`.
		 */
		$source = apply_filters( self::SOURCE_FILTER, self::DEFAULT_SOURCE, $report_id );

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
	 * Refuse a successful answer that lacks a requested field, rather than let the caller read it as zero.
	 *
	 * @param array        $payload The handler's payload.
	 * @param Report_Query $query   The request.
	 * @return true|WP_Error
	 */
	private static function validate_response( array $payload, Report_Query $query ) {
		if ( null === $query->fields || 200 !== (int) $payload['status'] ) {
			return true;
		}

		$data    = (array) $payload['data'];
		$summary = isset( $data['summary'] ) ? (array) $data['summary'] : null;
		$missing = null === $summary ? $query->fields : array_values( array_diff( $query->fields, array_keys( $summary ) ) );
		if ( ! $missing ) {
			return true;
		}

		return self::error(
			'contract_violation',
			502,
			'missing_fields:' . implode( ',', $missing ),
			/* translators: %s: comma-separated field names. */
			sprintf( __( 'The report came back without: %s.', 'jetpack-woocommerce-stats-pkg' ), implode( ', ', $missing ) )
		);
	}

	/**
	 * Name the provider and contract in headers, and add `unsupported_fields` to the body when the
	 * handler serves only part of the contract. Other responses keep their body as it came.
	 *
	 * @param array          $payload  The handler's payload.
	 * @param string         $provider Provider name.
	 * @param Report_Handler $handler  The handler that served it.
	 * @param Report_Query   $query    The request.
	 * @return array
	 */
	private static function describe_result( array $payload, $provider, Report_Handler $handler, Report_Query $query ) {
		$definition = $query->definition;
		$capability = $handler->get_capability();
		$missing    = null === $definition->fields || '*' === $capability['fields'] ? array() : array_values( array_diff( array_keys( $definition->fields ), $capability['fields'] ) );

		if ( $missing && is_object( $payload['data'] ) ) {
			$payload['data']->unsupported_fields = $missing;
		} elseif ( $missing && is_array( $payload['data'] ) && ! wp_is_numeric_array( $payload['data'] ) ) {
			$payload['data']['unsupported_fields'] = $missing;
		}

		$payload['headers'] = array_merge(
			(array) $payload['headers'],
			array(
				'X-Jetpack-Report-Provider' => $provider,
				'X-Jetpack-Report-Contract' => $definition->id . '@' . $definition->version,
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
