<?php
/**
 * DNS providers known to Send, matched by nameserver.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * PHP copy of the nameserver patterns in `_inc/data/providers.json`, plus the hosts whose
 * addresses can't be used for sending.
 */
class Dns_Providers {

	/**
	 * Providers by slug: `array( 'name' => string, 'ns' => string[], 'match' => 'suffix'|'substring' )`.
	 * Must list the same slugs and patterns as `_inc/data/providers.json`, in the same (rank) order.
	 *
	 * @var array<string, array{name: string, ns: string[], match: string}>
	 */
	const PROVIDERS = array(
		'cloudflare'   => array(
			'name'  => 'Cloudflare',
			'ns'    => array( '.ns.cloudflare.com' ),
			'match' => 'suffix',
		),
		'bluehost'     => array(
			'name'  => 'Bluehost',
			'ns'    => array( 'ns1.bluehost.com', 'ns2.bluehost.com', '.bluehost.com', '.mybluehost.me', '.bluehost.in', '.hostmonster.com', '.justhost.com' ),
			'match' => 'suffix',
		),
		'hostinger'    => array(
			'name'  => 'Hostinger',
			'ns'    => array( '.dns-parking.com' ),
			'match' => 'suffix',
		),
		'godaddy'      => array(
			'name'  => 'GoDaddy',
			'ns'    => array( '.domaincontrol.com' ),
			'match' => 'suffix',
		),
		'hostgator'    => array(
			'name'  => 'HostGator',
			'ns'    => array( '.hostgator.com', '.hostgator.com.br', '.hostgator.mx', '.websitewelcome.com' ),
			'match' => 'suffix',
		),
		'siteground'   => array(
			'name'  => 'SiteGround',
			'ns'    => array( '.siteground.net' ),
			'match' => 'suffix',
		),
		'ionos'        => array(
			'name'  => 'IONOS',
			'ns'    => array( '.ui-dns.com', '.ui-dns.de', '.ui-dns.org', '.ui-dns.biz' ),
			'match' => 'suffix',
		),
		'namecheap'    => array(
			'name'  => 'Namecheap',
			'ns'    => array( '.registrar-servers.com', '.namecheaphosting.com' ),
			'match' => 'suffix',
		),
		'ovhcloud'     => array(
			'name'  => 'OVHcloud',
			'ns'    => array( '.ovh.net', '.anycast.me', '.ovh.ca' ),
			'match' => 'suffix',
		),
		'dreamhost'    => array(
			'name'  => 'DreamHost',
			'ns'    => array( '.dreamhost.com' ),
			'match' => 'suffix',
		),
		'route53'      => array(
			'name'  => 'Amazon Route 53',
			'ns'    => array( '.awsdns-' ),
			'match' => 'substring',
		),
		'squarespace'  => array(
			'name'  => 'Squarespace (incl. former Google Domains)',
			'ns'    => array( '.squarespacedns.com', '.googledomains.com' ),
			'match' => 'suffix',
		),
		'wordpresscom' => array(
			'name'  => 'WordPress.com',
			'ns'    => array( '.wordpress.com' ),
			'match' => 'suffix',
		),
		'other'        => array(
			'name'  => 'Other or not sure',
			'ns'    => array(),
			'match' => 'suffix',
		),
	);

	/**
	 * Domain Connect hosts seen for each provider, mirroring `domainConnectHost` in `_inc/data/providers.json`.
	 *
	 * @var array<string, string>
	 */
	const DOMAIN_CONNECT_HOSTS = array(
		'cloudflare'   => 'api.cloudflare.com/client/v4/dns/domainconnect',
		'godaddy'      => 'domainconnect.api.godaddy.com',
		'ionos'        => 'api.domainconnect.ionos.com',
		'squarespace'  => 'domains.squarespace.com',
		'wordpresscom' => 'public-api.wordpress.com/rest/v1.3/domain-connect',
	);

	/**
	 * Nameserver suffix that another DNS service shares with Squarespace, so it needs Domain Connect to confirm.
	 *
	 * @var string
	 */
	const SHARED_SQUARESPACE_SUFFIX = '.googledomains.com';

