<?php
/**
 * Why an email didn't go out.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Works out a failure's reason key and its structured details when the email fails, from error codes
 * first and the service's own words second. The service doesn't translate its words; core and the
 * host's mailer do, which is why this runs here and not in the browser.
 */
class Failure_Reason {

	/**
	 * Every reason and who can fix it. The dashboard reads the same table from a shared test fixture.
	 *
	 * @var array<string, string>
	 */
	const OWNERS = array(
		'unsupported'        => 'none',
		'too_large'          => 'email',
		'attachment_missing' => 'email',
		'attachment_blocked' => 'email',
		'bad_address'        => 'recipient',
		'lockdown'           => 'records',
		'dkim'               => 'records',
		'spf'                => 'records',
		'sender_domain'      => 'records',
		'unverified'         => 'ours',
		'account'            => 'ours',
		'limit'              => 'ours',
		'paused'             => 'ours',
		'busy'               => 'retry',
		'service_down'       => 'ours',
		'no_answer'          => 'retry',
		'unclear'            => 'ours',
		'blocked_by_site'    => 'site',
		'cant_find'          => 'server',
		'cant_connect'       => 'server',
		'insecure'           => 'server',
		'content'            => 'email',
		'virus'              => 'email',
		'suppressed'         => 'recipient',
		'rejected'           => 'recipient',
		'bad_list'           => 'ours',
		'unknown'            => 'ours',
	);

	/**
	 * Errors from building the message, by code.
	 *
	 * @var array<string, string>
	 */
	const BUILD_ERRORS = array(
		'jetpack_send_no_recipients'         => 'bad_address',
		'jetpack_send_attachment_unreadable' => 'attachment_missing',
		'jetpack_send_attachment_too_large'  => 'too_large',
		'jetpack_send_unsupported'           => 'unsupported',
	);

	/**
	 * The host's mailer's error keys, and the outcome each means.
	 *
	 * @var array<string, string>
	 */
	const HOST_KEYS = array(
		'instantiate'         => 'host_off',
		'execute'             => 'host_off',
		'authenticate'        => 'host_login',
		'connect_host'        => 'host_unreachable',
		'smtp_connect_failed' => 'host_unreachable',
		'recipients_failed'   => 'host_refused',
		'from_failed'         => 'host_refused',
		'data_not_accepted'   => 'host_refused',
		'invalid_address'     => 'bad_address',
		'provide_address'     => 'bad_address',
		'file_access'         => 'attachment_missing',
		'file_open'           => 'attachment_missing',
	);

	/**
	 * The host's mailer's own English messages, used when its translated table isn't at hand.
	 *
	 * @var array<string, string>
	 */
	const HOST_MESSAGES = array(
		'instantiate'         => 'Could not instantiate mail function.',
		'execute'             => 'Could not execute: ',
		'authenticate'        => 'SMTP Error: Could not authenticate.',
		'connect_host'        => 'SMTP Error: Could not connect to SMTP host.',
		'smtp_connect_failed' => 'SMTP connect() failed.',
		'recipients_failed'   => 'SMTP Error: The following recipients failed: ',
		'from_failed'         => 'The following From address failed: ',
		'data_not_accepted'   => 'SMTP Error: data not accepted.',
		'invalid_address'     => 'Invalid address: ',
		'provide_address'     => 'You must provide at least one recipient email address.',
		'file_access'         => 'Could not access file: ',
		'file_open'           => 'File Error: Could not open file: ',
	);

	/**
	 * The send timeout, in seconds, when the error doesn't say.
	 *
	 * @var int
	 */
	const TIMEOUT = 30;

	/**
	 * Every string in a detail is cut to this many characters.
	 *
	 * @var int
	 */
	const STRING_CHARS = 500;

