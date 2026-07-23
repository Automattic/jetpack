<?php
/**
 * Plugin Name: Premium Analytics Bookings export mock
 * Description: Supplies opt-in mock analytics responses for manually testing the Bookings CSV exports.
 * Version: 1.0.0
 *
 * @package automattic/jetpack-premium-analytics
 */

defined( 'ABSPATH' ) || exit;

/**
 * Create a representative analytics interval.
 *
 * Values vary by the requested month so comparison-period columns are visibly distinct.
 *
 * @param DateTimeImmutable $date  Interval date.
 * @param int               $index Zero-based interval index.
 * @return array
 */
function jetpack_premium_analytics_bookings_mock_interval( DateTimeImmutable $date, int $index ): array {
	$seed = (int) $date->format( 'n' );

	return array(
		'time_interval'                => $date->format( 'Y-m-d' ),
		'date_start'                   => $date->setTime( 0, 0, 0 )->format( DateTimeInterface::ATOM ),
		'date_end'                     => $date->setTime( 23, 59, 59 )->format( DateTimeInterface::ATOM ),
		'orders_no'                    => (string) ( ( $seed * 10 ) + $index + 1 ),
		'status_unpaid'                => (string) ( $index + 1 ),
		'status_pending_confirmation'  => (string) ( $index + 1 ),
		'status_confirmed'             => (string) ( $index + 2 ),
		'status_paid'                  => (string) $seed,
		'status_cancelled'             => (string) ( $index + 1 ),
		'status_complete'              => (string) ( $seed + $index + 1 ),
		'attendance_status_booked'     => (string) ( $seed + $index + 2 ),
		'attendance_status_no_show'    => (string) $index,
		'attendance_status_checked_in' => (string) ( $seed + $index ),
	);
}

/**
 * Limit a mock interval to structural fields plus fields requested by the analytics client.
 *
 * @param array $interval         Full interval data.
 * @param mixed $requested_fields Requested fields query parameter.
 * @return array
 */
function jetpack_premium_analytics_bookings_mock_filter_fields( array $interval, $requested_fields ): array {
	if ( ! is_array( $requested_fields ) || array() === $requested_fields ) {
		return $interval;
	}

	$fields = array_merge(
		array( 'time_interval', 'date_start', 'date_end' ),
		array_map( 'strval', $requested_fields )
	);

	return array_intersect_key( $interval, array_fill_keys( $fields, true ) );
}

/**
 * Build a two-row response matching the analytics time-series contract.
 *
 * @param WP_REST_Request $request Internal analytics proxy request.
 * @return array
 */
function jetpack_premium_analytics_bookings_mock_response( WP_REST_Request $request ): array {
	$timezone = wp_timezone();
	$from     = new DateTimeImmutable( (string) $request->get_param( 'from' ), $timezone );
	$to       = new DateTimeImmutable( (string) $request->get_param( 'to' ), $timezone );
	$fields   = $request->get_param( 'fields' );
	$rows     = array();

	for ( $index = 0; $index < 2; $index++ ) {
		$date = $from->modify( sprintf( '+%d day', $index ) );
		if ( $date > $to ) {
			break;
		}

		$rows[] = jetpack_premium_analytics_bookings_mock_filter_fields(
			jetpack_premium_analytics_bookings_mock_interval( $date, $index ),
			$fields
		);
	}

	if ( array() === $rows ) {
		$rows[] = jetpack_premium_analytics_bookings_mock_filter_fields(
			jetpack_premium_analytics_bookings_mock_interval( $from, 0 ),
			$fields
		);
	}

	$summary = array(
		'date_start' => $from->format( DateTimeInterface::ATOM ),
		'date_end'   => $to->format( DateTimeInterface::ATOM ),
	);

	foreach ( $rows as $row ) {
		foreach ( $row as $key => $value ) {
			if ( in_array( $key, array( 'time_interval', 'date_start', 'date_end' ), true ) ) {
				continue;
			}

			$summary[ $key ] = (string) ( (int) ( $summary[ $key ] ?? 0 ) + (int) $value );
		}
	}

	return array(
		'summary' => $summary,
		'data'    => $rows,
	);
}

