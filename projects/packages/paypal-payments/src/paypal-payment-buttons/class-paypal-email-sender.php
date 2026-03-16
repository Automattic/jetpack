<?php
/**
 * PayPal Payment Link email sender.
 *
 * Handles sending payment links via wp_mail() and tracking send history.
 * Registered as an AJAX handler for the admin detail view.
 *
 * @package automattic/jetpack-paypal-payments
 * @since 0.9.0
 */

namespace Automattic\Jetpack\PaypalPayments;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class PayPal_Email_Sender
 */
class PayPal_Email_Sender {

	/**
	 * Option key for storing the send log.
	 *
	 * @var string
	 */
	const LOG_OPTION_KEY = 'jetpack_paypal_email_send_log';

	/**
	 * Maximum number of log entries to retain.
	 *
	 * @var int
	 */
	const MAX_LOG_ENTRIES = 50;

	/**
	 * AJAX action name.
	 *
	 * @var string
	 */
	const AJAX_ACTION = 'paypal_send_payment_link';

	/**
	 * Initialize AJAX hooks.
	 */
	public static function init() {
		add_action( 'wp_ajax_' . self::AJAX_ACTION, array( __CLASS__, 'handle_send' ) );
	}

	/**
	 * Handle the AJAX send request.
	 */
	public static function handle_send() {
		// Verify nonce.
		if ( ! check_ajax_referer( self::AJAX_ACTION, '_wpnonce', false ) ) {
			wp_send_json_error(
				array( 'message' => __( 'Security check failed.', 'jetpack-paypal-payments' ) ),
				403,
				JSON_HEX_TAG | JSON_HEX_AMP
			);
		}

		// Check capability.
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error(
				array( 'message' => __( 'You do not have permission to send emails.', 'jetpack-paypal-payments' ) ),
				403,
				JSON_HEX_TAG | JSON_HEX_AMP
			);
		}

		// Validate inputs.
		$recipient    = isset( $_POST['recipient'] ) ? sanitize_email( wp_unslash( $_POST['recipient'] ) ) : '';
		$payment_link = isset( $_POST['payment_link'] ) ? esc_url_raw( wp_unslash( $_POST['payment_link'] ) ) : '';
		$product_name = isset( $_POST['product_name'] ) ? sanitize_text_field( wp_unslash( $_POST['product_name'] ) ) : '';
		$price        = isset( $_POST['price'] ) ? sanitize_text_field( wp_unslash( $_POST['price'] ) ) : '';
		$currency     = isset( $_POST['currency'] ) ? sanitize_text_field( wp_unslash( $_POST['currency'] ) ) : 'USD';
		$message      = isset( $_POST['message'] ) ? sanitize_textarea_field( wp_unslash( $_POST['message'] ) ) : '';
		$resource_id  = isset( $_POST['resource_id'] ) ? sanitize_text_field( wp_unslash( $_POST['resource_id'] ) ) : '';

		if ( ! is_email( $recipient ) ) {
			wp_send_json_error(
				array( 'message' => __( 'Please enter a valid email address.', 'jetpack-paypal-payments' ) ),
				400,
				JSON_HEX_TAG | JSON_HEX_AMP
			);
		}

		if ( empty( $payment_link ) ) {
			wp_send_json_error(
				array( 'message' => __( 'Payment link is missing.', 'jetpack-paypal-payments' ) ),
				400,
				JSON_HEX_TAG | JSON_HEX_AMP
			);
		}

		// Build and send email.
		$result = self::send_email( $recipient, $payment_link, $product_name, $price, $currency, $message );

		if ( is_wp_error( $result ) ) {
			wp_send_json_error(
				array( 'message' => $result->get_error_message() ),
				500,
				JSON_HEX_TAG | JSON_HEX_AMP
			);
		}

		// Log the send.
		self::log_send( $resource_id, $recipient );

