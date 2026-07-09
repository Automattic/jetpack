<?php
/**
 * WooCommerce-free export email sender.
 *
 * @package Automattic\Jetpack\PremiumAnalytics\Reports\Export
 */

declare( strict_types=1 );

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

defined( 'ABSPATH' ) || exit;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\Logger_Interface;
use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Support\Logger_Trait;

/**
 * Emails a finished CSV export as an attachment via wp_mail().
 *
 * @since $$next-version$$
 * @internal
 */
class Wp_Mail_Export_Email implements Registrable_Interface {

	use Logger_Trait;

	/**
	 * Maximum file size for email attachments in bytes (10MB).
	 */
	const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

	/**
	 * Constructor.
	 *
	 * @param Logger_Interface|null $logger The logger instance.
	 */
	public function __construct( ?Logger_Interface $logger = null ) {
		if ( null !== $logger ) {
			$this->logger = $logger;
		}
	}

	/**
	 * No hooks to register; wp_mail() needs no setup.
	 *
	 * @return void
	 */
	public function register(): void {}

	/**
	 * Send the export-ready email with the CSV attached.
	 *
	 * @param string $recipient    Recipient email address.
	 * @param string $report_label Report label.
	 * @param array  $params       Report parameters.
	 * @param string $file_path    Path to the generated CSV file.
	 * @return bool True if the mail was handed off successfully.
	 */
	public function send_export_email(
		string $recipient,
		string $report_label,
		array $params,
		string $file_path
	): bool {
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

		$subject = sprintf(
			/* translators: %s: Report name */
			__( 'Your %s export is ready!', 'jetpack-premium-analytics' ),
			$report_label
		);

		$sent = wp_mail(
			$recipient,
			$subject,
			$this->build_body( $report_label, $params ),
			array( 'Content-Type: text/html; charset=UTF-8' ),
			array( $file_path )
		);

		if ( null !== $this->logger ) {
			if ( $sent ) {
				$this->logger->log_message( sprintf( 'Export email sent to: %s', $recipient ), __METHOD__ );
			} else {
				$this->logger->log_error( sprintf( 'Failed to send export email to: %s', $recipient ), __METHOD__ );
			}
		}

		return $sent;
	}

	/**
	 * Build the HTML email body.
	 *
	 * @param string $report_label Report label.
	 * @param array  $params       Report parameters.
	 * @return string The HTML body.
	 */
	private function build_body( string $report_label, array $params ): string {
		$heading = sprintf(
			/* translators: %s: Report name */
			__( 'Your %s export is ready!', 'jetpack-premium-analytics' ),
			$report_label
		);

		$body  = '<h2>' . esc_html( $heading ) . '</h2>';
		$body .= '<p>' . esc_html__( 'The report you requested is attached to this email as a CSV file.', 'jetpack-premium-analytics' ) . '</p>';

		if ( ! empty( $params['from'] ) && ! empty( $params['to'] ) ) {
			$range = sprintf(
				/* translators: 1: Start date, 2: End date */
				__( 'Date range: %1$s to %2$s', 'jetpack-premium-analytics' ),
				gmdate( 'F j, Y', strtotime( (string) $params['from'] ) ),
				gmdate( 'F j, Y', strtotime( (string) $params['to'] ) )
			);
			$body .= '<p>' . esc_html( $range ) . '</p>';
		}

		return $body;
	}
}
