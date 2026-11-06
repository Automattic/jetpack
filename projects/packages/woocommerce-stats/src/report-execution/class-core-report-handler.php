<?php
/**
 * Interim local handler: a core `wc-analytics` REST route behind a param and field map.
 *
 * @package automattic/jetpack-woocommerce-stats
 */

namespace Automattic\Jetpack\WooCommerceStats\Report_Execution;

use WP_Error;
use WP_REST_Request;

/**
 * Runs a core report in-process and maps it into the wpcom shape. A subclass names the core route
 * and controller, the shape, and its field and extra param maps.
 *
 * @since $$next-version$$
 */
abstract class Core_Report_Handler implements Report_Handler {

	/**
	 * Core's names for the date types.
	 */
	const CORE_DATE_TYPES = array(
		'created'   => 'date_created',
		'paid'      => 'date_paid',
		'completed' => 'date_completed',
	);

	/**
	 * Core's page size cap, for intervals and for list rows.
	 */
	const PER_PAGE = 100;

	/**
	 * Most intervals one request may ask for: every core page reruns the totals queries.
	 */
	const MAX_INTERVALS = 500;

	/**
	 * Core REST route.
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
	 * `stats` (totals plus paged intervals, from the query's range), `totals`, or `list` (paged rows).
	 *
	 * @var string
	 */
	protected $shape;

	/**
	 * Field map: wpcom field => core field, or [ core field, count field ] for an average that is null over no
	 * items; null passes core's fields through and serves every field of the contract.
	 *
	 * @var array|null
	 */
	protected $fields;

	/**
	 * Params beyond the normalized ones: wpcom param => [ core param, converter returning null when invalid ].
	 *
	 * @return array
	 */
	protected function extra_params() {
		return array();
	}

