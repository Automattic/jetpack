<?php
/**
 * Serves store reports from WooCommerce Analytics on this site.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;
use WP_REST_Request;

/**
 * The reports core `wc-analytics` routes can answer, mapped into the wpcom report shape.
 *
 * @since $$next-version$$
 */
class Local_Report_Provider implements Report_Provider {

	/**
	 * Each route's core route and controller, and the wpcom fields core cannot produce.
	 */
	const ROUTES = array(
		'orders/by-date' => array(
			'core_route'         => '/wc-analytics/reports/revenue/stats',
			'core_controller'    => 'Automattic\\WooCommerce\\Admin\\API\\Reports\\Revenue\\Stats\\Controller',
			'unsupported_fields' => array(
				'avg_items',
				'cogs_amount',
				'coupons',
				'orders_value_gross',
				'paid_net_sales',
				'paid_orders_count',
				'product_net_revenue',
				'profit_margin',
				'refunds',
				'unpaid_net_sales',
				'unpaid_orders_count',
			),
		),
		// Stands in for the Stock notifications report, which WooCommerce does not ship yet.
		'stock/summary'  => array(
			'core_route'         => '/wc-analytics/reports/stock/stats',
			'core_controller'    => 'Automattic\\WooCommerce\\Admin\\API\\Reports\\Stock\\Stats\\Controller',
			'unsupported_fields' => array(),
		),
	);

	/**
	 * The report API's date types, by core's names.
	 */
	const DATE_TYPES = array(
		'created'   => 'date_created',
		'paid'      => 'date_paid',
		'completed' => 'date_completed',
	);

	/**
	 * Intervals core buckets by.
	 */
	const INTERVALS = array( 'hour', 'day', 'week', 'month', 'quarter', 'year' );

	/**
	 * Core's page size cap for intervals.
	 */
	const PER_PAGE = 100;

	/**
	 * Most intervals one request may ask for: every core page reruns the totals queries.
	 */
	const MAX_INTERVALS = 500;

