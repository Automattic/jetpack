<?php
/**
 * One report request, normalized once by the executor.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;

/**
 * The normalized range, interval, date type and fields of a request; handlers read these rather than raw params.
 *
 * @since $$next-version$$
 */
class Report_Query {

	/**
	 * Intervals a report can bucket by.
	 */
	const INTERVALS = array( 'hour', 'day', 'week', 'month', 'quarter', 'year' );

	/**
	 * Date types a report can filter orders by.
	 */
	const DATE_TYPES = array( 'created', 'paid', 'completed' );

	/**
	 * The report.
	 *
	 * @var Report_Definition
	 */
	public $definition;

	/**
	 * The route as requested: a WordPress.com route, or the report id.
	 *
	 * @var string
	 */
	public $route;

	/**
	 * Range start as store wall time, `Y-m-d\TH:i:s`, or null.
	 *
	 * @var string|null
	 */
	public $from;

	/**
	 * Range end as store wall time, `Y-m-d\TH:i:s`, or null.
	 *
	 * @var string|null
	 */
	public $to;

	/**
	 * One of `INTERVALS`, or null.
	 *
	 * @var string|null
	 */
	public $interval;

	/**
	 * One of `DATE_TYPES`, or null for the store's setting.
	 *
	 * @var string|null
	 */
	public $date_type;

	/**
	 * Fields the caller reads, or null for the whole report.
	 *
	 * @var string[]|null
	 */
	public $fields;

	/**
	 * The params not normalized above, as sent.
	 *
	 * @var array
	 */
	public $params;

	/**
	 * Every param as sent, for a handler that forwards them.
	 *
	 * @var array
	 */
	public $raw_params;

	/**
	 * Whether to skip caches.
	 *
	 * @var bool
	 */
	public $force_refresh;

	/**
	 * Normalize a request against its report.
	 *
	 * @param Report_Definition $definition    The report.
	 * @param string            $route         The route as requested.
	 * @param array             $params        Query params, without `execution`, `fields` and `force_refresh`.
	 * @param string|null       $fields        Comma-separated field names, or null.
	 * @param bool              $force_refresh Whether to skip caches.
	 * @return Report_Query|WP_Error A 422 for an unknown field or a value that does not normalize.
	 */
	public static function from_request( Report_Definition $definition, $route, array $params, $fields = null, $force_refresh = false ) {
		$query                = new self();
		$query->definition    = $definition;
		$query->route         = $route;
		$query->raw_params    = $params;
		$query->force_refresh = (bool) $force_refresh;

		$parsed = self::parse_fields( $definition, $fields );
		if ( is_wp_error( $parsed ) ) {
			return $parsed;
		}
		$query->fields = $parsed;

		$normalizers = array(
			'from'      => fn( $value ) => self::to_wall_time( $value, 'T00:00:00' ),
			'to'        => fn( $value ) => self::to_wall_time( $value, 'T23:59:59' ),
			'interval'  => fn( $value ) => in_array( $value, self::INTERVALS, true ) ? $value : null,
			'date_type' => fn( $value ) => in_array( $value, self::DATE_TYPES, true ) ? $value : null,
		);
		foreach ( $normalizers as $name => $normalize ) {
			if ( ! isset( $params[ $name ] ) ) {
				continue;
			}
			$query->$name = is_string( $params[ $name ] ) ? $normalize( $params[ $name ] ) : null;
			if ( null === $query->$name ) {
				return self::invalid_parameter( $name );
			}
			unset( $params[ $name ] );
		}
		$query->params = $params;

		return $query;
	}

	/**
	 * Names of every param the request sent.
	 *
	 * @return string[]
	 */
	public function param_names() {
		return array_keys( $this->raw_params );
	}

	/**
	 * The error for a param value no handler could apply.
	 *
	 * @param string $name Param name.
	 * @return WP_Error
	 */
	public static function invalid_parameter( $name ) {
		return Report_Executor::error(
			'invalid_parameter',
			422,
			'invalid_parameter:' . $name,
			/* translators: %s: query param name. */
			sprintf( __( 'The report cannot apply this value of %s.', 'jetpack-woocommerce-stats-pkg' ), $name )
		);
	}

	/**
	 * The requested fields, checked against the report's contract.
	 *
	 * @param Report_Definition $definition The report.
	 * @param string|null       $fields     Comma-separated field names, or null.
	 * @return string[]|null|WP_Error The field names, null for the whole report, or a 422.
	 */
	private static function parse_fields( Report_Definition $definition, $fields ) {
		if ( null === $fields ) {
			return null;
		}
		if ( null === $definition->fields ) {
			return Report_Executor::error( 'fields_not_described', 422, 'fields_not_described:' . $definition->id, __( 'This report has no field contract yet; request it whole.', 'jetpack-woocommerce-stats-pkg' ) );
		}

		$names   = array_values( array_unique( array_filter( array_map( 'trim', explode( ',', $fields ) ) ) ) );
		$unknown = array_diff( $names, array_keys( $definition->fields ) );
		if ( ! $names || $unknown ) {
			return Report_Executor::error(
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
	 * A report date as a wall-time bound: a bare date gets the start or end of its day, and the
	 * dashboard's milliseconds and offset are dropped, since stores read bounds in their own zone.
	 *
	 * @param string $date   `Y-m-d`, `Y-m-d H:i:s`, or ISO 8601 such as `2026-10-01T00:00:00.000+00:00`.
	 * @param string $suffix Time to add to a bare date.
	 * @return string|null The bound, or null when the date does not parse.
	 */
	private static function to_wall_time( $date, $suffix ) {
		$date  = str_replace( ' ', 'T', $date );
		$bound = 10 === strlen( $date ) ? $date . $suffix : substr( $date, 0, 19 );

		// The round trip also rejects dates PHP would roll over, such as February 30th.
		$parsed = \DateTimeImmutable::createFromFormat( '!Y-m-d\TH:i:s', $bound );

		return $parsed && $parsed->format( 'Y-m-d\TH:i:s' ) === $bound ? $bound : null;
	}
}
