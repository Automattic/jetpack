<?php
/**
 * Handles the settings for the Jetpack Web Application Firewall (WAF).
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

/**
 * Handles the settings for the Jetpack Web Application Firewall (WAF).
 */
class Waf_Settings {
	// WordPress Option Names
	const MODE_OPTION_NAME                    = 'jetpack_waf_mode';
	const SHARE_DATA_OPTION_NAME              = 'jetpack_waf_share_data';
	const SHARE_DEBUG_DATA_OPTION_NAME        = 'jetpack_waf_share_debug_data';
	const AUTOMATIC_RULES_ENABLED_OPTION_NAME = 'jetpack_waf_automatic_rules_enabled';
	const IP_ALLOW_LIST_ENABLED_OPTION_NAME   = 'jetpack_waf_ip_allow_list_enabled';
	const IP_ALLOW_LIST_OPTION_NAME           = 'jetpack_waf_ip_allow_list';
	const IP_BLOCK_LIST_ENABLED_OPTION_NAME   = 'jetpack_waf_ip_block_list_enabled';
	const IP_BLOCK_LIST_OPTION_NAME           = 'jetpack_waf_ip_block_list';

	// Properties with descriptions and types as PHPDoc comments

	/**
	 * The mode to operate the WAF in: 'normal' or 'silent'.
	 *
	 * @var string
	 */
	private $mode;

	/**
	 * Whether to share basic data with Jetpack.
	 *
	 * @var bool
	 */
	private $share_data;

	/**
	 * Whether to share additional debug data with Jetpack.
	 *
	 * @var bool
	 */
	private $share_debug_data;

	/**
	 * Whether to include automatic rules in the WAF execution.
	 *
	 * @var bool
	 */
	private $automatic_rules_enabled;

	/**
	 * Whether to include the IP allow list in the WAF execution.
	 *
	 * @var bool
	 */
	private $ip_allow_list_enabled;

	/**
	 * The list of IP addresses to allow.
	 *
	 * @var string
	 */
	private $ip_allow_list;

	/**
	 * Whether to include the IP block list in the WAF execution.
	 *
	 * @var bool
	 */
	private $ip_block_list_enabled;

	/**
	 * The list of IP addresses to block.
	 *
	 * @var string
	 */
	private $ip_block_list;

	// Getter methods with PHPDoc comments

	/**
	 * Get the current WAF mode.
	 *
	 * @return string The WAF mode.
	 */
	public function get_mode() {
		if ( ! $this->mode ) {
			$this->mode = get_option( self::MODE_OPTION_NAME, 'silent' );
		}

		return $this->mode;
	}

	/**
	 * Get the value of the share data option.
	 *
	 * @return bool Whether data sharing is enabled.
	 */
	public function get_share_data() {
		if ( ! isset( $this->share_data ) ) {
			$this->share_data = get_option( self::SHARE_DATA_OPTION_NAME, true );
		}

		return $this->share_data;
	}

	/**
	 * Get the value of the share debug data option.
	 *
	 * @return bool Whether debug data sharing is enabled.
	 */
	public function get_share_debug_data() {
		if ( ! isset( $this->share_debug_data ) ) {
			$this->share_debug_data = get_option( self::SHARE_DEBUG_DATA_OPTION_NAME, false );
		}

		return $this->share_debug_data;
	}

	/**
	 * Check if automatic rules are enabled.
	 *
	 * @return bool Whether automatic rules are enabled.
	 */
	public function get_automatic_rules_enabled() {
		if ( ! isset( $this->automatic_rules_enabled ) ) {
			$this->automatic_rules_enabled = get_option( self::AUTOMATIC_RULES_ENABLED_OPTION_NAME, false );
		}

		return $this->automatic_rules_enabled;
	}

	/**
	 * Check if the IP allow list is enabled.
	 *
	 * @return bool Whether the IP allow list is enabled.
	 */
	public function get_ip_allow_list_enabled() {
		if ( ! isset( $this->ip_allow_list_enabled ) ) {
			$this->ip_allow_list_enabled = get_option( self::IP_ALLOW_LIST_ENABLED_OPTION_NAME, false );
		}

		return $this->ip_allow_list_enabled;
	}

	/**
	 * Get the IP allow list.
	 *
	 * @return string The list of allowed IPs.
	 */
	public function get_ip_allow_list() {
		if ( ! isset( $this->ip_allow_list ) ) {
			$this->ip_allow_list = get_option( self::IP_ALLOW_LIST_OPTION_NAME, '' );
		}

		return $this->ip_allow_list;
	}

