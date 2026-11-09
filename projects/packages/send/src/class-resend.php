<?php
/**
 * Sending a logged email again.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Sends a new copy of a logged email straight to the mail service, never back through wp_mail(): the
 * stored copy already went through every filter once, and another run could wrap a template twice
 * or add another plugin's Bcc again. There's no backup through the host's mail either.
 */
class Resend {

	/**
	 * Most addresses in one resend, across To, Cc and Bcc.
	 *
	 * @var int
	 */
	const MAX_ADDRESSES = 10;

	/**
	 * Most addresses that weren't on the original.
	 *
	 * @var int
	 */
	const MAX_NEW_ADDRESSES = 5;

	/**
	 * The rate limit's window, in seconds.
	 *
	 * @var int
	 */
	const WINDOW = HOUR_IN_SECONDS;

	/**
	 * Times of the resends inside the window.
	 *
	 * @var string
	 */
	const TIMES_OPTION = 'jetpack_send_resend_times';

	/**
	 * Query parameters that look like they carry a sign-in secret; `rm_token` and `confirm_key` end in one.
	 *
	 * @var string[]
	 */
	const SIGN_IN_PARAMS = array( 'key', 'token', 'code', 'hash', 'auth', 'activation', 'login', 'reset' );

	/**
	 * Whether an email can be sent again, and to whom.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $entry A row from Email_Log::get().
	 * @return array{allowed: bool, reason: string, locked: bool} `reason` is '' when allowed.
	 */
	public static function eligibility( array $entry ) {
		$message = is_array( $entry['message'] ?? null ) ? $entry['message'] : null;
		$kept    = (string) ( $message['kept'] ?? 'full' );
		$reason  = '';
		if ( 'test' === ( $entry['source'] ?? '' ) ) {
			$reason = 'test';
		} elseif ( 'too_large' === $kept ) {
			$reason = 'too_large';
		} elseif ( ! $message || ! is_string( $message['body'] ?? null ) ) {
			$reason = 'no_content';
		} elseif ( ! empty( $message['attachments'] ) ) {
			$reason = 'attachments';
		} elseif ( 'unsupported' === ( $entry['reason'] ?? '' ) ) {
			$reason = 'unsupported';
		} elseif ( ! empty( $message['redacted'] ) ) {
			$reason = 'redacted';
		} else {
			$account = Account::get();
			if ( ! $account || array() !== REST_Controller::enable_blockers( $account ) ) {
				$reason = 'not_ready';
			} elseif ( empty( Settings::get()['enabled'] ) ) {
				$reason = 'paused';
			}
		}
		return array(
			'allowed' => '' === $reason,
			'reason'  => $reason,
			'locked'  => self::locked( $entry ),
		);
	}

