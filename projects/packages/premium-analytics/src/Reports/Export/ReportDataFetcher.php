<?php
/**
 * Report Data Fetcher
 *
 * Fetches report data via ApiProxy and handles comparison mode.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\LoggerTrait;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\Utilities;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\LoggerInterface;
use WP_REST_Request;
use WP_Error;


/**
 * Data Fetcher class for retrieving report data.
 *
 * @since x.x.x
 * @internal
 */
class ReportDataFetcher {

	use LoggerTrait;
	use Utilities;

	/**
	 * The index prefix for comparison data in arrays.
	 *
	 * @var string
	 */
	const COMPARISON_INDEX_PREFIX = 'comparison_';

	/**
	 * Constructor.
	 *
	 * @param LoggerInterface $logger The logger instance.
	 */
	public function __construct( LoggerInterface $logger ) {
		$this->logger = $logger;
	}

	/**
	 * Fetch report data based on parameters.
	 *
	 * @param array                             $params        Request parameters.
	 * @param string                            $data_endpoint The data endpoint to fetch from.
	 * @param CSVReportControllerInterface|null $controller Optional controller for default values.
	 * @return array|\WP_Error Report data array or error.
	 */
	public function fetch( array $params, string $data_endpoint, ?CSVReportControllerInterface $controller = null ) {
		// Fetch data based on whether this is a comparison request.
		if ( $this->is_comparison_request( $params ) ) {
			return $this->fetch_comparison_data( $data_endpoint, $params, $controller );
		}

		return $this->fetch_period_data( $data_endpoint, $params, 'single period' );
	}

	/**
	 * Fetch and merge comparison data.
	 *
	 * @param string                            $endpoint   The API endpoint.
	 * @param array                             $params     Request parameters.
	 * @param CSVReportControllerInterface|null $controller Optional controller for default values.
	 * @return array|\WP_Error Merged report data or error.
	 */
	private function fetch_comparison_data( string $endpoint, array $params, ?CSVReportControllerInterface $controller = null ) {
		// Build parameters for both periods.
		$base_params = $this->extract_base_params( $params );

		// Fetch original period data.
		$original_params = array_merge(
			$base_params,
			array(
				'from' => $params['from'],
				'to'   => $params['to'],
			)
		);
		$original_data   = $this->fetch_period_data( $endpoint, $original_params, 'original period' );
		if ( is_wp_error( $original_data ) ) {
			return $original_data;
		}

		// Fetch comparison period data.
		$comparison_params = array_merge(
			$base_params,
			array(
				'from' => $params['compare_from'],
				'to'   => $params['compare_to'],
			)
		);
		$comparison_data   = $this->fetch_period_data( $endpoint, $comparison_params, 'comparison period' );
		if ( is_wp_error( $comparison_data ) ) {
			return $comparison_data;
		}

		// Merge the datasets.
		$merged_data = $this->merge_datasets( $original_data, $comparison_data, $controller );

		$this->logger->log_message(
			sprintf( 'Fetched and merged comparison data: %d rows', count( $merged_data['data'] ?? array() ) ),
			__METHOD__
		);

		return $merged_data;
	}

	/**
	 * Extract base parameters (excluding date range and comparison params).
	 *
	 * @param array $params Request parameters.
	 * @return array Base parameters.
	 */
	private function extract_base_params( array $params ): array {
		$base_params = array( 'interval' => $params['interval'] ?? 'day' );

		$excluded_params = array( 'endpoint', 'from', 'to', 'compare_from', 'compare_to' );

		foreach ( $params as $key => $value ) {
			if ( ! in_array( $key, $excluded_params, true ) ) {
				$base_params[ $key ] = $value;
			}
		}

		return $base_params;
	}

	/**
	 * Fetch data for a single period with error handling and logging.
	 *
	 * @param string $endpoint    The API endpoint.
	 * @param array  $params      Query parameters.
	 * @param string $period_name Human-readable period name for logging.
	 * @return array|\WP_Error Report data or error.
	 */
	private function fetch_period_data( string $endpoint, array $params, string $period_name ) {
		$response = $this->make_proxy_request( $endpoint, $params );

		if ( is_wp_error( $response ) ) {
			$this->logger->log_error(
				sprintf( 'Failed to fetch %s data: %s', $period_name, $response->get_error_message() ),
				__METHOD__
			);
			return $response;
		}

		$this->logger->log_message(
			sprintf( 'Fetched %s data: %d rows', $period_name, count( $response['data'] ?? array() ) ),
			__METHOD__
		);

		return $response;
	}

