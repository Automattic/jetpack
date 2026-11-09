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
	 * The email last handed to the host's mail, until its outcome comes back or the next email starts:
	 * `log_id`, `hash` (its To and subject), `time`, `origin`, `reason` and `detail`.
	 *
	 * @var array|null
	 */
	private static $pending = null;

	/**
	 * Send through MailChannels, or hand the message back to core.
	 *
	 * @param null|bool $return Short-circuit value from earlier callbacks.
	 * @param array     $atts   wp_mail() attributes.
	 * @return null|bool True when sent, null to let core send it, false when it failed with fallback off.
	 */
	public static function pre_wp_mail( $return, $atts ) {
		// A new email: an earlier hand-off's outcome can't come any more, and Send's own hooks must not land on it.
		self::$pending = null;
		if ( null !== $return ) {
			Debug_Log::add( 'debug', 'sending', 'mail.skipped', __( 'Left it to your host: another plugin handled it.', 'jetpack-send-pkg' ), array( 'why' => 'another_plugin' ) );
			return $return;
		}

		$settings = Settings::get();
		if ( empty( $settings['enabled'] ) ) {
			Debug_Log::add( 'debug', 'sending', 'mail.skipped', __( 'Left it to your host: sending is off.', 'jetpack-send-pkg' ), array( 'why' => 'off' ) );
			return null;
		}
		$account = Account::get();
		if ( ! $account ) {
			Debug_Log::add( 'debug', 'sending', 'mail.skipped', __( 'Left it to your host: not set up.', 'jetpack-send-pkg' ), array( 'why' => 'not_set_up' ) );
			return null;
		}

		$atts = (array) $atts;
		$now  = time();
		// phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_debug_backtrace -- Names the plugin or theme that sent the email, for the dashboard.
		$origin  = Email_Origin::detect( debug_backtrace( DEBUG_BACKTRACE_IGNORE_ARGS, 30 ) );
		$payload = Message_Builder::build( $atts, $settings, $account );
		// This email's entries are linked to its row once it's logged.
		Debug_Log::hold();
		self::note_caught( $atts, $payload, $origin );
		$result = is_wp_error( $payload ) ? $payload : self::deliver( $payload, $account );
		if ( ! is_wp_error( $result ) ) {
			$log_id = self::log( $atts, $payload, Email_Log::STATUS_SENT, $result['request_id'], '', 'wp_mail', $origin, self::sent_detail( $result ), '', $now );
			Stats::add( $now, Email_Log::STATUS_SENT, 'wp_mail', $origin, (int) $log_id );
			/* translators: %s: the email service's request ID. */
			Debug_Log::add( 'info', 'sending', 'mail.sent', sprintf( __( 'Sent. Request %s.', 'jetpack-send-pkg' ), $result['request_id'] ), $result, (int) $log_id );
			/** This action is documented in wp-includes/pluggable.php */
			do_action( 'wp_mail_succeeded', $atts );
			return true;
		}

		// A message MailChannels can't represent always goes to core, whatever the fallback setting.
		$fallback = ! empty( $settings['fallback'] ) || 'jetpack_send_unsupported' === $result->get_error_code();
		$context  = array(
			'fallback' => $fallback,
			'records'  => $account['dns_check'] ?? null,
		);
		$reason   = Failure_Reason::classify( $result, $context );
		$detail   = Failure_Reason::detail( $result, $context + array( 'reason' => $reason ) );
		$data     = $result->get_error_data();
		$request  = is_array( $data ) && is_scalar( $data['request_id'] ?? null ) ? (string) $data['request_id'] : '';
		if ( $fallback ) {
			$detail['host'] = array( 'result' => 'unknown' );
			$log_id         = self::log( $atts, $payload, Email_Log::STATUS_FALLBACK, $request, self::error_text( $result ), 'wp_mail', $origin, $detail, $reason, $now );
			Stats::add( $now, Email_Log::STATUS_FALLBACK, 'wp_mail', $origin, (int) $log_id );
			Debug_Log::add(
				'warning',
				'sending',
				'fallback.handed_off',
				/* translators: %s: why, in a plain sentence, e.g. "We didn't hear back in time, so it may still arrive." */
				sprintf( __( 'Handed to your host’s mail. %s', 'jetpack-send-pkg' ), Failure_Reason::headline( $reason, (string) $account['domain'] ) ),
				array(
					'reason' => $reason,
					'code'   => $result->get_error_code(),
				),
				(int) $log_id
			);
			// Core sends it next; its own success or failure hook says how that went for this email.
			self::$pending = array(
				'log_id' => (int) $log_id,
				'hash'   => self::mail_hash( $atts['to'] ?? '', $atts['subject'] ?? '' ),
				'time'   => $now,
				'origin' => $origin,
				'reason' => $reason,
				'detail' => $detail,
			);
			return null;
		}

		$log_id = self::log( $atts, $payload, Email_Log::STATUS_FAILED, $request, self::error_text( $result ), 'wp_mail', $origin, $detail, $reason, $now );
		Stats::add( $now, Email_Log::STATUS_FAILED, 'wp_mail', $origin, (int) $log_id );
		Debug_Log::add(
			'error',
			'sending',
			'mail.failed',
			self::failed_line( $reason, (string) $account['domain'] ),
			array(
				'reason'      => $reason,
				'code'        => $result->get_error_code(),
				'http_status' => $detail['http_status'] ?? 0,
			),
			(int) $log_id
		);
		/** This action is documented in wp-includes/pluggable.php */
		do_action( 'wp_mail_failed', new WP_Error( 'wp_mail_failed', $result->get_error_message(), $atts ) );
		return false;
	}

	/**
	 * The debug line for an email that didn't go out. With no answer, or one that couldn't be read, it
	 * may have gone out after all, so the line doesn't say it wasn't sent.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $reason Failure reason key.
	 * @param string $domain Sending domain.
	 * @param bool   $test   Whether it was a test email.
	 * @return string
	 */
	public static function failed_line( $reason, $domain, $test = false ) {
		$headline = Failure_Reason::headline( $reason, $domain );
		if ( in_array( $reason, array( 'no_answer', 'unclear' ), true ) ) {
			return $test
				/* translators: %s: why, in a plain sentence, e.g. "We didn't hear back in time, so it may still arrive." */
				? sprintf( __( 'Not sure the test went out. %s', 'jetpack-send-pkg' ), $headline )
				/* translators: %s: why, in a plain sentence, e.g. "We didn't hear back in time, so it may still arrive." */
				: sprintf( __( 'Not sure it went out. %s', 'jetpack-send-pkg' ), $headline );
		}
		return $test
			/* translators: %s: why, in a plain sentence, e.g. "Your signing record doesn't match what Jetpack needs." */
			? sprintf( __( 'Test not sent. %s', 'jetpack-send-pkg' ), $headline )
			/* translators: %s: why, in a plain sentence, e.g. "Your signing record doesn't match what Jetpack needs." */
			: sprintf( __( 'Not sent. %s', 'jetpack-send-pkg' ), $headline );
	}

	/**
	 * The host's mail sent an email Send handed it: note it on that email's row.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $mail_data The `wp_mail_succeeded` data; only `to` and `subject` are read.
	 * @return void
	 */
	public static function host_succeeded( $mail_data ) {
		$pending = self::take_pending( is_array( $mail_data ) ? $mail_data : array() );
		if ( ! $pending ) {
			return;
		}
		$detail         = $pending['detail'];
		$detail['host'] = array( 'result' => 'accepted' );
		Email_Log::update( $pending['log_id'], array( 'detail' => $detail ) );
		Debug_Log::add( 'info', 'sending', 'fallback.host_result', __( 'Your host’s mail accepted it.', 'jetpack-send-pkg' ), array( 'result' => 'accepted' ), $pending['log_id'] );
		if ( in_array( $pending['reason'], array( 'no_answer', 'unclear' ), true ) ) {
			Debug_Log::add(
				'warning',
				'sending',
				'mail.maybe_duplicate',
				__( 'It may arrive twice: your host’s mail sent it too, after Jetpack Send got no clear answer.', 'jetpack-send-pkg' ),
				array(
					'reason' => $pending['reason'],
					'host'   => 'accepted',
				),
				$pending['log_id']
			);
		}
	}

	/**
	 * The host's mail failed too: the email didn't go out. The row keeps Send's reason, because fixing
	 * that fixes the email, and adds the host's outcome. Reads only the message and the mailer's code,
	 * never the email's content.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_Error $error The `wp_mail_failed` error.
	 * @return void
	 */
	public static function host_failed( $error ) {
		if ( ! $error instanceof WP_Error ) {
			return;
		}
		$data    = $error->get_error_data();
		$data    = is_array( $data ) ? $data : array();
		$pending = self::take_pending( $data );
		if ( ! $pending ) {
			return;
		}
		$host           = array(
			'result'         => 'failed',
			'reason'         => Failure_Reason::host_reason( $error ),
			'message'        => mb_substr( wp_strip_all_tags( $error->get_error_message() ), 0, Failure_Reason::STRING_CHARS ),
			'exception_code' => is_scalar( $data['phpmailer_exception_code'] ?? null ) ? $data['phpmailer_exception_code'] : '',
		);
		$detail         = $pending['detail'];
		$detail['host'] = $host;
		Email_Log::update(
			$pending['log_id'],
			array(
				'status' => Email_Log::STATUS_FAILED,
				'detail' => $detail,
			)
		);
		Stats::move( $pending['time'], Email_Log::STATUS_FALLBACK, Email_Log::STATUS_FAILED, 'wp_mail', $pending['origin'], $pending['log_id'] );
		/* translators: %s: the host's mail error message. */
		Debug_Log::add( 'error', 'sending', 'fallback.host_result', sprintf( __( 'Your host’s mail failed: %s', 'jetpack-send-pkg' ), $host['message'] ), $host, $pending['log_id'] );
	}

	/**
	 * The pending hand-off, when a hook's mail data is that email; it's taken, so it's answered once.
	 *
	 * @param array $mail_data Hook data with `to` and `subject`.
	 * @return array|null
	 */
	private static function take_pending( array $mail_data ) {
		$pending = self::$pending;
		if ( null === $pending || self::mail_hash( $mail_data['to'] ?? '', $mail_data['subject'] ?? '' ) !== $pending['hash'] ) {
			return null;
		}
		self::$pending = null;
		return $pending;
	}

	/**
	 * Forget the pending hand-off (at shutdown).
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function clear_pending() {
		self::$pending = null;
	}

	/**
	 * Which email a hook is about: its recipients (split, trimmed, lowercased, sorted) and subject.
	 *
	 * @param string|array $to      Recipients.
	 * @param string       $subject Subject.
	 * @return string
	 */
	private static function mail_hash( $to, $subject ) {
		$recipients = array();
		foreach ( is_array( $to ) ? $to : array( $to ) as $item ) {
			foreach ( explode( ',', (string) $item ) as $part ) {
				$part = strtolower( trim( $part ) );
				if ( '' !== $part ) {
					$recipients[] = $part;
				}
			}
		}
		sort( $recipients );
		return md5( implode( ',', $recipients ) . "\n" . (string) $subject );
	}

	/**
	 * Note an email Send picked up, for the debug log.
	 *
	 * @param array          $atts    wp_mail() attributes.
	 * @param array|WP_Error $payload MailChannels payload, or why it wasn't built.
	 * @param string         $origin  What sent it.
	 * @return void
	 */
	private static function note_caught( array $atts, $payload, $origin ) {
		$personalization = is_array( $payload ) ? $payload['personalizations'][0] : array();
		$recipients      = is_array( $payload )
			? count( $personalization['to'] ?? array() ) + count( $personalization['cc'] ?? array() ) + count( $personalization['bcc'] ?? array() )
			: count( Message_Builder::parse_recipients( $atts['to'] ?? array() ) );
		Debug_Log::add(
			'debug',
			'sending',
			'mail.caught',
			/* translators: 1: what sent the email, e.g. "Shop Orders" or "WordPress", 2: how many recipients. */
			sprintf( _n( 'Picked up an email from %1$s for %2$d recipient.', 'Picked up an email from %1$s for %2$d recipients.', $recipients, 'jetpack-send-pkg' ), '' !== $origin ? Email_Origin::label( $origin ) : __( 'your site', 'jetpack-send-pkg' ), $recipients ),
			array(
				'origin'       => $origin,
				'recipients'   => $recipients,
				'attachments'  => count( Message_Builder::attachment_files( $atts['attachments'] ?? array() ) ),
				'content_type' => is_array( $payload ) ? (string) end( $payload['content'] )['type'] : '',
			)
		);
	}

	/**
	 * Send one built message.
	 *
	 * @param array $payload MailChannels payload.
	 * @param array $account Provisioned account.
	 * @return array{request_id: string, message_id: string, ms: int}|WP_Error The error's data keeps the request ID,
	 *                                                                         the result and the time taken.
	 */
	private static function deliver( array $payload, array $account ) {
		$client   = new MailChannels_Client( $account['api_key'] );
		$response = $client->send( $payload );
		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$last   = $client->last_response();
		$result = isset( $response['results'][0] ) && is_array( $response['results'][0] ) ? $response['results'][0] : null;
		$data   = array(
			// The REST status, should the error reach a response.
			'status'       => 502,
			'http_status'  => $last['status'],
			'request_id'   => is_scalar( $response['request_id'] ?? null ) ? (string) $response['request_id'] : '',
			'ms'           => $last['ms'],
			'content_type' => $last['content_type'],
			'bytes'        => $last['bytes'],
		);
		if ( null === $result || ! isset( $result['status'] ) || ! is_scalar( $result['status'] ) ) {
			// Accepted, maybe: the answer didn't say.
			return new WP_Error( 'jetpack_send_unclear', __( 'The sending service’s answer couldn’t be read.', 'jetpack-send-pkg' ), $data );
		}

		$reason             = ! empty( $result['reason'] ) && is_string( $result['reason'] ) ? $result['reason'] : '';
		$data['message_id'] = is_scalar( $result['message_id'] ?? null ) ? (string) $result['message_id'] : '';
		$data['result']     = array(
			'status'     => (string) $result['status'],
			'reason'     => $reason,
			'message_id' => $data['message_id'],
		);
		if ( 'sent' !== $result['status'] ) {
			return new WP_Error( 'jetpack_send_rejected', '' !== $reason ? $reason : __( 'The sending service did not accept the message.', 'jetpack-send-pkg' ), $data );
		}

		return array(
			'request_id' => $data['request_id'],
			'message_id' => $data['message_id'],
			'ms'         => $data['ms'],
		);
	}

	/**
	 * The details kept with a sent email: its request and message IDs and the time taken.
	 *
	 * @param array $result deliver()'s result.
	 * @return array
	 */
	private static function sent_detail( array $result ) {
		return array_filter(
			array(
				'v'          => 1,
				'stage'      => 'result',
				'request_id' => (string) $result['request_id'],
				'message_id' => (string) $result['message_id'],
				'timing'     => array(
					'ms'        => (int) $result['ms'],
					'timeout_s' => Failure_Reason::TIMEOUT,
				),
				'locale'     => get_locale(),
			),
			fn( $value ) => '' !== $value
		);
	}

	/**
	 * Send a copy of a logged email straight to the service, and log it as a new row. Skips wp_mail()
	 * and its hooks: the stored copy already went through them. No backup through the host's mail.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $atts     wp_mail()-style attributes built from the stored copy.
	 * @param array $settings Send settings.
	 * @param array $account  The provisioned account.
	 * @param array $row      `origin`, `resend_of` and `user_id` for the new row.
	 * @return array{log_id: string, status: string, reason: string, error: string}
	 */
	public static function deliver_resend( array $atts, array $settings, array $account, array $row = array() ) {
		Debug_Log::hold();
		$now     = time();
		$origin  = (string) ( $row['origin'] ?? '' );
		$payload = Message_Builder::build( $atts, $settings, $account );
		$result  = is_wp_error( $payload ) ? $payload : self::deliver( $payload, $account );
		if ( is_wp_error( $result ) ) {
			$context = array(
				'fallback' => false,
				'records'  => $account['dns_check'] ?? null,
			);
			$reason  = Failure_Reason::classify( $result, $context );
			$detail  = Failure_Reason::detail( $result, $context + array( 'reason' => $reason ) );
			$data    = $result->get_error_data();
			$status  = Email_Log::STATUS_FAILED;
			$request = is_array( $data ) && is_scalar( $data['request_id'] ?? null ) ? (string) $data['request_id'] : '';
			$error   = self::error_text( $result );
		} else {
			$reason  = '';
			$detail  = self::sent_detail( $result );
			$status  = Email_Log::STATUS_SENT;
			$request = $result['request_id'];
			$error   = '';
		}

		$log_id = Email_Log::insert(
			self::log_row( $atts, $payload, $status, $request, $error, 'resend' ) + array(
				'origin'     => $origin,
				'reason'     => $reason,
				'detail'     => $detail,
				'resend_of'  => (int) ( $row['resend_of'] ?? 0 ),
				'user_id'    => (int) ( $row['user_id'] ?? 0 ),
				'created_at' => $now,
			)
		);
		Debug_Log::claim( (int) $log_id );
		Stats::add( $now, $status, 'resend', $origin, (int) $log_id );
		return array(
			'log_id' => $log_id ? (string) $log_id : '',
			'status' => $status,
			'reason' => $reason,
			'error'  => $error,
		);
	}

	/**
	 * Send a test email, skipping the enabled check and fallback so the result reflects MailChannels.
	 *
	 * No recipient lock or rate limit here: the REST route applies those, and the watch's automatic test calls this directly.
	 *
	 * @param string $to   Recipient.
	 * @param string $kind `manual` (from the dashboard) or `auto` (sent when the domain finished connecting).
	 * @return array{request_id: string, log_id: string}|WP_Error On failure the error data carries `log_id` when a row
	 *                                                            was logged, and `reason`.
	 */
	public static function send_test( $to, $kind = 'manual' ) {
		$account = Account::get();
		if ( ! $account ) {
			return new WP_Error( 'jetpack_send_not_set_up', __( 'Set up Send before sending a test email.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}

		$settings = Settings::get();
		$domain   = strtolower( (string) $account['domain'] );
		$site     = wp_specialchars_decode( (string) get_bloginfo( 'name' ), ENT_QUOTES );
		$from     = Message_Builder::sender( $settings, $account )['email'];
		$subject  = 'auto' === $kind
			/* translators: %s: the domain emails are sent from, e.g. example.com. */
			? sprintf( __( '%s is ready to send email', 'jetpack-send-pkg' ), $domain )
			/* translators: %s: site title. */
			: sprintf( __( 'Test email from %s', 'jetpack-send-pkg' ), '' !== $site ? $site : $domain );

		// Reserve the row first, so the email can link to its own log entry. Its time is the one counted.
		$now    = time();
		$log_id = self::log(
			array(
				'to'      => $to,
				'subject' => $subject,
			),
			null,
			Email_Log::STATUS_FAILED,
			'',
			__( 'The test email was not sent.', 'jetpack-send-pkg' ),
			'test',
			'',
			null,
			'',
			$now
		);
		$intro  = 'auto' === $kind
			/* translators: 1: the domain emails are sent from, 2: the From email address. */
			? sprintf( __( 'Jetpack Send finished connecting %1$s. Sending is on, and this test came from %2$s.', 'jetpack-send-pkg' ), $domain, $from )
			/* translators: 1: the From email address, 2: the domain emails are sent from. */
			: sprintf( __( 'This email came from %1$s through Jetpack Send, signed for %2$s. Your site\'s password resets, receipts and form replies go out the same way.', 'jetpack-send-pkg' ), $from, $domain );
		/* translators: %s: link to this email in the Send log. */
		$link = sprintf( __( 'See it in your Send log: %s', 'jetpack-send-pkg' ), self::log_url( $log_id ) );

		$atts = array(
			'to'          => $to,
			'subject'     => $subject,
			'message'     => $intro . "\n\n" . $link,
			'headers'     => '',
			'attachments' => array(),
		);

		Debug_Log::hold();
		$payload = Message_Builder::build( $atts, $settings, $account );
		$result  = is_wp_error( $payload ) ? $payload : self::deliver( $payload, $account );
		$reason  = '';
		if ( is_wp_error( $result ) ) {
			$context = array( 'records' => $account['dns_check'] ?? null );
			$reason  = Failure_Reason::classify( $result, $context );
			$data    = $result->get_error_data();
			$row     = array( Email_Log::STATUS_FAILED, is_array( $data ) && is_scalar( $data['request_id'] ?? null ) ? (string) $data['request_id'] : '', self::error_text( $result ), Failure_Reason::detail( $result, $context + array( 'reason' => $reason ) ) );
		} else {
			$row = array( Email_Log::STATUS_SENT, $result['request_id'], '', self::sent_detail( $result ) );
		}
		$extra = array(
			'reason' => $reason,
			'detail' => $row[3],
		);
		if ( $log_id ) {
			Email_Log::update( $log_id, self::log_row( $atts, $payload, $row[0], $row[1], $row[2], 'test' ) + $extra );
			Debug_Log::claim( (int) $log_id );
		} else {
			$log_id = self::log( $atts, $payload, $row[0], $row[1], $row[2], 'test', '', $row[3], $reason, $now );
		}
		// Counted in the reserved row's hour; the counts changed without a new row, so cached stats are stale.
		Stats::add( $now, $row[0], 'test', '', (int) $log_id );
		Email_Log::clear_stats_cache();

		if ( is_wp_error( $result ) ) {
			Debug_Log::add(
				'error',
				'sending',
				'test.failed',
				self::failed_line( $reason, $domain, true ),
				array(
					'kind'   => $kind,
					'reason' => $reason,
					'code'   => $result->get_error_code(),
				),
				(int) $log_id
			);
			$data = $result->get_error_data();
			return new WP_Error(
				$result->get_error_code(),
				self::error_text( $result ),
				array_merge(
					is_array( $data ) ? $data : array(),
					array(
						'log_id' => $log_id ? (string) $log_id : '',
						'reason' => $reason,
					)
				)
			);
		}

		Debug_Log::add(
			'info',
			'sending',
			'test.sent',
			__( 'Test sent.', 'jetpack-send-pkg' ),
			array(
				'kind'       => $kind,
				'request_id' => $result['request_id'],
			),
			(int) $log_id
		);
		if ( null === Onboarding::state()['test_sent_at'] ) {
			Onboarding::record( array( 'test_sent_at' => gmdate( 'Y-m-d\\TH:i:s\\Z' ) ) );
		}

		return array(
			'request_id' => $result['request_id'],
			'log_id'     => $log_id ? (string) $log_id : '',
		);
	}

	/**
	 * The error text kept in the log: the service's own words, led by its HTTP status when it sent
	 * one, so the dashboard can tell an account or service problem from a records problem.
	 *
	 * @param WP_Error $error A send error.
	 * @return string
	 */
	private static function error_text( WP_Error $error ) {
		$message = $error->get_error_message();
		$data    = $error->get_error_data();
		$status  = is_array( $data ) && isset( $data['status'] ) ? (int) $data['status'] : 0;
		if ( 0 === strpos( (string) $error->get_error_code(), 'jetpack_send_http_' ) && $status >= 400 && false === stripos( $message, 'HTTP ' . $status ) ) {
			return 'HTTP ' . $status . ': ' . $message;
		}
		return $message;
	}

	/**
	 * Admin URL of the Send log, with one entry highlighted when an id is given.
	 *
	 * @param int|false $log_id Log row id.
	 * @return string
	 */
	public static function log_url( $log_id ) {
		$args = array(
			'page' => Admin_Page::MENU_SLUG,
			'p'    => '/log',
		);
		if ( $log_id ) {
			$args['entry'] = (int) $log_id;
		}
		return add_query_arg( $args, admin_url( 'admin.php' ) );
	}

	/**
	 * Write a log row.
	 *
	 * @param array               $atts       wp_mail() attributes.
	 * @param array|WP_Error|null $payload    MailChannels payload, why it wasn't built, or null before building.
	 * @param string              $status     Email_Log status.
	 * @param string              $request_id MailChannels request ID.
	 * @param string              $error      Error message.
	 * @param string              $source     `wp_mail` or `test`.
	 * @param string              $origin     What sent it (Email_Origin key); '' for tests.
	 * @param array|null          $detail     Structured details of the send.
	 * @param string              $reason     The failure reason key; '' when it was sent.
	 * @param int|null            $time       When it was sent, Unix time; defaults to now.
	 * @return int|false The row id, or false when nothing was logged.
	 */
	private static function log( array $atts, $payload, $status, $request_id, $error, $source, $origin = '', $detail = null, $reason = '', $time = null ) {
		$row = self::log_row( $atts, $payload, $status, $request_id, $error, $source ) + array(
			'origin' => $origin,
			'reason' => $reason,
			'detail' => $detail,
		);
		if ( null !== $time ) {
			$row['created_at'] = (int) $time;
		}
		$log_id = Email_Log::insert( $row );
		// The entries written before the row existed (picked up, the API call) now point at it.
		Debug_Log::claim( (int) $log_id );
		return $log_id;
	}

	/**
	 * The log columns for one email.
	 *
	 * @param array               $atts       wp_mail() attributes.
	 * @param array|WP_Error|null $payload    MailChannels payload, why it wasn't built, or null before building.
	 * @param string              $status     Email_Log status.
	 * @param string              $request_id MailChannels request ID.
	 * @param string              $error      Error message.
	 * @param string              $source     `wp_mail`, `test` or `resend`.
	 * @return array
	 */
	private static function log_row( array $atts, $payload, $status, $request_id, $error, $source ) {
		$to = $atts['to'] ?? '';
		return array(
			'recipients' => is_array( $to ) ? implode( ', ', $to ) : (string) $to,
			'subject'    => (string) ( $atts['subject'] ?? '' ),
			'status'     => $status,
			'error'      => $error,
			'request_id' => $request_id,
			'source'     => $source,
			'message'    => null === $payload ? null : self::log_message( $atts, $payload ),
		);
	}

	/**
	 * What the log keeps of an email: the message as sent, or as wp_mail() received it. Addresses are
	 * always kept; the body is left out (`kept` says why) when the site turns content off or it's too big.
	 *
	 * @param array          $atts    wp_mail() attributes.
	 * @param array|WP_Error $payload MailChannels payload, or why it wasn't built.
	 * @return array
	 */
	public static function log_message( array $atts, $payload ) {
		if ( is_array( $payload ) ) {
			$personalization = $payload['personalizations'][0];
			// The HTML part comes last when there is one.
			$part    = end( $payload['content'] );
			$message = array(
				'from'         => $payload['from'],
				'reply_to'     => $payload['reply_to'] ?? null,
				'to'           => $personalization['to'] ?? array(),
				'cc'           => $personalization['cc'] ?? array(),
				'bcc'          => $personalization['bcc'] ?? array(),
				'subject'      => (string) ( $payload['subject'] ?? '' ),
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
				'to'           => Message_Builder::parse_recipients( $atts['to'] ?? array() ),
				'cc'           => $headers['cc'],
				'bcc'          => $headers['bcc'],
				'subject'      => (string) ( $atts['subject'] ?? '' ),
				'content_type' => 'text/html' === strtolower( $content_type ) ? 'text/html' : 'text/plain',
				'body'         => (string) ( $atts['message'] ?? '' ),
				'attachments'  => array_column( Message_Builder::attachment_files( $atts['attachments'] ?? array() ), 'filename' ),
			);
		}
		$message['kept']     = 'full';
		$message['redacted'] = false;

		/**
		 * Whether Send keeps an email's content in its log so it can be previewed. Addresses are kept either way.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool  $keep Default true.
		 * @param array $atts wp_mail() attributes.
		 */
		if ( ! apply_filters( 'jetpack_send_log_email_content', true, $atts ) ) {
			$message['body'] = null;
			$message['kept'] = 'off';
		} elseif ( strlen( $message['body'] ) > Email_Log::MAX_BODY_BYTES ) {
			$message['body'] = null;
			$message['kept'] = 'too_large';
		}
		return $message;
	}
}