/**
 * Intercept only proxy calls nested inside the two Bookings CSV export requests.
 *
 * @param mixed           $result  Response to replace, or null to continue dispatching.
 * @param WP_REST_Server  $server  REST server.
 * @param WP_REST_Request $request Current request.
 * @return mixed
 */
function jetpack_premium_analytics_bookings_mock_pre_dispatch( $result, WP_REST_Server $server, WP_REST_Request $request ) {
	static $mock_export_active = false;

	$export_route = '/jetpack-premium-analytics/v1/reports/csv-export';
	$report_types = array( 'bookingsovertime', 'bookingstatusbreakdown' );

	if ( $export_route === $request->get_route() && 'POST' === $request->get_method() ) {
		$mock_export_active = in_array( $request->get_param( 'report_type' ), $report_types, true );
		return $result;
	}

	if ( ! $mock_export_active ) {
		return $result;
	}

	$mock_routes = array(
		'/jetpack-premium-analytics/v1/proxy/v2/analytics/reports/orders-by-product-type/by-date',
		'/jetpack-premium-analytics/v1/proxy/v2/analytics/reports/bookings/by-date',
	);

	if ( ! in_array( $request->get_route(), $mock_routes, true ) ) {
		return $result;
	}

	$response = new WP_REST_Response( jetpack_premium_analytics_bookings_mock_response( $request ), 200 );
	$response->header( 'X-Premium-Analytics-Bookings-Mock', 'active' );

	return $response;
}
add_filter( 'rest_pre_dispatch', 'jetpack_premium_analytics_bookings_mock_pre_dispatch', 5, 3 );

/**
 * Register a manual-test page.
 *
 * @return void
 */
function jetpack_premium_analytics_bookings_mock_admin_menu(): void {
	add_management_page(
		'Bookings export mock',
		'Bookings export mock',
		'manage_options',
		'premium-analytics-bookings-export-mock',
		'jetpack_premium_analytics_bookings_mock_admin_page'
	);
}
add_action( 'admin_menu', 'jetpack_premium_analytics_bookings_mock_admin_menu' );

/**
 * Render a one-click manual test form for a report.
 *
 * @param string $report_type Report type key.
 * @param string $label       Button label.
 * @return void
 */
function jetpack_premium_analytics_bookings_mock_form( string $report_type, string $label ): void {
	?>
	<form method="post" action="<?php echo esc_url( rest_url( 'jetpack-premium-analytics/v1/reports/csv-export' ) ); ?>">
		<input type="hidden" name="_wpnonce" value="<?php echo esc_attr( wp_create_nonce( 'wp_rest' ) ); ?>">
		<input type="hidden" name="report_type" value="<?php echo esc_attr( $report_type ); ?>">
		<input type="hidden" name="from" value="2026-07-01T00:00:00">
		<input type="hidden" name="to" value="2026-07-02T23:59:59">
		<input type="hidden" name="interval" value="day">
		<input type="hidden" name="delivery_method" value="download">
		<input type="hidden" name="compare_from" value="2026-06-01T00:00:00">
		<input type="hidden" name="compare_to" value="2026-06-02T23:59:59">
		<?php submit_button( $label, 'primary', 'submit', false ); ?>
	</form>
	<?php
}

/**
 * Render the manual-test page.
 *
 * @return void
 */
function jetpack_premium_analytics_bookings_mock_admin_page(): void {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1>Premium Analytics Bookings export mock</h1>
		<p>
			These downloads use two mocked days in July 2026 and a June 2026 comparison period.
			Only the two Bookings export proxy requests are mocked.
		</p>
		<div style="display: flex; gap: 12px;">
			<?php
			jetpack_premium_analytics_bookings_mock_form( 'bookingsovertime', 'Download Bookings over time CSV' );
			jetpack_premium_analytics_bookings_mock_form( 'bookingstatusbreakdown', 'Download Booking status breakdown CSV' );
			?>
		</div>
	</div>
	<?php
}
