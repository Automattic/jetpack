<?php
/**
 * A report served by a core `wc-analytics` stats route, in WordPress.com's shape.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use DateTimeImmutable;
use DateTimeZone;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Runs a core stats route in-process as the current user, so core's own capability check applies,
 * and maps its totals and intervals into `summary` and `data` rows. A subclass names the route,
 * the controller and the field map.
 *
 * @internal
 *
 * @since $$next-version$$
 */
abstract class Core_Report_Handler implements Report_Handler, Report_Capability, Report_Support, Report_Readiness {

	/**
	 * Date types the `date_type` param accepts, as core names them.
	 */
	private const DATE_TYPES = array(
		'created'   => 'date_created',
		'paid'      => 'date_paid',
		'completed' => 'date_completed',
	);

	/**
	 * Intervals core can bucket by.
	 */
	private const INTERVALS = array( 'hour', 'day', 'week', 'month', 'quarter', 'year' );

	/**
	 * Core's page size cap for intervals.
	 */
	private const PER_PAGE = 100;

	/**
	 * Most intervals one request may ask for: every core page reruns the totals queries.
	 */
	const MAX_INTERVALS = 500;

	/**
	 * Core REST route, such as `/wc-analytics/reports/revenue/stats`.
	 *
	 * @var string
	 */
	protected $core_route;

	/**
	 * Core controller class, present only on a WooCommerce that serves the route.
	 *
	 * @var string
	 */
	protected $core_controller;

	/**
	 * Contract field => core field, or [ core field, count field ] for an average that is null over no items.
	 *
	 * @var array<string, string|string[]>
	 */
	protected $fields = array();

