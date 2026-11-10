<?php
/**
 * Picks the handler of a report request and runs it.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;

/**
 * Resolves a route to its report and a provider's handler, runs it without falling back, and
 * checks the answer against the report's contract.
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
	 * Response header naming the provider that served the report.
	 */
	private const PROVIDER_HEADER = 'X-Jetpack-Report-Provider';

	/**
	 * Response header naming the report's contract, as `id@version`.
	 */
	private const CONTRACT_HEADER = 'X-Jetpack-Report-Contract';

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
	 * @param string        $route         Route below `analytics/reports/`.
	 * @param array         $params        The report's query params, without the proxy's own.
	 * @param string|null   $provider      The validated `provider` param, or null when the request names none.
	 * @param bool          $force_refresh Whether to skip caches.
	 * @param string[]|null $fields        Summary fields the caller reads, or null for the whole report.
	 * @return array|WP_Error The handler's payload with the report headers, or an error: `unknown_report` (404),
	 *                        `fields_not_described`, `unknown_field`, `unsupported_provider`, `unsupported_fields`,
	 *                        `unsupported_parameter` (422), `contract_violation` (502), the provider's or the handler's.
	 */
	public function execute( $route, array $params, $provider = null, $force_refresh = false, $fields = null ) {
		$definition = $this->registry->get_definition_for_route( $route );
		if ( null === $definition ) {
			return new WP_Error(
				'unknown_report',
				__( 'No report is defined for this route.', 'jetpack-woocommerce-stats-pkg' ),
				array( 'status' => 404 )
			);
		}

		$invalid = null === $fields ? true : self::check_fields( $definition, $fields );
		if ( is_wp_error( $invalid ) ) {
			return $invalid;
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

		$request = new Report_Request( $definition, $route, $params, $force_refresh, $fields );

		// A request naming no provider leaves readiness to the handler: the forward serves its cache before checking the connection.
		if ( null !== $provider ) {
			$covered = self::check_capability( $handler, $request );
			if ( is_wp_error( $covered ) ) {
				return $covered;
			}

			$ready = $this->registry->get_provider( $name )->check_ready();
			if ( is_wp_error( $ready ) ) {
				return $ready;
			}
		}

		$payload = $handler->run( $request );
		if ( is_wp_error( $payload ) || ! self::is_success( $payload ) ) {
			return $payload;
		}

		$missing = self::get_missing_fields( $payload, $request );
		if ( $missing ) {
			return new WP_Error(
				'contract_violation',
				/* translators: %s: comma-separated field names. */
				sprintf( __( 'The report came back without: %s.', 'jetpack-woocommerce-stats-pkg' ), implode( ', ', $missing ) ),
				array( 'status' => 502 )
			);
		}

		return self::describe( $payload, $name, $handler, $definition );
	}

	/**
	 * Refuse named fields the report's contract doesn't list.
	 *
	 * @param Report_Definition $definition The report.
	 * @param string[]          $fields     Field names the caller named.
	 * @return true|WP_Error A 422 when the report is undescribed, or a name is unknown or missing.
	 */
	private static function check_fields( Report_Definition $definition, array $fields ) {
		if ( null === $definition->fields ) {
			return new WP_Error(
				'fields_not_described',
				__( 'This report has no field contract yet, so it can only be requested whole.', 'jetpack-woocommerce-stats-pkg' ),
				array( 'status' => 422 )
			);
		}

		if ( ! $fields ) {
			return new WP_Error(
				'unknown_field',
				__( 'Name at least one field of the report.', 'jetpack-woocommerce-stats-pkg' ),
				array( 'status' => 422 )
			);
		}

		$unknown = array_values( array_diff( $fields, $definition->get_field_names() ) );
		if ( $unknown ) {
			return new WP_Error(
				'unknown_field',
				/* translators: %s: comma-separated field names. */
				sprintf( __( 'This report has no such field: %s.', 'jetpack-woocommerce-stats-pkg' ), implode( ', ', $unknown ) ),
				array( 'status' => 422 )
			);
		}

		return true;
	}

	/**
	 * Whether a handler covers the request's params and fields, by what it declares.
	 *
	 * @param Report_Handler $handler The handler.
	 * @param Report_Request $request The request.
	 * @return true|WP_Error A 422 `unsupported_parameter` or `unsupported_fields`.
	 */
	private static function check_capability( Report_Handler $handler, Report_Request $request ) {
		$capability = self::get_capability( $handler );

		$unsupported = self::uncovered( array_keys( $request->params ), $capability['params'] );
		if ( $unsupported ) {
			return new WP_Error(
				'unsupported_parameter',
				/* translators: %s: comma-separated query param names. */
				sprintf( __( 'This provider cannot apply: %s.', 'jetpack-woocommerce-stats-pkg' ), implode( ', ', $unsupported ) ),
				array( 'status' => 422 )
			);
		}

		$unsupported = self::uncovered( $request->get_requested_fields(), $capability['fields'] );
		if ( $unsupported ) {
			return new WP_Error(
				'unsupported_fields',
				/* translators: %s: comma-separated field names. */
				sprintf( __( 'This provider cannot produce: %s.', 'jetpack-woocommerce-stats-pkg' ), implode( ', ', $unsupported ) ),
				array( 'status' => 422 )
			);
		}

		return true;
	}

	/**
	 * Requested fields a successful answer lacks from its `summary`; checked only when the caller named fields.
	 *
	 * @param array          $payload The handler's payload.
	 * @param Report_Request $request The request.
	 * @return string[]
	 */
	private static function get_missing_fields( array $payload, Report_Request $request ) {
		if ( null === $request->fields ) {
			return array();
		}

		$summary = ( (array) $payload['data'] )['summary'] ?? null;
		$present = is_object( $summary ) || is_array( $summary ) ? array_keys( (array) $summary ) : array();

		return array_values( array_diff( $request->fields, $present ) );
	}

	/**
	 * Name the provider and contract in headers, and list the contract fields the handler doesn't
	 * serve at the top of the body. The body is otherwise left as it came.
	 *
	 * @param array             $payload    The handler's payload.
	 * @param string            $provider   Provider name.
	 * @param Report_Handler    $handler    The handler that served it.
	 * @param Report_Definition $definition The report.
	 * @return array
	 */
	private static function describe( array $payload, $provider, Report_Handler $handler, Report_Definition $definition ) {
		$unsupported = self::uncovered( $definition->get_field_names(), self::get_capability( $handler )['fields'] );
		if ( $unsupported && is_object( $payload['data'] ) ) {
			$payload['data']                     = clone $payload['data'];
			$payload['data']->unsupported_fields = $unsupported;
		} elseif ( $unsupported && is_array( $payload['data'] ) && ! wp_is_numeric_array( $payload['data'] ) ) {
			$payload['data']['unsupported_fields'] = $unsupported;
		}

		$payload['headers'] = array_merge(
			(array) $payload['headers'],
			array(
				self::PROVIDER_HEADER => $provider,
				self::CONTRACT_HEADER => $definition->get_contract(),
			)
		);

		return $payload;
	}

	/**
	 * What a handler serves: everything unless it declares less.
	 *
	 * @param Report_Handler $handler The handler.
	 * @return array{fields: string[]|string, params: string[]|string}
	 */
	private static function get_capability( Report_Handler $handler ) {
		if ( $handler instanceof Report_Capability ) {
			return $handler->get_capability();
		}

		return array(
			'fields' => '*',
			'params' => '*',
		);
	}

	/**
	 * Names a capability list leaves out; none when it is `*`.
	 *
	 * @param string[]        $names    Names asked for.
	 * @param string[]|string $declared A capability list, or `*`.
	 * @return string[]
	 */
	private static function uncovered( array $names, $declared ) {
		return '*' === $declared ? array() : array_values( array_diff( $names, (array) $declared ) );
	}

	/**
	 * Whether a payload is a successful answer.
	 *
	 * @param array $payload The handler's payload.
	 * @return bool
	 */
	private static function is_success( array $payload ) {
		$status = (int) $payload['status'];

		return $status >= 200 && $status < 300;
	}
}
