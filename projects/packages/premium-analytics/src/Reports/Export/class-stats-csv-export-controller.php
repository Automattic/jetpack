<?php
/**
 * Stats CSV Export REST controller.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\Logger_Interface;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\Logger_Trait;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\Utilities;
use WP_Error;
use WP_REST_Controller;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Stats CSV Export Controller.
 *
 * @since $$next-version$$
 * @internal
 */
class Stats_Csv_Export_Controller extends WP_REST_Controller implements Registrable_Interface {

	use Logger_Trait;
	use Utilities;

	/**
	 * Plugin REST slug.
	 */
	private const SLUG = 'jetpack-premium-analytics';

	/**
	 * Report registry instance.
	 *
	 * @var Report_Registry
	 */
	private $registry;

	/**
	 * Data fetcher instance.
	 *
	 * @var Report_Data_Fetcher
	 */
	private $data_fetcher;

	/**
	 * CSV generator instance.
	 *
	 * @var Report_Csv_Generator
	 */
	private $csv_generator;

	/**
	 * Export scheduler instance.
	 *
	 * @var Wp_Cron_Export_Scheduler
	 */
	private $scheduler;

	/**
	 * Constructor.
	 *
	 * @param Report_Registry          $registry      The report registry.
	 * @param Report_Data_Fetcher      $data_fetcher  The data fetcher.
	 * @param Report_Csv_Generator     $csv_generator The CSV generator.
	 * @param Wp_Cron_Export_Scheduler $scheduler     The export scheduler.
	 * @param Logger_Interface         $logger        The logger.
	 */
	public function __construct(
		Report_Registry $registry,
		Report_Data_Fetcher $data_fetcher,
		Report_Csv_Generator $csv_generator,
		Wp_Cron_Export_Scheduler $scheduler,
		Logger_Interface $logger
	) {
		$this->namespace     = self::SLUG . '/v1';
		$this->rest_base     = 'reports/stats-csv-export';
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
		register_rest_route(
			$this->namespace,
			$this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( $this, 'create_export' ),
					'permission_callback' => array( $this, 'check_permission' ),
					'args'                => $this->get_endpoint_args(),
				),
			)
		);
	}

	/**
	 * Permission check.
	 *
	 * @return bool
	 */
	public function check_permission(): bool {
		return current_user_can( 'view_stats' ) || current_user_can( 'manage_options' );
	}

	/**
	 * Endpoint argument schema.
	 *
	 * @return array
	 */
	private function get_endpoint_args(): array {
		return array(
			'report_type'     => array(
				'description'       => __( 'The type of Stats report to export.', 'jetpack-premium-analytics' ),
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
	 * Validate that the report type is registered.
	 *
	 * @param mixed $value The parameter value.
	 * @return bool|WP_Error
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
	 * @return bool|WP_Error
	 */
	public function validate_from_date( $value, WP_REST_Request $request, string $param ) {
		$validated = rest_validate_request_arg( $value, $request, $param );
		if ( is_wp_error( $validated ) ) {
			return $validated;
		}

		$to_date = $request->get_param( 'to' );
		if ( $to_date ) {
			$from_timestamp = strtotime( (string) $value );
			$to_timestamp   = strtotime( (string) $to_date );

			if ( false !== $from_timestamp && false !== $to_timestamp && $from_timestamp >= $to_timestamp ) {
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
	 * @return bool|WP_Error
	 */
	public function validate_to_date( $value, WP_REST_Request $request, string $param ) {
		$validated = rest_validate_request_arg( $value, $request, $param );
		if ( is_wp_error( $validated ) ) {
			return $validated;
		}

		$to_timestamp = strtotime( (string) $value );
		if ( false !== $to_timestamp && wp_date( 'Y-m-d', $to_timestamp ) > current_datetime()->format( 'Y-m-d' ) ) {
			return new WP_Error(
				'future_date',
				__( 'The "to" date cannot be later than today.', 'jetpack-premium-analytics' ),
				array( 'status' => 400 )
			);
		}

		$from_date = $request->get_param( 'from' );
		if ( $from_date ) {
			$from_timestamp = strtotime( (string) $from_date );

			if ( false !== $from_timestamp && false !== $to_timestamp && $from_timestamp >= $to_timestamp ) {
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
	 * @return bool|WP_Error
	 */
	public function validate_compare_from_date( $value, WP_REST_Request $request, string $param ) {
		$validated = rest_validate_request_arg( $value, $request, $param );
		if ( is_wp_error( $validated ) ) {
			return $validated;
		}

		$compare_to = $request->get_param( 'compare_to' );
		if ( $compare_to ) {
			return $this->validate_compare_period( $value, $compare_to );
		}

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
	 * @return bool|WP_Error
	 */
	public function validate_compare_to_date( $value, WP_REST_Request $request, string $param ) {
		$validated = rest_validate_request_arg( $value, $request, $param );
		if ( is_wp_error( $validated ) ) {
			return $validated;
		}

		$compare_to_timestamp = strtotime( (string) $value );
		if ( false !== $compare_to_timestamp && wp_date( 'Y-m-d', $compare_to_timestamp ) > current_datetime()->format( 'Y-m-d' ) ) {
			return new WP_Error(
				'future_date',
				__( 'The "compare_to" date cannot be later than today.', 'jetpack-premium-analytics' ),
				array( 'status' => 400 )
			);
		}

		$compare_from = $request->get_param( 'compare_from' );
		if ( $compare_from ) {
			return $this->validate_compare_period( $compare_from, $value );
		}

		return new WP_Error(
			'missing_compare_from',
			__( 'The "compare_from" parameter is required when "compare_to" is provided.', 'jetpack-premium-analytics' ),
			array( 'status' => 400 )
		);
	}

	/**
	 * Validate the comparison period date order.
	 *
	 * @param string $compare_from The compare_from date.
	 * @param string $compare_to   The compare_to date.
	 * @return bool|WP_Error
	 */
	private function validate_compare_period( string $compare_from, string $compare_to ) {
		$compare_from_timestamp = strtotime( $compare_from );
		$compare_to_timestamp   = strtotime( $compare_to );

		if ( false !== $compare_from_timestamp && false !== $compare_to_timestamp && $compare_from_timestamp >= $compare_to_timestamp ) {
			return new WP_Error(
				'invalid_compare_date_range',
				__( 'The "compare_from" date must be before the "compare_to" date.', 'jetpack-premium-analytics' ),
				array( 'status' => 400 )
			);
		}

		return true;
	}

	/**
	 * Create a CSV export.
	 *
	 * @param WP_REST_Request $request The request object.
	 * @return WP_REST_Response|WP_Error
	 */
	public function create_export( WP_REST_Request $request ) {
		$report_type     = $request->get_param( 'report_type' );
		$delivery_method = $request->get_param( 'delivery_method' );

		$controller = $this->registry->get_controller( $report_type );
		if ( is_wp_error( $controller ) ) {
			return $controller;
		}

		$params = array(
			'from'         => $request->get_param( 'from' ),
			'to'           => $request->get_param( 'to' ),
			'interval'     => $request->get_param( 'interval' ),
			'compare_from' => $request->get_param( 'compare_from' ),
			'compare_to'   => $request->get_param( 'compare_to' ),
		);

		if ( 'email' === $delivery_method ) {
			return $this->schedule_email_export( $report_type, $params );
		}

		return $this->generate_download_export( $report_type, $params );
	}

	/**
	 * Fetch, generate, and stream the CSV for direct download.
	 *
	 * @param string $report_type The report type.
	 * @param array  $params      Request parameters.
	 * @return WP_REST_Response|WP_Error
	 */
	private function generate_download_export( string $report_type, array $params ) {
		$controller = $this->registry->get_controller( $report_type );
		if ( is_wp_error( $controller ) ) {
			return $controller;
		}

		$data = $this->data_fetcher->fetch( $params, $controller );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		$is_comparison = $this->is_comparison_request( $params );
		$interval      = $params['interval'] ?? null;

		$columns = $this->registry->get_columns( $report_type, $is_comparison, $interval );
		if ( is_wp_error( $columns ) ) {
			return $columns;
		}

		$formatter = $this->registry->get_row_formatter( $report_type, $interval );
		if ( is_wp_error( $formatter ) ) {
			return $formatter;
		}

		$filename  = $this->registry->build_filename( $report_type, $params );
		$file_path = $this->csv_generator->generate( $data, $columns, $formatter, $filename );
		if ( is_wp_error( $file_path ) ) {
			return $file_path;
		}

		$response = new WP_REST_Response( null, 200 );
		$this->attach_download_response_handler( $response, $file_path, $filename . '.csv' );

		return $response;
	}

	/**
	 * Attach a one-shot REST response handler that streams the generated CSV file.
	 *
	 * @param WP_REST_Response $response The response object that should trigger streaming.
	 * @param string           $file_path Generated CSV file path.
	 * @param string           $filename  Download filename.
	 * @return void
	 */
	private function attach_download_response_handler( WP_REST_Response $response, string $file_path, string $filename ): void {
		$handler = null;
		$handler = function ( $served, $result ) use ( &$handler, $response, $file_path, $filename ) {
			if ( $result !== $response ) {
				return $served;
			}

			remove_filter( 'rest_pre_serve_request', $handler, 10 );

			$streamed = $this->csv_generator->stream_file( $file_path, $filename );
			$this->csv_generator->delete_file( $file_path );

			return $streamed ? true : $served;
		};

		add_filter( 'rest_pre_serve_request', $handler, 10, 2 );
	}

	/**
	 * Schedule an async email export via WP-Cron.
	 *
	 * @param string $report_type The report type.
	 * @param array  $params      Request parameters.
	 * @return WP_REST_Response|WP_Error
	 */
	private function schedule_email_export( string $report_type, array $params ) {
		$user      = wp_get_current_user();
		$scheduled = $this->scheduler->schedule_export( $report_type, $params, $user->ID, $user->user_email );

		if ( is_wp_error( $scheduled ) ) {
			return $scheduled;
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => __( 'Export has been scheduled. You will receive an email when it is ready.', 'jetpack-premium-analytics' ),
			),
			202
		);
	}
}