		wp_send_json_success(
			array(
				'message' => sprintf(
					/* translators: %s: recipient email address */
					__( 'Payment link sent to %s.', 'jetpack-paypal-payments' ),
					$recipient
				),
			),
			200,
			JSON_HEX_TAG | JSON_HEX_AMP
		);
	}

	/**
	 * Send the payment link email.
	 *
	 * @param string $recipient    Recipient email address.
	 * @param string $payment_link PayPal payment URL.
	 * @param string $product_name Product name.
	 * @param string $price        Price value.
	 * @param string $currency     Currency code.
	 * @param string $message      Optional personal message from merchant.
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public static function send_email( $recipient, $payment_link, $product_name, $price, $currency, $message = '' ) {
		$site_name = get_bloginfo( 'name' );

		$subject = sprintf(
			/* translators: 1: site name, 2: product name */
			__( 'Payment link from %1$s: %2$s', 'jetpack-paypal-payments' ),
			$site_name,
			$product_name
		);

		$html_body = self::build_email_html( $site_name, $payment_link, $product_name, $price, $currency, $message );

		// Temporarily set content type to HTML.
		$set_html_content_type = function () {
			return 'text/html';
		};

		add_filter( 'wp_mail_content_type', $set_html_content_type );

		$sent = wp_mail( $recipient, $subject, $html_body );

		// Remove the filter immediately.
		remove_filter( 'wp_mail_content_type', $set_html_content_type );

		if ( ! $sent ) {
			return new \WP_Error(
				'email_send_failed',
				__( 'Failed to send email. Check your site\'s email configuration.', 'jetpack-paypal-payments' )
			);
		}

		return true;
	}

	/**
	 * Build the HTML email body.
	 *
	 * @param string $site_name    Site name.
	 * @param string $payment_link PayPal payment URL.
	 * @param string $product_name Product name.
	 * @param string $price        Price value.
	 * @param string $currency     Currency code.
	 * @param string $message      Optional personal message.
	 * @return string HTML email body.
	 */
	private static function build_email_html( $site_name, $payment_link, $product_name, $price, $currency, $message ) {
		$formatted_price = PayPal_Payment_Buttons::format_price( $price, $currency );
		$escaped_link    = esc_url( $payment_link );
		$escaped_name    = esc_html( $product_name );
		$escaped_site    = esc_html( $site_name );
		$escaped_price   = esc_html( $formatted_price );

		$message_html = '';
		if ( ! empty( $message ) ) {
			$message_html = sprintf(
				'<p style="color:#555;font-size:14px;line-height:1.6;margin:16px 0;">%s</p>',
				nl2br( esc_html( $message ) )
			);
		}

		return '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;">
	<tr><td style="padding:32px 32px 24px;">
		<h2 style="margin:0 0 4px;font-size:20px;color:#1e1e1e;">' . $escaped_name . '</h2>
		<p style="margin:0;font-size:24px;font-weight:700;color:#003087;">' . $escaped_price . '</p>
	</td></tr>
	' . ( $message_html ? '<tr><td style="padding:0 32px;">' . $message_html . '</td></tr>' : '' ) . '
	<tr><td style="padding:16px 32px 32px;" align="center">
		<a href="' . $escaped_link . '" style="display:inline-block;background:#FFC439;color:#003087;font-size:16px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:24px;">
			' . esc_html__( 'Pay with PayPal', 'jetpack-paypal-payments' ) . '
		</a>
	</td></tr>
	<tr><td style="padding:0 32px 24px;text-align:center;">
		<p style="margin:0;font-size:12px;color:#999;">
			' . sprintf(
				/* translators: %s: site name */
				esc_html__( 'Sent by %s via PayPal Payment Links', 'jetpack-paypal-payments' ),
				$escaped_site
			) . '
		</p>
	</td></tr>
</table>
</td></tr>
</table>
</body>
</html>';
	}

	/**
	 * Log a successful email send.
	 *
	 * @param string $resource_id PayPal resource ID.
	 * @param string $recipient   Recipient email address.
	 */
	private static function log_send( $resource_id, $recipient ) {
		$log = get_option( self::LOG_OPTION_KEY, array() );

		if ( ! is_array( $log ) ) {
			$log = array();
		}

		$log[] = array(
			'resource_id' => $resource_id,
			'email'       => self::mask_email( $recipient ),
			'sent_at'     => gmdate( 'Y-m-d H:i:s' ),
		);

		// Cap at max entries.
		if ( count( $log ) > self::MAX_LOG_ENTRIES ) {
			$log = array_slice( $log, -self::MAX_LOG_ENTRIES );
		}

		update_option( self::LOG_OPTION_KEY, $log, false );
	}

	/**
	 * Mask an email address for privacy-safe storage.
	 *
	 * Stores only the first 3 characters of the local part + domain.
	 * Example: "customer@example.com" → "cus***@example.com"
	 *
	 * @param string $email Full email address.
	 * @return string Masked email address.
	 */
	private static function mask_email( $email ) {
		$parts = explode( '@', $email, 2 );
		if ( count( $parts ) !== 2 ) {
			return '***';
		}
		$local   = $parts[0];
		$domain  = $parts[1];
		$visible = min( 3, strlen( $local ) );
		return substr( $local, 0, $visible ) . '***@' . $domain;
	}

	/**
	 * Get send log entries for a specific resource.
	 *
	 * @param string $resource_id PayPal resource ID.
	 * @return array Log entries for this resource.
	 */
	public static function get_log_for_resource( $resource_id ) {
		$log = get_option( self::LOG_OPTION_KEY, array() );

		if ( ! is_array( $log ) ) {
			return array();
		}

		return array_filter(
			$log,
			function ( $entry ) use ( $resource_id ) {
				return isset( $entry['resource_id'] ) && $entry['resource_id'] === $resource_id;
			}
		);
	}
}
