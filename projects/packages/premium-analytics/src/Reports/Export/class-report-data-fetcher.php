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

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\Logger_Interface;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\MergeStrategy\Id_Based_Merge_Strategy;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\MergeStrategy\Index_Based_Merge_Strategy;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\Logger_Trait;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\Utilities;
use WP_Error;
use WP_REST_Request;

/**
 * Data Fetcher class for retrieving report data.
 *
 * @since $$next-version$$
 */
class Report_Data_Fetcher {

	use Logger_Trait;
	use Utilities;

	/**
	 * The index prefix for comparison data in arrays.
	 *
	 * @var string
	 */
	const COMPARISON_INDEX_PREFIX = 'comparison_';

	/**
	 * Maximum number of IDs to include in an IN filter.
	 *
	 * This limit prevents URL length issues (typical limit is 2048 chars).
	 * With an average ID length of 4 chars, 300 IDs ≈ 1200 chars plus other params.
	 *
	 * @var int
	 */
	const MAX_ID_FILTER_COUNT = 300;

	/**
	 * Constructor.
	 *
	 * @param Logger_Interface $logger The logger instance.
	 */
	public function __construct( Logger_Interface $logger ) {
		$this->logger = $logger;
	}

	/**
	 * Fetch report data based on parameters.
	 *
	 * @param array                           $params     Request parameters.
	 * @param Csv_Report_Controller_Interface $controller Controller for endpoint and matching field context.
	 * @return array|\WP_Error Report data array or error.
	 */
	public function fetch( array $params, Csv_Report_Controller_Interface $controller ) {
		// Merge controller-specific additional parameters (controller defaults first, user params override).
		// get_additional_params() is part of the interface, so this applies to any implementation.
		$params = array_merge( $controller->get_additional_params(), $params );

		$fields = $controller->get_fields();
		if ( ! empty( $fields ) ) {
			$params['fields'] = $fields;
		}

		// Fetch data based on whether this is a comparison request.
		if ( $this->is_comparison_request( $params ) ) {
			return $this->fetch_comparison_data( $params, $controller );
		}

		return $this->fetch_period_data( $params, 'single period', $controller );
	}