	/**
	 * The reason for a failed send. First match wins.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_Error $error   Why the send failed.
	 * @param array    $context `ms` (int), `records` (the last domain check).
	 * @return string A key from OWNERS.
	 */
	public static function classify( WP_Error $error, array $context = array() ) {
		$code   = (string) $error->get_error_code();
		$data   = self::data( $error );
		$text   = self::text( $error );
		$status = self::http_status( $error );

		if ( isset( self::BUILD_ERRORS[ $code ] ) ) {
			return self::BUILD_ERRORS[ $code ];
		}
		if ( preg_match( '/\bverified (?:e-?mail )?(?:address|recipient)/i', $text ) ) {
			return 'unverified';
		}
		if ( 0 === $status && self::is_transport( $error ) ) {
			return self::transport_reason( (string) ( $data['wp_code'] ?? $code ), self::errno( $error ), $error->get_error_message(), (int) ( $context['ms'] ?? $data['ms'] ?? 0 ), (int) ( $data['timeout_s'] ?? self::TIMEOUT ) );
		}
		if ( $status >= 500 ) {
			return 'service_down';
		}
		if ( 401 === $status || 402 === $status ) {
			return 'account';
		}
		if ( 413 === $status ) {
			return 'too_large';
		}
		if ( 429 === $status ) {
			return preg_match( '/\b(?:limit|quota)\b/i', $text ) ? 'limit' : 'busy';
		}
		if ( 400 === $status || 403 === $status || ( $status >= 200 && $status < 300 ) ) {
			$records = self::records_reason( $text );
			if ( '' !== $records ) {
				return $records;
			}
		}
		$policy = self::policy_reason( $text );
		if ( '' !== $policy ) {
			return $policy;
		}
		if ( 403 === $status ) {
			if ( preg_match( '/suspend|disabled/i', $text ) ) {
				return 'paused';
			}
			// A bare 403 is a records problem when the last check said the permission record failed.
			$records = is_array( $context['records'] ?? null ) ? $context['records'] : array();
			return 'failed' === ( $records['domain_lockdown'] ?? '' ) ? 'lockdown' : 'account';
		}
		if ( 400 === $status ) {
			if ( preg_match( '/personali[sz]ations|\.(?:to|cc|bcc)\b|\b(?:to|cc|bcc) (?:field|address)|\baddress(?:es)?\b|\brecipients?\b|\binvalid e-?mail\b/i', $text ) ) {
				return 'bad_address';
			}
			return preg_match( '/attachment/i', $text ) ? 'attachment_blocked' : 'account';
		}
		if ( 'jetpack_send_unclear' === $code ) {
			return 'unclear';
		}
		if ( preg_match( '/\bspam\b|content (?:filter|scan|polic)|\bflagged\b/i', $text ) ) {
			return 'content';
		}
		if ( preg_match( '/\breject(?:ed|s)?\b|user unknown|no such (?:user|mailbox)|mailbox (?:unavailable|not found|full)|\b5\.1\.\d+\b/i', $text ) ) {
			return 'rejected';
		}
		return 'unknown';
	}

	/**
	 * Records problems named in the service's words.
	 *
	 * @param string $text The service's words.
	 * @return string A records reason, `account` for the service's own signing key, or ''.
	 */
	private static function records_reason( $text ) {
		if ( preg_match( '/not (?:authori[sz]ed|permitted|allowed) to send|lock\s?down|_mailchannels/i', $text ) ) {
			return 'lockdown';
		}
		if ( preg_match( '/\[SDNF\]|sender domain not found|\b5\.1\.2\b/i', $text ) ) {
			return 'sender_domain';
		}
		if ( preg_match( '/\[BFD\]|prohibited by SPF/i', $text ) ) {
			return 'spf';
		}
		if ( preg_match( '/\bdkim\b|_domainkey/i', $text ) ) {
			// The service's own key missing or retired isn't the site's record.
			return preg_match( '/no dkim key|key (?:was )?not found|retired|revoked/i', $text ) ? 'account' : 'dkim';
		}
		return '';
	}

