<?php
/**
 * Dev-only provisioner that does WordPress.com's job with a parent API key.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Creates the site's sub-account directly against MailChannels.
 */
class Local_Provisioner implements Provisioner {

	/**
	 * DKIM selector for hosted keys.
	 *
	 * @var string
	 */
	const DKIM_SELECTOR = 'jpsend';

	/**
	 * Client authenticated with the parent account key.
	 *
	 * @var MailChannels_Client
	 */
	private $parent_client;

	/**
	 * Send limit to set, or null to inherit the parent's.
	 *
	 * @var int|null
	 */
	private $send_limit;

	/**
	 * DNS zone that holds the real Lockdown and DKIM values, or '' to give customers the values directly.
	 *
	 * @var string
	 */
	private $dns_zone;

	/**
	 * Constructor.
	 *
	 * @param MailChannels_Client $parent_client Parent-key client.
	 * @param int|null            $send_limit    Sub-account send limit.
	 * @param string              $dns_zone      Zone customers' CNAMEs point into, or ''.
	 */
	public function __construct( MailChannels_Client $parent_client, $send_limit = null, $dns_zone = '' ) {
		$this->parent_client = $parent_client;
		$this->send_limit    = null === $send_limit ? null : (int) $send_limit;
		$this->dns_zone      = strtolower( trim( (string) $dns_zone, " .\t\n" ) );
	}

	/**
	 * Type.
	 *
	 * @return string
	 */
	public function get_type() {
		return 'local';
	}

	/**
	 * A handle that is stable per site, so provisioning again reuses the sub-account.
	 *
	 * @return string
	 */
	public static function handle_for_site() {
		return 'jpsend' . substr( md5( home_url() ), 0, 16 );
	}

	/**
	 * Create or reuse the sub-account, issue a key, and prepare DNS records.
	 *
	 * @param string $domain Sending domain.
	 * @return array|WP_Error
	 */
	public function provision( $domain ) {
		$handle  = self::handle_for_site();
		$created = $this->parent_client->create_sub_account( $handle, self::company_name() );
		if ( is_wp_error( $created ) && 'jetpack_send_http_409' !== $created->get_error_code() ) {
			return $created;
		}

		$key = $this->parent_client->create_sub_account_api_key( $handle );
		if ( is_wp_error( $key ) ) {
			return $key;
		}
		$api_key = (string) ( $key['key'] ?? $key['api_key'] ?? $key['value'] ?? '' );
		if ( '' === $api_key ) {
			return new WP_Error( 'jetpack_send_no_api_key', __( 'MailChannels did not return an API key for the new sub-account.', 'jetpack-send-pkg' ), array( 'status' => 502 ) );
		}

		if ( null !== $this->send_limit ) {
			$limit = $this->parent_client->set_sub_account_limit( $handle, $this->send_limit );
			if ( is_wp_error( $limit ) ) {
				return $limit;
			}
		}

		$required = array(
			self::txt_record( '_mailchannels.' . $domain, 'v=mc1 auth=' . $handle, 'lockdown' ),
		);
		$dkim     = $this->dkim_record( $domain, new MailChannels_Client( $api_key ) );
		if ( $dkim ) {
			$required[] = $dkim;
		}

		// With a zone, customers add short CNAMEs and the zone holds the values, so they can change without customer edits.
		$records      = $required;
		$zone_records = array();
		if ( '' !== $this->dns_zone ) {
			$records = array();
			foreach ( $required as $record ) {
				$target         = $handle . '.' . $record['purpose'] . '.' . $this->dns_zone;
				$records[]      = array_merge(
					$record,
					array(
						'type'  => 'CNAME',
						'value' => $target,
					)
				);
				$zone_records[] = array_merge( $record, array( 'name' => $target ) );
			}
		}

		// SPF is optional because DMARC passes on aligned DKIM; it sits after Lockdown to keep the checklist order.
		$spf = array_merge(
			self::txt_record( $domain, 'v=spf1 include:relay.mailchannels.net ~all', 'spf' ),
			array( 'optional' => true )
		);
		array_splice( $records, 1, 0, array( $spf ) );

		$result = array(
			'handle'           => $handle,
			'api_key'          => $api_key,
			'lockdown_auth_id' => $handle,
			'monthly_limit'    => null === $this->send_limit ? -1 : $this->send_limit,
			'dns_records'      => $records,
		);
		if ( $zone_records ) {
			$result['zone_records'] = $zone_records;
		}
		return $result;
	}

