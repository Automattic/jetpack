<?php
/**
 * CSV Export Email
 *
 * Handles sending email notifications for CSV exports.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\LoggerInterface;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\LoggerTrait;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\Utilities;

/**
 * Include WC_Email dependencies if not already loaded.
 */
if ( ! class_exists( 'WC_Email', false ) && function_exists( 'WC' ) ) {
	// @phan-suppress-next-line PhanUndeclaredConstant -- WC_PLUGIN_FILE is defined by WooCommerce, guarded by function_exists( 'WC' ).
	include_once dirname( WC_PLUGIN_FILE ) . '/includes/class-wc-emails.php';
	// @phan-suppress-next-line PhanUndeclaredConstant -- WC_PLUGIN_FILE is defined by WooCommerce, guarded by function_exists( 'WC' ).
	include_once dirname( WC_PLUGIN_FILE ) . '/includes/emails/class-wc-email.php';
}

/**
 * CSV Export Email class.
 *
 * @since x.x.x
 * @internal
 */
class CSVExportEmail extends \WC_Email implements RegistrableInterface {

	use LoggerTrait;
	use Utilities;

	/**
	 * Email key used in WooCommerce emails registry.
	 */
	const EMAIL_KEY = 'WC_Email_CSV_Export';

	/**
	 * Maximum file size for email attachments in bytes (10MB).
	 */
	const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

	/**
	 * Report label for the export.
	 *
	 * @var string
	 */
	private $report_label = '';

	/**
	 * Export parameters.
	 *
	 * @var array
	 */
	private $params = array();

	/**
	 * File URL for download.
	 *
	 * @var string
	 */
	private $file_url = '';

	/**
	 * Constructor.
	 *
	 * @param LoggerInterface|null $logger The logger instance.
	 */
	public function __construct( ?LoggerInterface $logger = null ) {
		$this->id             = 'csv_export_ready';
		$this->title          = __( 'CSV Export Ready', 'jetpack-premium-analytics' );
		$this->description    = __( 'Email sent when a CSV export is ready for download.', 'jetpack-premium-analytics' );
		$this->template_html  = 'csv-export-email.php';
		$this->template_plain = 'csv-export-email-plain.php';
		$this->template_base  = __DIR__ . '/templates/';

		// Call parent constructor.
		parent::__construct();

		// Set logger.
		if ( null !== $logger ) {
			$this->logger = $logger;
		}

		// Other settings.
		$this->recipient = $this->get_option( 'recipient', get_option( 'admin_email' ) );
	}

	/**
	 * Register the email.
	 *
	 * @return void
	 */
	public function register(): void {
		add_filter( 'woocommerce_email_classes', array( $this, 'register_email_class' ) );
	}

	/**
	 * Register email class with WooCommerce.
	 *
	 * @param array $emails Existing email classes.
	 * @return array Modified email classes.
	 */
	public function register_email_class( array $emails ): array {
		$emails[ self::EMAIL_KEY ] = $this;
		return $emails;
	}

	/**
	 * Get email subject.
	 *
	 * @return string
	 */
	public function get_default_subject(): string {
		return __( 'Your export is ready!', 'jetpack-premium-analytics' );
	}

	/**
	 * Get email heading.
	 *
	 * @return string
	 */
	public function get_default_heading(): string {
		return __( 'Your export is ready!', 'jetpack-premium-analytics' );
	}

	/**
	 * Get email subject with report name.
	 *
	 * @return string
	 */
	public function get_subject(): string {
		if ( ! empty( $this->report_label ) ) {
			return sprintf(
				/* translators: %s: Report name */
				__( 'Your %s export is ready!', 'jetpack-premium-analytics' ),
				$this->report_label
			);
		}
		return $this->get_default_subject();
	}

	/**
	 * Get email heading with report name.
	 *
	 * @return string
	 */
	public function get_heading(): string {
		if ( ! empty( $this->report_label ) ) {
			return sprintf(
				/* translators: %s: Report name */
				__( 'Your %s export is ready!', 'jetpack-premium-analytics' ),
				$this->report_label
			);
		}
		return $this->get_default_heading();
	}

