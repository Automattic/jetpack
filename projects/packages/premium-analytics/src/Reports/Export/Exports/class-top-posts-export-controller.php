<?php
/**
 * Stats Top Posts & Pages CSV export controller.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Exports;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Abstract_Csv_Report_Controller;

/**
 * Exports the Jetpack Stats "Top Posts & Pages" report.
 *
 * @since $$next-version$$
 */
class Top_Posts_Export_Controller extends Abstract_Csv_Report_Controller {

	/**
	 * Default number of days to export when no range is supplied.
	 */
	private const DEFAULT_DAYS = 30;

	/**
	 * Maximum posts to request.
	 */
	private const MAX_POSTS = 500;

	/**
	 * Get the report key for this controller.
	 *
	 * @return string The report key.
	 */
	public function get_report_key(): string {
		return 'stats-top-posts';
	}

	/**
	 * Get the report label for this controller.
	 *
	 * @return string The report label.
	 */
	public function get_report_label(): string {
		return __( 'Top Posts & Pages', 'jetpack-premium-analytics' );
	}

	/**
	 * Get the data endpoint under the `stats` proxy prefix.
	 *
	 * @return string The data endpoint.
	 */
	public function get_data_endpoint(): string {
		return 'top-posts';
	}

	/**
	 * Ask the Stats endpoint to summarize the whole range into a single flat post list.
	 *
	 * @return array Additional request parameters.
	 */
	public function get_additional_params(): array {
		return array(
			'summarize' => 1,
			'max'       => self::MAX_POSTS,
		);
	}

	/**
	 * Map the generic from/to range onto the WPCOM Stats top-posts query shape.
	 *
	 * @param array $params The per-period request parameters.
	 * @return array The Stats-native parameters.
	 */
	public function prepare_request_params( array $params ): array {
		$to_date   = $this->extract_request_date( $params['to'] ?? null );
		$from_date = $this->extract_request_date( $params['from'] ?? null );

		if ( null === $to_date ) {
			$to_date = gmdate( 'Y-m-d' );
		}

		if ( null === $from_date ) {
			$from_date = $this->shift_date( $to_date, '-' . ( self::DEFAULT_DAYS - 1 ) . ' days' );
		}

		$days = $this->count_inclusive_days( $from_date, $to_date );

		$params['period'] = 'day';
		$params['date']   = $to_date;
		$params['num']    = $days;

		unset( $params['from'], $params['to'], $params['interval'], $params['compare_from'], $params['compare_to'] );

		return $params;
	}

	/**
	 * Extract the request calendar date without applying timezone conversion.
	 *
	 * @param mixed $value Date-like request value.
	 * @return string|null The YYYY-MM-DD date, or null when unavailable.
	 */
	private function extract_request_date( $value ): ?string {
		if ( ! is_scalar( $value ) ) {
			return null;
		}

		$date = (string) $value;
		if ( preg_match( '/^(\d{4}-\d{2}-\d{2})/', $date, $matches ) ) {
			return $matches[1];
		}

		$timestamp = strtotime( $date );
		if ( false === $timestamp ) {
			return null;
		}

		return gmdate( 'Y-m-d', $timestamp );
	}

	/**
	 * Shift a YYYY-MM-DD date by a relative interval.
	 *
	 * @param string $date     Date in YYYY-MM-DD format.
	 * @param string $modifier Relative date modifier.
	 * @return string Shifted date in YYYY-MM-DD format.
	 */
	private function shift_date( string $date, string $modifier ): string {
		$date_time = \DateTimeImmutable::createFromFormat( '!Y-m-d', $date, new \DateTimeZone( 'UTC' ) );
		if ( false === $date_time ) {
			return gmdate( 'Y-m-d' );
		}

		return $date_time->modify( $modifier )->format( 'Y-m-d' );
	}

	/**
	 * Count calendar days in an inclusive YYYY-MM-DD range.
	 *
	 * @param string $from_date Start date in YYYY-MM-DD format.
	 * @param string $to_date   End date in YYYY-MM-DD format.
	 * @return int Inclusive day count.
	 */
	private function count_inclusive_days( string $from_date, string $to_date ): int {
		$from = \DateTimeImmutable::createFromFormat( '!Y-m-d', $from_date, new \DateTimeZone( 'UTC' ) );
		$to   = \DateTimeImmutable::createFromFormat( '!Y-m-d', $to_date, new \DateTimeZone( 'UTC' ) );

		if ( false === $from || false === $to ) {
			return 1;
		}

		return max( 1, (int) $from->diff( $to )->format( '%r%a' ) + 1 );
	}

	/**
	 * Get the column headers for this controller.
	 *
	 * @param string|null $interval Optional time interval.
	 * @return array The column headers.
	 */
	public function get_column_headers( ?string $interval = null ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- The summarized list has no interval column.
		return array(
			'post_title' => __( 'Title', 'jetpack-premium-analytics' ),
			'views'      => __( 'Views', 'jetpack-premium-analytics' ),
			'type'       => __( 'Type', 'jetpack-premium-analytics' ),
			'url'        => __( 'URL', 'jetpack-premium-analytics' ),
		);
	}

	/**
	 * Get default values for missing data fields.
	 *
	 * @return array Array of field_name => default_value pairs.
	 */
	public function get_default_values(): array {
		return array(
			'post_title' => '',
			'views'      => 0,
			'type'       => '',
			'url'        => '',
		);
	}

	/**
	 * Format a single Stats postviews item for CSV export.
	 *
	 * @param array       $item     The raw postviews item.
	 * @param string|null $interval Optional time interval.
	 * @return array The formatted row.
	 */
	public function format_row_for_csv( array $item, ?string $interval = null ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- The summarized list has no interval column.
		$defaults = $this->get_default_values();

		return array(
			'post_title' => (string) ( $item['title'] ?? $defaults['post_title'] ),
			'views'      => (int) ( $item['views'] ?? $defaults['views'] ),
			'type'       => (string) ( $item['type'] ?? $defaults['type'] ),
			'url'        => (string) ( $item['href'] ?? $defaults['url'] ),
		);
	}
}
