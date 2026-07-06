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
 * @internal
 */
class ReportRegistry {

	/**
	 * Singleton instance.
	 *
	 * @var ReportRegistry|null
	 */
	private static $instance = null;

	/**
	 * Registered controller instances.
	 *
	 * @var array<string, CSVReportControllerInterface>
	 */
	private $controllers = array();

	/**
	 * Private constructor for singleton.
	 */
	private function __construct() {
	}

	/**
	 * Get singleton instance.
	 *
	 * @return ReportRegistry
	 */
	public static function instance(): ReportRegistry {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Register a controller instance.
	 *
	 * @param CSVReportControllerInterface $controller The controller instance.
	 * @return bool True on success, false if already registered.
	 */
	public function register_controller( CSVReportControllerInterface $controller ): bool {
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
				$comparison_columns[ ReportDataFetcher::COMPARISON_INDEX_PREFIX . $key ] = $label . ' (' . __( 'Previous Period', 'jetpack-premium-analytics' ) . ')';
			}
			$columns = array_merge( $columns, $comparison_columns );
		}

		return $columns;
	}

	/**
	 * Get row formatter for a report type.
	 *
	 * @param string $report_key The report key.
	 * @return callable|\WP_Error The row formatter callback or error.
	 */
	public function get_row_formatter( string $report_key ) {
		$controller = $this->get_controller( $report_key );
		if ( \is_wp_error( $controller ) ) {
			return $controller;
		}
		return array( $controller, 'format_row_with_comparison' );
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
	 * @return CSVReportControllerInterface|\WP_Error The controller instance or error.
	 */
	public function get_controller( string $report_key ) {
		if ( ! isset( $this->controllers[ $report_key ] ) ) {
			return new \WP_Error(
				'invalid_report_type',
				sprintf( 'Invalid report type: %s', $report_key ),
				array( 'status' => 400 )
			);
		}
		return $this->controllers[ $report_key ];
	}
}