	/**
	 * Host suffixes that are temporary or staging addresses, never a domain to send from.
	 *
	 * @var string[]
	 */
	const NON_EDITABLE_SUFFIXES = array(
		'wpcomstaging.com',
		'mystagingwebsite.com',
		'mybluehost.me',
		'hostingersite.com',
		'wpengine.com',
		'wpenginepowered.com',
		'pressable.com',
		'kinsta.cloud',
		'flywheelsites.com',
		'flywheelstaging.com',
		'pantheonsite.io',
		'cloudwaysapps.com',
		'myftpupload.com',
		'instawp.xyz',
		'tastewp.com',
		'playground.wordpress.net',
		'ddev.site',
		'lndo.site',
		'ngrok.io',
		'ngrok-free.app',
		'trycloudflare.com',
		'local',
	);

	/**
	 * Reserved top-level names (RFC 2606 / RFC 6761) that can't have real DNS.
	 *
	 * @var string[]
	 */
	const RESERVED_TLDS = array( 'example', 'invalid', 'localhost', 'test' );

	/**
	 * The provider slug for one nameserver.
	 *
	 * @param string $nameserver Lowercased hostname, no trailing dot.
	 * @return string|null Slug, or null when no pattern matches.
	 */
	public static function match_nameserver( $nameserver ) {
		$nameserver = strtolower( rtrim( trim( (string) $nameserver ), '.' ) );
		if ( '' === $nameserver ) {
			return null;
		}
		foreach ( self::PROVIDERS as $slug => $provider ) {
			foreach ( $provider['ns'] as $pattern ) {
				if ( self::matches( $nameserver, $pattern, $provider['match'] ) ) {
					return $slug;
				}
			}
		}
		return null;
	}

	/**
	 * The provider for a set of nameservers: majority wins, a mixed set lowers confidence.
	 *
	 * @param string[] $nameservers Lowercased hostnames.
	 * @return array{provider: string|null, confidence: string} Confidence is `high`, `low` or `none`.
	 */
	public static function match_nameservers( array $nameservers ) {
		$nameservers = array_values( array_unique( array_filter( array_map( 'strval', $nameservers ) ) ) );
		$counts      = array();
		foreach ( $nameservers as $nameserver ) {
			$slug           = self::match_nameserver( $nameserver );
			$key            = null === $slug ? '' : $slug;
			$counts[ $key ] = ( $counts[ $key ] ?? 0 ) + 1;
		}

		// Most matches wins; ties go to the higher-ranked provider (PROVIDERS order).
		$best = null;
		foreach ( array_keys( self::PROVIDERS ) as $slug ) {
			if ( isset( $counts[ $slug ] ) && ( null === $best || $counts[ $slug ] > $counts[ $best ] ) ) {
				$best = $slug;
			}
		}
		if ( null === $best ) {
			return array(
				'provider'   => null,
				'confidence' => 'none',
			);
		}
		return array(
			'provider'   => $best,
			'confidence' => count( $nameservers ) === $counts[ $best ] ? 'high' : 'low',
		);
	}

	/**
	 * The provider whose known Domain Connect host matches a discovered one.
	 *
	 * @param string $host Host from a `_domainconnect` record.
	 * @return string|null Slug, or null when none matches.
	 */
	public static function match_domain_connect( $host ) {
		$host = strtolower( trim( (string) $host ) );
		if ( '' === $host ) {
			return null;
		}
		foreach ( self::DOMAIN_CONNECT_HOSTS as $slug => $known ) {
			if ( false !== strpos( $host, $known ) ) {
				return $slug;
			}
		}
		return null;
	}

	/**
	 * Whether a slug is a known provider (including `other` and `unsure`).
	 *
	 * @param string $slug Slug.
	 * @return bool
	 */
	public static function is_known( $slug ) {
		return is_string( $slug ) && ( 'unsure' === $slug || isset( self::PROVIDERS[ $slug ] ) );
	}

	/**
	 * Whether a nameserver matches a pattern: a suffix on a label boundary, or a plain substring.
	 *
	 * @param string $nameserver Lowercased hostname.
	 * @param string $pattern    Pattern from PROVIDERS.
	 * @param string $mode       `suffix` or `substring`.
	 * @return bool
	 */
	private static function matches( $nameserver, $pattern, $mode ) {
		if ( 'substring' === $mode ) {
			return false !== strpos( $nameserver, $pattern );
		}
		if ( '.' !== $pattern[0] ) {
			if ( $nameserver === $pattern ) {
				return true;
			}
			$pattern = '.' . $pattern;
		}
		return strlen( $nameserver ) > strlen( $pattern ) && substr( $nameserver, -strlen( $pattern ) ) === $pattern;
	}
}
