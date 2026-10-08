<?php
/**
 * Reduces MailChannels check-domain results to per-record verdicts.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * DNS check helpers.
 */
class Dns_Check {

	/**
	 * Normalize a check-domain response.
	 *
	 * @param array  $response     MailChannels response.
	 * @param string $existing_spf The domain's current SPF record, or ''.
	 * @return array{checked_at: string, domain_lockdown: string, spf: string, dkim: string, sender_domain: string, existing_spf: string}
	 */
	public static function normalize( array $response, $existing_spf ) {
		$results = isset( $response['check_results'] ) && is_array( $response['check_results'] ) ? $response['check_results'] : array();

		return array(
			'checked_at'      => gmdate( 'c' ),
			'domain_lockdown' => self::verdict_of( $results['domain_lockdown'] ?? null ),
			'spf'             => self::verdict_of( $results['spf'] ?? null ),
			'dkim'            => self::verdict_of( $results['dkim'] ?? null ),
			'sender_domain'   => self::verdict_of( $results['sender_domain'] ?? null ),
			'existing_spf'    => (string) $existing_spf,
		);
	}

	/**
	 * The domain's current SPF record, or '' when there is none or DNS lookups are unavailable.
	 *
	 * @param string $domain Domain.
	 * @return string
	 */
	public static function existing_spf( $domain ) {
		if ( ! function_exists( 'dns_get_record' ) ) {
			return '';
		}
		$records = @dns_get_record( $domain, DNS_TXT ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- Lookup failures just mean "unknown".
		foreach ( is_array( $records ) ? $records : array() as $record ) {
			$txt = (string) ( $record['txt'] ?? '' );
			if ( 0 === stripos( $txt, 'v=spf1' ) ) {
				return $txt;
			}
		}
		return '';
	}

	/**
	 * A node's verdict; for a group of checks, passed when any member passed.
	 *
	 * @param mixed $node A check result, or a list/map of them.
	 * @return string
	 */
	private static function verdict_of( $node ) {
		if ( ! is_array( $node ) || array() === $node ) {
			return 'unknown';
		}
		if ( isset( $node['verdict'] ) && is_string( $node['verdict'] ) ) {
			return strtolower( $node['verdict'] );
		}

		$verdicts = array();
		foreach ( $node as $child ) {
			$verdicts[] = self::verdict_of( $child );
		}
		if ( in_array( 'passed', $verdicts, true ) ) {
			return 'passed';
		}
		return in_array( 'failed', $verdicts, true ) ? 'failed' : 'unknown';
	}
}
