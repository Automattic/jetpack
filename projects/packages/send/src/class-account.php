<?php
/**
 * The site's provisioned MailChannels sub-account.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Reads and writes the `jetpack_send_account` option.
 */
class Account {

	/**
	 * Option name.
	 *
	 * @var string
	 */
	const OPTION = 'jetpack_send_account';

	/**
	 * The stored account, or null when the site isn't set up.
	 *
	 * @return array|null
	 */
	public static function get() {
		$account = get_option( self::OPTION );
		return is_array( $account ) && ! empty( $account['api_key'] ) ? $account : null;
	}

	/**
	 * Replace the stored account.
	 *
	 * @param array $account Account.
	 * @return void
	 */
	public static function save( array $account ) {
		update_option( self::OPTION, $account, false );
	}

	/**
	 * Merge changes into the stored account, if there is one.
	 *
	 * @param array $changes Keys to change.
	 * @return void
	 */
	public static function update( array $changes ) {
		$account = self::get();
		if ( $account ) {
			self::save( array_merge( $account, $changes ) );
		}
	}

	/**
	 * Delete the option.
	 *
	 * @return void
	 */
	public static function delete() {
		delete_option( self::OPTION );
	}

	/**
	 * The account without its API key, for REST responses.
	 *
	 * @param array|null $account Account.
	 * @return array|null
	 */
	public static function to_public( $account ) {
		if ( ! is_array( $account ) ) {
			return null;
		}
		unset( $account['api_key'] );

		$zone = (string) ( $account['dns_host']['apex'] ?? '' );
		if ( '' === $zone ) {
			$zone = (string) ( $account['domain'] ?? '' );
		}
		foreach ( (array) ( $account['dns_records'] ?? array() ) as $i => $record ) {
			$account['dns_records'][ $i ]['host'] = self::relative_host( (string) ( $record['name'] ?? '' ), $zone );
		}
		return $account;
	}

	/**
	 * A record name relative to its DNS zone, as most providers' host fields expect.
	 *
	 * @param string $name Full record name.
	 * @param string $zone Zone root, e.g. `example.com`.
	 * @return string The short host, `@` for the zone root, or the name unchanged when outside the zone.
	 */
	public static function relative_host( $name, $zone ) {
		$name = strtolower( rtrim( $name, '.' ) );
		$zone = strtolower( rtrim( $zone, '.' ) );
		if ( '' === $zone ) {
			return $name;
		}
		if ( $name === $zone ) {
			return '@';
		}
		$suffix = '.' . $zone;
		return substr( $name, -strlen( $suffix ) ) === $suffix ? substr( $name, 0, -strlen( $suffix ) ) : $name;
	}

	/**
	 * Validate a provisioner result and shape it into an account.
	 *
	 * @param array  $result   Provisioner::provision() result.
	 * @param string $domain   Sending domain.
	 * @param string $provider Provisioner type.
	 * @return array|WP_Error
	 */
	public static function from_provision( array $result, $domain, $provider ) {
		foreach ( array( 'handle', 'api_key', 'lockdown_auth_id' ) as $key ) {
			if ( empty( $result[ $key ] ) || ! is_string( $result[ $key ] ) ) {
				return new WP_Error( 'jetpack_send_bad_provision', __( 'The sending account could not be created. Please try again.', 'jetpack-send-pkg' ), array( 'status' => 502 ) );
			}
		}

		$records       = self::clean_records( $result['dns_records'] ?? array() );
		$dkim_selector = '';
		foreach ( $records as $record ) {
			if ( 'dkim' === $record['purpose'] && false !== strpos( $record['name'], '._domainkey.' ) ) {
				$dkim_selector = (string) strstr( $record['name'], '._domainkey.', true );
			}
		}

		return array(
			'handle'           => $result['handle'],
			'api_key'          => $result['api_key'],
			'lockdown_auth_id' => $result['lockdown_auth_id'],
			'domain'           => $domain,
			'dkim_selector'    => $dkim_selector,
			'monthly_limit'    => isset( $result['monthly_limit'] ) ? (int) $result['monthly_limit'] : -1,
			'dns_records'      => $records,
			'zone_records'     => self::clean_records( $result['zone_records'] ?? array() ),
			'provider'         => $provider,
			'provisioned_at'   => gmdate( 'c' ),
			'dns_check'        => null,
		);
	}

	/**
	 * Keep well-formed DNS records, cast to strings.
	 *
	 * @param mixed $records Records from a provisioner.
	 * @return array[] `{type, name, value, purpose, optional}`.
	 */
	private static function clean_records( $records ) {
		$clean = array();
		foreach ( (array) $records as $record ) {
			if ( ! is_array( $record ) || ! isset( $record['type'] ) || ! isset( $record['name'] ) || ! isset( $record['value'] ) || ! isset( $record['purpose'] ) ) {
				continue;
			}
			$clean[] = array(
				'type'     => (string) $record['type'],
				'name'     => (string) $record['name'],
				'value'    => (string) $record['value'],
				'purpose'  => (string) $record['purpose'],
				'optional' => ! empty( $record['optional'] ),
			);
		}
		return $clean;
	}
}
