<?php
/**
 * CSV Export Scheduler
 *
 * Handles scheduling and processing of CSV export jobs via Action Scheduler.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\Logger_Interface;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\Logger_Trait;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\Utilities;

/**
 * CSV Export Scheduler class.
 *
 * @since $$next-version$$
 */
class Csv_Export_Scheduler implements Registrable_Interface {

	use Logger_Trait;
	use Utilities;

	/**
	 * Action hook name for CSV export jobs.
	 */
	const EXPORT_ACTION_HOOK = 'jetpack_premium_analytics_generate_csv_export';

	/**
	 * Action Scheduler group name.
	 */
	const ACTION_GROUP = 'jetpack-premium-analytics-csv-export';

	/**
	 * Cleanup hook name.
	 */
	const CLEANUP_HOOK = 'jetpack_premium_analytics_cleanup_csv_exports';

	/**
	 * Default retention period for CSV export files in seconds (48 hours).
	 */
	const DEFAULT_RETENTION_PERIOD = 2 * DAY_IN_SECONDS;

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
	 * Email sender instance.
	 *
	 * @var Csv_Export_Email
	 */
	private $email_sender;

	/**
	 * Constructor.
	 *
	 * @param Report_Registry      $registry      The report registry.
	 * @param Report_Data_Fetcher  $data_fetcher  The data fetcher.
	 * @param Report_Csv_Generator $csv_generator The CSV generator.
	 * @param Csv_Export_Email     $email_sender  The email sender.
	 * @param Logger_Interface     $logger        The logger.
	 */
	public function __construct(
		Report_Registry $registry,
		Report_Data_Fetcher $data_fetcher,
		Report_Csv_Generator $csv_generator,
		Csv_Export_Email $email_sender,
		Logger_Interface $logger
	) {
		$this->registry      = $registry;
		$this->data_fetcher  = $data_fetcher;
		$this->csv_generator = $csv_generator;
		$this->email_sender  = $email_sender;
		$this->logger        = $logger;

		// Inject logger into email sender if not already set.
		if ( null === $this->email_sender->get_logger() ) {
			$this->email_sender->set_logger( $this->logger );
		}
	}

	/**
	 * Register hooks.
	 *
	 * @return void
	 */
	public function register(): void {
		// Register export action callback.
		add_action( self::EXPORT_ACTION_HOOK, array( $this, 'process_export_job' ), 10, 4 );

		// Register cleanup action callback. The recurring cleanup is scheduled lazily from
		// schedule_export() (see below), so we avoid an Action Scheduler DB query on every request.
		add_action( self::CLEANUP_HOOK, array( $this, 'cleanup_old_exports' ) );
	}

	/**
	 * Schedule a CSV export job.
	 *
	 * @param string $report_type  The report type.
	 * @param array  $params       Report parameters.
	 * @param int    $user_id      User ID requesting the export.
	 * @param string $user_email   User email for notification.
	 * @return int|\WP_Error Action ID on success, WP_Error on failure.
	 */
	public function schedule_export( string $report_type, array $params, int $user_id, string $user_email ) {
		// Validate email format.
		if ( ! \is_email( $user_email ) ) {
			return new \WP_Error(
				'invalid_email',
				__( 'Invalid email address provided.', 'jetpack-premium-analytics' ),
				array( 'status' => 400 )
			);
		}

		if ( ! function_exists( 'as_enqueue_async_action' ) ) {
			$this->logger->log_error( 'Action Scheduler is not available', __METHOD__ );
			return new \WP_Error(
				'action_scheduler_unavailable',
				__( 'Action Scheduler is not available. Cannot schedule export.', 'jetpack-premium-analytics' ),
				array( 'status' => 503 )
			);
		}

		// Validate report type.
		if ( ! $this->registry->is_registered( $report_type ) ) {
			return new \WP_Error(
				'invalid_report_type',
				__( 'Invalid report type.', 'jetpack-premium-analytics' ),
				array( 'status' => 400 )
			);
		}

		try {
			// Schedule the action.
			// @phan-suppress-next-line PhanUndeclaredFunction -- Action Scheduler; guarded by function_exists() above.
			$action_id = as_enqueue_async_action(
				self::EXPORT_ACTION_HOOK,
				array(
					'report_type' => $report_type,
					'params'      => $params,
					'user_id'     => $user_id,
					'user_email'  => $user_email,
				),
				self::ACTION_GROUP
			);
		} catch ( \Throwable $e ) {
			$this->logger->log_exception( $e, __METHOD__ );
			return new \WP_Error(
				'schedule_failed',
				__( 'Failed to schedule export job.', 'jetpack-premium-analytics' ),
				array( 'status' => 500 )
			);
		}

		if ( ! $action_id ) {
			$this->logger->log_error( 'Failed to schedule CSV export action', __METHOD__ );
			return new \WP_Error(
				'schedule_failed',
				__( 'Failed to schedule export job.', 'jetpack-premium-analytics' ),
				array( 'status' => 500 )
			);
		}

		$this->logger->log_message(
			sprintf( 'Scheduled CSV export job %d for report type: %s', $action_id, $report_type ),
			__METHOD__
		);

		// Ensure the recurring cleanup exists now that exports are actually being used.
		$this->schedule_cleanup();

		return $action_id;
	}

