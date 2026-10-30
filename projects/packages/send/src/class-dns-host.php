<?php
/**
 * Works out who runs a domain's DNS.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * DNS host detection for GET /dns-host. All lookups go through Dns_Lookup::resolve().
 */
class Dns_Host {

	/**
	 * Account key the last detection is cached under.
	 *
	 * @var string
	 */
	const ACCOUNT_KEY = 'dns_host';

	/**
	 * Two-label public suffixes under which a registrable domain has three labels.
	 *
	 * @var string[]
	 */
	const PUBLIC_SUFFIXES = array(
		'co.uk',
		'org.uk',
		'me.uk',
		'ltd.uk',
		'plc.uk',
		'net.uk',
		'ac.uk',
		'gov.uk',
		'com.au',
		'net.au',
		'org.au',
		'edu.au',
		'gov.au',
		'asn.au',
		'id.au',
		'co.nz',
		'net.nz',
		'org.nz',
		'co.za',
		'org.za',
		'com.br',
		'net.br',
		'org.br',
		'com.mx',
		'org.mx',
		'com.ar',
		'com.co',
		'com.pe',
		'com.uy',
		'com.ec',
		'com.ve',
		'co.in',
		'net.in',
		'org.in',
		'co.jp',
		'ne.jp',
		'or.jp',
		'co.kr',
		'or.kr',
		'com.cn',
		'net.cn',
		'org.cn',
		'com.tw',
		'com.hk',
		'com.sg',
		'com.my',
		'co.id',
		'co.il',
		'co.th',
		'com.tr',
		'com.pl',
		'com.ua',
		'com.es',
		'co.at',
		'or.at',
		'com.ph',
		'com.vn',
		'com.pk',
		'com.ng',
		'co.ke',
		'com.eg',
		'com.sa',
	);

	/**
	 * Selector used for the signing record when the account doesn't name one.
	 *
	 * @var string
	 */
	const DEFAULT_DKIM_SELECTOR = 'jpsend';

	/**
	 * The detection for the stored account, from cache unless asked to refresh.
	 *
	 * Caches the result on the account (`Account::update( array( 'dns_host' => … ) )`).
	 * A provider the user picked (`Onboarding::state()['dns_provider']`) is reported with
	 * `provider_source: 'user'`.
	 *
	 * @param bool $refresh Run detection again even when cached.
	 * @return array|WP_Error The detection (see detect()), or `jetpack_send_not_set_up` without an account.
	 */
	public static function get( $refresh = false ) {
		$account = Account::get();
		if ( ! $account ) {
			return new WP_Error( 'jetpack_send_not_set_up', __( 'Set up Send first.', 'jetpack-send-pkg' ), array( 'status' => 400 ) );
		}

		$domain    = strtolower( (string) $account['domain'] );
		$detection = $account[ self::ACCOUNT_KEY ] ?? null;
		if ( $refresh || ! is_array( $detection ) || ( $detection['domain'] ?? '' ) !== $domain ) {
			$detection = self::detect( $domain );
			Account::update( array( self::ACCOUNT_KEY => $detection ) );
		}

		// The user's pick is applied on read, so changing it never needs a fresh lookup.
		$detection['detected_provider'] = $detection['provider'];
		$state                          = Onboarding::state();
		$picked                         = is_array( $state ) ? ( $state['dns_provider'] ?? null ) : null;
		if ( is_string( $picked ) && 'unsure' !== $picked && Dns_Providers::is_known( $picked ) ) {
			$detection['provider']        = $picked;
			$detection['provider_source'] = 'user';
		}
		$detection['cloudflare_api'] = array( 'supported' => (bool) Cloudflare_Dns::is_available( $detection ) );
		return $detection;
	}

