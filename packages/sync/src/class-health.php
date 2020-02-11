<?php
/**
 * Status class.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

/**
 * Status class
 */
class Health {

	/**
	 * Prefix of the blog lock transient.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const STATUS_OPTION = 'sync_health_status';

	/**
	 * Status key in option array.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const OPTION_STATUS_KEY = 'status';

	/**
	 * Timestamp key in option array.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const OPTION_TIMESTAMP_KEY = 'timestamp';

	/**
	 * Unknown status code.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const STATUS_UNKNOWN = 'unknown';

	/**
	 * Disabled status code.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const STATUS_DISABLED = 'disabled';

	/**
	 * Out of sync status code.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const STATUS_OUT_OF_SYNC = 'out_of_sync';

	/**
	 * In sync status code.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const STATUS_IN_SYNC = 'in_sync';

	/**
	 * Initializing status code.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const STATUS_INITIALIZING = 'initializing';

	/**
	 * Gets health status code.
	 *
	 * @return string Sync Health Status
	 */
	public static function get_status() {
		$status = \Jetpack_Options::get_option( self::STATUS_OPTION );

		if ( false === $status || ! is_array( $status ) || empty( $status[ self::OPTION_STATUS_KEY ] ) ) {
			return self::STATUS_UNKNOWN;
		}

		switch ( $status[ self::OPTION_STATUS_KEY ] ) {
			case self::STATUS_DISABLED:
			case self::STATUS_OUT_OF_SYNC:
			case self::STATUS_IN_SYNC:
			case self::STATUS_INITIALIZING:
				return $status[ self::OPTION_STATUS_KEY ];
			default:
				return self::STATUS_UNKNOWN;
		}

	}

	/**
	 * Sets sync health status to either STATUS_INITIALIZING or, if sync is disabled,
	 * to STATUS_DISABLED. This method is hooked to Jetpack's plugin activation and
	 * upgrade actions.
	 */
	public static function set_initial_status() {
		if ( false === self::is_status_defined() ) {
			self::update_status( self::STATUS_INITIALIZING );
		}

		if ( ! Settings::is_sync_enabled() ) {
			self::update_status( self::STATUS_DISABLED );
		}
	}

	/**
	 * Updates sync health status with either a valid status, or an unknown status.
	 *
	 * @param string $status Sync Status.
	 */
	public static function update_status( $status ) {
		// Default Status Option.
		$new_status = array(
			self::OPTION_STATUS_KEY    => self::STATUS_UNKNOWN,
			self::OPTION_TIMESTAMP_KEY => microtime( true ),
		);

		switch ( $status ) {
			case self::STATUS_DISABLED:
			case self::STATUS_OUT_OF_SYNC:
			case self::STATUS_IN_SYNC:
			case self::STATUS_INITIALIZING:
				$new_status[ self::OPTION_STATUS_KEY ] = $status;
				break;
		}

		\Jetpack_Options::update_option( self::STATUS_OPTION, $new_status );
	}

	/**
	 * Check if Status has been previously set.
	 *
	 * @return bool is a Status defined
	 */
	public static function is_status_defined() {
		$status = \Jetpack_Options::get_option( self::STATUS_OPTION );

		if ( false === $status || ! is_array( $status ) || empty( $status[ self::OPTION_STATUS_KEY ] ) ) {
			return false;
		} else {
			return true;
		}
	}

}
