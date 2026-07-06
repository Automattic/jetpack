<?php
/**
 * CSV Export REST API Controller
 *
 * Handles REST API requests for CSV report exports.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\LoggerInterface;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\LoggerTrait;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\Utilities;
use WC_REST_Controller;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

/**
 * CSV Export Controller class.
 *
 * @since $$next-version$$
 * @internal
 */
class CSVExportController extends WC_REST_Controller implements RegistrableInterface {

	use LoggerTrait;
	use Utilities;

	/**
	 * Plugin REST slug, matching the other Premium Analytics controllers.
	 */
	private const SLUG = 'jetpack-premium-analytics';

	/**
	 * Endpoint namespace.
	 *
	 * @var string
	 */
	protected $namespace;

	/**
	 * Route base.
	 *
	 * @var string
	 */
	protected $rest_base;

	/**
	 * Report registry instance.
	 *
	 * @var ReportRegistry
	 */
	private $registry;

	/**
	 * Data fetcher instance.
	 *
	 * @var ReportDataFetcher
	 */
	private $data_fetcher;

	/**
	 * CSV generator instance.
	 *
	 * @var ReportCSVGenerator
	 */
	private $csv_generator;

	/**
	 * Export scheduler instance.
	 *
	 * @var CSVExportScheduler
	 */
	private $scheduler;

	/**
	 * Constructor.
	 *
	 * @param ReportRegistry     $registry      The report registry.
	 * @param ReportDataFetcher  $data_fetcher  The data fetcher.
	 * @param ReportCSVGenerator $csv_generator The CSV generator.
	 * @param CSVExportScheduler $scheduler     The export scheduler.
	 * @param LoggerInterface    $logger        The logger.
	 */
	public function __construct(
		ReportRegistry $registry,
		ReportDataFetcher $data_fetcher,
		ReportCSVGenerator $csv_generator,
		CSVExportScheduler $scheduler,
		LoggerInterface $logger
	) {
		$this->namespace     = self::SLUG . '/v1';
		$this->rest_base     = 'reports/csv-export';
		$this->registry      = $registry;
		$this->data_fetcher  = $data_fetcher;
		$this->csv_generator = $csv_generator;
		$this->scheduler     = $scheduler;
		$this->logger        = $logger;
	}

	/**
	 * Register the controller.
	 *
	 * @return void
	 */
	public function register(): void {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
	}

