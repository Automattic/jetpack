<?php
/**
 * Class use to define the constants used by the WAF
 *
 * @package automattic/jetpack-waf
 */

namespace Automattic\Jetpack\Waf;

use Automattic\Jetpack\Status\Host;

/**
 * Defines our constants.
 */
class Waf_Constants {
	const WAF_RAN_CONSTANT              = 'JETPACK_WAF_RAN';
	const DIRECTORY_PATH_CONSTANT       = 'JETPACK_WAF_DIR';
	const ENTRYPOINT_CONSTANT           = 'JETPACK_WAF_ENTRYPOINT';
	const KILLSWITCH_CONSTANT           = 'DISABLE_JETPACK_WAF';
	const MODE_CONSTANT                 = 'JETPACK_WAF_MODE';
	const SHARE_DATA_CONSTANT           = 'JETPACK_WAF_SHARE_DATA';
	const SHARE_DEBUG_DATA_CONSTANT     = 'JETPACK_WAF_SHARE_DEBUG_DATA';
	const WPCONFIG_PATH_CONSTANT        = 'JETPACK_WAF_WPCONFIG';
	const BRUTE_FORCE_API_HOST_CONSTANT = 'JETPACK_PROTECT__API_HOST';

	const CONSTANTS = array(
		self::DIRECTORY_PATH_CONSTANT,
		self::WPCONFIG_PATH_CONSTANT,
		self::KILLSWITCH_CONSTANT,
		self::MODE_CONSTANT,
		self::ENTRYPOINT_CONSTANT,
		self::SHARE_DATA_CONSTANT,
		self::SHARE_DEBUG_DATA_CONSTANT,
		self::BRUTE_FORCE_API_HOST_CONSTANT,
	);

	/**
	 * Initializes all constants used by the WAF.
	 */
	public function initialize_constants() {
		foreach ( self::CONSTANTS as $constant ) {
			$method_name = 'define_' . str_replace( '_constant', '', strtolower( $constant ) );
			if ( method_exists( $this, $method_name ) ) {
				$this->$method_name();
			}
		}
	}

	/**
	 * Print all constants used by the WAF.
	 */
	public function print_constants() {
		foreach ( self::CONSTANTS as $constant ) {
			$value = $this->get( $constant );
			sprintf( "define( '%s', %s );\n", $constant, var_export( $value, true ) );
		}
	}

	/**
	 * Get the value of a constant.
	 *
	 * @param string $constant The name of the constant to get.
	 *
	 * @return mixed The value of the constant, or null if the constant is not defined.
	 */
	public function get( string $constant ) {
		// Return early if the provided constant name is invalid.
		if ( ! in_array( $constant, self::CONSTANTS, true ) ) {
			return null;
		}

		// Initialize the constant if it has not been defined yet.
		if ( ! defined( $constant ) ) {
			$method_name = 'define_' . strtolower( $constant );
			if ( method_exists( $this, $method_name ) ) {
				$this->$method_name();
			}
		}

		// Return early if the constant is still not defined.
		if ( ! defined( $constant ) ) {
			return null;
		}

		// Return the value of the constant.
		return constant( $constant );
	}

	/**
	 * Set the path to the WAF directory if it has not been set.
	 *
	 * @return void
	 */
	public function define_directory_path() {
		if ( ! defined( self::DIRECTORY_PATH_CONSTANT ) ) {
			define( self::DIRECTORY_PATH_CONSTANT, trailingslashit( WP_CONTENT_DIR ) . 'jetpack-waf' );
		}
	}

	/**
	 * Set the path to the wp-config.php file if it has not been set.
	 *
	 * @return void
	 */
	public function define_wpconfig_path() {
		if ( ! defined( self::WPCONFIG_PATH_CONSTANT ) ) {
			define( self::WPCONFIG_PATH_CONSTANT, trailingslashit( WP_CONTENT_DIR ) . '../wp-config.php' );
		}
	}

	/**
	 * Set the killswitch definition if it has not been set.
	 *
	 * @return void
	 */
	public function define_killswitch() {
		if ( ! defined( self::KILLSWITCH_CONSTANT ) ) {
			$is_wpcom        = defined( 'IS_WPCOM' ) && IS_WPCOM;
			$is_atomic       = ( new Host() )->is_atomic_platform();
			$is_atomic_on_jn = defined( 'IS_ATOMIC_JN' ) ?? IS_ATOMIC_JN;
			define( self::KILLSWITCH_CONSTANT, $is_wpcom || ( $is_atomic && ! $is_atomic_on_jn ) );
		}
	}

	/**
	 * Set the mode definition if it has not been set.
	 *
	 * @return void
	 */
	public function define_mode() {
		if ( ! defined( self::MODE_CONSTANT ) ) {
			define( self::MODE_CONSTANT, ( new Waf_Settings() )->get_mode() );
		}
	}

	/**
	 * Set the entrypoint definition if it has not been set.
	 */
	public function define_entrypoint() {
		if ( ! defined( self::ENTRYPOINT_CONSTANT ) ) {
			define( self::ENTRYPOINT_CONSTANT, 'rules/rules.php' );
		}
	}

	/**
	 * Set the share data definition if it has not been set.
	 *
	 * @return void
	 */
	public function define_share_data() {
		if ( ! defined( self::SHARE_DATA_CONSTANT ) ) {
			define( self::SHARE_DATA_CONSTANT, ( new Waf_Settings() )->get_share_data() );
		}
	}

	/**
	 * Set the share debug data definition if it has not been set.
	 *
	 * @return void
	 */
	public function define_share_debug_data() {
		if ( ! defined( self::SHARE_DEBUG_DATA_CONSTANT ) ) {
			define( self::SHARE_DEBUG_DATA_CONSTANT, ( new Waf_Settings() )->get_share_debug_data() );
		}
	}

	/**
	 * Set the brute force protection's API host definition if it has not been set.
	 *
	 * @return void
	 */
	public function define_brute_force_api_host() {
		if ( ! defined( self::BRUTE_FORCE_API_HOST_CONSTANT ) ) {
			define( self::BRUTE_FORCE_API_HOST_CONSTANT, 'https://api.bruteprotect.com/' );
		}
	}
}