	/**
	 * A required TXT record.
	 *
	 * @param string $name    Host name.
	 * @param string $value   Value.
	 * @param string $purpose `lockdown`, `spf`, or `dkim`.
	 * @return array
	 */
	private static function txt_record( $name, $value, $purpose ) {
		return array(
			'type'     => 'TXT',
			'name'     => $name,
			'value'    => $value,
			'purpose'  => $purpose,
			'optional' => false,
		);
	}

	/**
	 * Usage for the site's sub-account.
	 *
	 * @param array $account Stored account.
	 * @return array|WP_Error
	 */
	public function get_usage( array $account ) {
		$usage = $this->parent_client->get_sub_account_usage( $account['handle'] );
		if ( is_wp_error( $usage ) ) {
			return $usage;
		}

		return array(
			'total_usage'   => (int) ( $usage['total_usage'] ?? 0 ),
			'monthly_limit' => (int) ( $usage['monthly_limit'] ?? -1 ),
			'period_start'  => (string) ( $usage['period_start_date'] ?? '' ),
			'period_end'    => (string) ( $usage['period_end_date'] ?? '' ),
		);
	}

	/**
	 * Delete the site's sub-account; one that's already gone counts as success.
	 *
	 * @param array $account Stored account.
	 * @return true|WP_Error
	 */
	public function deprovision( array $account ) {
		$result = $this->parent_client->delete_sub_account( $account['handle'] );
		if ( is_wp_error( $result ) && 'jetpack_send_http_404' !== $result->get_error_code() ) {
			return $result;
		}
		return true;
	}

	/**
	 * Create (or fetch the existing) hosted DKIM key's DNS record; null when unavailable.
	 *
	 * @param string              $domain Domain.
	 * @param MailChannels_Client $client Sub-account client.
	 * @return array|null
	 */
	private function dkim_record( $domain, MailChannels_Client $client ) {
		$response = $client->create_dkim_key( $domain, self::DKIM_SELECTOR );
		if ( is_wp_error( $response ) ) {
			if ( 'jetpack_send_http_409' !== $response->get_error_code() ) {
				return null;
			}
			$response = $client->get_dkim_keys( $domain, self::DKIM_SELECTOR );
			if ( is_wp_error( $response ) ) {
				return null;
			}
		}

		$record = self::find_dkim_dns_record( $response );
		if ( ! $record ) {
			return null;
		}

		return self::txt_record( self::DKIM_SELECTOR . '._domainkey.' . $domain, (string) $record['value'], 'dkim' );
	}

	/**
	 * The first entry of the first `dkim_dns_records` list anywhere in a response.
	 *
	 * @param array $data Decoded response.
	 * @return array|null
	 */
	private static function find_dkim_dns_record( array $data ) {
		if ( isset( $data['dkim_dns_records'][0]['value'] ) ) {
			return $data['dkim_dns_records'][0];
		}
		foreach ( $data as $child ) {
			if ( is_array( $child ) ) {
				$found = self::find_dkim_dns_record( $child );
				if ( $found ) {
					return $found;
				}
			}
		}
		return null;
	}

	/**
	 * Site title clamped to MailChannels' 3–128 character company name.
	 *
	 * @return string
	 */
	private static function company_name() {
		$name = trim( wp_specialchars_decode( (string) get_bloginfo( 'name' ), ENT_QUOTES ) );
		if ( mb_strlen( $name ) < 3 ) {
			$name = 'Jetpack Send site';
		}
		return mb_substr( $name, 0, 128 );
	}
}
