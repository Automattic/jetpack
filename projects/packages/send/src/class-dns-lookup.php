<?php
/**
 * Local DNS lookups for the domain's Send records.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Looks up each required record and says what state it's in, without calling the mail service.
 */
class Dns_Lookup {

	/**
	 * Mail-service verdict key for each record purpose.
	 *
	 * @var array<string, string>
	 */
	const VERDICT_KEYS = array(
		'lockdown'      => 'domain_lockdown',
		'dkim'          => 'dkim',
		'spf'           => 'spf',
		'sender_domain' => 'sender_domain',
	);

	/**
	 * Cloudflare's published edge ranges; a proxied record answers with these instead of its CNAME.
	 *
	 * @var string[]
	 */
	const CLOUDFLARE_RANGES = array(
		'173.245.48.0/20',
		'103.21.244.0/22',
		'103.22.200.0/22',
		'103.31.4.0/22',
		'141.101.64.0/18',
		'108.162.192.0/18',
		'190.93.240.0/20',
		'188.114.96.0/20',
		'197.234.240.0/22',
		'198.41.128.0/17',
		'162.158.0.0/15',
		'104.16.0.0/13',
		'104.24.0.0/14',
		'172.64.0.0/13',
		'131.0.72.0/22',
		'2400:cb00::/32',
		'2606:4700::/32',
		'2803:f800::/32',
		'2405:b500::/32',
		'2405:8100::/32',
		'2a06:98c0::/29',
		'2c0f:f248::/32',
	);