	/**
	 * Process a scheduled export job.
	 *
	 * @param string $report_type The report type.
	 * @param array  $params      Report parameters.
	 * @param int    $user_id     User ID.
	 * @param string $user_email  User email.
	 * @return void
	 * @throws \Exception If export processing fails.
	 * @throws \Throwable If export processing fails.
	 */
	public function process_export_job( string $report_type, array $params, int $user_id, string $user_email ): void {
		$this->logger->log_message(
			sprintf( 'Processing CSV export job for report type: %s, user: %d', $report_type, $user_id ),
			__METHOD__
		);

		// Set user context for REST API calls.
		$previous_user_id = \get_current_user_id();
		\wp_set_current_user( $user_id );

		try {
			// Controller drives the data endpoint, requested fields, and merge strategy.
			$controller = $this->registry->get_controller( $report_type );
			if ( is_wp_error( $controller ) ) {
				throw new \Exception( $controller->get_error_message() );
			}

			// Fetch data.
			$data = $this->data_fetcher->fetch( $params, $controller );
			if ( is_wp_error( $data ) ) {
				throw new \Exception( $data->get_error_message() );
			}

			// Determine if comparison mode.
			$is_comparison = $this->is_comparison_request( $params );

			// Interval drives time-series column labels and row formatting.
			$interval = $params['interval'] ?? null;

			// Get columns.
			$columns = $this->registry->get_columns( $report_type, $is_comparison, $interval );
			if ( is_wp_error( $columns ) ) {
				throw new \Exception( $columns->get_error_message() );
			}

			// Get row formatter.
			$formatter = $this->registry->get_row_formatter( $report_type, $interval );
			if ( is_wp_error( $formatter ) ) {
				throw new \Exception( $formatter->get_error_message() );
			}

			// Generate filename.
			$filename = $this->registry->build_filename( $report_type, $params );

			// Generate CSV file.
			$file_path = $this->csv_generator->generate( $data, $columns, $formatter, $filename );
			if ( is_wp_error( $file_path ) ) {
				throw new \Exception( $file_path->get_error_message() );
			}

			// Get report label.
			$report_label = $this->registry->get_label( $report_type );
			if ( is_wp_error( $report_label ) ) {
				$report_label = $report_type;
			}

			// Send email with the CSV as an attachment (no public download URL is exposed).
			$email_sent = $this->email_sender->send_export_email(
				$user_email,
				$report_label,
				$params,
				$file_path
			);

			// The file has been attached and is no longer needed on disk; the daily cleanup is
			// only a backstop.
			$this->csv_generator->delete_file( $file_path );

			if ( ! $email_sent ) {
				throw new \Exception( 'Failed to send export email' );
			}

			$this->logger->log_message(
				sprintf( 'CSV export completed and emailed to: %s', $user_email ),
				__METHOD__
			);

		} catch ( \Throwable $e ) {
			$this->logger->log_exception( $e, __METHOD__ );

			// Notify the requester with a generic message (details are logged, not emailed).
			$this->send_error_email( $user_email, $report_type );

			// Rethrow so Action Scheduler records the action as failed rather than completed.
			throw $e;
		} finally {
			// Always restore the prior user context, including the anonymous/system user (0),
			// so later actions in the same cron batch do not run as the export requester.
			\wp_set_current_user( $previous_user_id );
		}
	}

	/**
	 * Send a generic export-failure notification (error detail is logged, not emailed).
	 *
	 * @param string $user_email  User email.
	 * @param string $report_type Report type.
	 * @return void
	 */
	private function send_error_email( string $user_email, string $report_type ): void {
		$report_label = $this->registry->get_label( $report_type );
		if ( is_wp_error( $report_label ) ) {
			$report_label = $report_type;
		}

		$subject = sprintf(
			/* translators: %s: Report label */
			__( 'Export Failed: %s', 'jetpack-premium-analytics' ),
			$report_label
		);

		$message = sprintf(
			/* translators: %s: Report label */
			__( 'Your export for "%s" could not be completed. Please try again later.', 'jetpack-premium-analytics' ),
			$report_label
		);

		wp_mail( $user_email, $subject, $message );
	}

	/**
	 * Schedule daily cleanup of old export files.
	 *
	 * @return void
	 */
	public function schedule_cleanup(): void {
		if ( ! function_exists( 'as_schedule_recurring_action' ) || ! function_exists( 'as_next_scheduled_action' ) ) {
			return;
		}

		// Only schedule if not already scheduled.
		// @phan-suppress-next-line PhanUndeclaredFunction -- Action Scheduler; guarded by function_exists() above.
		if ( false === as_next_scheduled_action( self::CLEANUP_HOOK, array(), self::ACTION_GROUP ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunction -- Action Scheduler; guarded by function_exists() above.
			as_schedule_recurring_action(
				time(),
				DAY_IN_SECONDS,
				self::CLEANUP_HOOK,
				array(),
				self::ACTION_GROUP
			);
		}
	}

	/**
	 * Clean up export files older than the retention period.
	 *
	 * @return void
	 */
	public function cleanup_old_exports(): void {
		$upload_dir = wp_upload_dir();
		$export_dir = trailingslashit( $upload_dir['basedir'] ) . 'jetpack-premium-analytics-exports';

		if ( ! is_dir( $export_dir ) ) {
			return;
		}

		/**
		 * Filter the CSV export file retention period.
		 *
		 * @param int $retention_seconds Retention period in seconds. Default: 48 hours.
		 */
		$retention = apply_filters( 'jetpack_premium_analytics_csv_export_retention', self::DEFAULT_RETENTION_PERIOD );

		// glob() can return false on error; normalize to an array before iterating.
		$files = glob( $export_dir . '/*.csv' );
		if ( ! is_array( $files ) ) {
			$files = array();
		}

		$cutoff  = time() - $retention;
		$deleted = 0;

		foreach ( $files as $file ) {
			$mtime = filemtime( $file );
			if ( false !== $mtime && $mtime < $cutoff ) {
				if ( wp_delete_file( $file ) ) {
					++$deleted;
				}
			}
		}

		if ( $deleted > 0 ) {
			$this->logger->log_message(
				sprintf( 'Cleaned up %d old CSV export files', $deleted ),
				__METHOD__
			);
		}
	}
}