	/**
	 * Detect the DNS host for a domain.
	 *
	 * @param string $domain Sending domain.
	 * @return array{domain: string, apex: string, nameservers: string[], provider: string|null, provider_source: string|null, confidence: string, editable: bool, reason: string|null, domain_connect: array, one_click: array, wpcom_dns: array, cloudflare_api: array, existing: array, checked_at: string}
	 */
	public static function detect( $domain ) {
		$domain    = strtolower( rtrim( trim( (string) $domain ), '.' ) );
		$editable  = self::is_editable( $domain );
		$detection = array(
			'domain'          => $domain,
			'apex'            => $domain,
			'nameservers'     => array(),
			'provider'        => null,
			'provider_source' => null,
			'confidence'      => 'none',
			'editable'        => $editable['editable'],
			'reason'          => $editable['reason'],
			'domain_connect'  => array(
				'host'      => null,
				'supported' => null,
			),
			'one_click'       => array( 'supported' => null ),
			'wpcom_dns'       => array( 'supported' => null ),
			'cloudflare_api'  => array( 'supported' => false ),
			'existing'        => array(
				'lockdown' => null,
				'spf'      => null,
				'dkim'     => null,
			),
			'checked_at'      => gmdate( 'c' ),
		);

		// Nobody can add records to a temporary or reserved address, so don't look it up.
		if ( ! $editable['editable'] ) {
			return $detection;
		}

		$apex                     = self::find_apex( $domain );
		$detection['apex']        = $apex;
		$detection['nameservers'] = self::nameservers( $apex );

		$match                        = Dns_Providers::match_nameservers( $detection['nameservers'] );
		$detection['domain_connect']  = array(
			'host'      => self::domain_connect_host( $apex ),
			'supported' => null,
		);
		$detection['provider']        = $match['provider'];
		$detection['confidence']      = $match['confidence'];
		$detection['provider_source'] = null === $match['provider'] ? null : 'ns';
		$detection                    = self::refine_with_domain_connect( $detection );
		$detection['existing']        = self::existing_records( $domain );
		$detection['cloudflare_api']  = array( 'supported' => (bool) Cloudflare_Dns::is_available( $detection ) );
		return $detection;
	}

	/**
	 * The zone root for a name: walk up its labels until one answers SOA.
	 *
	 * @param string $domain Domain.
	 * @return string The apex, or the domain itself when nothing answers.
	 */
	public static function find_apex( $domain ) {
		$domain = strtolower( rtrim( trim( (string) $domain ), '.' ) );
		$labels = explode( '.', $domain );
		for ( $count = count( $labels ); $count >= 2; $count-- ) {
			$name = implode( '.', $labels );
			if ( self::is_public_suffix( $name ) ) {
				break;
			}
			$records = Dns_Lookup::resolve( $name, DNS_SOA );
			foreach ( is_array( $records ) ? $records : array() as $record ) {
				$host = strtolower( rtrim( (string) ( $record['host'] ?? $name ), '.' ) );
				if ( $host === $name ) {
					return $name;
				}
			}
			array_shift( $labels );
		}
		return $domain;
	}

	/**
	 * Whether a domain can be used for sending, and why not.
	 *
	 * Not editable: IP addresses, `localhost`, temporary and staging hosts
	 * (Dns_Providers::NON_EDITABLE_SUFFIXES), and reserved names (Dns_Providers::RESERVED_TLDS).
	 *
	 * @param string $domain Domain.
	 * @return array{editable: bool, reason: string|null} Reason is `ip`, `temporary` or `reserved`.
	 */
	public static function is_editable( $domain ) {
		$domain = strtolower( rtrim( trim( (string) $domain ), '.' ) );
		$reason = null;

		if ( false !== filter_var( trim( $domain, '[]' ), FILTER_VALIDATE_IP ) ) {
			$reason = 'ip';
		} elseif ( '' === $domain || 'localhost' === $domain || false === strpos( $domain, '.' ) ) {
			$reason = 'temporary';
		} elseif ( in_array( substr( (string) strrchr( $domain, '.' ), 1 ), Dns_Providers::RESERVED_TLDS, true ) ) {
			$reason = 'reserved';
		} else {
			foreach ( Dns_Providers::NON_EDITABLE_SUFFIXES as $suffix ) {
				if ( substr( $domain, -strlen( $suffix ) - 1 ) === '.' . $suffix ) {
					$reason = 'temporary';
					break;
				}
			}
		}

		return array(
			'editable' => null === $reason,
			'reason'   => $reason,
		);
	}

	/**
	 * Whether a name is a public suffix (a TLD or a known two-label suffix like `co.uk`).
	 *
	 * @param string $name Lowercased name.
	 * @return bool
	 */
	private static function is_public_suffix( $name ) {
		return false === strpos( $name, '.' ) || in_array( $name, self::PUBLIC_SUFFIXES, true );
	}

