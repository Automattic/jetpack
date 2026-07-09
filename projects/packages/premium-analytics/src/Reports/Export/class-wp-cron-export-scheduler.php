<?php
/**
 * WP-Cron export scheduler.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\Logger_Interface;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\Logger_Trait;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\Utilities;
use Throwable;

/**
 * Schedules CSV export jobs on WP-Cron and processes them.
 *
 * @since $$next-version$$
 * @internal
 */
class Wp_Cron_Export_Scheduler implements Registrable_Interface {

	use Logger_Trait;
	use Utilities;

	/**
	 * Cron hook name for CSV export jobs.
	 */
	const EXPORT_ACTION_HOOK = 'jetpack_premium_analytics_wpcron_generate_csv_export';

	/**
	 * Cron hook name for the retention cleanup.
	 */
	const CLEANUP_HOOK = 'jetpack_premium_analytics_wpcron_cleanup_csv_exports';

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
	 * @var Wp_Mail_Export_Email
	 */
	private $email_sender;

	/**
	 * Constructor.
	 *
	 * @param Report_Registry      $registry      The report registry.
	 * @param Report_Data_Fetcher  $data_fetcher  The data fetcher.
	 * @param Report_Csv_Generator $csv_generator The CSV generator.
	 * @param Wp_Mail_Export_Email $email_sender  The email sender.
	 * @param Logger_Interface     $logger        The logger.
	 */
	public function __construct(
		Report_Registry $registry,
		Report_Data_Fetcher $data_fetcher,
		Report_Csv_Generator $csv_generator,
		Wp_Mail_Export_Email $email_sender,
		Logger_Interface $logger
	) {
		$this->registry      = $registry;
		$this->data_fetcher  = $data_fetcher;
		$this->csv_generator = $csv_generator;
		$this->email_sender  = $email_sender;
		$this->logger        = $logger;

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
		add_action( self::EXPORT_ACTION_HOOK, array( $this, 'process_export_job' ), 10, 4 );
		add_action( self::CLEANUP_HOOK, array( $this, 'cleanup_old_exports' ) );
	}

