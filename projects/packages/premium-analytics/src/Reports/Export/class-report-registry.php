<?php
/**
 * Report Registry
 *
 * Registry pattern to manage report type configurations for CSV exports.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

defined( 'ABSPATH' ) || exit;

/**
 * Report Registry class for managing report configurations.
 *
 * @since $$next-version$$
 */
class Report_Registry {

	/**
	 * Registered controller instances.
	 *
	 * @var array<string, Csv_Report_Controller_Interface>
	 */
	private $controllers = array();

	/**
	 * Register a controller instance.
	 *
	 * @param Csv_Report_Controller_Interface $controller The controller instance.
	 * @return bool True on success, false if already registered.
	 */
	public function register_controller( Csv_Report_Controller_Interface $controller ): bool {
		$report_key = $controller->get_report_key();

		if ( isset( $this->controllers[ $report_key ] ) ) {
			return false;
		}

		// Store the controller instance.
		$this->controllers[ $report_key ] = $controller;

		return true;
	}

	/**
	 * Check if a report type is registered.
	 *
	 * @param string $report_key The report key.
	 * @return bool True if registered, false otherwise.
	 */
	public function is_registered( string $report_key ): bool {
		return isset( $this->controllers[ $report_key ] );
	}

	/**
	 * Get all registered report keys.
	 *
	 * @return string[] Array of registered report keys.
	 */
	public function get_registered_reports(): array {
		return array_keys( $this->controllers );
	}

	/**
	 * Get data endpoint for a report type.
	 *
	 * @param string $report_key The report key.
	 * @return string|\WP_Error The data endpoint or error.
	 */
	public function get_data_endpoint( string $report_key ) {
		$controller = $this->get_controller( $report_key );
		if ( \is_wp_error( $controller ) ) {
			return $controller;
		}

		return $controller->get_data_endpoint();
	}

	/**
	 * Get columns for a report type.
	 *
	 * @param string      $report_key         The report key.
	 * @param bool        $include_comparison Whether to include comparison columns.
	 * @param string|null $interval           Optional time interval for dynamic headers.
	 * @return array|\WP_Error Column definitions or error.
	 */
	public function get_columns( string $report_key, bool $include_comparison = false, ?string $interval = null ) {
		$controller = $this->get_controller( $report_key );
		if ( \is_wp_error( $controller ) ) {
			return $controller;
		}

		$columns = $controller->get_column_headers( $interval );

		if ( $include_comparison ) {
			$comparison_columns = array();
			foreach ( $columns as $key => $label ) {
				$comparison_columns[ Report_Data_Fetcher::COMPARISON_INDEX_PREFIX . $key ] = sprintf(
					/* translators: %s: the column label, e.g. "Orders". */
					__( '%s (Previous Period)', 'jetpack-premium-analytics' ),
					$label
				);
			}
			$columns = array_merge( $columns, $comparison_columns );
		}

		return $columns;
	}

	/**
	 * Get row formatter for a report type.
	 *
	 * @param string      $report_key The report key.
	 * @param string|null $interval   Optional time interval for formatting.
	 * @return callable|\WP_Error The row formatter callback or error.
	 */
	public function get_row_formatter( string $report_key, ?string $interval = null ) {
		$controller = $this->get_controller( $report_key );
		if ( \is_wp_error( $controller ) ) {
			return $controller;
		}
		// Return a closure that captures the interval to avoid race conditions.
		return function ( $item ) use ( $controller, $interval ) {
			return $controller->format_row_with_comparison( $item, $interval );
		};
	}

	/**
	 * Get report label.
	 *
	 * @param string $report_key The report key.
	 * @return string|\WP_Error The report label or error.
	 */
	public function get_label( string $report_key ) {
		$controller = $this->get_controller( $report_key );
		if ( \is_wp_error( $controller ) ) {
			return $controller;
		}
		return $controller->get_report_label();
	}

	/**
	 * Build a filename base (no extension) for a report export: "<label>-<from>-to-<to>".
	 *
	 * @param string $report_key The report key.
	 * @param array  $params     Request parameters (reads 'from' and 'to').
	 * @return string The sanitized filename base.
	 */
	public function build_filename( string $report_key, array $params ): string {
		$label = $this->get_label( $report_key );
		if ( \is_wp_error( $label ) ) {
			$label = $report_key;
		}

		$from_ts = empty( $params['from'] ) ? false : strtotime( $params['from'] );
		$to_ts   = empty( $params['to'] ) ? false : strtotime( $params['to'] );

		return sprintf(
			'%s-%s-to-%s',
			sanitize_title( $label ),
			false === $from_ts ? '' : gmdate( 'Y-m-d', $from_ts ),
			false === $to_ts ? '' : gmdate( 'Y-m-d', $to_ts )
		);
	}

	/**
	 * Get batch limit for a report type.
	 *
	 * @param string $report_key The report key.
	 * @return int|\WP_Error The batch limit or error.
	 */
	public function get_batch_limit( string $report_key ) {
		$controller = $this->get_controller( $report_key );
		if ( \is_wp_error( $controller ) ) {
			return $controller;
		}
		return $controller->get_batch_limit();
	}

	/**
	 * Get controller instance for a report type.
	 *
	 * @param string $report_key The report key.
	 * @return Csv_Report_Controller_Interface|\WP_Error The controller instance or error.
	 */
	public function get_controller( string $report_key ) {
		if ( ! isset( $this->controllers[ $report_key ] ) ) {
			return new \WP_Error(
				'invalid_report_type',
				sprintf(
					/* translators: %s: Report type key. */
					__( 'Invalid report type: %s', 'jetpack-premium-analytics' ),
					$report_key
				),
				array( 'status' => 400 )
			);
		}
		return $this->controllers[ $report_key ];
	}
}