	/**
	 * {@inheritDoc}
	 */
	public function get_capability() {
		return array(
			'fields' => array_keys( $this->fields ),
			'params' => array( 'from', 'to', 'interval', 'date_type' ),
		);
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Request $request The request.
	 */
	public function supports( Report_Request $request ) {
		$query = self::to_core_query( $request );
		if ( is_wp_error( $query ) ) {
			return $query;
		}

		$count = self::count_intervals( $query['after'], $query['before'], $query['interval'] );

		return $count > self::MAX_INTERVALS ? self::too_many_intervals() : true;
	}

	/**
	 * {@inheritDoc}
	 */
	public function check_ready() {
		if ( class_exists( $this->core_controller ) ) {
			return true;
		}

		return new WP_Error(
			'local_unavailable',
			__( 'This version of WooCommerce does not provide this report.', 'jetpack-woocommerce-stats-pkg' ),
			array( 'status' => 503 )
		);
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Request $request The request.
	 */
	public function run( Report_Request $request ) {
		$query = self::to_core_query( $request );
		if ( is_wp_error( $query ) ) {
			return $query;
		}

		$query += array(
			'orderby'  => 'date',
			'order'    => 'asc',
			'per_page' => self::PER_PAGE,
		);
		if ( $request->force_refresh ) {
			$query['force_cache_refresh'] = true;
		}

		$totals    = null;
		$intervals = array();
		$page      = 1;
		do {
			$response = $this->core_request( $query + array( 'page' => $page ) );
			if ( is_wp_error( $response ) ) {
				return $response;
			}

			$body      = self::to_array( $response->get_data() );
			$totals  ??= $body['totals'] ?? array();
			$intervals = array_merge( $intervals, $body['intervals'] ?? array() );
			$pages     = (int) ( $response->get_headers()['X-WP-TotalPages'] ?? 1 );
			// supports() estimates; core counts its own buckets, so refuse rather than return part of a series.
			if ( $pages * self::PER_PAGE > self::MAX_INTERVALS ) {
				return self::too_many_intervals();
			}
		} while ( ++$page <= $pages );

		$data = array();
		foreach ( $intervals as $interval ) {
			$data[] = array(
				'time_interval' => $interval['interval'],
				'date_start'    => self::to_site_iso( $interval['date_start'] ),
				'date_end'      => self::to_site_iso( $interval['date_end'] ),
			) + $this->map_fields( $interval['subtotals'] ?? array() );
		}

		return array(
			'data'    => array(
				'summary' => $this->map_fields( $totals ) + array(
					'date_start' => self::to_site_iso( $query['after'] ),
					'date_end'   => self::to_site_iso( $query['before'] ),
				),
				'data'    => $data,
			),
			'status'  => 200,
			'headers' => array(),
		);
	}

	/**
	 * The request's range, interval and date type as core's params.
	 *
	 * @param Report_Request $request The request.
	 * @return array|WP_Error `after`, `before`, `interval` and `date_type`, or a 400.
	 */
	private static function to_core_query( Report_Request $request ) {
		$params = $request->params;
		foreach ( array( 'from', 'to', 'interval' ) as $name ) {
			if ( ! isset( $params[ $name ] ) ) {
				return new WP_Error(
					'missing_parameter',
					/* translators: %s: query param name. */
					sprintf( __( 'The report needs %s.', 'jetpack-woocommerce-stats-pkg' ), $name ),
					array( 'status' => 400 )
				);
			}
		}

		$date_type = $params['date_type'] ?? null;
		$query     = array(
			'after'     => self::to_wall_time( $params['from'], '00:00:00' ),
			'before'    => self::to_wall_time( $params['to'], '23:59:59' ),
			'interval'  => in_array( $params['interval'], self::INTERVALS, true ) ? $params['interval'] : null,
			'date_type' => null === $date_type ? self::get_store_date_type() : ( is_string( $date_type ) ? self::DATE_TYPES[ $date_type ] ?? null : null ),
		);

		$names = array(
			'after'     => 'from',
			'before'    => 'to',
			'interval'  => 'interval',
			'date_type' => 'date_type',
		);
		foreach ( $query as $key => $value ) {
			if ( null === $value ) {
				return new WP_Error(
					'invalid_parameter',
					/* translators: %s: query param name. */
					sprintf( __( 'The report cannot apply this value of %s.', 'jetpack-woocommerce-stats-pkg' ), $names[ $key ] ),
					array( 'status' => 400 )
				);
			}
		}

		return $query;
	}

	/**
	 * The store's `woocommerce_date_type`, read live as the WordPress.com forward does.
	 *
	 * @return string Core's name for it, `date_paid` when unset or unknown.
	 */
	private static function get_store_date_type() {
		$option = get_option( 'woocommerce_date_type' );

		return in_array( $option, self::DATE_TYPES, true ) ? $option : self::DATE_TYPES['paid'];
	}

	/**
	 * A report date as a bound in the store's zone, as WordPress.com reads it: a date without an
	 * offset is store wall time, one with an offset is converted, and a bare date spans its day.
	 *
	 * @param mixed  $date `Y-m-d`, `Y-m-d H:i:s`, or ISO 8601 such as `2026-10-01T00:00:00.000Z`.
	 * @param string $time Time to give a bare date.
	 * @return string|null `Y-m-d\TH:i:s`, or null when the date does not parse.
	 */
	private static function to_wall_time( $date, $time ) {
		if ( ! is_string( $date ) || ! preg_match( '/^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2}:\d{2})(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/D', $date, $parts ) ) {
			return null;
		}

		try {
			$zone = empty( $parts[3] ) ? wp_timezone() : new DateTimeZone( $parts[3] );
		} catch ( \Exception $e ) {
			return null;
		}

		$bound = $parts[1] . 'T' . ( empty( $parts[2] ) ? $time : $parts[2] );
		// The round trip also rejects dates PHP would roll over, such as February 30th.
		$parsed = DateTimeImmutable::createFromFormat( '!Y-m-d\TH:i:s', $bound, $zone );
		if ( ! $parsed || $parsed->format( 'Y-m-d\TH:i:s' ) !== $bound ) {
			return null;
		}

		return $parsed->setTimezone( wp_timezone() )->format( 'Y-m-d\TH:i:s' );
	}

	/**
	 * A wall time in the store's zone as ISO 8601 with its offset, as WordPress.com writes dates.
	 *
	 * @param string $wall_time `Y-m-d H:i:s` or `Y-m-d\TH:i:s`.
	 * @return string
	 */
	private static function to_site_iso( $wall_time ) {
		return ( new DateTimeImmutable( $wall_time, wp_timezone() ) )->format( 'c' );
	}

	/**
	 * A core row in contract fields, as the strings WordPress.com sends. A field core lacks stays absent.
	 *
	 * @param array $row Core totals or interval subtotals.
	 * @return array
	 */
	private function map_fields( array $row ) {
		$mapped = array();
		foreach ( $this->fields as $field => $source ) {
			list( $core_field, $count_field ) = (array) $source + array( 1 => null );
			if ( ! array_key_exists( $core_field, $row ) ) {
				continue;
			}

			// Core casts an average over no orders to 0; WordPress.com sends null.
			$empty            = null === $row[ $core_field ] || ( null !== $count_field && empty( $row[ $count_field ] ) );
			$mapped[ $field ] = $empty ? null : (string) wp_json_encode( $row[ $core_field ], JSON_UNESCAPED_SLASHES );
		}

		return $mapped;
	}

	/**
	 * How many buckets core returns for the range: partial first and last buckets count, and weeks
	 * start on the site's `start_of_week`, as in core's TimeInterval.
	 *
	 * @param string $after    Start bound, `Y-m-d\TH:i:s`.
	 * @param string $before   End bound, `Y-m-d\TH:i:s`.
	 * @param string $interval One of `INTERVALS`.
	 * @return int
	 */
	private static function count_intervals( $after, $before, $interval ) {
		$start = new DateTimeImmutable( $after );
		$end   = new DateTimeImmutable( $before );
		if ( $end < $start ) {
			return 0;
		}

		$days = (int) $start->setTime( 0, 0 )->diff( $end->setTime( 0, 0 ) )->days;
		$year = (int) $end->format( 'Y' ) - (int) $start->format( 'Y' );

		switch ( $interval ) {
			case 'hour':
				return intdiv( $end->getTimestamp() - $start->getTimestamp(), HOUR_IN_SECONDS ) + 1;
			case 'day':
				return $days + 1;
			case 'week':
				$offset = ( (int) $start->format( 'w' ) - absint( get_option( 'start_of_week' ) ) + 7 ) % 7;
				return intdiv( $days + $offset, 7 ) + 1;
			case 'month':
				return $year * 12 + (int) $end->format( 'n' ) - (int) $start->format( 'n' ) + 1;
			case 'quarter':
				return $year * 4 + intdiv( (int) $end->format( 'n' ) - 1, 3 ) - intdiv( (int) $start->format( 'n' ) - 1, 3 ) + 1;
			default:
				return $year + 1;
		}
	}

	/**
	 * The error for a range with more buckets than one request may fetch.
	 *
	 * @return WP_Error
	 */
	private static function too_many_intervals() {
		return new WP_Error(
			'too_many_intervals',
			/* translators: %d: the most intervals allowed. */
			sprintf( __( 'This range needs more than %d intervals. Pick a shorter range or a larger interval.', 'jetpack-woocommerce-stats-pkg' ), self::MAX_INTERVALS ),
			array( 'status' => 422 )
		);
	}

	/**
	 * Core's response data as the JSON a client would read: in-process it may still hold objects.
	 *
	 * @param mixed $data Response data.
	 * @return array
	 */
	private static function to_array( $data ) {
		return (array) json_decode( (string) wp_json_encode( $data, JSON_UNESCAPED_SLASHES ), true );
	}

	/**
	 * Run the core route in-process as the current user.
	 *
	 * @param array $query Query params.
	 * @return WP_REST_Response|WP_Error Core's response, or its error with core's status.
	 */
	private function core_request( array $query ) {
		$request = new WP_REST_Request( 'GET', $this->core_route );
		$request->set_query_params( $query );
		$response = rest_do_request( $request );

		if ( ! $response->is_error() ) {
			return $response;
		}

		$error = $response->as_error();
		if ( 404 === $response->get_status() && 'rest_no_route' === $error->get_error_code() ) {
			return new WP_Error(
				'local_unavailable',
				__( 'WooCommerce does not serve this report on this site.', 'jetpack-woocommerce-stats-pkg' ),
				array( 'status' => 503 )
			);
		}

		return $error;
	}
}
