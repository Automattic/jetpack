<?php
/**
 * Routes wp_mail() through MailChannels.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * The `pre_wp_mail` handler.
 */
class Mailer {

	/**
	 * Send through MailChannels, or hand the message back to core.
	 *
	 * @param null|bool $return Short-circuit value from earlier callbacks.
	 * @param array     $atts   wp_mail() attributes.
	 * @return null|bool True when sent, null to let core send it, false when it failed with fallback off.
	 */
	public static function pre_wp_mail( $return, $atts ) {
		if ( null !== $return ) {
			return $return;
		}

		$settings = Settings::get();
		if ( empty( $settings['enabled'] ) ) {
			return null;
		}
		$account = Account::get();
		if ( ! $account ) {
			return null;
		}

		$atts    = (array) $atts;
		$payload = Message_Builder::build( $atts, $settings, $account );
		$result  = is_wp_error( $payload ) ? $payload : self::deliver( $payload, $account );
		if ( ! is_wp_error( $result ) ) {
			self::log( $atts, $payload, Email_Log::STATUS_SENT, $result['request_id'], '', 'wp_mail' );
			/** This action is documented in wp-includes/pluggable.php */
			do_action( 'wp_mail_succeeded', $atts );
			return true;
		}

		// A message MailChannels can't represent always goes to core, whatever the fallback setting.
		if ( ! empty( $settings['fallback'] ) || 'jetpack_send_unsupported' === $result->get_error_code() ) {
			self::log( $atts, $payload, Email_Log::STATUS_FALLBACK, '', $result->get_error_message(), 'wp_mail' );
			return null;
		}

		self::log( $atts, $payload, Email_Log::STATUS_FAILED, '', $result->get_error_message(), 'wp_mail' );
		/** This action is documented in wp-includes/pluggable.php */
		do_action( 'wp_mail_failed', new WP_Error( 'wp_mail_failed', $result->get_error_message(), $atts ) );
		return false;
	}

	/**
	 * Send one built message.
	 *
	 * @param array $payload MailChannels payload.
	 * @param array $account Provisioned account.
	 * @return array{request_id: string}|WP_Error
	 */
	private static function deliver( array $payload, array $account ) {
		$response = ( new MailChannels_Client( $account['api_key'] ) )->send( $payload );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$result = isset( $response['results'][0] ) && is_array( $response['results'][0] ) ? $response['results'][0] : array();
		if ( 'sent' !== ( $result['status'] ?? '' ) ) {
			return new WP_Error(
				'jetpack_send_rejected',
				! empty( $result['reason'] ) && is_string( $result['reason'] ) ? $result['reason'] : __( 'MailChannels did not accept the message.', 'jetpack-send-pkg' ),
				array( 'status' => 502 )
			);
		}

		return array( 'request_id' => (string) ( $response['request_id'] ?? '' ) );
	}

	/**
	 * Send a test email, skipping the enabled check and fallback so the result reflects MailChannels.
	 *
	 * @param string $to Recipient.
	 * @return array{request_id: string}|WP_Error
	 */
	public static function send_test( $to ) {
		$account = Account::get();
		if ( ! $account ) {
			return new WP_Error( 'jetpack_send_not_set_up', __( 'Set up Send before sending a test email.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}

		$atts = array(
			'to'          => $to,
			'subject'     => __( 'Jetpack Send test email', 'jetpack-send-pkg' ),
			/* translators: %s: site URL. */
			'message'     => sprintf( __( 'This test email from %s was delivered by Jetpack Send.', 'jetpack-send-pkg' ), home_url() ),
			'headers'     => '',
			'attachments' => array(),
		);

		$payload = Message_Builder::build( $atts, Settings::get(), $account );
		$result  = is_wp_error( $payload ) ? $payload : self::deliver( $payload, $account );
		if ( is_wp_error( $result ) ) {
			self::log( $atts, $payload, Email_Log::STATUS_FAILED, '', $result->get_error_message(), 'test' );
		} else {
			self::log( $atts, $payload, Email_Log::STATUS_SENT, $result['request_id'], '', 'test' );
		}

		return $result;
	}

	/**
	 * Write a log row.
	 *
	 * @param array          $atts       wp_mail() attributes.
	 * @param array|WP_Error $payload    MailChannels payload, or why it wasn't built.
	 * @param string         $status     Email_Log status.
	 * @param string         $request_id MailChannels request ID.
	 * @param string         $error      Error message.
	 * @param string         $source     `wp_mail` or `test`.
	 * @return void
	 */
	private static function log( array $atts, $payload, $status, $request_id, $error, $source ) {
		$to = $atts['to'] ?? '';
		Email_Log::insert(
			array(
				'recipients' => is_array( $to ) ? implode( ', ', $to ) : (string) $to,
				'subject'    => (string) ( $atts['subject'] ?? '' ),
				'status'     => $status,
				'error'      => $error,
				'request_id' => $request_id,
				'source'     => $source,
				'message'    => self::log_message( $atts, $payload ),
			)
		);
	}

	/**
	 * The content the log keeps for previewing: the message as sent, or as wp_mail() received it.
	 *
	 * @param array          $atts    wp_mail() attributes.
	 * @param array|WP_Error $payload MailChannels payload, or why it wasn't built.
	 * @return array|null Null when the content isn't kept.
	 */
	public static function log_message( array $atts, $payload ) {
		/**
		 * Whether Send keeps an email's content in its log so it can be previewed.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool  $keep Default true.
		 * @param array $atts wp_mail() attributes.
		 */
		if ( ! apply_filters( 'jetpack_send_log_email_content', true, $atts ) ) {
			return null;
		}

		if ( is_array( $payload ) ) {
			$personalization = $payload['personalizations'][0];
			// The HTML part comes last when there is one.
			$part    = end( $payload['content'] );
			$message = array(
				'from'         => $payload['from'],
				'reply_to'     => $payload['reply_to'] ?? null,
				'cc'           => $personalization['cc'] ?? array(),
				'bcc'          => $personalization['bcc'] ?? array(),
				'content_type' => $part['type'],
				'body'         => $part['value'],
				'attachments'  => array_column( $payload['attachments'] ?? array(), 'filename' ),
			);
		} else {
			$headers = Message_Builder::parse_headers( $atts['headers'] ?? '' );
			/** This filter is documented in wp-includes/pluggable.php */
			$content_type = (string) apply_filters( 'wp_mail_content_type', '' !== $headers['content_type'] ? $headers['content_type'] : 'text/plain' );
			$message      = array(
				'from'         => '' !== $headers['from']['email'] ? $headers['from'] : null,
				'reply_to'     => $headers['reply_to'][0] ?? null,
				'cc'           => $headers['cc'],
				'bcc'          => $headers['bcc'],
				'content_type' => 'text/html' === strtolower( $content_type ) ? 'text/html' : 'text/plain',
				'body'         => (string) ( $atts['message'] ?? '' ),
				'attachments'  => array_column( Message_Builder::attachment_files( $atts['attachments'] ?? array() ), 'filename' ),
			);
		}

		return strlen( $message['body'] ) > Email_Log::MAX_BODY_BYTES ? null : $message;
	}
}