	/**
	 * Check if the IP block list is enabled.
	 *
	 * @return bool Whether the IP block list is enabled.
	 */
	public function get_ip_block_list_enabled() {
		if ( ! isset( $this->ip_block_list_enabled ) ) {
			$this->ip_block_list_enabled = get_option( self::IP_BLOCK_LIST_ENABLED_OPTION_NAME, false );
		}

		return $this->ip_block_list_enabled;
	}

	/**
	 * Get the IP block list.
	 *
	 * @return string The list of blocked IPs.
	 */
	public function get_ip_block_list() {
		if ( ! isset( $this->ip_block_list ) ) {
			$this->ip_block_list = get_option( self::IP_BLOCK_LIST_OPTION_NAME, '' );
		}

		return $this->ip_block_list;
	}

	// Setter methods with PHPDoc comments

	/**
	 * Set the WAF mode.
	 *
	 * @param string $mode The mode to set.
	 * @return bool True if the mode was successfully updated.
	 */
	public function set_mode( string $mode ) {
		if ( ! $this->validate_mode( $mode ) ) {
			return false;
		}

		$this->mode = $mode;
		return update_option( self::MODE_OPTION_NAME, $this->mode );
	}

	/**
	 * Set the share data option.
	 *
	 * @param bool $share_data Whether to share data.
	 * @return void
	 */
	public function set_share_data( bool $share_data ) {
		$this->share_data = $share_data;
		update_option( self::SHARE_DATA_OPTION_NAME, $this->share_data );
	}

	/**
	 * Set the share debug data option.
	 *
	 * @param bool $share_debug_data Whether to share debug data.
	 * @return void
	 */
	public function set_share_debug_data( bool $share_debug_data ) {
		$this->share_debug_data = $share_debug_data;
		update_option( self::SHARE_DEBUG_DATA_OPTION_NAME, $this->share_debug_data );
	}

	/**
	 * Set whether automatic rules are enabled.
	 *
	 * @param bool $automatic_rules_enabled Whether to enable automatic rules.
	 * @return void
	 */
	public function set_automatic_rules_enabled( bool $automatic_rules_enabled ) {
		$this->automatic_rules_enabled = $automatic_rules_enabled;
		update_option( self::AUTOMATIC_RULES_ENABLED_OPTION_NAME, $this->automatic_rules_enabled );
	}

	/**
	 * Enable or disable the IP allow list.
	 *
	 * @param bool $ip_allow_list_enabled Whether to enable the IP allow list.
	 * @return void
	 */
	public function set_ip_allow_list_enabled( bool $ip_allow_list_enabled ) {
		$this->ip_allow_list_enabled = $ip_allow_list_enabled;
		update_option( self::IP_ALLOW_LIST_ENABLED_OPTION_NAME, $this->ip_allow_list_enabled );
	}

	/**
	 * Set the IP allow list.
	 *
	 * @param string $ip_allow_list The IP allow list.
	 * @return void
	 */
	public function set_ip_allow_list( string $ip_allow_list ) {
		$this->ip_allow_list = $ip_allow_list;
		update_option( self::IP_ALLOW_LIST_OPTION_NAME, $this->ip_allow_list );
	}

	/**
	 * Enable or disable the IP block list.
	 *
	 * @param bool $ip_block_list_enabled Whether to enable the IP block list.
	 * @return void
	 */
	public function set_ip_block_list_enabled( bool $ip_block_list_enabled ) {
		$this->ip_block_list_enabled = $ip_block_list_enabled;
		update_option( self::IP_BLOCK_LIST_ENABLED_OPTION_NAME, $this->ip_block_list_enabled );
	}

	/**
	 * Set the IP block list.
	 *
	 * @param string $ip_block_list The IP block list.
	 * @return void
	 */
	public function set_ip_block_list( string $ip_block_list ) {
		$this->ip_block_list = $ip_block_list;
		update_option( self::IP_BLOCK_LIST_OPTION_NAME, $this->ip_block_list );
	}

	/**
	 * Validates if the provided mode is one of the allowed WAF modes.
	 *
	 * @param string $mode The mode to validate.
	 * @return bool True if the mode is valid, false otherwise.
	 */
	public function validate_mode( string $mode ) {
		// Normal constants are defined prior to WP_CLI running causing problems for activation
		if ( defined( 'WAF_CLI_MODE' ) ) {
			$mode = WAF_CLI_MODE;
		}

		$allowed_modes = array(
			'normal',
			'silent',
		);

		return in_array( $mode, $allowed_modes, true );
	}
}
