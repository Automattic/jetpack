<?php
/**
 * Picks the provider of a report request and runs it.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;

/**
 * Builds the effective request, picks a provider that can serve all of it, checks readiness without
 * falling back, runs it and validates the answer against the report's contract.
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
	 * @param array       $params    Report query params, without `execution` and `fields`.
	 * @param string|null $execution The validated override, or null when the request names none.
	 * @param string|null $fields    Comma-separated fields the caller reads, or null for the whole report.
	 * @return array|WP_Error The provider's payload with its provenance, or an error with a `reason`.
	 */
	public function execute( $route, array $params, $execution = null, $fields = null ) {
		$definition = $this->registry->get_definition( $route );
		if ( null === $definition ) {
			return self::error( 'unknown_report', 404, 'no_definition', __( 'No report is defined for this route.', 'jetpack-woocommerce-stats-pkg' ) );
		}

		$fields = self::parse_fields( $definition, $fields );
		if ( is_wp_error( $fields ) ) {
			return $fields;
		}

		$request = array(
			'report' => $definition,
			'route'  => $route,
			'params' => $params,
			'fields' => $fields,
		);

		$provider = $this->resolve_provider( $request, $execution );
		if ( is_wp_error( $provider ) ) {
			return $this->legacy_error( $provider, $execution );
		}

		$payload = $provider->run( $request );
		if ( is_wp_error( $payload ) ) {
			return $payload;
		}

		$invalid = self::validate_response( $payload, $request );
		if ( is_wp_error( $invalid ) ) {
			return $invalid;
		}

		return $this->with_provenance( $payload, $provider->get_name(), $request );
	}

	/**
	 * The requested fields, checked against the report's contract.
	 *
	 * @param array       $definition The report definition.
	 * @param string|null $fields     Comma-separated field names, or null.
	 * @return string[]|null|WP_Error The field names, null for the whole report, or a 422.
	 */
	private static function parse_fields( array $definition, $fields ) {
		if ( null === $fields ) {
			return null;
		}
		if ( null === $definition['fields'] ) {
			return self::error( 'fields_not_described', 422, 'fields_not_described:' . $definition['id'], __( 'This report has no field contract yet; request it whole.', 'jetpack-woocommerce-stats-pkg' ) );
		}

		$names   = array_values( array_unique( array_filter( array_map( 'trim', explode( ',', $fields ) ) ) ) );
		$unknown = array_diff( $names, array_keys( $definition['fields'] ) );
		if ( ! $names || $unknown ) {
			return self::error(
				'unknown_field',
				422,
				'unknown_field:' . implode( ',', $unknown ),
				/* translators: %s: comma-separated field names. */
				sprintf( __( 'This report has no such field: %s.', 'jetpack-woocommerce-stats-pkg' ), implode( ', ', $unknown ) )
			);
		}

		return $names;
	}

	/**
	 * The provider to run: the forced one, or for `auto` the first provider that can serve the
	 * whole request, the site default first. Readiness is checked after the choice, never fallen back from.
	 *
	 * @param array       $request   The effective request.
	 * @param string|null $execution The override.
	 * @return Report_Provider|WP_Error
	 */
	private function resolve_provider( array $request, $execution ) {
		$capabilities = $request['report']['capabilities'];

		if ( null !== $execution && 'auto' !== $execution ) {
			if ( ! isset( $capabilities[ $execution ] ) ) {
				return self::error(
					'unsupported_provider',
					422,
					$execution . '_not_declared',
					/* translators: %s: provider name, local or remote. */
					sprintf( __( 'This report cannot be served by the %s provider.', 'jetpack-woocommerce-stats-pkg' ), $execution )
				);
			}

			$ineligible = self::check_capability( $capabilities[ $execution ], $request );

			return is_wp_error( $ineligible ) ? $ineligible : $this->ready_provider( $request, $execution );
		}

		// A request without `execution` comes from a widget that parses only the wpcom shape, with its semantics, so the filter never moves it.
		$preferred = null === $execution ? self::DEFAULT_SOURCE : $this->get_default_source( $request['report']['id'] );
		$names     = array_keys( $capabilities );
		usort(
			$names,
			static function ( $a, $b ) use ( $preferred ) {
				return (int) ( $b === $preferred ) - (int) ( $a === $preferred );
			}
		);

		$first_error = null;
		foreach ( $names as $name ) {
			$ineligible = self::check_capability( $capabilities[ $name ], $request );
			if ( ! is_wp_error( $ineligible ) ) {
				return $this->ready_provider( $request, $name );
			}
			$first_error = $first_error ?? $ineligible;
		}

		return $first_error;
	}

	/**
	 * Whether a capability covers the request's params and fields; no fields means every field of the contract.
	 *
	 * @param array $capability The provider's capability for the report.
	 * @param array $request    The effective request.
	 * @return true|WP_Error
	 */
	private static function check_capability( array $capability, array $request ) {
		if ( '*' !== $capability['params'] ) {
			$unsupported = array_diff( array_keys( $request['params'] ), $capability['params'] );
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

		$wanted = $request['fields'] ?? ( null === $request['report']['fields'] ? array() : array_keys( $request['report']['fields'] ) );
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

		return true;
	}

	/**
	 * The named provider when its prerequisites hold.
	 *
	 * @param array  $request The effective request.
	 * @param string $name    Provider name.
	 * @return Report_Provider|WP_Error
	 */
	private function ready_provider( array $request, $name ) {
		$provider = $this->registry->get_provider( $name );
		$ready    = $provider->check_ready( $request );

		return true === $ready ? $provider : $ready;
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
		 * The preferred provider is used only when it can serve every requested field and param. A
		 * request without `execution` always goes to the default provider.
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
	 * @param array $payload The provider's payload.
	 * @param array $request The effective request.
	 * @return true|WP_Error
	 */
	private static function validate_response( array $payload, array $request ) {
		if ( null === $request['fields'] || 200 !== (int) $payload['status'] ) {
			return true;
		}

		$data    = (array) $payload['data'];
		$summary = isset( $data['summary'] ) ? (array) $data['summary'] : null;
		$missing = null === $summary ? $request['fields'] : array_values( array_diff( $request['fields'], array_keys( $summary ) ) );
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
	 * Add the provenance to the payload: a `provenance` key on an object body, and headers either way.
	 *
	 * @param array  $payload  The provider's payload.
	 * @param string $provider Provider name.
	 * @param array  $request  The effective request.
	 * @return array
	 */
	private function with_provenance( array $payload, $provider, array $request ) {
		$report     = $request['report'];
		$capability = $report['capabilities'][ $provider ];
		$provenance = array(
			'provider'           => $provider,
			'contract'           => $report['id'] . '@' . $report['version'],
			'generated_at'       => gmdate( 'c', (int) ( $payload['generated_at'] ?? time() ) ),
			'fields'             => $request['fields'],
			'unsupported_fields' => null === $report['fields'] || '*' === $capability['fields'] ? array() : array_values( array_diff( array_keys( $report['fields'] ), $capability['fields'] ) ),
			'deviations'         => (object) $capability['deviations'],
			'datasets'           => $report['datasets'],
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
				'X-Jetpack-Report-Contract'     => $provenance['contract'],
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
