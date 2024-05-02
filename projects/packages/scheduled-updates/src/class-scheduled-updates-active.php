<?php
/**
 * Scheduled Updates Active class
 *
 * @package automattic/scheduled-updates
 */

namespace Automattic\Jetpack;

/**
 * Scheduled_Updates_Active class
 *
 * This class provides static methods to get/save active for scheduled updates.
 */
class Scheduled_Updates_Active {

	/**
	 * The name of the WordPress option where the active option is stored.
	 */
	const OPTION_NAME = 'jetpack_scheduled_update_active';

	/**
	 * Get the active value for a scheduled update.
	 *
	 * @param string $schedule_id Request ID.
	 * @return bool Active value.
	 */
	public static function get( $schedule_id ) {
		$option = get_option( self::OPTION_NAME, array() );

		return $option[ $schedule_id ] ?? true;
	}

	/**
	 * Update the active value for a scheduled update.
	 *
	 * @param string $schedule_id Request ID.
	 * @param bool   $active      Active value.
	 * @return bool
	 */
	public static function update( $schedule_id, $active ) {
		$option = get_option( self::OPTION_NAME, array() );

		if ( ! is_array( $option ) ) {
			$option = array();
		}

		$option[ $schedule_id ] = $active;

		return update_option( self::OPTION_NAME, $option );
	}

	/**
	 * Clear the active value for a scheduled update.
	 *
	 * @param string|null $schedule_id Request ID.
	 * @return bool
	 */
	public static function clear( $schedule_id ) {
		$option = get_option( self::OPTION_NAME, array() );

		if ( isset( $option[ $schedule_id ] ) ) {
			unset( $option[ $schedule_id ] );
		}

		if ( count( $option ) ) {
			return update_option( self::OPTION_NAME, $option );
		} else {
			return delete_option( self::OPTION_NAME );
		}
	}

	/**
	 * REST prepare_item_for_response filter.
	 *
	 * @param array            $item    WP Cron event.
	 * @param \WP_REST_Request $request Request object.
	 * @return array Response array on success.
	 */
	public static function response_filter( $item, $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed, VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$item['active'] = self::get( $item['schedule_id'] );

		return $item;
	}
}
