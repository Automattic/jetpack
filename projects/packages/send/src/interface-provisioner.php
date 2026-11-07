<?php
/**
 * Provisioner contract.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Creates and manages the site's MailChannels sub-account.
 */
interface Provisioner {

	/**
	 * `wpcom` or `local`.
	 *
	 * @return string
	 */
	public function get_type();

	/**
	 * Create (or re-key) the site's sub-account for a domain.
	 *
	 * @param string $domain Sending domain.
	 * @return array|WP_Error `{handle, api_key, lockdown_auth_id, monthly_limit, dns_records[]}`.
	 */
	public function provision( $domain );

	/**
	 * Usage this billing period.
	 *
	 * @param array $account Stored account.
	 * @return array|WP_Error `{total_usage, monthly_limit, period_start, period_end}`.
	 */
	public function get_usage( array $account );

	/**
	 * Remove the site's sub-account.
	 *
	 * @param array $account Stored account.
	 * @return true|WP_Error
	 */
	public function deprovision( array $account );
}
