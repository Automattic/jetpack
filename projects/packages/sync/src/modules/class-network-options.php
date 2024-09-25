<?php
/**
 * Network Options sync module.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Modules;

use Automattic\Jetpack\Sync\Defaults;

/**
 * Class to handle sync for network options.
 */
class Network_Options extends Module {
	/**
	 * Whitelist for network options we want to sync.
	 *
	 * @access private
	 *
	 * @var array
	 */
	private $network_options_whitelist;

	/**
	 * Sync module name.
	 *
	 * @access public
	 *
	 * @return string
	 */
	public function name() {
		return 'network_options';
	}

	/**
	 * Initialize network options action listeners.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_listeners( $callable ) {
		// Multi site network options.
		add_action( 'add_site_option', $callable, 10, 2 );
		add_action( 'update_site_option', $callable, 10, 3 );
		add_action( 'delete_site_option', $callable, 10, 1 );

		$whitelist_network_option_handler = array( $this, 'whitelist_network_options' );
		add_filter( 'jetpack_sync_before_enqueue_delete_site_option', $whitelist_network_option_handler );
		add_filter( 'jetpack_sync_before_enqueue_add_site_option', $whitelist_network_option_handler );
		add_filter( 'jetpack_sync_before_enqueue_update_site_option', $whitelist_network_option_handler );
	}

	/**
	 * Initialize network options action listeners for full sync.
	 *
	 * @access public
	 *
	 * @param callable $callable Action handler callable.
	 */
	public function init_full_sync_listeners( $callable ) {
		add_action( 'jetpack_full_sync_network_options', $callable );
	}

	/**
	 * Initialize the module in the sender.
	 *
	 * @access public
	 */
	public function init_before_send() {
		// Full sync.
		add_filter(
			'jetpack_sync_before_send_jetpack_full_sync_network_options',
			array(
				$this,
				'expand_network_options',
			)
		);
	}

	/**
	 * Set module defaults.
	 * Define the network options whitelist based on the default one.
	 *
	 * @access public
	 */
	public function set_defaults() {
		$this->network_options_whitelist = Defaults::$default_network_options_whitelist;
	}

	/**
	 * Send the network options actions for full sync.
	 *
	 * @access public
	 *
	 * @param array $config Full sync configuration for this sync module.
	 * @param int   $send_until The timestamp until the current request can send.
	 * @param array $state This module Full Sync status.
	 *
	 * @return array This module Full Sync status.
	 */
	public function send_full_sync_actions( $config, $send_until, $state ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// we call this instead of do_action when sending immediately.
		$this->send_action( 'jetpack_full_sync_network_options', array( true ) );

		// The number of actions enqueued, and next module state (true == done).
		return array( 'finished' => true );
	}

	/**
	 * Retrieve all network options as per the current network options whitelist.
	 *
	 * @access public
	 *
	 * @return array All network options.
	 */
	public function get_all_network_options() {
		$options = array();
		foreach ( $this->network_options_whitelist as $option ) {
			$options[ $option ] = get_site_option( $option );
		}

		return $options;
	}

	/**
	 * Set the network options whitelist.
	 *
	 * @access public
	 *
	 * @param array $options The new network options whitelist.
	 */
	public function set_network_options_whitelist( $options ) {
		$this->network_options_whitelist = $options;
	}

	/**
	 * Get the network options whitelist.
	 *
	 * @access public
	 *
	 * @return array The network options whitelist.
	 */
	public function get_network_options_whitelist() {
		return $this->network_options_whitelist;
	}

	/**
	 * Reject non-whitelisted network options.
	 *
	 * @access public
	 *
	 * @param array $args The hook parameters.
	 * @return array|false $args The hook parameters, false if not a whitelisted network option.
	 */
	public function whitelist_network_options( $args ) {
		if ( ! $this->is_whitelisted_network_option( $args[0] ) ) {
			return false;
		}

		return $args;
	}

	/**
	 * Whether the option is a whitelisted network option.
	 *
	 * @access public
	 *
	 * @param string $option Option name.
	 * @return boolean True if this is a whitelisted network option.
	 */
	public function is_whitelisted_network_option( $option ) {
		return in_array( $option, $this->network_options_whitelist, true );
	}

	/**
	 * Expand the network options within a hook before they are serialized and sent to the server.
	 *
	 * @access public
	 *
	 * @param array $args The hook parameters.
	 * @return array $args The hook parameters.
	 */
	public function expand_network_options( $args ) {
		if ( $args[0] ) {
			return $this->get_all_network_options();
		}

		return $args;
	}

	/**
	 * Return Total number of objects.
	 *
	 * @param array $config Full Sync config.
	 *
	 * @return int total
	 */
	public function total( $config ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return count( (array) $this->network_options_whitelist );
	}
}