	/**
	 * Schedule a CSV export job on WP-Cron.
	 *
	 * @param string $report_type The report type.
	 * @param array  $params      Report parameters.
	 * @param int    $user_id     User ID requesting the export.
	 * @param string $user_email  User email for notification.
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public function schedule_export( string $report_type, array $params, int $user_id, string $user_email ) {
		if ( ! \is_email( $user_email ) ) {
			return new \WP_Error(
				'invalid_email',
				__( 'Invalid email address provided.', 'jetpack-premium-analytics' ),
				array( 'status' => 400 )
			);
		}

		if ( ! $this->registry->is_registered( $report_type ) ) {
			return new \WP_Error(
				'invalid_report_type',
				__( 'Invalid report type.', 'jetpack-premium-analytics' ),
				array( 'status' => 400 )
			);
		}

		$args      = array( $report_type, $params, $user_id, $user_email );
		$scheduled = wp_schedule_single_event(
			time(),
			self::EXPORT_ACTION_HOOK,
			$args,
			true
		);

		if ( is_wp_error( $scheduled ) ) {
			if ( 'duplicate_event' === $scheduled->get_error_code() && wp_next_scheduled( self::EXPORT_ACTION_HOOK, $args ) ) {
				$this->logger->log_message(
					sprintf( 'WP-Cron CSV export already scheduled for report type: %s', $report_type ),
					__METHOD__
				);
				$this->schedule_cleanup();
				return true;
			}

			$this->logger->log_error(
				sprintf( 'Failed to schedule WP-Cron CSV export event: %s', $scheduled->get_error_message() ),
				__METHOD__
			);
			if ( null === $scheduled->get_error_data() ) {
				$scheduled->add_data( array( 'status' => 500 ) );
			}
			return $scheduled;
		}

		if ( true !== $scheduled ) {
			if ( wp_next_scheduled( self::EXPORT_ACTION_HOOK, $args ) ) {
				$this->logger->log_message(
					sprintf( 'WP-Cron CSV export already scheduled for report type: %s', $report_type ),
					__METHOD__
				);
				$this->schedule_cleanup();
				return true;
			}

			$this->logger->log_error( 'Failed to schedule WP-Cron CSV export event', __METHOD__ );
			return new \WP_Error(
				'schedule_failed',
				__( 'Failed to schedule export job.', 'jetpack-premium-analytics' ),
				array( 'status' => 500 )
			);
		}

		$this->logger->log_message(
			sprintf( 'Scheduled WP-Cron CSV export for report type: %s', $report_type ),
			__METHOD__
		);

		$this->schedule_cleanup();

		return true;
	}

	// phpcs:disable Squiz.Commenting.FunctionCommentThrowTag.Missing -- Exceptions are caught so WP-Cron can continue processing.
	/**
	 * Process a scheduled export job.
	 *
	 * @param string $report_type The report type.
	 * @param array  $params      Report parameters.
	 * @param int    $user_id     User ID.
	 * @param string $user_email  User email.
	 * @return void
	 */
	public function process_export_job( string $report_type, array $params, int $user_id, string $user_email ): void {
		$this->logger->log_message(
			sprintf( 'Processing WP-Cron CSV export for report type: %s, user: %d', $report_type, $user_id ),
			__METHOD__
		);

		$user = get_user_by( 'id', $user_id );
		if ( ! $user ) {
			$this->logger->log_error( sprintf( 'Cannot process WP-Cron CSV export for missing user: %d', $user_id ), __METHOD__ );
			return;
		}

		$recipient_email = (string) $user->user_email;
		if ( ! is_email( $recipient_email ) ) {
			$this->logger->log_error( sprintf( 'Cannot process WP-Cron CSV export for user %d because their email is invalid', $user_id ), __METHOD__ );
			return;
		}

		if ( ! user_can( $user, 'view_stats' ) && ! user_can( $user, 'manage_options' ) ) {
			$this->logger->log_error( sprintf( 'Cannot process WP-Cron CSV export for unauthorized user: %d', $user_id ), __METHOD__ );
			return;
		}

		$previous_user_id = \get_current_user_id();
		\wp_set_current_user( $user_id );

		try {
			$controller = $this->registry->get_controller( $report_type );
			if ( is_wp_error( $controller ) ) {
				throw new \RuntimeException( $controller->get_error_message() );
			}

			$data = $this->data_fetcher->fetch( $params, $controller );
			if ( is_wp_error( $data ) ) {
				throw new \RuntimeException( $data->get_error_message() );
			}

			$is_comparison = $this->is_comparison_request( $params );
			$interval      = $params['interval'] ?? null;

			$columns = $this->registry->get_columns( $report_type, $is_comparison, $interval );
			if ( is_wp_error( $columns ) ) {
				throw new \RuntimeException( $columns->get_error_message() );
			}

			$formatter = $this->registry->get_row_formatter( $report_type, $interval );
			if ( is_wp_error( $formatter ) ) {
				throw new \RuntimeException( $formatter->get_error_message() );
			}

			$filename  = $this->registry->build_filename( $report_type, $params );
			$file_path = $this->csv_generator->generate( $data, $columns, $formatter, $filename );
			if ( is_wp_error( $file_path ) ) {
				throw new \RuntimeException( $file_path->get_error_message() );
			}

			$report_label = $this->registry->get_label( $report_type );
			if ( is_wp_error( $report_label ) ) {
				$report_label = $report_type;
			}

			$email_sent = $this->email_sender->send_export_email( $recipient_email, $report_label, $params, $file_path );
			$this->csv_generator->delete_file( $file_path );

			if ( ! $email_sent ) {
				throw new \RuntimeException( 'Failed to send export email' );
			}

			$this->logger->log_message(
				sprintf( 'WP-Cron CSV export completed and emailed to: %s', $recipient_email ),
				__METHOD__
			);
		} catch ( Throwable $e ) {
			$this->logger->log_exception( $e, __METHOD__ );
			$this->send_error_email( $recipient_email, $report_type );
		} finally {
			\wp_set_current_user( $previous_user_id );
		}
	}
	// phpcs:enable Squiz.Commenting.FunctionCommentThrowTag.Missing

	/**
	 * Send a generic export-failure notification.
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
		if ( wp_next_scheduled( self::CLEANUP_HOOK ) ) {
			return;
		}

		$scheduled = wp_schedule_event( time(), 'daily', self::CLEANUP_HOOK, array(), true );
		if ( is_wp_error( $scheduled ) ) {
			$this->logger->log_error(
				sprintf( 'Failed to schedule WP-Cron CSV export cleanup: %s', $scheduled->get_error_message() ),
				__METHOD__
			);
			return;
		}

		if ( true !== $scheduled ) {
			$this->logger->log_error( 'Failed to schedule WP-Cron CSV export cleanup', __METHOD__ );
		}
	}

	/**
	 * Clean up export files older than the retention period.
	 *
	 * @return void
	 */
	public function cleanup_old_exports(): void {
		$upload_dir = wp_upload_dir();
		if ( ! empty( $upload_dir['error'] ) || empty( $upload_dir['basedir'] ) ) {
			$this->logger->log_error( 'Cannot clean up CSV exports because the uploads directory is unavailable', __METHOD__ );
			return;
		}

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
		$retention = is_numeric( $retention ) ? max( 0, (int) $retention ) : self::DEFAULT_RETENTION_PERIOD;

		$files = glob( $export_dir . '/*.csv' );
		if ( ! is_array( $files ) ) {
			$files = array();
		}

		$cutoff  = time() - $retention;
		$deleted = 0;

		foreach ( $files as $file ) {
			$mtime = filemtime( $file );
			if ( false !== $mtime && $mtime < $cutoff && wp_delete_file( $file ) ) {
				++$deleted;
			}
		}

		if ( $deleted > 0 ) {
			$this->logger->log_message( sprintf( 'Cleaned up %d old CSV export files', $deleted ), __METHOD__ );
		}
	}
}