	/**
	 * The apex's nameservers, lowercased without trailing dots.
	 *
	 * @param string $apex Zone root.
	 * @return string[]
	 */
	private static function nameservers( $apex ) {
		$records     = Dns_Lookup::resolve( $apex, DNS_NS );
		$nameservers = array();
		foreach ( is_array( $records ) ? $records : array() as $record ) {
			$target = strtolower( rtrim( trim( (string) ( $record['target'] ?? '' ) ), '.' ) );
			if ( '' !== $target ) {
				$nameservers[] = $target;
			}
		}
		$nameservers = array_values( array_unique( $nameservers ) );
		sort( $nameservers );
		return $nameservers;
	}

	/**
	 * The Domain Connect host the apex advertises, ignoring values that aren't hostnames.
	 *
	 * @param string $apex Zone root.
	 * @return string|null
	 */
	private static function domain_connect_host( $apex ) {
		foreach ( self::txt_list( '_domainconnect.' . $apex ) as $value ) {
			$value = strtolower( $value );
			// Wildcard answers can carry SPF strings or verification tokens; keep only host[/path] values.
			if ( preg_match( '#^[a-z0-9_-]+(\.[a-z0-9_-]+)*\.[a-z]{2,}(/[a-z0-9._~/-]*)?$#', $value ) ) {
				return rtrim( $value, '/' );
			}
		}
		return null;
	}

	/**
	 * Use Domain Connect discovery to confirm a shared nameserver match, or to guess when nameservers matched nothing.
	 *
	 * @param array $detection Detection so far.
	 * @return array
	 */
	private static function refine_with_domain_connect( array $detection ) {
		$dc_provider = Dns_Providers::match_domain_connect( (string) $detection['domain_connect']['host'] );

		if ( 'squarespace' === $detection['provider'] && 'high' === $detection['confidence'] && 'squarespace' !== $dc_provider ) {
			foreach ( $detection['nameservers'] as $nameserver ) {
				if ( Dns_Providers::SHARED_SQUARESPACE_SUFFIX === substr( $nameserver, -strlen( Dns_Providers::SHARED_SQUARESPACE_SUFFIX ) ) ) {
					$detection['confidence'] = 'low';
					break;
				}
			}
		}

		if ( null === $detection['provider'] && null !== $dc_provider ) {
			$detection['provider']        = $dc_provider;
			$detection['confidence']      = 'low';
			$detection['provider_source'] = 'ns';
		}
		return $detection;
	}

	/**
	 * Records already on the domain that change what we ask for: a host's own permission record, SPF and a signing key.
	 *
	 * @param string $domain Sending domain.
	 * @return array{lockdown: string|null, spf: string|null, dkim: string|null}
	 */
	private static function existing_records( $domain ) {
		$account  = Account::get();
		$ours     = is_array( $account ) && strtolower( (string) $account['domain'] ) === $domain ? $account : array();
		$own_auth = strtolower( (string) ( $ours['lockdown_auth_id'] ?? '' ) );
		$selector = (string) ( $ours['dkim_selector'] ?? '' );
		$selector = '' === $selector ? self::DEFAULT_DKIM_SELECTOR : $selector;

		$lockdown = null;
		foreach ( self::txt_list( '_mailchannels.' . $domain ) as $value ) {
			if ( 0 !== stripos( $value, 'v=mc1' ) ) {
				continue;
			}
			preg_match_all( '/\bauth=(\S+)/i', $value, $auths );
			$others = array_diff( array_map( 'strtolower', $auths[1] ), array( $own_auth ) );
			if ( $others ) {
				$lockdown = $value;
				break;
			}
		}

		$spf = null;
		foreach ( self::txt_list( $domain ) as $value ) {
			if ( 0 === stripos( $value, 'v=spf1' ) ) {
				$spf = $value;
				break;
			}
		}

		$dkim = null;
		foreach ( self::txt_list( $selector . '._domainkey.' . $domain ) as $value ) {
			if ( false !== stripos( $value, 'p=' ) ) {
				$dkim = $value;
				break;
			}
		}

		return array(
			'lockdown' => $lockdown,
			'spf'      => $spf,
			'dkim'     => $dkim,
		);
	}

	/**
	 * TXT values at a name, empty when there are none or the lookup failed.
	 *
	 * @param string $name Name.
	 * @return string[]
	 */
	private static function txt_list( $name ) {
		$values = Dns_Lookup::txt_values( $name );
		return is_array( $values ) ? $values : array();
	}
}