	/**
	 * The service's policy codes, like `550 5.7.1 [CS] Message blocked`.
	 *
	 * @param string $text The service's words.
	 * @return string A reason, or ''.
	 */
	private static function policy_reason( $text ) {
		$rules = array(
			'content'            => '/\[(?:CS|SHF|XM)\]/i',
			'paused'             => '/\[(?:CSR|ESA)\]/i',
			'suppressed'         => '/\[(?:UNS|RB)\]|\bsuppress|\bunsubscribed\b/i',
			'bad_list'           => '/\[(?:BR|NS)\]/i',
			'busy'               => '/\[STF\]/i',
			'attachment_blocked' => '/\[FEB\]|attachment type (?:that )?is not allowed/i',
			'limit'              => '/daily limit|quota exceeded|\b451 4\.7\.1\b/i',
		);
		foreach ( $rules as $reason => $pattern ) {
			if ( preg_match( $pattern, $text ) ) {
				return 'content' === $reason && preg_match( '/\[CS\].*virus|virus.*\[CS\]/is', $text ) ? 'virus' : $reason;
			}
		}
		return '';
	}

	/**
	 * Network failures before any answer.
	 *
	 * @param string $wp_code WordPress's error code.
	 * @param int    $errno   cURL error number, 0 when unknown.
	 * @param string $message The error's words.
	 * @param int    $ms      How long the call took.
	 * @param int    $timeout The timeout, in seconds.
	 * @return string
	 */
	private static function transport_reason( $wp_code, $errno, $message, $ms, $timeout ) {
		if ( 'http_request_not_executed' === $wp_code ) {
			return 'blocked_by_site';
		}
		switch ( self::transport_phase( $errno, $message ) ) {
			case 'dns':
				return 'cant_find';
			case 'after_send':
				return in_array( $errno, array( 52, 55, 56 ), true ) ? 'service_down' : 'no_answer';
		}
		if ( in_array( $errno, array( 35, 58, 60, 77 ), true ) || preg_match( '/SSL certificate problem/i', $message ) ) {
			return 'insecure';
		}
		if ( 28 === $errno && ! preg_match( '/connection timed out/i', $message ) && $ms >= $timeout * 1000 ) {
			return 'no_answer';
		}
		return 'cant_connect';
	}

	/**
	 * When a network failure happened: finding the service, connecting to it, or after the email went out.
	 *
	 * @since $$next-version$$
	 *
	 * @param int    $errno   cURL error number, 0 when unknown.
	 * @param string $message The error's words.
	 * @return string `dns`, `connect`, `after_send` or `unknown`.
	 */
	public static function transport_phase( $errno, $message ) {
		$errno = (int) $errno;
		if ( 5 === $errno || 6 === $errno || preg_match( '/resolving timed out|could not resolve/i', $message ) ) {
			return 'dns';
		}
		if ( preg_match( '/operation timed out/i', $message ) || in_array( $errno, array( 52, 55, 56 ), true ) ) {
			return 'after_send';
		}
		if ( 7 === $errno || in_array( $errno, array( 35, 58, 60, 77 ), true ) || preg_match( '/connection timed out|failed to connect|connection refused/i', $message ) ) {
			return 'connect';
		}
		return 'unknown';
	}

