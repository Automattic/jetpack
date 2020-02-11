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
	 * Get a human-readable Sync Health Status.
	 *
	 * @return string Sync Health Status
	 */
	public static function get_status() {
		$status = \Jetpack_Options::get_option( self::STATUS_OPTION );

		if ( false === $status || ! is_array( $status ) || empty( $status[ self::OPTION_STATUS_KEY ] ) ) {
			return self::STATUS_UNKNOWN;
		}

		switch ( $status[ self::OPTION_STATUS_KEY ] ) {
			case self::STATUS_OUT_OF_SYNC:
			case self::STATUS_IN_SYNC:
			case self::STATUS_INITIALIZING:
				return $status[ self::OPTION_STATUS_KEY ];
			default:
				return self::STATUS_UNKNOWN;
		}

	}

	/**
	 * Update Sync Health Status.
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