	/**
	 * {@inheritDoc}
	 */
	public function get_name() {
		return 'local';
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param string $route Report route.
	 */
	public function supports( $route ) {
		return isset( self::ROUTES[ $route ] );
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param string $route Report route.
	 */
	public function check_ready( $route ) {
		// WooCommerce registers `wc-analytics` routes only once a request dispatches into the namespace.
		return class_exists( self::ROUTES[ $route ]['core_controller'] ) ? true : self::feature_missing( 'core_controller_missing' );
	}

	/**
	 * The error for a report this WooCommerce cannot serve.
	 *
	 * @param string $reason Machine-readable reason.
	 * @return WP_Error
	 */
	private static function feature_missing( $reason ) {
		return Report_Executor::error(
			'feature_missing',
			503,
			$reason,
			__( 'This version of WooCommerce does not provide this report.', 'jetpack-woocommerce-stats-pkg' )
		);
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param string $route  Report route.
	 * @param array  $params Report query params.
	 */
	public function run( $route, array $params ) {
		$definition = self::ROUTES[ $route ];

		$query = self::to_core_query( self::param_map( $route ), $params );
		if ( is_wp_error( $query ) ) {
			return $query;
		}

		$data = 'orders/by-date' === $route ? $this->run_orders( $definition['core_route'], $query ) : $this->run_stock( $definition['core_route'], $query );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		return array(
			'data'               => $data,
			'status'             => 200,
			'headers'            => array(),
			'unsupported_fields' => $definition['unsupported_fields'],
		);
	}

	/**
	 * Each wpcom param a route accepts: the core param it becomes, the value converter (null when the
	 * value is invalid), and whether it is required.
	 *
	 * @param string $route Report route.
	 * @return array<string, array{0: string, 1: callable, 2: bool}>
	 */
	private static function param_map( $route ) {
		$maps = array(
			'orders/by-date' => array(
				'from'      => array( 'after', fn( $value ) => self::to_core_date( $value, 'T00:00:00' ), true ),
				'to'        => array( 'before', fn( $value ) => self::to_core_date( $value, 'T23:59:59' ), true ),
				'interval'  => array( 'interval', fn( $value ) => in_array( $value, self::INTERVALS, true ) ? $value : null, true ),
				'date_type' => array( 'date_type', fn( $value ) => self::DATE_TYPES[ $value ] ?? null, false ),
			),
			'stock/summary'  => array(),
		);

		return $maps[ $route ];
	}

	/**
	 * The report params as core's query: a param outside the map, or one whose value does not
	 * convert, is refused rather than dropped.
	 *
	 * @param array $map    The route's param map.
	 * @param array $params Report query params.
	 * @return array|WP_Error Core query params, or an error with the offending param in its reason.
	 */
	private static function to_core_query( array $map, array $params ) {
		$query = array();
		foreach ( $params as $name => $value ) {
			if ( ! isset( $map[ $name ] ) ) {
				return Report_Executor::error(
					'unsupported_parameter',
					422,
					'unsupported_parameter:' . $name,
					/* translators: %s: query param name. */
					sprintf( __( 'The local provider cannot apply %s.', 'jetpack-woocommerce-stats-pkg' ), $name )
				);
			}

			list( $core_name, $convert ) = $map[ $name ];
			$query[ $core_name ]         = is_string( $value ) ? $convert( $value ) : null;
			if ( null === $query[ $core_name ] ) {
				return Report_Executor::error(
					'invalid_parameter',
					422,
					'invalid_parameter:' . $name,
					/* translators: %s: query param name. */
					sprintf( __( 'The local provider cannot apply this value of %s.', 'jetpack-woocommerce-stats-pkg' ), $name )
				);
			}
		}

		foreach ( $map as $name => list( , , $required ) ) {
			if ( $required && ! isset( $params[ $name ] ) ) {
				return Report_Executor::error(
					'missing_parameter',
					400,
					'missing_parameter:' . $name,
					/* translators: %s: query param name. */
					sprintf( __( 'The report needs %s.', 'jetpack-woocommerce-stats-pkg' ), $name )
				);
			}
		}

		return $query;
	}

	/**
	 * The orders report from core's revenue stats, every page of intervals, oldest first.
	 *
	 * @param string $core_route Core route.
	 * @param array  $query      Core query params, from the param map.
	 * @return array|WP_Error
	 */
	private function run_orders( $core_route, array $query ) {
		$query += array(
			'orderby'  => 'date',
			'order'    => 'asc',
			'per_page' => self::PER_PAGE,
		);

		$count = self::count_intervals( $query['after'], $query['before'], $query['interval'] );
		if ( $count > self::MAX_INTERVALS ) {
			return self::too_many_intervals( $count );
		}

		$totals    = null;
		$intervals = array();
		$page      = 1;
		do {
			$response = $this->core_request( $core_route, $query + array( 'page' => $page ) );
			if ( is_wp_error( $response ) ) {
				return $response;
			}
			$body      = self::to_array( $response->get_data() );
			$totals    = $totals ?? $body['totals'];
			$intervals = array_merge( $intervals, $body['intervals'] ?? array() );
			$pages     = (int) ( $response->get_headers()['X-WP-TotalPages'] ?? 1 );
			// Core counts its own buckets; refuse rather than return a partial series.
			if ( $pages > (int) ceil( self::MAX_INTERVALS / self::PER_PAGE ) ) {
				return self::too_many_intervals( (int) ( $response->get_headers()['X-WP-Total'] ?? $pages * self::PER_PAGE ) );
			}
		} while ( ++$page <= $pages );

		$summary               = self::map_orders_row( $totals );
		$summary['date_start'] = $query['after'];
		$summary['date_end']   = $query['before'];

		return array(
			'summary' => $summary,
			'data'    => array_map(
				static function ( $interval ) {
					return array(
						'time_interval' => $interval['interval'],
						'date_start'    => $interval['date_start'],
						'date_end'      => $interval['date_end'],
					) + self::map_orders_row( $interval['subtotals'] );
				},
				$intervals
			),
		);
	}

	/**
	 * Stock counts by status, from core's stock stats.
	 *
	 * @param string $core_route Core route.
	 * @param array  $query      Core query params, from the param map.
	 * @return array|WP_Error
	 */
	private function run_stock( $core_route, array $query ) {
		$response = $this->core_request( $core_route, $query );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return array(
			'summary' => self::to_array( $response->get_data() )['totals'] ?? array(),
			'data'    => array(),
		);
	}

	/**
	 * The wpcom fields core's revenue stats can produce. The rest stay absent, never zero.
	 *
	 * @param array $row Core totals or interval subtotals.
	 * @return array
	 */
	private static function map_orders_row( array $row ) {
		$orders = (int) $row['orders_count'];

		return array(
			'orders_no'           => $orders,
			'orders_value_net'    => (float) $row['net_revenue'],
			'total_sales'         => (float) $row['total_sales'],
			'average_order_value' => $orders > 0 ? (float) $row['avg_order_value'] : null,
		);
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
		$start = new \DateTimeImmutable( $after );
		$end   = new \DateTimeImmutable( $before );
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
				$offset = ( (int) $start->format( 'w' ) - (int) get_option( 'start_of_week', 0 ) + 7 ) % 7;
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
	 * @param int $count Buckets the range needs.
	 * @return WP_Error
	 */
	private static function too_many_intervals( $count ) {
		return Report_Executor::error(
			'too_many_intervals',
			422,
			'too_many_intervals:' . $count,
			/* translators: 1: number of chart buckets requested, 2: the most allowed. */
			sprintf( __( 'This range needs %1$d intervals; the local provider serves at most %2$d. Pick a shorter range or a larger interval.', 'jetpack-woocommerce-stats-pkg' ), $count, self::MAX_INTERVALS )
		);
	}

	/**
	 * Core's response data as the JSON a client would read: in-process it still holds objects.
	 *
	 * @param mixed $data Response data.
	 * @return array
	 */
	private static function to_array( $data ) {
		return (array) json_decode( (string) wp_json_encode( $data, JSON_UNESCAPED_SLASHES ), true );
	}

	/**
	 * Run a core route in-process as the current user.
	 *
	 * @param string $core_route Core route.
	 * @param array  $query      Query params.
	 * @return \WP_REST_Response|WP_Error
	 */
	private function core_request( $core_route, array $query ) {
		$request = new WP_REST_Request( 'GET', $core_route );
		$request->set_query_params( $query );
		$response = rest_do_request( $request );

		if ( 404 === $response->get_status() && 'rest_no_route' === ( $response->get_data()['code'] ?? '' ) ) {
			return self::feature_missing( 'core_route_missing' );
		}
		if ( $response->is_error() ) {
			$error = $response->as_error();
			$error->add_data(
				array(
					'status' => $response->get_status(),
					'reason' => 'core_error',
				)
			);

			return $error;
		}

		return $response;
	}

	/**
	 * A report date as core's wall-time bound: a bare date gets the start or end of its day, and
	 * the dashboard's milliseconds and offset are dropped, since core reads bounds in the store's zone.
	 *
	 * @param string $date   `Y-m-d`, `Y-m-d H:i:s`, or ISO 8601 such as `2026-10-01T00:00:00.000+00:00`.
	 * @param string $suffix Time to add to a bare date.
	 * @return string
	 */
	private static function to_core_date( $date, $suffix ) {
		$date = str_replace( ' ', 'T', (string) $date );

		return 10 === strlen( $date ) ? $date . $suffix : substr( $date, 0, 19 );
	}
}