	/**
	 * The details kept with a failed email's log row. Never a key, header, payload or body.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_Error $error   Why the send failed.
	 * @param array    $context `reason`, `ms`, `fallback` (bool), `records` (the last domain check), `locale`.
	 * @return array
	 */
	public static function detail( WP_Error $error, array $context = array() ) {
		$data   = self::data( $error );
		$code   = (string) $error->get_error_code();
		$status = self::http_status( $error );
		$reason = isset( $context['reason'] ) ? (string) $context['reason'] : self::classify( $error, $context );
		$detail = array(
			'v'     => 1,
			'stage' => self::stage( $error, $status ),
			'code'  => $code,
		);

		if ( $status > 0 ) {
			$detail['http_status'] = $status;
		}
		$errors = array_values( array_filter( array_map( fn( $item ) => is_scalar( $item ) ? (string) $item : '', (array) ( $data['errors'] ?? array() ) ) ) );
		if ( $errors ) {
			$detail['service_errors'] = array_slice( $errors, 0, 5 );
		}
		if ( isset( $data['result'] ) && is_array( $data['result'] ) ) {
			$detail['result'] = array_filter(
				array(
					'status'     => is_scalar( $data['result']['status'] ?? null ) ? (string) $data['result']['status'] : '',
					'reason'     => is_scalar( $data['result']['reason'] ?? null ) ? (string) $data['result']['reason'] : '',
					'message_id' => is_scalar( $data['result']['message_id'] ?? null ) ? (string) $data['result']['message_id'] : '',
				)
			);
		}
		$smtp = self::smtp( self::text( $error ) );
		if ( $smtp ) {
			$detail['smtp'] = $smtp;
		}
		if ( 0 === $status && self::is_transport( $error ) ) {
			$errno               = self::errno( $error );
			$detail['transport'] = array(
				'wp_code' => (string) ( $data['wp_code'] ?? $code ),
				'errno'   => $errno,
				'phase'   => (string) ( $data['phase'] ?? self::transport_phase( $errno, $error->get_error_message() ) ),
				'message' => $error->get_error_message(),
			);
		}
		$ms = $context['ms'] ?? $data['ms'] ?? null;
		if ( null !== $ms ) {
			$detail['timing'] = array(
				'ms'        => (int) $ms,
				'timeout_s' => (int) ( $data['timeout_s'] ?? self::TIMEOUT ),
			);
		}
		foreach ( array( 'request_id', 'message_id' ) as $key ) {
			if ( isset( $data[ $key ] ) && is_scalar( $data[ $key ] ) && '' !== (string) $data[ $key ] ) {
				$detail[ $key ] = (string) $data[ $key ];
			}
		}
		if ( isset( $context['fallback'] ) ) {
			$detail['fallback'] = $context['fallback'] ? 'on' : 'off';
		}
		$records = is_array( $context['records'] ?? null ) ? $context['records'] : null;
		if ( $records && 'records' === ( self::OWNERS[ $reason ] ?? '' ) ) {
			$detail['records'] = array_filter(
				array(
					'lockdown'   => (string) ( $records['domain_lockdown'] ?? '' ),
					'dkim'       => (string) ( $records['dkim'] ?? '' ),
					'spf'        => (string) ( $records['spf'] ?? '' ),
					'checked_at' => (string) ( $records['checked_at'] ?? '' ),
				)
			);
		}
		$builder = array_filter(
			array(
				'feature'     => (string) ( $data['feature'] ?? '' ),
				'attachments' => isset( $data['attachments'] ) && is_array( $data['attachments'] ) ? array(
					'count' => (int) ( $data['attachments']['count'] ?? 0 ),
					'bytes' => (int) ( $data['attachments']['bytes'] ?? 0 ),
				) : null,
			)
		);
		if ( $builder ) {
			$detail['builder'] = $builder;
		}
		$detail['locale'] = (string) ( $context['locale'] ?? get_locale() );
		return self::cap( $detail );
	}

	/**
	 * The host's mail outcome after a hand-off failed, from its mailer's error key, never from words.
	 * The key is found by matching the message against the mailer's own table, in the site's language.
	 *
	 * @since $$next-version$$
	 *
	 * @param WP_Error $error The `wp_mail_failed` error.
	 * @return string `host_off`, `host_login`, `host_unreachable`, `host_refused`, `host_failed`, `bad_address` or `attachment_missing`.
	 */
	public static function host_reason( WP_Error $error ) {
		$key = self::host_key( $error );
		return self::HOST_KEYS[ $key ] ?? 'host_failed';
	}