	/**
	 * Register REST API routes.
	 *
	 * @return void
	 */
	public function register_routes(): void {
		$args = array(
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'create_export' ),
				'permission_callback' => array( $this, 'check_permission' ),
				'args'                => $this->get_endpoint_args(),
			),
		);
		// Set separately (not in the literal) to avoid mixing indexed endpoint entries with a keyed value.
		$args['schema'] = array( $this, 'get_public_item_schema' );

		register_rest_route( $this->namespace, $this->rest_base, $args );
	}

	/**
	 * Check if user has permission to export reports.
	 *
	 * Must match the capability the analytics proxy enforces (`manage_options` for the
	 * `analytics` prefix in Api_Proxy_Controller); otherwise the route would advertise
	 * access the async data fetch cannot honor, scheduling a job that then fails.
	 *
	 * @return bool True if user has permission.
	 */
	public function check_permission(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Get endpoint arguments.
	 *
	 * @return array Endpoint arguments.
	 */
	private function get_endpoint_args(): array {
		return array(
			'report_type'     => array(
				'description'       => __( 'The type of report to export.', 'jetpack-premium-analytics' ),
				'type'              => 'string',
				'required'          => true,
				'validate_callback' => array( $this, 'validate_report_type' ),
			),
			'from'            => array(
				'description'       => __( 'Start date for the report period (ISO 8601 format).', 'jetpack-premium-analytics' ),
				'type'              => 'string',
				'format'            => 'date-time',
				'required'          => true,
				'validate_callback' => array( $this, 'validate_from_date' ),
			),
			'to'              => array(
				'description'       => __( 'End date for the report period (ISO 8601 format).', 'jetpack-premium-analytics' ),
				'type'              => 'string',
				'format'            => 'date-time',
				'required'          => true,
				'validate_callback' => array( $this, 'validate_to_date' ),
			),
			'interval'        => array(
				'description'       => __( 'Time interval for grouping data.', 'jetpack-premium-analytics' ),
				'type'              => 'string',
				'default'           => 'day',
				'enum'              => array( 'hour', 'day', 'week', 'month', 'quarter', 'year' ),
				'validate_callback' => 'rest_validate_request_arg',
			),
			'compare_from'    => array(
				'description'       => __( 'Start date for comparison period (ISO 8601 format).', 'jetpack-premium-analytics' ),
				'type'              => 'string',
				'format'            => 'date-time',
				'validate_callback' => array( $this, 'validate_compare_from_date' ),
			),
			'compare_to'      => array(
				'description'       => __( 'End date for comparison period (ISO 8601 format).', 'jetpack-premium-analytics' ),
				'type'              => 'string',
				'format'            => 'date-time',
				'validate_callback' => array( $this, 'validate_compare_to_date' ),
			),
			'delivery_method' => array(
				'description' => __( 'Delivery method for the export.', 'jetpack-premium-analytics' ),
				'type'        => 'string',
				'default'     => 'download',
				'enum'        => array( 'download', 'email' ),
			),
		);
	}

	/**
	 * Validate report type parameter.
	 *
	 * @param mixed $value The parameter value.
	 * @return bool|WP_Error True if valid, WP_Error otherwise.
	 */
	public function validate_report_type( $value ) {
		if ( ! is_string( $value ) || ! $this->registry->is_registered( $value ) ) {
			return new WP_Error(
				'invalid_report_type',
				sprintf(
					/* translators: %s: Report type */
					__( 'Invalid report type: %s', 'jetpack-premium-analytics' ),
					is_string( $value ) ? $value : wp_json_encode( $value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE )
				),
				array( 'status' => 400 )
			);
		}
		return true;
	}

	/**
	 * Validate from date parameter.
	 *
	 * @param mixed           $value   The parameter value.
	 * @param WP_REST_Request $request The request object.
	 * @param string          $param   The parameter name.
	 * @return bool|WP_Error True if valid, WP_Error otherwise.
	 */
	public function validate_from_date( $value, WP_REST_Request $request, string $param ) {
		// First validate the basic date format.
		$validated = rest_validate_request_arg( $value, $request, $param );
		if ( is_wp_error( $validated ) ) {
			return $validated;
		}

		// Check if 'to' date is provided and validate the relationship.
		$to_date = $request->get_param( 'to' );
		if ( $to_date ) {
			$from_timestamp = strtotime( $value );
			$to_timestamp   = strtotime( $to_date );

			if ( $from_timestamp >= $to_timestamp ) {
				return new WP_Error(
					'invalid_date_range',
					__( 'The "from" date must be before the "to" date.', 'jetpack-premium-analytics' ),
					array( 'status' => 400 )
				);
			}
		}

		return true;
	}

	/**
	 * Validate to date parameter.
	 *
	 * @param mixed           $value   The parameter value.
	 * @param WP_REST_Request $request The request object.
	 * @param string          $param   The parameter name.
	 * @return bool|WP_Error True if valid, WP_Error otherwise.
	 */
	public function validate_to_date( $value, WP_REST_Request $request, string $param ) {
		// First validate the basic date format.
		$validated = rest_validate_request_arg( $value, $request, $param );
		if ( is_wp_error( $validated ) ) {
			return $validated;
		}

		$to_timestamp = strtotime( $value );

		// Check that the date is not beyond today (compare at day level, not time level).
		$to_date_only    = gmdate( 'Y-m-d', $to_timestamp );
		$today_date_only = gmdate( 'Y-m-d', time() );

		if ( $to_date_only > $today_date_only ) {
			return new WP_Error(
				'future_date',
				__( 'The "to" date cannot be later than today.', 'jetpack-premium-analytics' ),
				array( 'status' => 400 )
			);
		}

		// Check if 'from' date is provided and validate the relationship.
		$from_date = $request->get_param( 'from' );
		if ( $from_date ) {
			$from_timestamp = strtotime( $from_date );

			if ( $from_timestamp >= $to_timestamp ) {
				return new WP_Error(
					'invalid_date_range',
					__( 'The "from" date must be before the "to" date.', 'jetpack-premium-analytics' ),
					array( 'status' => 400 )
				);
			}
		}

		return true;
	}

	/**
	 * Validate compare_from date parameter.
	 *
	 * @param mixed           $value   The parameter value.
	 * @param WP_REST_Request $request The request object.
	 * @param string          $param   The parameter name.
	 * @return bool|WP_Error True if valid, WP_Error otherwise.
	 */
	public function validate_compare_from_date( $value, WP_REST_Request $request, string $param ) {
		// First validate the basic date format.
		$validated = rest_validate_request_arg( $value, $request, $param );
		if ( is_wp_error( $validated ) ) {
			return $validated;
		}

		// Check if compare_to date is provided and validate the relationship.
		$compare_to = $request->get_param( 'compare_to' );
		if ( $compare_to ) {
			return $this->validate_compare_period( $value, $compare_to, $request );
		}

		// If compare_from is provided but compare_to is not, return error.
		return new WP_Error(
			'missing_compare_to',
			__( 'The "compare_to" parameter is required when "compare_from" is provided.', 'jetpack-premium-analytics' ),
			array( 'status' => 400 )
		);
	}

	/**
	 * Validate compare_to date parameter.
	 *
	 * @param mixed           $value   The parameter value.
	 * @param WP_REST_Request $request The request object.
	 * @param string          $param   The parameter name.
	 * @return bool|WP_Error True if valid, WP_Error otherwise.
	 */
	public function validate_compare_to_date( $value, WP_REST_Request $request, string $param ) {
		// First validate the basic date format.
		$validated = rest_validate_request_arg( $value, $request, $param );
		if ( is_wp_error( $validated ) ) {
			return $validated;
		}

		$compare_to_timestamp = strtotime( $value );

		// Check that the date is not beyond today (compare at day level, not time level).
		$compare_to_date_only = gmdate( 'Y-m-d', $compare_to_timestamp );
		$today_date_only      = gmdate( 'Y-m-d', time() );

		if ( $compare_to_date_only > $today_date_only ) {
			return new WP_Error(
				'future_date',
				__( 'The "compare_to" date cannot be later than today.', 'jetpack-premium-analytics' ),
				array( 'status' => 400 )
			);
		}

		// Check if compare_from date is provided and validate the relationship.
		$compare_from = $request->get_param( 'compare_from' );
		if ( $compare_from ) {
			return $this->validate_compare_period( $compare_from, $value, $request );
		}

		// If compare_to is provided but compare_from is not, return error.
		return new WP_Error(
			'missing_compare_from',
			__( 'The "compare_from" parameter is required when "compare_to" is provided.', 'jetpack-premium-analytics' ),
			array( 'status' => 400 )
		);
	}

	/**
	 * Validate comparison period dates and duration.
	 *
	 * @param string          $compare_from The compare_from date.
	 * @param string          $compare_to   The compare_to date.
	 * @param WP_REST_Request $request      The request object.
	 * @return bool|WP_Error True if valid, WP_Error otherwise.
	 */
	private function validate_compare_period( string $compare_from, string $compare_to, WP_REST_Request $request ) {
		$compare_from_timestamp = strtotime( $compare_from );
		$compare_to_timestamp   = strtotime( $compare_to );

		if ( $compare_from_timestamp >= $compare_to_timestamp ) {
			return new WP_Error(
				'invalid_compare_date_range',
				__( 'The "compare_from" date must be before the "compare_to" date.', 'jetpack-premium-analytics' ),
				array( 'status' => 400 )
			);
		}

		// Validate that comparison period length matches original period length.
		$from_date = $request->get_param( 'from' );
		$to_date   = $request->get_param( 'to' );

		if ( $from_date && $to_date ) {
			$original_duration = strtotime( $to_date ) - strtotime( $from_date );
			$compare_duration  = $compare_to_timestamp - $compare_from_timestamp;

			if ( $original_duration !== $compare_duration ) {
				return new WP_Error(
					'invalid_compare_period_length',
					__( 'The comparison period length must match the original period length.', 'jetpack-premium-analytics' ),
					array( 'status' => 400 )
				);
			}
		}

		return true;
	}

	/**
	 * Create a CSV export.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	public function create_export( WP_REST_Request $request ) {
		$report_type     = $request->get_param( 'report_type' );
		$delivery_method = $request->get_param( 'delivery_method' );

		// Get controller to access additional params.
		$controller = $this->registry->get_controller( $report_type );
		if ( is_wp_error( $controller ) ) {
			return $controller;
		}

		// Get report data endpoint.
		$data_endpoint = $this->registry->get_data_endpoint( $report_type );
		if ( is_wp_error( $data_endpoint ) ) {
			return $data_endpoint;
		}

		// Extract parameters.
		$params = array(
			'from'         => $request->get_param( 'from' ),
			'to'           => $request->get_param( 'to' ),
			'interval'     => $request->get_param( 'interval' ),
			'compare_from' => $request->get_param( 'compare_from' ),
			'compare_to'   => $request->get_param( 'compare_to' ),
		);

		// Merge controller-specific additional parameters.
		$params = array_merge( $params, $controller->get_additional_params() );

		// Handle delivery method.
		if ( 'email' === $delivery_method ) {
			return $this->schedule_email_export( $report_type, $params );
		}

		return $this->generate_download_export( $report_type, $data_endpoint, $params );
	}

	/**
	 * Generate and stream CSV for download.
	 *
	 * @param string $report_type  The report type.
	 * @param string $data_endpoint The data endpoint.
	 * @param array  $params       Request parameters.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	private function generate_download_export( string $report_type, string $data_endpoint, array $params ) {
		// Get controller for default values.
		$controller = $this->registry->get_controller( $report_type );
		if ( is_wp_error( $controller ) ) {
			$controller = null; // Fallback to null if controller not found.
		}

		// Fetch data.
		$data = $this->data_fetcher->fetch( $params, $data_endpoint, $controller );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		// Determine if comparison mode.
		$is_comparison = $this->is_comparison_request( $params );

		// Get columns.
		$columns = $this->registry->get_columns( $report_type, $is_comparison, $params['interval'] ?? null );
		if ( is_wp_error( $columns ) ) {
			return $columns;
		}

		// Get row formatter.
		$formatter = $this->registry->get_row_formatter( $report_type );
		if ( is_wp_error( $formatter ) ) {
			return $formatter;
		}

		// Generate filename.
		$filename = $this->generate_filename( $report_type, $params );

		// Generate CSV file.
		$file_path = $this->csv_generator->generate( $data, $columns, $formatter, $filename );
		if ( is_wp_error( $file_path ) ) {
			return $file_path;
		}

		// Stream the file. If streaming fails (headers already sent, missing file), return a
		// structured error instead of silently deleting and exiting with an empty response.
		$streamed = $this->csv_generator->stream_file( $file_path, $filename . '.csv' );
		if ( ! $streamed ) {
			$this->csv_generator->delete_file( $file_path );
			return new WP_Error(
				'csv_stream_failed',
				__( 'Failed to stream the export file.', 'jetpack-premium-analytics' ),
				array( 'status' => 500 )
			);
		}

		// Clean up file after successful streaming.
		$this->csv_generator->delete_file( $file_path );

		// The file body has already been written to the output buffer; terminate so the REST
		// stack does not append a JSON response. (Streaming a file is inherently a non-REST
		// response; there is no cleaner hook once headers + body are sent.)
		exit;
	}

	/**
	 * Schedule email export via Action Scheduler.
	 *
	 * @param string $report_type The report type.
	 * @param array  $params      Request parameters.
	 * @return WP_REST_Response|WP_Error Response or error.
	 */
	private function schedule_email_export( string $report_type, array $params ) {
		$user   = wp_get_current_user();
		$job_id = $this->scheduler->schedule_export( $report_type, $params, $user->ID, $user->user_email );

		if ( is_wp_error( $job_id ) ) {
			return $job_id;
		}

		$this->logger->log_message(
			sprintf( 'Scheduled CSV export job %d for user %d', $job_id, $user->ID ),
			__METHOD__
		);

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Export has been scheduled. You will receive an email when it is ready.', 'jetpack-premium-analytics' ),
				'job_id'  => $job_id,
			),
			202
		);
	}

	/**
	 * Generate filename for export.
	 *
	 * @param string $report_type The report type.
	 * @param array  $params      Request parameters.
	 * @return string The filename (without extension).
	 */
	private function generate_filename( string $report_type, array $params ): string {
		$label = $this->registry->get_label( $report_type );
		if ( is_wp_error( $label ) ) {
			$label = $report_type;
		}

		$safe_label = sanitize_title( $label );
		$from_date  = gmdate( 'Y-m-d', strtotime( $params['from'] ) );
		$to_date    = gmdate( 'Y-m-d', strtotime( $params['to'] ) );

		return sprintf( '%s-%s-to-%s', $safe_label, $from_date, $to_date );
	}

	/**
	 * Get the schema for the endpoint.
	 *
	 * @return array The schema.
	 */
	public function get_item_schema(): array {
		return array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'csv-export',
			'type'       => 'object',
			'properties' => array(
				'success' => array(
					'description' => __( 'Whether the export was successful.', 'jetpack-premium-analytics' ),
					'type'        => 'boolean',
					'context'     => array( 'view' ),
				),
				'message' => array(
					'description' => __( 'Status message.', 'jetpack-premium-analytics' ),
					'type'        => 'string',
					'context'     => array( 'view' ),
				),
				'job_id'  => array(
					'description' => __( 'Action Scheduler job ID (for email exports).', 'jetpack-premium-analytics' ),
					'type'        => 'integer',
					'context'     => array( 'view' ),
				),
			),
		);
	}
}