	/**
	 * Merge comparison data with original data.
	 *
	 * Prefixes comparison keys and merges them into the original data array by index.
	 * Handles mismatched data lengths by adding empty comparison data when needed.
	 *
	 * @param array                             $original_data   The original report data.
	 * @param array                             $comparison_data The comparison report data.
	 * @param CSVReportControllerInterface|null $controller Optional controller for default values.
	 * @param string                            $prefix          The prefix to use for comparison keys.
	 * @return array The merged data with comparison columns.
	 */
	private function merge_datasets( array $original_data, array $comparison_data, ?CSVReportControllerInterface $controller = null, string $prefix = self::COMPARISON_INDEX_PREFIX ): array {
		$original_items   = $original_data['data'] ?? array();
		$comparison_items = $comparison_data['data'] ?? array();

		// Merge comparison data into original items by index.
		foreach ( $original_items as $index => &$original_item ) {
			$comparison_item = $comparison_items[ $index ] ?? $this->create_empty_item( $original_item, $controller );

			// Prefix and merge comparison data.
			foreach ( $comparison_item as $key => $value ) {
				$original_item[ $prefix . $key ] = $value;
			}
		}
		unset( $original_item );

		$original_data['data'] = $original_items;
		return $original_data;
	}

	/**
	 * Create an empty item with default values based on a template.
	 *
	 * @param array                             $template_item The template item to use for structure.
	 * @param CSVReportControllerInterface|null $controller Optional controller for default values.
	 * @return array An array with the same keys but default values.
	 */
	private function create_empty_item( array $template_item, ?CSVReportControllerInterface $controller = null ): array {
		$empty = array();
		foreach ( array_keys( $template_item ) as $key ) {
			$empty[ $key ] = $this->get_default_value_for_field( $key, $controller );
		}
		return $empty;
	}

	/**
	 * Get the default value for a field based on its type/name.
	 *
	 * @param string                            $field_name The field name.
	 * @param CSVReportControllerInterface|null $controller Optional controller for default values.
	 * @return mixed The default value for the field.
	 */
	private function get_default_value_for_field( string $field_name, ?CSVReportControllerInterface $controller = null ) {
		// Use controller-specific defaults if available.
		if ( $controller ) {
			$defaults = $controller->get_default_values();
			if ( isset( $defaults[ $field_name ] ) ) {
				return $defaults[ $field_name ];
			}
		}

		// Default to empty string for any unknown fields.
		// This ensures the system is robust and doesn't require updates
		// to this class for every new field addition.
		return '';
	}

	/**
	 * Make an internal REST API call to the ApiProxy endpoint.
	 *
	 * @param string $endpoint The endpoint to call (e.g., 'reports/orders/by-date').
	 * @param array  $params   Query parameters.
	 * @return array|\WP_Error The response data or error.
	 */
	private function make_proxy_request( string $endpoint, array $params ) {
		// Re-pointed from WooCommerce Analytics' own /wc/v3/<slug>/proxy route to Premium
		// Analytics' existing data proxy, which forwards the `analytics` prefix to the WPCOM
		// analytics API (v2 base). The endpoint lives in the route path.
		$proxy_route = sprintf( '/jetpack-premium-analytics/v1/proxy/v2/analytics/%s', $endpoint );

		// Remaining params are forwarded as query args. They must be set as query params (the
		// proxy reads get_query_params()), not appended to the route string, or they would
		// pollute the captured `endpoint` path segment and fail its validation.
		unset( $params['endpoint'] );

		$request = new WP_REST_Request( 'GET', $proxy_route );
		$request->set_query_params( $params );

		// Make internal REST API call.
		$response = rest_do_request( $request );

		// Check for errors.
		if ( $response->is_error() ) {
			$error_data = $response->as_error();
			$this->logger->log_error(
				'Proxy request failed: ' . $error_data->get_error_message(),
				__METHOD__
			);
			return $error_data;
		}

		// Get response data and ensure it's an array.
		$data = $response->get_data();

		// Convert to array if it's an object.
		if ( is_object( $data ) ) {
			$data = json_decode( wp_json_encode( $data ), true );
		}

		// Normalize response structure: some endpoints return 'items' instead of 'data'.
		if ( isset( $data['items'] ) && ! isset( $data['data'] ) ) {
			$data['data'] = $data['items'];
			unset( $data['items'] );
		}

		// Check if the response has error status (API returned error).
		if ( isset( $data['data']['status'] ) && $data['data']['status'] >= 400 ) {
			$message = $data['message'] ?? 'Unknown error from API';
			return new WP_Error(
				'api_error',
				$message,
				array( 'status' => $data['data']['status'] )
			);
		}

		return $data;
	}
}