	/**
	 * The host's mailer's error key for a failure: the error data's `phpmailer_key` when set, else the
	 * longest of its messages the error starts with.
	 *
	 * @param WP_Error $error The `wp_mail_failed` error.
	 * @return string The key, or ''.
	 */
	private static function host_key( WP_Error $error ) {
		global $phpmailer;
		$data = self::data( $error );
		if ( isset( $data['phpmailer_key'] ) && is_string( $data['phpmailer_key'] ) ) {
			return $data['phpmailer_key'];
		}

		$tables = array();
		if ( is_object( $phpmailer ) && method_exists( $phpmailer, 'getTranslations' ) ) {
			$tables[] = (array) $phpmailer->getTranslations();
		}
		$tables[] = self::HOST_MESSAGES;

		$message = trim( wp_strip_all_tags( $error->get_error_message() ) );
		foreach ( $tables as $table ) {
			$best = '';
			$size = 0;
			foreach ( $table as $key => $text ) {
				$prefix = rtrim( trim( (string) $text ), ' .:' );
				if ( '' !== $prefix && strlen( $prefix ) > $size && 0 === stripos( $message, $prefix ) ) {
					$best = (string) $key;
					$size = strlen( $prefix );
				}
			}
			if ( '' !== $best ) {
				return $best;
			}
		}
		return '';
	}

	/**
	 * The plain headline for a reason, as the dashboard words it. For the resend dialog's answer.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $reason   A key from OWNERS.
	 * @param string $domain   The sending domain.
	 * @param bool   $dev_mode Whether the site sends through a development account.
	 * @return string
	 */
	public static function headline( $reason, $domain = '', $dev_mode = false ) {
		$our_side = __( 'The problem is on our side, not your site.', 'jetpack-send-pkg' );
		switch ( $reason ) {
			case 'unsupported':
				return __( 'Jetpack Send can’t handle something in this email yet.', 'jetpack-send-pkg' );
			case 'too_large':
				return __( 'This email is too big. Its files add up to more than 20 MB.', 'jetpack-send-pkg' );
			case 'attachment_missing':
				return __( 'A file this email should attach is missing.', 'jetpack-send-pkg' );
			case 'attachment_blocked':
				return __( 'It has a type of file Jetpack Send can’t send, like a program file.', 'jetpack-send-pkg' );
			case 'bad_address':
				return __( 'The address it was going to isn’t a real email address.', 'jetpack-send-pkg' );
			case 'lockdown':
				return '' !== $domain
					/* translators: %s: the sending domain, e.g. example.com. */
					? sprintf( __( '%s hasn’t given Jetpack permission to send yet. Record 1 isn’t showing up.', 'jetpack-send-pkg' ), $domain )
					: __( 'Your domain hasn’t given Jetpack permission to send yet. Record 1 isn’t showing up.', 'jetpack-send-pkg' );
			case 'dkim':
				return __( 'Your signing record doesn’t match what Jetpack needs. Check record 2.', 'jetpack-send-pkg' );
			case 'spf':
				return __( 'Your domain’s sender list doesn’t include Jetpack, so this was blocked.', 'jetpack-send-pkg' );
			case 'sender_domain':
				return '' !== $domain
					/* translators: %s: the sending domain, e.g. example.com. */
					? sprintf( __( '%s needs a website or mail record before it can send.', 'jetpack-send-pkg' ), $domain )
					: __( 'Your domain needs a website or mail record before it can send.', 'jetpack-send-pkg' );
			case 'unverified':
				return $dev_mode ? __( 'This sending account can only email verified addresses.', 'jetpack-send-pkg' ) : $our_side;
			case 'account':
				return $our_side;
			case 'limit':
				return __( 'Your site reached its email limit for now.', 'jetpack-send-pkg' );
			case 'paused':
				return __( 'Our email service paused sending for your site.', 'jetpack-send-pkg' );
			case 'busy':
				return __( 'Your site sent a lot of email at once, so it was slowed down.', 'jetpack-send-pkg' );
			case 'service_down':
				return __( 'The problem is on our side, not your site. Our email service had a hiccup.', 'jetpack-send-pkg' );
			case 'no_answer':
				return __( 'We didn’t hear back in time, so it may still arrive.', 'jetpack-send-pkg' );
			case 'unclear':
				return __( 'We couldn’t read the answer, so it may have gone out.', 'jetpack-send-pkg' );
			case 'blocked_by_site':
				return __( 'Your site’s settings stop it from connecting to our email service.', 'jetpack-send-pkg' );
			case 'cant_find':
				return __( 'Your server couldn’t find our email service.', 'jetpack-send-pkg' );
			case 'cant_connect':
				return __( 'Your server couldn’t connect to our email service.', 'jetpack-send-pkg' );
			case 'insecure':
				return __( 'Your server couldn’t make a safe connection to our email service.', 'jetpack-send-pkg' );
			case 'content':
				return __( 'It was flagged as spam.', 'jetpack-send-pkg' );
			case 'virus':
				return __( 'Our scanner thought it had a virus.', 'jetpack-send-pkg' );
			case 'suppressed':
				return __( 'This address can’t get email from your site right now.', 'jetpack-send-pkg' );
			case 'rejected':
				return __( 'The receiving mail server turned it down.', 'jetpack-send-pkg' );
			case 'bad_list':
				return __( 'Many emails from your site went to addresses that don’t exist, so sending is limited.', 'jetpack-send-pkg' );
		}
		return __( 'We couldn’t tell why.', 'jetpack-send-pkg' );
	}

