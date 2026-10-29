<?php
/**
 * Sync fields for the Jetpack section of the Site Health Info tab.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync;

/**
 * Adds the sync status to the section the connection package builds.
 *
 * @since $$next-version$$
 */
class Debug_Data {

	/**
	 * Add the sync fields.
	 *
	 * @since $$next-version$$
	 *
	 * @param array $fields Fields keyed by ID, each with a `label`, a `value` and a `private` flag.
	 *
	 * @return array The fields with the sync status added.
	 */
	public static function add_fields( $fields ) {
		$sync_module = Modules::get_module( 'full-sync' );
		'@phan-var \Automattic\Jetpack\Sync\Modules\Full_Sync_Immediately|\Automattic\Jetpack\Sync\Modules\Full_Sync $sync_module';
		if ( $sync_module ) {
			$human_readable_sync_status = array();
			foreach ( $sync_module->get_status() as $sync_status => $sync_status_value ) {
				$human_readable_sync_status[ $sync_status ] =
					in_array( $sync_status, array( 'started', 'queue_finished', 'send_started', 'finished' ), true )
						? gmdate( 'r', $sync_status_value ) : $sync_status_value;
			}
			$fields['full_sync'] = array(
				'label'   => 'Full Sync Status',
				'value'   => wp_json_encode( $human_readable_sync_status, JSON_UNESCAPED_SLASHES ),
				'private' => false,
			);
		}

		$queue = Sender::get_instance()->get_sync_queue();

		$fields['sync_size'] = array(
			'label'   => 'Sync Queue Size',
			'value'   => $queue->size(),
			'private' => false,
		);
		$fields['sync_lag']  = array(
			'label'   => 'Sync Queue Lag',
			'value'   => self::seconds_to_time( $queue->lag() ),
			'private' => false,
		);

		$full_sync_queue = Sender::get_instance()->get_full_sync_queue();

		$fields['full_sync_size'] = array(
			'label'   => 'Full Sync Queue Size',
			'value'   => $full_sync_queue->size(),
			'private' => false,
		);
		$fields['full_sync_lag']  = array(
			'label'   => 'Full Sync Queue Lag',
			'value'   => self::seconds_to_time( $full_sync_queue->lag() ),
			'private' => false,
		);

		return $fields;
	}

	/**
	 * Convert seconds to "1 hour, 2 minutes, 3 seconds".
	 *
	 * Core's human_time_diff() rounds to one unit, which hides a lag of seconds.
	 *
	 * @param int|float $seconds Number of seconds.
	 *
	 * @return string Human readable time.
	 */
	private static function seconds_to_time( $seconds ) {
		$seconds = (int) $seconds;
		if ( 0 === $seconds ) {
			return '0 seconds';
		}

		$units = array(
			'week'   => WEEK_IN_SECONDS,
			'day'    => DAY_IN_SECONDS,
			'hour'   => HOUR_IN_SECONDS,
			'minute' => MINUTE_IN_SECONDS,
			'second' => 1,
		);

		$parts = array();
		foreach ( $units as $name => $divisor ) {
			$quot = (int) ( $seconds / $divisor );
			if ( $quot ) {
				$parts[]  = $quot . ' ' . $name . ( abs( $quot ) > 1 ? 's' : '' );
				$seconds -= $quot * $divisor;
			}
		}

		return implode( ', ', $parts );
	}
}