	/**
	 * Whether an email holds what looks like a sign-in link, so it may go only to the same people or the
	 * current user. Fails closed: a store's order link locks too, and receipts still go to the same people.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $entry A row from Email_Log::get().
	 * @return bool
	 */
	public static function locked( array $entry ) {
		if ( in_array( (string) ( $entry['origin'] ?? '' ), array( 'core:password_reset', 'core:new_user' ), true ) ) {
			return true;
		}
		// The log couldn't check this one's links when it stored it.
		if ( is_array( $entry['message'] ?? null ) && ! empty( $entry['message']['locked'] ) ) {
			return true;
		}
		$body = is_array( $entry['message'] ?? null ) && is_string( $entry['message']['body'] ?? null ) ? $entry['message']['body'] : '';
		if ( ! preg_match_all( '/(?:\?|&(?:amp;|#0?38;)?)([A-Za-z0-9_-]+)=/', $body, $matches ) ) {
			return false;
		}
		$names = implode( '|', self::SIGN_IN_PARAMS );
		foreach ( $matches[1] as $name ) {
			if ( preg_match( '/^(?:.*_)?(?:' . $names . ')$/i', $name ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * The original's recipients: the parsed To kept since the log stored it, else the logged recipient list.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $entry A row from Email_Log::get().
	 * @return array{to: array[], cc: array[], bcc: array[]}
	 */
	public static function originals( array $entry ) {
		$message = is_array( $entry['message'] ?? null ) ? $entry['message'] : array();
		$to      = isset( $message['to'] ) && is_array( $message['to'] ) ? $message['to'] : Message_Builder::parse_recipients( (string) ( $entry['recipients'] ?? '' ) );
		return array(
			'to'  => self::addresses( $to ),
			'cc'  => self::addresses( $message['cc'] ?? array() ),
			'bcc' => self::addresses( $message['bcc'] ?? array() ),
		);
	}

	/**
	 * Check the addresses to resend to. Fields left as they were keep the original's names.
	 *
	 * @since $$next-version$$
	 *
	 * @param array  $entry      A row from Email_Log::get().
	 * @param array  $to         Addresses.
	 * @param array  $cc         Addresses.
	 * @param array  $bcc        Addresses.
	 * @param string $user_email The current user's address, for "Just me".
	 * @return array{to: array[], cc: array[], bcc: array[]}|WP_Error
	 */
	public static function validate( array $entry, array $to, array $cc, array $bcc, $user_email ) {
		$original = self::originals( $entry );
		$seen     = array();
		$clean    = array();
		foreach ( array(
			'to'  => $to,
			'cc'  => $cc,
			'bcc' => $bcc,
		) as $field => $values ) {
			$clean[ $field ] = array();
			foreach ( $values as $value ) {
				if ( ! is_string( $value ) || strlen( $value ) > 254 || preg_match( '/[\r\n\0]/', $value ) ) {
					return self::invalid_address( is_string( $value ) ? substr( (string) preg_replace( '/[\r\n\0]/', ' ', $value ), 0, 254 ) : '' );
				}
				$value = trim( $value );
				if ( '' === $value ) {
					continue;
				}
				if ( ! is_email( $value ) ) {
					return self::invalid_address( $value );
				}
				$lower = strtolower( $value );
				if ( ! isset( $seen[ $lower ] ) ) {
					$seen[ $lower ]    = true;
					$clean[ $field ][] = $value;
				}
			}
		}
		if ( array() === $clean['to'] ) {
			return new WP_Error( 'jetpack_send_no_recipients', __( 'Add at least one email address.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}

		$same_field = fn( $field ) => self::emails( $clean[ $field ] ) === self::emails( array_column( $original[ $field ], 'email' ) );
		$same       = $same_field( 'to' ) && $same_field( 'cc' ) && $same_field( 'bcc' );
		$just_me    = array( strtolower( (string) $user_email ) ) === self::emails( $clean['to'] ) && array() === $clean['cc'] && array() === $clean['bcc'];
		if ( ! $same && ! $just_me && self::locked( $entry ) ) {
			return new WP_Error( 'jetpack_send_resend_locked', __( 'This email has a sign-in link, so it can only go to the same people or to you.', 'jetpack-send-pkg' ), array( 'status' => 403 ) );
		}
		// The same list as before can go out again even when it was longer.
		if ( ! $same && count( $seen ) > self::MAX_ADDRESSES ) {
			/* translators: %d: the most addresses allowed, 10. */
			return new WP_Error( 'jetpack_send_too_many_addresses', sprintf( __( 'You can send to up to %d addresses at once.', 'jetpack-send-pkg' ), self::MAX_ADDRESSES ), array( 'status' => 400 ) );
		}
		$known = array_flip( self::emails( array_merge( array_column( $original['to'], 'email' ), array_column( $original['cc'], 'email' ), array_column( $original['bcc'], 'email' ) ) ) );
		$new   = array_diff_key( $seen, $known );
		if ( count( $new ) > self::MAX_NEW_ADDRESSES ) {
			/* translators: %d: the most new addresses allowed, 5. */
			return new WP_Error( 'jetpack_send_too_many_new_addresses', sprintf( __( 'You can add up to %d addresses that weren’t on the original email.', 'jetpack-send-pkg' ), self::MAX_NEW_ADDRESSES ), array( 'status' => 400 ) );
		}

		$result = array();
		foreach ( array( 'to', 'cc', 'bcc' ) as $field ) {
			$result[ $field ] = $same_field( $field ) ? $original[ $field ] : array_map( fn( $email ) => array( 'email' => $email ), $clean[ $field ] );
		}
		return $result;
	}

	/**
	 * Take one resend from the hourly allowance.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool False when the allowance is used up.
	 */
	public static function claim() {
		// Another resend may hold the lock for a moment; wait briefly rather than refuse.
		$tries = 0;
		while ( ! Lock::acquire( 'resend', 30 ) ) {
			if ( ++$tries > 20 ) {
				return false;
			}
			usleep( 100000 );
		}
		try {
			$times = self::recent();
			if ( count( $times ) >= self::limit() ) {
				return false;
			}
			$times[] = time();
			update_option( self::TIMES_OPTION, $times, false );
			return true;
		} finally {
			Lock::release( 'resend' );
		}
	}

	/**
	 * Seconds until the oldest resend in the window leaves it.
	 *
	 * @since $$next-version$$
	 *
	 * @return int
	 */
	public static function retry_after() {
		$times = self::recent();
		return $times ? max( 1, min( $times ) + self::WINDOW - time() ) : 0;
	}

	/**
	 * Resends allowed per hour.
	 *
	 * @since $$next-version$$
	 *
	 * @return int
	 */
	public static function limit() {
		/**
		 * Resends a site may send per hour from the Log.
		 *
		 * @since $$next-version$$
		 *
		 * @param int $limit Default 20.
		 */
		return max( 0, (int) apply_filters( 'jetpack_send_resend_limit', 20 ) );
	}

	/**
	 * Resend times inside the window.
	 *
	 * @return int[]
	 */
	private static function recent() {
		$since = time() - self::WINDOW;
		return array_values( array_filter( array_map( 'intval', (array) get_option( self::TIMES_OPTION, array() ) ), fn( $time ) => $time > $since ) );
	}

	/**
	 * Send the copy and log it as a new row linked to the original, which never changes.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $entry   A row from Email_Log::get().
	 * @param array $to      Address objects, from validate().
	 * @param array $cc      Address objects.
	 * @param array $bcc     Address objects.
	 * @param int   $user_id Who resent it.
	 * @return array{log_id: string, status: string, reason: string, message: string}|WP_Error
	 */
	public static function send( array $entry, array $to, array $cc, array $bcc, $user_id ) {
		$account = Account::get();
		if ( ! $account ) {
			return new WP_Error( 'jetpack_send_not_set_up', __( 'Set up Send first.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}
		$message = (array) $entry['message'];
		$headers = array( 'Content-Type: ' . ( 'text/html' === ( $message['content_type'] ?? '' ) ? 'text/html' : 'text/plain' ) . '; charset=UTF-8' );
		if ( ! empty( $message['from']['email'] ) ) {
			$headers[] = 'From: ' . self::format( $message['from'] );
		}
		if ( ! empty( $message['reply_to']['email'] ) ) {
			$headers[] = 'Reply-To: ' . self::format( $message['reply_to'] );
		}
		foreach ( array(
			'Cc'  => $cc,
			'Bcc' => $bcc,
		) as $name => $list ) {
			foreach ( $list as $address ) {
				$headers[] = $name . ': ' . self::format( $address );
			}
		}
		$atts = array(
			'to'          => array_map( array( __CLASS__, 'format' ), $to ),
			'subject'     => (string) ( $message['subject'] ?? $entry['subject'] ?? '' ),
			'message'     => (string) $message['body'],
			'headers'     => $headers,
			'attachments' => array(),
		);

		$result     = Mailer::deliver_resend(
			$atts,
			Settings::get(),
			$account,
			array(
				'origin'    => (string) ( $entry['origin'] ?? '' ),
				'resend_of' => (int) $entry['id'],
				'user_id'   => (int) $user_id,
			)
		);
		$changed    = self::emails( array_column( $to, 'email' ) ) !== self::emails( array_column( self::originals( $entry )['to'], 'email' ) );
		$recipients = count( $to ) + count( $cc ) + count( $bcc );
		$sent       = Email_Log::STATUS_SENT === $result['status'];
		$line       = $sent
			/* translators: 1: the original email's log id, 2: the new copy's log id, 3: how many recipients. */
			? sprintf( _n( 'Resent email %1$s as %2$s to %3$d recipient.', 'Resent email %1$s as %2$s to %3$d recipients.', $recipients, 'jetpack-send-pkg' ), (string) $entry['id'], $result['log_id'], $recipients )
			/* translators: 1: the original email's log id, 2: the new copy's log id, 3: how many recipients. */
			: sprintf( _n( 'Tried to resend email %1$s as %2$s to %3$d recipient.', 'Tried to resend email %1$s as %2$s to %3$d recipients.', $recipients, 'jetpack-send-pkg' ), (string) $entry['id'], $result['log_id'], $recipients )
				. ' ' . Mailer::failed_line( (string) $result['reason'], strtolower( (string) $account['domain'] ) );
		Debug_Log::add(
			$sent ? 'info' : 'warning',
			'sending',
			'resend.sent',
			$line,
			array(
				'original'   => (int) $entry['id'],
				'recipients' => $recipients,
				'changed'    => $changed,
				'status'     => $result['status'],
				'reason'     => $result['reason'],
			),
			(int) $result['log_id']
		);

		return array(
			'log_id'  => $result['log_id'],
			'status'  => $result['status'],
			'reason'  => $result['reason'],
			'message' => '' === $result['reason'] ? '' : Failure_Reason::headline( $result['reason'], strtolower( (string) $account['domain'] ), 'local' === ( $account['provider'] ?? '' ) ),
		);
	}

	/**
	 * `Name <email>`, or the bare address. Commas and angle brackets leave the name, so it parses back.
	 *
	 * @param array $address `email`, maybe `name`.
	 * @return string
	 */
	private static function format( array $address ) {
		$name = trim( (string) preg_replace( '/[\r\n,<>"]+/', ' ', (string) ( $address['name'] ?? '' ) ) );
		return '' === $name ? (string) $address['email'] : $name . ' <' . $address['email'] . '>';
	}

	/**
	 * Address objects with a valid email, as `{email, name?}`.
	 *
	 * @param mixed $list Addresses.
	 * @return array[]
	 */
	private static function addresses( $list ) {
		$addresses = array();
		foreach ( (array) $list as $item ) {
			if ( is_array( $item ) && is_string( $item['email'] ?? null ) && is_email( $item['email'] ) ) {
				$address = array( 'email' => $item['email'] );
				if ( ! empty( $item['name'] ) && is_string( $item['name'] ) ) {
					$address['name'] = $item['name'];
				}
				$addresses[] = $address;
			}
		}
		return $addresses;
	}

	/**
	 * Addresses lowercased, deduplicated and sorted, for comparing lists.
	 *
	 * @param string[] $emails Addresses.
	 * @return string[]
	 */
	private static function emails( array $emails ) {
		$emails = array_values( array_unique( array_map( 'strtolower', array_map( 'strval', $emails ) ) ) );
		sort( $emails );
		return $emails;
	}

	/**
	 * The error for an address that can't be used.
	 *
	 * @param string $address The address.
	 * @return WP_Error
	 */
	private static function invalid_address( $address ) {
		return new WP_Error(
			'jetpack_send_invalid_address',
			/* translators: %s: an email address. */
			sprintf( __( 'Check this address: %s', 'jetpack-send-pkg' ), $address ),
			array(
				'status'  => 400,
				'address' => $address,
			)
		);
	}
}