	/**
	 * One technical line saying what happened, for Copy details. Not customer copy: support reads it.
	 *
	 * @since $$next-version$$
	 *
	 * @param string     $status The row's status.
	 * @param array|null $detail The row's detail.
	 * @return string '' when nothing is known.
	 */
	public static function what_happened( $status, $detail ) {
		if ( ! is_array( $detail ) ) {
			return '';
		}
		$http = (int) ( $detail['http_status'] ?? 0 );
		if ( Email_Log::STATUS_SENT === $status ) {
			return 'Accepted by the email service';
		}
		if ( isset( $detail['transport'] ) ) {
			$errno   = (int) ( $detail['transport']['errno'] ?? 0 );
			$seconds = isset( $detail['timing']['ms'] ) ? sprintf( ' after %.1f s', $detail['timing']['ms'] / 1000 ) : '';
			$phase   = array(
				'dns'        => ', finding the service',
				'connect'    => ', before sending',
				'after_send' => ', after sending',
			)[ $detail['transport']['phase'] ?? '' ] ?? '';
			return ( $errno ? 'cURL error ' . $errno : 'Network error' ) . $seconds . $phase;
		}
		if ( 'build' === ( $detail['stage'] ?? '' ) ) {
			return 'Not built: ' . ( '' !== (string) ( $detail['builder']['feature'] ?? '' ) ? $detail['builder']['feature'] : ( $detail['code'] ?? 'unknown' ) );
		}
		if ( 'jetpack_send_unclear' === ( $detail['code'] ?? '' ) ) {
			return 'HTTP ' . $http . ' from the email service, but the answer couldn’t be read';
		}
		if ( $http >= 200 && $http < 300 ) {
			return 'Refused by the email service (HTTP ' . $http . ')';
		}
		return $http ? 'HTTP ' . $http . ' from the email service' : '';
	}

	/**
	 * The error's data as an array.
	 *
	 * @param WP_Error $error Error.
	 * @return array
	 */
	private static function data( WP_Error $error ) {
		$data = $error->get_error_data();
		return is_array( $data ) ? $data : array();
	}

