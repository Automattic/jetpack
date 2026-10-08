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
		$account  = Account::get();
		if ( empty( $settings['enabled'] ) || ! $account ) {
			return null;
		}

		$atts   = (array) $atts;
		$result = self::deliver( $atts, $settings, $account );
		if ( ! is_wp_error( $result ) ) {
			self::log( $atts, Email_Log::STATUS_SENT, $result['request_id'], '', 'wp_mail' );
			/** This action is documented in wp-includes/pluggable.php */
			do_action( 'wp_mail_succeeded', $atts );
			return true;
		}

		// A message MailChannels can't represent always goes to core, whatever the fallback setting.
		if ( ! empty( $settings['fallback'] ) || 'jetpack_send_unsupported' === $result->get_error_code() ) {
			self::log( $atts, Email_Log::STATUS_FALLBACK, '', $result->get_error_message(), 'wp_mail' );
			return null;
		}

		self::log( $atts, Email_Log::STATUS_FAILED, '', $result->get_error_message(), 'wp_mail' );
		/** This action is documented in wp-includes/pluggable.php */
		do_action( 'wp_mail_failed', new WP_Error( 'wp_mail_failed', $result->get_error_message(), $atts ) );
		return false;
	}

	/**
	 * Build and send one message.
	 *
	 * @param array $atts     wp_mail() attributes.
	 * @param array $settings Send settings.
	 * @param array $account  Provisioned account.
	 * @return array{request_id: string}|WP_Error
	 */
	public static function deliver( array $atts, array $settings, array $account ) {
		$payload = Message_Builder::build( $atts, $settings, $account );
		if ( is_wp_error( $payload ) ) {
			return $payload;
		}

		$response = ( new MailChannels_Client( $account['api_key'] ) )->send( $payload );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$result = isset( $response['results'][0] ) && is_array( $response['results'][0] ) ? $response['results'][0] : array();
		if ( 'sent' !== ( $result['status'] ?? '' ) ) {
			return new WP_Error(
				'jetpack_send_rejected',
				! empty( $result['reason'] ) ? (string) $result['reason'] : __( 'MailChannels did not accept the message.', 'jetpack-send-pkg' ),
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

		$result = self::deliver( $atts, Settings::get(), $account );
		if ( is_wp_error( $result ) ) {
			self::log( $atts, Email_Log::STATUS_FAILED, '', $result->get_error_message(), 'test' );
		} else {
			self::log( $atts, Email_Log::STATUS_SENT, $result['request_id'], '', 'test' );
		}

		return $result;
	}

	/**
	 * Write a log row.
	 *
	 * @param array  $atts       wp_mail() attributes.
	 * @param string $status     Email_Log status.
	 * @param string $request_id MailChannels request ID.
	 * @param string $error      Error message.
	 * @param string $source     `wp_mail` or `test`.
	 * @return void
	 */
	private static function log( array $atts, $status, $request_id, $error, $source ) {
		$to = $atts['to'] ?? '';
		Email_Log::insert(
			array(
				'recipients' => is_array( $to ) ? implode( ', ', $to ) : (string) $to,
				'subject'    => (string) ( $atts['subject'] ?? '' ),
				'status'     => $status,
				'error'      => $error,
				'request_id' => $request_id,
				'source'     => $source,
			)
		);
	}
}
