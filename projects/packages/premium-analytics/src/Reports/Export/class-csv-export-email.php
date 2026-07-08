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

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\Logger_Interface;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\Logger_Trait;
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
 * @since $$next-version$$
 */
class Csv_Export_Email extends \WC_Email implements Registrable_Interface {

	use Logger_Trait;
	use Utilities;

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
	 * Constructor.
	 *
	 * @param Logger_Interface|null $logger The logger instance.
	 */
	public function __construct( ?Logger_Interface $logger = null ) {
		$this->id             = 'csv_export_ready';
		$this->title          = __( 'CSV Export Ready', 'jetpack-premium-analytics' );
		$this->description    = __( 'Email sent, with the CSV attached, when a report export is ready.', 'jetpack-premium-analytics' );
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
		// Intentionally not hooked into woocommerce_email_classes. This is a transactional export
		// email sent directly via send_export_email(), not an admin-configurable WooCommerce email,
		// so it should not appear as a settings row under WooCommerce > Settings > Emails.
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
	 * @return bool True if email sent successfully.
	 */
	public function send_export_email(
		string $recipient,
		string $report_label,
		array $params,
		string $file_path
	): bool {
		// Set recipient.
		$this->recipient = $recipient;

		// Store data for template.
		$this->report_label = $report_label;
		$this->params       = $params;

		// The CSV is delivered as an attachment only (no public URL). If it is missing,
		// unreadable, or too large to attach, fail rather than send a linkless dead-end email.
		$file_size = is_readable( $file_path ) ? filesize( $file_path ) : false;
		if ( false === $file_size || $file_size >= self::MAX_ATTACHMENT_SIZE ) {
			if ( null !== $this->logger ) {
				$this->logger->log_error(
					sprintf( 'Export file missing or too large to attach: %s', $file_path ),
					__METHOD__
				);
			}
			return false;
		}

		$attachments = array( $file_path );

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
				'email'         => $this,
				'report_label'  => $this->report_label ?? '',
				'params'        => $this->params ?? array(),
				'email_heading' => $this->get_heading(),
				'sent_to_admin' => false,
				'is_comparison' => $this->is_comparison_request( $this->params ?? array() ),
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
				'email'         => $this,
				'report_label'  => $this->report_label ?? '',
				'params'        => $this->params ?? array(),
				'email_heading' => $this->get_heading(),
				'sent_to_admin' => false,
				'is_comparison' => $this->is_comparison_request( $this->params ?? array() ),
			),
			'',
			$this->template_base
		);
	}
}