	/**
	 * Send export ready email.
	 *
	 * @param string $recipient    Recipient email address.
	 * @param string $report_label Report label.
	 * @param array  $params       Report parameters.
	 * @param string $file_path    Path to CSV file.
	 * @param string $file_url     URL to download CSV.
	 * @return bool True if email sent successfully.
	 */
	public function send_export_email(
		string $recipient,
		string $report_label,
		array $params,
		string $file_path,
		string $file_url
	): bool {
		// Set recipient.
		$this->recipient = $recipient;

		// Store data for template.
		$this->report_label = $report_label;
		$this->params       = $params;
		$this->file_url     = $file_url;

		// Set attachment if file exists, is readable, and is not too large.
		$attachments = array();
		if ( file_exists( $file_path ) && is_readable( $file_path ) && filesize( $file_path ) < self::MAX_ATTACHMENT_SIZE ) {
			$attachments[] = $file_path;
		}

		// Send email.
		$sent = $this->send(
			$this->get_recipient(),
			$this->get_subject(),
			$this->get_content(),
			$this->get_headers(),
			$attachments
		);

		// Simply return if no logger available.
		if ( null === $this->logger ) {
			return $sent;
		}

		// Log the result.
		if ( $sent ) {
			$this->logger->log_message(
				sprintf( 'Export email sent to: %s', $recipient ),
				__METHOD__
			);
		} else {
			$this->logger->log_error(
				sprintf( 'Failed to send export email to: %s', $recipient ),
				__METHOD__
			);
		}

		return $sent;
	}

	/**
	 * Get content html.
	 *
	 * @return string
	 */
	public function get_content_html(): string {
		return wc_get_template_html(
			$this->template_html,
			array(
				'email'           => $this,
				'report_label'    => $this->report_label ?? '',
				'params'          => $this->params ?? array(),
				'file_url'        => $this->file_url ?? '',
				'email_heading'   => $this->get_heading(),
				'sent_to_admin'   => false,
				'is_comparison'   => $this->is_comparison_request( $this->params ?? array() ),
				'retention_hours' => $this->get_retention_hours(),
			),
			'',
			$this->template_base
		);
	}

	/**
	 * Get content plain.
	 *
	 * @return string
	 */
	public function get_content_plain(): string {
		return wc_get_template_html(
			$this->template_plain,
			array(
				'email'           => $this,
				'report_label'    => $this->report_label ?? '',
				'params'          => $this->params ?? array(),
				'file_url'        => $this->file_url ?? '',
				'email_heading'   => $this->get_heading(),
				'sent_to_admin'   => false,
				'is_comparison'   => $this->is_comparison_request( $this->params ?? array() ),
				'retention_hours' => $this->get_retention_hours(),
			),
			'',
			$this->template_base
		);
	}

	/**
	 * Format date range for email.
	 *
	 * @param array $params Report parameters.
	 * @return string Formatted date range.
	 */
	protected function format_date_range( array $params ): string {
		$from = gmdate( 'F j, Y', strtotime( $params['from'] ) );
		$to   = gmdate( 'F j, Y', strtotime( $params['to'] ) );

		return sprintf(
			/* translators: 1: Start date, 2: End date */
			__( '%1$s to %2$s', 'jetpack-premium-analytics' ),
			$from,
			$to
		);
	}

	/**
	 * Get retention period in hours.
	 *
	 * @return int Retention period in hours.
	 */
	protected function get_retention_hours(): int {
		/**
		 * Filter the CSV export file retention period.
		 *
		 * @param int $retention_seconds Retention period in seconds. Default: 48 hours.
		 */
		$retention_seconds = apply_filters( 'woocommerce_analytics_csv_export_retention', CSVExportScheduler::DEFAULT_RETENTION_PERIOD );
		return (int) ( $retention_seconds / HOUR_IN_SECONDS );
	}
}