	/**
	 * Everything the service said, plus the message, for matching words.
	 *
	 * @param WP_Error $error Error.
	 * @return string
	 */
	private static function text( WP_Error $error ) {
		$data  = self::data( $error );
		$parts = array( $error->get_error_message() );
		foreach ( (array) ( $data['errors'] ?? array() ) as $item ) {
			if ( is_scalar( $item ) ) {
				$parts[] = (string) $item;
			}
		}
		if ( isset( $data['result']['reason'] ) && is_scalar( $data['result']['reason'] ) ) {
			$parts[] = (string) $data['result']['reason'];
		}
		return implode( "\n", $parts );
	}

	/**
	 * The service's HTTP status: the real one when the error says, else the one in a `jetpack_send_http_N` code.
	 *
	 * @param WP_Error $error Error.
	 * @return int 0 when there was no answer.
	 */
	private static function http_status( WP_Error $error ) {
		$data = self::data( $error );
		if ( isset( $data['http_status'] ) ) {
			return (int) $data['http_status'];
		}
		return preg_match( '/^jetpack_send_http_(\d+)$/', (string) $error->get_error_code(), $match ) ? (int) $match[1] : 0;
	}

	/**
	 * Whether the call never got an answer.
	 *
	 * @param WP_Error $error Error.
	 * @return bool
	 */
	private static function is_transport( WP_Error $error ) {
		return in_array( (string) $error->get_error_code(), array( 'jetpack_send_transport', 'http_request_failed', 'http_request_not_executed' ), true );
	}

	/**
	 * The cURL error number, from the error data or the `cURL error N:` message.
	 *
	 * @param WP_Error $error Error.
	 * @return int 0 when there's none.
	 */
	private static function errno( WP_Error $error ) {
		$data = self::data( $error );
		if ( ! empty( $data['errno'] ) ) {
			return (int) $data['errno'];
		}
		return preg_match( '/cURL error (\d+)/i', $error->get_error_message(), $match ) ? (int) $match[1] : 0;
	}

	/**
	 * Which step it failed at.
	 *
	 * @param WP_Error $error  Error.
	 * @param int      $status HTTP status, 0 for none.
	 * @return string
	 */
	private static function stage( WP_Error $error, $status ) {
		$code = (string) $error->get_error_code();
		if ( isset( self::BUILD_ERRORS[ $code ] ) ) {
			return 'build';
		}
		if ( 0 === $status && self::is_transport( $error ) ) {
			return 'after_send' === self::transport_phase( self::errno( $error ), $error->get_error_message() ) ? 'response' : 'request';
		}
		// The service answered, refused or not, so it stopped while reading that answer; still waiting
		// is kept for no answer at all.
		return $status > 0 ? 'result' : 'response';
	}

	/**
	 * A mail server code in the service's words, like `550 5.7.1 [CS]`.
	 *
	 * @param string $text The service's words.
	 * @return array{code?: string, enhanced?: string, policy?: string}
	 */
	private static function smtp( $text ) {
		$smtp = array();
		if ( preg_match( '/\b([245]\d\d)[ -]([245]\.\d{1,3}\.\d{1,3})\b/', $text, $match ) ) {
			$smtp['code']     = $match[1];
			$smtp['enhanced'] = $match[2];
		}
		if ( preg_match( '/\[([A-Z]{2,4})\]/', $text, $match ) ) {
			$smtp['policy'] = $match[1];
		}
		return $smtp;
	}

	/**
	 * Cut every string to STRING_CHARS.
	 *
	 * @param array $value Detail.
	 * @return array
	 */
	public static function cap( array $value ) {
		foreach ( $value as $key => $item ) {
			if ( is_array( $item ) ) {
				$value[ $key ] = self::cap( $item );
			} elseif ( is_string( $item ) && mb_strlen( $item ) > self::STRING_CHARS ) {
				$value[ $key ] = mb_substr( $item, 0, self::STRING_CHARS - 1 ) . '…';
			}
		}
		return $value;
	}
}