	/**
	 * Fetch and merge comparison data.
	 *
	 * @param array                           $params     Request parameters.
	 * @param Csv_Report_Controller_Interface $controller Controller for endpoint and matching field context.
	 * @return array|\WP_Error Merged report data or error.
	 */
	private function fetch_comparison_data( array $params, Csv_Report_Controller_Interface $controller ) {
		// fetch() is public library API; the REST layer marks these required, but guard here too.
		foreach ( array( 'from', 'to', 'compare_from', 'compare_to' ) as $required ) {
			if ( empty( $params[ $required ] ) ) {
				return new WP_Error(
					'missing_comparison_param',
					/* translators: %s: parameter name. */
					sprintf( __( 'Missing required comparison parameter: %s', 'jetpack-premium-analytics' ), $required ),
					array( 'status' => 400 )
				);
			}
		}

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
		$original_data   = $this->fetch_period_data( $original_params, 'original period', $controller );
		if ( is_wp_error( $original_data ) ) {
			return $original_data;
		}

		// Check if we need ID-based matching.
		$matching_field = $controller->get_matching_field();

		// Validate matching field exists in data if specified.
		if ( $matching_field && ! empty( $original_data['data'] ) ) {
			$first_item = $original_data['data'][0];
			if ( ! isset( $first_item[ $matching_field ] ) ) {
				$this->logger->log_error(
					sprintf(
						'Matching field "%s" not found in original data. Available fields: %s',
						$matching_field,
						implode( ', ', array_keys( $first_item ) )
					),
					__METHOD__
				);
				// Fall back to null (index-based matching) instead of failing.
				$matching_field = null;
			}
		}

		// Fetch comparison period data.
		$comparison_params = array_merge(
			$base_params,
			array(
				'from' => $params['compare_from'],
				'to'   => $params['compare_to'],
			)
		);

		// If matching field specified, filter comparison to only original period IDs.
		if ( $matching_field && ! empty( $original_data['data'] ) ) {
			$ids = $this->extract_ids_from_data( $original_data['data'], $matching_field, $controller );
			if ( ! empty( $ids ) ) {
				// Check if ID count exceeds the maximum.
				if ( count( $ids ) > self::MAX_ID_FILTER_COUNT ) {
					$this->logger->log_error(
						sprintf(
							'ID count (%d) exceeds maximum (%d) for field "%s". Skipping ID filter - comparison will fetch all data.',
							count( $ids ),
							self::MAX_ID_FILTER_COUNT,
							$matching_field
						),
						__METHOD__
					);
				} else {
					$comparison_params = $this->add_id_filter( $comparison_params, $matching_field, $ids, $controller );
				}
			}
		}

		$comparison_data = $this->fetch_period_data( $comparison_params, 'comparison period', $controller );
		if ( is_wp_error( $comparison_data ) ) {
			return $comparison_data;
		}

		// Merge the datasets.
		$merged_data = $this->merge_datasets(
			$original_data,
			$comparison_data,
			self::COMPARISON_INDEX_PREFIX,
			$matching_field,
			$controller
		);

		$this->logger->log_message(
			sprintf(
				'Fetched and merged comparison data: %d rows (matching: %s)',
				count( $merged_data['data'] ?? array() ),
				$matching_field ? "by $matching_field" : 'by index'
			),
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
	 * Checks if the controller has a custom fetch_data() method and uses that if available,
	 * otherwise falls back to the standard proxy request.
	 *
	 * @param array                           $params      Query parameters.
	 * @param string                          $period_name Human-readable period name for logging.
	 * @param Csv_Report_Controller_Interface $controller  The controller for endpoint and custom fetch.
	 * @return array|\WP_Error Report data or error.
	 */
	private function fetch_period_data( array $params, string $period_name, Csv_Report_Controller_Interface $controller ) {
		$endpoint = $controller->get_data_endpoint();

		$response = $this->request_endpoint_data( $endpoint, $params, $controller );

		// Some analytics endpoints have strict/limited `fields` enums and reject
		// otherwise-valid requests. Retry once without `fields` to fetch full payload.
		if (
			isset( $params['fields'] ) &&
			is_wp_error( $response ) &&
			$this->is_invalid_fields_error( $response )
		) {
			unset( $params['fields'] );
			$this->logger->log_message(
				sprintf( 'Retrying %s without `fields` parameter', $endpoint ),
				__METHOD__
			);

			$response = $this->request_endpoint_data( $endpoint, $params, $controller );
		}

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
	 * Request endpoint data using controller override when available.
	 *
	 * @param string                          $endpoint   Endpoint to request.
	 * @param array                           $params     Query parameters.
	 * @param Csv_Report_Controller_Interface $controller The active report controller.
	 * @return array|\WP_Error Response data or error.
	 */
	private function request_endpoint_data(
		string $endpoint,
		array $params,
		Csv_Report_Controller_Interface $controller
	) {
		if ( method_exists( $controller, 'fetch_data' ) ) {
			// @phan-suppress-next-line PhanUndeclaredMethod -- Optional hook, guarded by method_exists() above; not part of the interface.
			return $controller->fetch_data( $endpoint, $params );
		}

		return $this->make_proxy_request( $endpoint, $params );
	}

	/**
	 * Check whether a response error indicates invalid `fields` parameter usage.
	 *
	 * @param WP_Error $error The response error.
	 * @return bool True when the API rejected the fields parameter.
	 */
	private function is_invalid_fields_error( WP_Error $error ): bool {
		if ( 'rest_invalid_param' !== $error->get_error_code() ) {
			return false;
		}

		$data = $error->get_error_data();

		return is_array( $data ) && isset( $data['params']['fields'] );
	}

	/**
	 * Merge comparison data with original data.
	 *
	 * Supports two strategies:
	 * 1. Index-based (default): Merges by position (row 0 with row 0)
	 * 2. ID-based: Merges by matching field (product_id, coupon_code, etc.)
	 *
	 * @param array                           $original_data   Original report data.
	 * @param array                           $comparison_data Comparison report data.
	 * @param string                          $prefix          Prefix for comparison keys.
	 * @param string|null                     $matching_field  Field to match on, or null for index.
	 * @param Csv_Report_Controller_Interface $controller      Controller for default values.
	 * @return array Merged data with comparison columns.
	 */
	private function merge_datasets(
		array $original_data,
		array $comparison_data,
		string $prefix,
		?string $matching_field,
		Csv_Report_Controller_Interface $controller
	): array {
		$original_items   = $original_data['data'] ?? array();
		$comparison_items = $comparison_data['data'] ?? array();

		// Select appropriate merge strategy based on matching field.
		if ( $matching_field ) {
			$strategy = new Id_Based_Merge_Strategy( $matching_field, $this->logger );
		} else {
			$strategy = new Index_Based_Merge_Strategy( $this->logger );
		}

		// Delegate to strategy.
		$merged_items = $strategy->merge( $original_items, $comparison_items, $prefix, $controller );

		$original_data['data'] = $merged_items;
		return $original_data;
	}

	/**
	 * Extract IDs from data array using specified field.
	 *
	 * @param array                           $data       The data to extract IDs from.
	 * @param string                          $field      The field name containing the ID.
	 * @param Csv_Report_Controller_Interface $controller Controller to check empty row handling.
	 * @return array Array of unique IDs.
	 */
	private function extract_ids_from_data( array $data, string $field, Csv_Report_Controller_Interface $controller ): array {
		$ids = array();
		foreach ( $data as $item ) {
			if ( isset( $item[ $field ] ) && '' !== $item[ $field ] ) {
				$ids[] = $item[ $field ];
			} elseif ( $controller->should_include_empty_rows() ) {
				// Include a placeholder for empty values if controller includes empty rows.
				// This ensures comparison data is fetched for empty rows.
				$ids[] = '';
			}
		}
		return array_unique( $ids );
	}

	/**
	 * Add an IN filter to params for matching specific IDs.
	 *
	 * Supports two formats based on controller preference:
	 * - Array format: filters[0][value][]=id1&filters[0][value][]=id2 (for order-attribution endpoints)
	 * - Comma format: filters[0][value]=id1,id2 (default, more URL-efficient)
	 *
	 * Note: Caller should ensure ID count doesn't exceed MAX_ID_FILTER_COUNT to avoid
	 * URL length issues (typically 2048 chars).
	 *
	 * @param array                           $params     Parameters array.
	 * @param string                          $field      Field name to filter on.
	 * @param array                           $ids        Array of IDs to include.
	 * @param Csv_Report_Controller_Interface $controller Controller for format preference.
	 * @return array Modified params with filter added.
	 */
	private function add_id_filter( array $params, string $field, array $ids, Csv_Report_Controller_Interface $controller ): array {
		// Find next available filter index.
		$filter_index = 0;

		// Check both flat keys and nested array structure for existing filters.
		foreach ( array_keys( $params ) as $key ) {
			if ( preg_match( '/^filters\[(\d+)\]/', $key, $matches ) ) {
				$filter_index = max( $filter_index, (int) $matches[1] + 1 );
			}
		}
		if ( isset( $params['filters'] ) && is_array( $params['filters'] ) ) {
			$filter_index = max( $filter_index, count( $params['filters'] ) );
		}

		// Build filter as nested array structure.
		if ( ! isset( $params['filters'] ) ) {
			$params['filters'] = array();
		}

		// Add values in controller's preferred format.
		if ( $controller->use_array_filter_format() ) {
			// Array format: pass IDs as an array so each serializes to its own filter value entry.
			$params['filters'][ $filter_index ] = array(
				'key'     => $field,
				'compare' => 'IN',
				'value'   => $ids,
			);
		} else {
			// Comma-separated format (default, more URL-efficient).
			$params['filters'][ $filter_index ] = array(
				'key'     => $field,
				'compare' => 'IN',
				'value'   => implode( ',', $ids ),
			);
		}

		return $params;
	}

	/**
	 * Make an internal REST API call to the ApiProxy endpoint.
	 *
	 * @param string $endpoint The endpoint to call (e.g., 'reports/orders/by-date').
	 * @param array  $params   Query parameters.
	 * @return array|\WP_Error The response data or error.
	 */
	protected function make_proxy_request( string $endpoint, array $params ) {
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

		// Make internal REST API call. rest_do_request() always returns a WP_REST_Response
		// (never a WP_Error); proxy failures surface via $response->is_error() below.
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

		// Get response data and fully normalize to associative arrays. A top-level object OR a
		// top-level list whose items are stdClass both need converting, otherwise stdClass rows
		// would reach format_row_with_comparison( array $item ) and throw a TypeError.
		$data = $this->normalize_response_data( $response->get_data() );
		if ( is_wp_error( $data ) ) {
			return $data;
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

	/**
	 * Normalize REST response data to associative arrays.
	 *
	 * @param mixed $data Response data.
	 * @return mixed|WP_Error Normalized response data or an error when it cannot be encoded.
	 */
	private function normalize_response_data( $data ) {
		if ( ! is_object( $data ) && ! is_array( $data ) ) {
			return $data;
		}

		$encoded = wp_json_encode( $data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
		if ( false === $encoded ) {
			$this->logger->log_error( 'Failed to JSON encode proxy response data: ' . json_last_error_msg(), __METHOD__ );
			return new WP_Error(
				'proxy_response_encode_failed',
				__( 'Failed to normalize proxy response data.', 'jetpack-premium-analytics' )
			);
		}

		return json_decode( $encoded, true );
	}
}
