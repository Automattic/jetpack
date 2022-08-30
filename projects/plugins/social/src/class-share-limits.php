<?php
/**
 * Enforce sharing limits for Jetpack Social.
 *
 * @package automattic/jetpack-social-plugin
 */

namespace Automattic\Jetpack\Social;

/**
 * Enforce sharing limits for Jetpack Social.
 */
class Share_Limits {
	/**
	 * List of all connections.
	 *
	 * @var array
	 */
	public $connections;

	/**
	 * Number of shares remaining.
	 *
	 * @var int
	 */
	public $shares_remaining;

	/**
	 * Constructor.
	 *
	 * @param array $connections List of Publicize connections.
	 * @param int   $shares_remaining Number of shares remaining for this period.
	 */
	public function __construct( $connections, $shares_remaining ) {
		$this->connections      = $connections;
		$this->shares_remaining = $shares_remaining;
	}

	/**
	 * Run functionality required to enforce sharing limits.
	 */
	public function enforce_share_limits() {
		$this->maybe_disable_publicize_services_by_default();
	}

	/**
	 * If the number of connections is greater than the share limit, we set all
	 * connections to disabled by default. This allows the user to pick and
	 * choose which services they want to share to, without going over the limit.
	 */
	public function maybe_disable_publicize_services_by_default() {
		if ( $this->shares_remaining >= count( $this->connections ) ) {
			return;
		}

		add_filter( 'publicize_checkbox_default', '__return_false' );
	}
}