	/**
	 * {@inheritDoc}
	 */
	public function get_capability() {
		$params = 'stats' === $this->shape ? array( 'from', 'to', 'interval', 'date_type' ) : array();

		return array(
			'fields'     => null === $this->fields ? '*' : array_keys( $this->fields ),
			'params'     => array_merge( $params, array_keys( $this->extra_params() ) ),
			'deviations' => array(),
		);
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Query $query The request.
	 */
	public function supports( Report_Query $query ) {
		if ( 'stats' === $this->shape ) {
			foreach ( array( 'from', 'to', 'interval' ) as $name ) {
				if ( null === $query->$name ) {
					return Report_Executor::error(
						'missing_parameter',
						400,
						'missing_parameter:' . $name,
						/* translators: %s: query param name. */
						sprintf( __( 'The report needs %s.', 'jetpack-woocommerce-stats-pkg' ), $name )
					);
				}
			}

			$count = self::count_intervals( $query->from, $query->to, $query->interval );
			if ( $count > self::MAX_INTERVALS ) {
				return self::too_many_intervals( $count );
			}
		}

		$extra = $this->to_core_params( $query );

		return is_wp_error( $extra ) ? $extra : true;
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Query $query The request.
	 */
	public function check_ready( Report_Query $query ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Readiness is the same for every request.
		// WooCommerce registers `wc-analytics` routes only once a request dispatches into the namespace.
		return class_exists( $this->core_controller ) ? true : self::feature_missing( 'core_controller_missing' );
	}

	/**
	 * {@inheritDoc}
	 *
	 * @param Report_Query $query The request.
	 */
	public function run( Report_Query $query ) {
		$core_query = $this->to_core_params( $query );
		if ( is_wp_error( $core_query ) ) {
			return $core_query;
		}

		switch ( $this->shape ) {
			case 'stats':
				$result = $this->run_stats( $query, $core_query );
				break;
			case 'list':
				$result = $this->run_list( $core_query );
				break;
			default:
				$result = $this->run_totals( $core_query );
		}
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		return array(
			'data'    => $result['body'],
			'status'  => 200,
			'headers' => $result['headers'],
		);
	}

	/**
	 * The extra params as core's, refusing a value that does not convert.
	 *
	 * @param Report_Query $query The request.
	 * @return array|WP_Error
	 */
	private function to_core_params( Report_Query $query ) {
		$core_query = array();
		foreach ( $this->extra_params() as $name => list( $core_name, $convert ) ) {
			if ( ! isset( $query->params[ $name ] ) ) {
				continue;
			}
			$core_query[ $core_name ] = is_string( $query->params[ $name ] ) ? $convert( $query->params[ $name ] ) : null;
			if ( null === $core_query[ $core_name ] ) {
				return Report_Query::invalid_parameter( $name );
			}
		}

		return $core_query;
	}

	/**
	 * Totals as the summary, every page of intervals as the rows, oldest first.
	 *
	 * @param Report_Query $query      The request.
	 * @param array        $core_query Core params from the extra param map.
	 * @return array|WP_Error `body` and `headers`.
	 */
	private function run_stats( Report_Query $query, array $core_query ) {
		$core_query += array(
			'after'    => $query->from,
			'before'   => $query->to,
			'interval' => $query->interval,
			'orderby'  => 'date',
			'order'    => 'asc',
			'per_page' => self::PER_PAGE,
		);
		if ( null !== $query->date_type ) {
			$core_query['date_type'] = self::CORE_DATE_TYPES[ $query->date_type ];
		}

		$totals    = null;
		$intervals = array();
		$page      = 1;
		do {
			$response = self::core_request( $this->core_route, $core_query + array( 'page' => $page ) );
			if ( is_wp_error( $response ) ) {
				return $response;
			}
			$body      = self::to_array( $response->get_data() );
			$totals  ??= $body['totals'] ?? array();
			$intervals = array_merge( $intervals, $body['intervals'] ?? array() );
			$pages     = (int) ( $response->get_headers()['X-WP-TotalPages'] ?? 1 );
			// Core counts its own buckets; refuse rather than return a partial series.
			if ( $pages > (int) ceil( self::MAX_INTERVALS / self::PER_PAGE ) ) {
				return self::too_many_intervals( (int) ( $response->get_headers()['X-WP-Total'] ?? $pages * self::PER_PAGE ) );
			}
		} while ( ++$page <= $pages );

		$fields = $this->fields;

		return array(
			'body'    => array(
				'summary' => self::map_fields( $totals, $fields ) + array(
					'date_start' => $query->from,
					'date_end'   => $query->to,
				),
				'data'    => array_map(
					static function ( $interval ) use ( $fields ) {
						return array(
							'time_interval' => $interval['interval'],
							'date_start'    => $interval['date_start'],
							'date_end'      => $interval['date_end'],
						) + self::map_fields( $interval['subtotals'] ?? array(), $fields );
					},
					$intervals
				),
			),
			'headers' => array(),
		);
	}

	/**
	 * Totals with no time series, such as stock counts.
	 *
	 * @param array $core_query Core params.
	 * @return array|WP_Error `body` and `headers`.
	 */
	private function run_totals( array $core_query ) {
		$response = self::core_request( $this->core_route, $core_query );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		return array(
			'body'    => array(
				'summary' => self::map_fields( self::to_array( $response->get_data() )['totals'] ?? array(), $this->fields ),
				'data'    => array(),
			),
			'headers' => array(),
		);
	}

	/**
	 * One page of rows, with core's totals passed on as the wpcom paging headers.
	 *
	 * @param array $core_query Core params.
	 * @return array|WP_Error `body` and `headers`.
	 */
	private function run_list( array $core_query ) {
		$response = self::core_request( $this->core_route, $core_query );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$headers = $response->get_headers();
		$total   = (int) ( $headers['X-WP-Total'] ?? 0 );
		$fields  = $this->fields;

		return array(
			'body'    => array(
				'summary' => array( 'total_items' => $total ),
				'data'    => array_map(
					static fn( $row ) => self::map_fields( $row, $fields ),
					array_values( self::to_array( $response->get_data() ) )
				),
			),
			'headers' => array(
				'x-wp-total'      => (string) $total,
				'x-wp-totalpages' => (string) (int) ( $headers['X-WP-TotalPages'] ?? 0 ),
			),
		);
	}

	/**
	 * A core row in wpcom fields. A field core does not send stays absent, never zero.
	 *
	 * @param array      $row    Core totals, interval subtotals or list row.
	 * @param array|null $fields The field map; null passes core's fields through.
	 * @return array
	 */
	private static function map_fields( array $row, $fields ) {
		unset( $row['_links'], $row['segments'] );
		if ( null === $fields ) {
			return $row;
		}

		$mapped = array();
		foreach ( $fields as $wpcom_name => $source ) {
			if ( is_array( $source ) ) {
				list( $core_name, $count_name ) = $source;
				if ( isset( $row[ $core_name ] ) && isset( $row[ $count_name ] ) ) {
					$mapped[ $wpcom_name ] = $row[ $count_name ] > 0 ? $row[ $core_name ] : null;
				}
			} elseif ( array_key_exists( $source, $row ) ) {
				$mapped[ $wpcom_name ] = $row[ $source ];
			}
		}

		return $mapped;
	}

	/**
	 * How many buckets core returns for the range: partial first and last buckets count, and weeks
	 * start on the site's `start_of_week`, as in core's TimeInterval.
	 *
	 * @param string $after    Start bound, `Y-m-d\TH:i:s`.
	 * @param string $before   End bound, `Y-m-d\TH:i:s`.
	 * @param string $interval One of `Report_Query::INTERVALS`.
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
	 * The error for a report this WooCommerce cannot serve.
	 *
	 * @param string $reason Machine-readable reason.
	 * @return WP_Error
	 */
	protected static function feature_missing( $reason ) {
		return Report_Executor::error(
			'feature_missing',
			503,
			$reason,
			__( 'This version of WooCommerce does not provide this report.', 'jetpack-woocommerce-stats-pkg' )
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
	 * @param array  $core_query Query params.
	 * @return \WP_REST_Response|WP_Error
	 */
	private static function core_request( $core_route, array $core_query ) {
		$request = new WP_REST_Request( 'GET', $core_route );
		$request->set_query_params( $core_query );
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
}
