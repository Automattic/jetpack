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
class Status {

	/**
	 * Prefix of the blog lock transient.
	 *
	 * @access public
	 *
	 * @var string
	 */
	const STATUS_OPTION = 'jp_sync_health_status';

	/**
	 * Status KEY in option array
	 *
	 * @access public
	 *
	 * @var string
	 */
	const OPTION_STATUS_KEY = 'status';

	/**
	 * Timestamp KEY in option array
	 *
	 * @access public
	 *
	 * @var string
	 */
	const OPTION_TIMESTAMP_KEY = 'timestamp';

	/**
	 * Unknown Status
	 *
	 * @access public
	 *
	 * @var string
	 */
	const STATUS_UNKNOWN = 'Unknown';

	/**
	 * Out of Sync Status
	 *
	 * @access public
	 *
	 * @var string
	 */
	const STATUS_OUT_OF_SYNC = 'Out of Sync';

	/**
	 * In Sync Status
	 *
	 * @access public
	 *
	 * @var string
	 */
	const STATUS_IN_SYNC = 'In Sync';

	/**
	 * get the raw Sync Health Status
	 *
	 * @return array|mixed
	 */
	public static function get_status_raw( ) {

		$status = get_option( self::STATUS_OPTION, false );

		return $status;

	}

	/**
	 * get the Sync Health Status
	 *
	 * @return string Sync Health Status
	 */
	public static function get_status( ) {

		$status = get_option( self::STATUS_OPTION, false );

		if ( false == $status || ! is_array( $status ) || empty( $status[ self::OPTION_STATUS_KEY ] ) ) {
			return self::STATUS_UNKNOWN;
		}

		// Return only valid Status
		switch ( $status[ self::OPTION_STATUS_KEY ] ) {

			case self::STATUS_OUT_OF_SYNC:
			case self::STATUS_IN_SYNC:
				return $status[ self::OPTION_STATUS_KEY ];
				break;

			default :
				return STATUS_UNKNOWN;

		}

	}

	/**
	 * update Sync Health Status
	 *
	 * @param string $status Sync Status
	 */
	public static function update_status( $status ) {

		// Default Status Option
		$new_status = array(
			self::OPTION_STATUS_KEY     => STATUS_UNKNOWN,
			self::OPTION_TIMESTAMP_KEY  => microtime(true ),
		);

		switch ( $status ) {

			case self::STATUS_OUT_OF_SYNC:
			case self::STATUS_IN_SYNC:
				$new_status[ self::OPTION_STATUS_KEY ] = $status;
				break;

		}

		update_option( self::STATUS_OPTION, $new_status );

	}

}