	/**
	 * Query DNS for one name and record type. Every lookup Send makes goes through here.
	 *
	 * @param string $name Fully qualified name, without a trailing dot.
	 * @param int    $type A `DNS_*` constant: DNS_TXT, DNS_NS, DNS_SOA, DNS_CNAME, DNS_A, DNS_AAAA or DNS_MX.
	 * @return array[]|false Records in dns_get_record() shape, an empty array when there are none,
	 *                       or false when the lookup failed (no answer, timeout, lookups unavailable).
	 */
	public static function resolve( $name, $type ) {
		$name = strtolower( rtrim( (string) $name, '.' ) );
		$type = (int) $type;

		/**
		 * Short-circuits a DNS lookup, for tests and local mocks.
		 *
		 * Return what dns_get_record() would (e.g. `array( array( 'host' => …, 'type' => 'TXT', 'txt' => … ) )`,
		 * `target` for NS/CNAME), an empty array for no records, or false for a failed lookup.
		 *
		 * @since $$next-version$$
		 *
		 * @param array[]|false|null $pre  Null to look it up, or the records to use instead.
		 * @param string             $name Lowercased name without a trailing dot.
		 * @param int                $type The `DNS_*` constant being queried.
		 */
		$pre = apply_filters( 'jetpack_send_pre_dns_lookup', null, $name, $type );
		if ( null !== $pre ) {
			return is_array( $pre ) ? $pre : false;
		}

		if ( '' === $name || ! function_exists( 'dns_get_record' ) ) {
			return false;
		}
		$records = @dns_get_record( $name, $type ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- A failed lookup is reported as false.
		return is_array( $records ) ? $records : false;
	}

	/**
	 * TXT values at a name, each record's strings joined with quotes removed.
	 *
	 * @param string $name Name.
	 * @return string[]|false Values, or false when the lookup failed.
	 */
	public static function txt_values( $name ) {
		$records = self::resolve( $name, DNS_TXT );
		if ( false === $records ) {
			return false;
		}
		$values = array();
		foreach ( $records as $record ) {
			if ( ! is_array( $record ) ) {
				continue;
			}
			$text  = isset( $record['entries'] ) && is_array( $record['entries'] ) ? implode( '', $record['entries'] ) : (string) ( $record['txt'] ?? '' );
			$value = trim( (string) preg_replace( '/\s+/', ' ', str_replace( '"', '', $text ) ) );
			if ( '' !== $value ) {
				$values[] = $value;
			}
		}
		return $values;
	}

	/**
	 * Check each required record for the stored account.
	 *
	 * @param array $account Stored account (Account::get()).
	 * @return array{domain: string, checked_at: string, records: array[], all_found: bool, can_enable: bool}
	 *               Each record: `{purpose, name, host, type, state, found?, expected, problem?}`,
	 *               where state is `not_found|found|verified|needs_fix|no_answer` and problem is
	 *               `doubled|wrong_value|proxied|conflict|not_live`.
	 */
	public static function check( array $account ) {
		$domain    = strtolower( (string) ( $account['domain'] ?? '' ) );
		$detection = $account[ Dns_Host::ACCOUNT_KEY ] ?? null;
		$apex      = is_array( $detection ) && ( $detection['domain'] ?? '' ) === $domain && ! empty( $detection['apex'] ) ? (string) $detection['apex'] : $domain;
		$dns_check = isset( $account['dns_check'] ) && is_array( $account['dns_check'] ) ? $account['dns_check'] : null;

		$rows      = array();
		$all_found = true;
		$required  = self::required_records( $account );
		foreach ( $required as $record ) {
			$row       = self::record_state( $record, $apex, $dns_check );
			$rows[]    = $row;
			$all_found = $all_found && in_array( $row['state'], array( 'found', 'verified' ), true );
		}

		// The sending-domain check has no record to add, so it only shows up once it fails.
		if ( $dns_check && 'failed' === ( $dns_check['sender_domain'] ?? '' ) ) {
			$rows[] = array(
				'purpose'  => 'sender_domain',
				'name'     => $domain,
				'host'     => '@',
				'type'     => '',
				'state'    => 'needs_fix',
				'expected' => '',
				'problem'  => 'not_live',
			);
		}

		return array(
			'domain'     => $domain,
			'checked_at' => gmdate( 'c' ),
			'records'    => $rows,
			'all_found'  => array() !== $required && $all_found,
			'can_enable' => array() === REST_Controller::enable_blockers( $account ),
		);
	}

	/**
	 * The state of one required record.
	 *
	 * @param array      $record    Record `{type, name, value, purpose}`.
	 * @param string     $apex      Zone root, used to spot a doubled name.
	 * @param array|null $dns_check The account's last mail-service check, or null.
	 * @return array `{purpose, name, host, type, state, found?, expected, problem?}`.
	 */
	public static function record_state( array $record, $apex, $dns_check = null ) {
		$purpose = (string) ( $record['purpose'] ?? '' );
		$name    = strtolower( rtrim( (string) ( $record['name'] ?? '' ), '.' ) );
		$apex    = strtolower( rtrim( (string) $apex, '.' ) );
		$type    = strtoupper( (string) ( $record['type'] ?? '' ) );
		$row     = array(
			'purpose'  => $purpose,
			'name'     => $name,
			'host'     => Account::relative_host( $name, $apex ),
			'type'     => $type,
			'state'    => 'not_found',
			'expected' => (string) ( $record['value'] ?? '' ),
		);

		$verdict_key = self::VERDICT_KEYS[ $purpose ] ?? '';
		if ( is_array( $dns_check ) && '' !== $verdict_key && 'passed' === ( $dns_check[ $verdict_key ] ?? '' ) ) {
			$row['state'] = 'verified';
			return $row;
		}

		$result = 'CNAME' === $type ? self::cname_state( $name, $row['expected'], $apex ) : self::txt_state( $name, $row['expected'], $purpose, $apex );
		$row    = array_merge( $row, $result );
		if ( empty( $row['found'] ) ) {
			unset( $row['found'] );
		}
		return $row;
	}

	/**
	 * Records that must pass: permission, plus signing when the account has a key, otherwise SPF.
	 *
	 * @param array $account Stored account.
	 * @return array[] In the account's display order.
	 */
	private static function required_records( array $account ) {
		$records  = array_values( array_filter( (array) ( $account['dns_records'] ?? array() ), 'is_array' ) );
		$has_dkim = in_array( 'dkim', array_column( $records, 'purpose' ), true );
		$required = array();
		foreach ( $records as $record ) {
			$purpose = $record['purpose'] ?? '';
			if ( 'lockdown' === $purpose || ( $has_dkim ? 'dkim' : 'spf' ) === $purpose ) {
				$required[] = $record;
			}
		}
		return $required;
	}

	/**
	 * State of a TXT record.
	 *
	 * @param string $name     Record name.
	 * @param string $expected Expected value.
	 * @param string $purpose  Record purpose.
	 * @param string $apex     Zone root.
	 * @return array `{state, found?, problem?}`.
	 */
	private static function txt_state( $name, $expected, $purpose, $apex ) {
		$values = self::txt_values( $name );
		if ( false === $values ) {
			return array( 'state' => 'no_answer' );
		}

		$relevant = self::relevant_values( $values, $purpose );
		// A domain can only have one of each of these, so a second copy breaks the check.
		if ( count( $relevant ) > 1 && in_array( $purpose, array( 'lockdown', 'spf', 'dkim' ), true ) ) {
			return self::needs_fix( 'conflict', $relevant );
		}
		foreach ( $relevant as $value ) {
			if ( self::txt_matches( $value, $expected, $purpose ) ) {
				return array(
					'state' => 'found',
					'found' => $relevant,
				);
			}
		}
		if ( $relevant ) {
			return self::needs_fix( 'wrong_value', $relevant );
		}

		$doubled = self::doubled_name( $name, $apex );
		if ( '' !== $doubled ) {
			$doubled_values = self::txt_values( $doubled );
			$doubled_values = is_array( $doubled_values ) ? self::relevant_values( $doubled_values, $purpose ) : array();
			if ( $doubled_values ) {
				return self::needs_fix( 'doubled', $doubled_values );
			}
		}

		$targets = self::cname_targets( $name );
		if ( $targets && self::cname_targets( self::probe_name( $name ) ) !== $targets ) {
			return self::needs_fix( 'conflict', array() );
		}
		return array( 'state' => 'not_found' );
	}

	/**
	 * State of a CNAME record.
	 *
	 * @param string $name     Record name.
	 * @param string $expected Expected target.
	 * @param string $apex     Zone root.
	 * @return array `{state, found?, problem?}`.
	 */
	private static function cname_state( $name, $expected, $apex ) {
		$targets = self::cname_targets( $name );
		if ( false === $targets ) {
			return array( 'state' => 'no_answer' );
		}

		$expected = strtolower( rtrim( trim( $expected ), '.' ) );
		if ( in_array( $expected, $targets, true ) ) {
			return array(
				'state' => 'found',
				'found' => $targets,
			);
		}
		if ( $targets ) {
			return self::needs_fix( 'wrong_value', $targets );
		}

		$doubled = self::doubled_name( $name, $apex );
		if ( '' !== $doubled ) {
			$doubled_targets = self::cname_targets( $doubled );
			if ( is_array( $doubled_targets ) && $doubled_targets ) {
				return self::needs_fix( 'doubled', $doubled_targets );
			}
		}

		$txt = self::txt_values( $name );
		if ( is_array( $txt ) && $txt ) {
			return self::needs_fix( 'conflict', $txt );
		}

		if ( self::answers_with_cloudflare( $name ) && ! self::answers_with_cloudflare( self::probe_name( $name ) ) ) {
			return self::needs_fix( 'proxied', array() );
		}
		return array( 'state' => 'not_found' );
	}

	/**
	 * A needs-fix result.
	 *
	 * @param string   $problem Problem.
	 * @param string[] $found   Values seen.
	 * @return array
	 */
	private static function needs_fix( $problem, array $found ) {
		return array(
			'state'   => 'needs_fix',
			'found'   => array_values( $found ),
			'problem' => $problem,
		);
	}

	/**
	 * The name a host field produces when the full name is pasted into it, or '' when there's no zone to repeat.
	 *
	 * @param string $name Record name.
	 * @param string $apex Zone root.
	 * @return string
	 */
	private static function doubled_name( $name, $apex ) {
		return '' === $apex || $name === $apex ? '' : $name . '.' . $apex;
	}

	/**
	 * A sibling name nobody would create, so an answer for it can only come from a wildcard record.
	 *
	 * @param string $name Record name.
	 * @return string
	 */
	private static function probe_name( $name ) {
		$dot = strpos( $name, '.' );
		return '_jpsend-wildcard-probe' . ( false === $dot ? '' : substr( $name, $dot ) );
	}

	/**
	 * CNAME targets at a name.
	 *
	 * @param string $name Name.
	 * @return string[]|false Lowercased targets without trailing dots, or false when the lookup failed.
	 */
	private static function cname_targets( $name ) {
		$records = self::resolve( $name, DNS_CNAME );
		if ( false === $records ) {
			return false;
		}
		$targets = array();
		foreach ( $records as $record ) {
			$target = is_array( $record ) ? strtolower( rtrim( trim( (string) ( $record['target'] ?? '' ) ), '.' ) ) : '';
			if ( '' !== $target ) {
				$targets[] = $target;
			}
		}
		return $targets;
	}

	/**
	 * TXT values that belong to this kind of record; wildcards and other services' records are ignored.
	 *
	 * @param string[] $values  TXT values.
	 * @param string   $purpose Record purpose.
	 * @return string[]
	 */
	private static function relevant_values( array $values, $purpose ) {
		$relevant = array();
		foreach ( $values as $value ) {
			$value = (string) $value;
			if ( 'lockdown' === $purpose ) {
				$keep = 0 === stripos( $value, 'v=mc1' );
			} elseif ( 'spf' === $purpose ) {
				$keep = 0 === stripos( $value, 'v=spf1' );
			} elseif ( 'dkim' === $purpose ) {
				$keep = 0 === stripos( $value, 'v=dkim1' ) || preg_match( '/(^|;)\s*p=/i', $value );
			} else {
				$keep = true;
			}
			if ( $keep ) {
				$relevant[] = $value;
			}
		}
		return array_values( array_unique( $relevant ) );
	}

	/**
	 * Whether a TXT value does the job of the expected one.
	 *
	 * @param string $value    Value seen.
	 * @param string $expected Expected value.
	 * @param string $purpose  Record purpose.
	 * @return bool
	 */
	private static function txt_matches( $value, $expected, $purpose ) {
		if ( 'lockdown' === $purpose ) {
			// A host's own permission record may list other senders too; ours just has to be there.
			$wanted = self::tokens( $expected, 'auth=' );
			return $wanted && ! array_diff( $wanted, self::tokens( $value, 'auth=' ) );
		}
		if ( 'spf' === $purpose ) {
			$wanted = self::tokens( $expected, 'include:' );
			if ( $wanted ) {
				return ! array_diff( $wanted, self::tokens( $value, 'include:' ) );
			}
		}
		if ( 'dkim' === $purpose ) {
			$key = self::dkim_key( $expected );
			if ( '' !== $key ) {
				return self::dkim_key( $value ) === $key;
			}
		}
		return self::compact( $value ) === self::compact( $expected );
	}

	/**
	 * Lowercased space-separated tokens that start with a prefix.
	 *
	 * @param string $value  Value.
	 * @param string $prefix Prefix, e.g. `auth=`.
	 * @return string[]
	 */
	private static function tokens( $value, $prefix ) {
		$tokens = array();
		foreach ( preg_split( '/\s+/', strtolower( trim( (string) $value ) ) ) as $token ) {
			if ( strlen( $token ) > strlen( $prefix ) && 0 === strpos( $token, $prefix ) ) {
				$tokens[] = $token;
			}
		}
		return $tokens;
	}

	/**
	 * The public key (`p=`) of a signing record, whitespace removed.
	 *
	 * @param string $value Record value.
	 * @return string
	 */
	private static function dkim_key( $value ) {
		return preg_match( '/(?:^|;)\s*p=([^;]*)/i', self::compact_quotes( $value ), $m ) ? (string) preg_replace( '/\s+/', '', $m[1] ) : '';
	}

	/**
	 * A value with quotes and all whitespace removed, for comparison.
	 *
	 * @param string $value Value.
	 * @return string
	 */
	private static function compact( $value ) {
		return (string) preg_replace( '/\s+/', '', self::compact_quotes( $value ) );
	}

	/**
	 * A value without quotes.
	 *
	 * @param string $value Value.
	 * @return string
	 */
	private static function compact_quotes( $value ) {
		return str_replace( '"', '', (string) $value );
	}

	/**
	 * Whether a name answers with Cloudflare edge addresses, which is what a proxied record does.
	 *
	 * @param string $name Name.
	 * @return bool
	 */
	private static function answers_with_cloudflare( $name ) {
		foreach ( array(
			DNS_A    => 'ip',
			DNS_AAAA => 'ipv6',
		) as $type => $field ) {
			$records = self::resolve( $name, $type );
			foreach ( is_array( $records ) ? $records : array() as $record ) {
				$ip = is_array( $record ) ? (string) ( $record[ $field ] ?? '' ) : '';
				if ( '' !== $ip && self::in_cloudflare_range( $ip ) ) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Whether an IP address falls in one of Cloudflare's ranges.
	 *
	 * @param string $ip IPv4 or IPv6 address.
	 * @return bool
	 */
	private static function in_cloudflare_range( $ip ) {
		$packed = @inet_pton( $ip ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- Invalid input just means "no".
		if ( false === $packed ) {
			return false;
		}
		foreach ( self::CLOUDFLARE_RANGES as $range ) {
			list( $subnet, $bits ) = explode( '/', $range );
			$net                   = inet_pton( $subnet );
			if ( strlen( $net ) !== strlen( $packed ) ) {
				continue;
			}
			$bits  = (int) $bits;
			$bytes = intdiv( $bits, 8 );
			if ( substr( $packed, 0, $bytes ) !== substr( $net, 0, $bytes ) ) {
				continue;
			}
			$rest = $bits % 8;
			if ( 0 === $rest ) {
				return true;
			}
			$mask = chr( ( 0xff << ( 8 - $rest ) ) & 0xff );
			if ( ( $packed[ $bytes ] & $mask ) === ( $net[ $bytes ] & $mask ) ) {
				return true;
			}
		}
		return false;
	}
}
