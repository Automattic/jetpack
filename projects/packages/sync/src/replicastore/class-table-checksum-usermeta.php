<?php
/**
 * Table Checksums Class.
 *
 * @package automattic/jetpack-sync
 */

namespace Automattic\Jetpack\Sync\Replicastore;

use Automattic\Jetpack\Sync;
use WP_Error;
use WP_User_Query;

/**
 * Class to handle Table Checksums for the User Meta table.
 */
class Table_Checksum_Usermeta extends Table_Checksum {
	/**
	 * Calculate the checksum based on provided range and filters.
	 *
	 * @param int|null   $range_from          The start of the range.
	 * @param int|null   $range_to            The end of the range.
	 * @param array|null $filter_values       Additional filter values. Not used at the moment.
	 * @param bool       $granular_result     If the returned result should be granular or only the checksum.
	 * @param bool       $simple_return_value If we want to use a simple return value for non-granular results (return only the checksum, without wrappers).
	 *
	 * @return array|mixed|object|WP_Error|null
	 */
	public function calculate_checksum( $range_from = null, $range_to = null, $filter_values = null, $granular_result = false, $simple_return_value = true ) {

		if ( ! Sync\Settings::is_checksum_enabled() ) {
			return new WP_Error( 'checksum_disabled', 'Checksums are currently disabled.' );
		}

		/**
		 * First we need to fetch the user IDs for the users that we want to include in the range.
		 *
		 * To keep things a bit simple and avoid filtering issues, let's reuse the `build_filter_statement` that already
		 * exists. Unfortunately we don't
		 */
		global $wpdb;

		// This call depends on the `range_field` pointing to the `ID` field of the `users` table. Currently, "ID".
		$range_filter_statement = $this->build_filter_statement( $range_from, $range_to );

		$query = "
			SELECT
				ID
			FROM
				{$wpdb->users}
			WHERE
				{$range_filter_statement}
		";

		// phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
		$user_ids = $wpdb->get_col( $query );

		// Chunk the array down to make sure we don't overload the database with queries that are too large.
		$chunked_user_ids = array_chunk( $user_ids, 10000 );

		$checksum_entries = array();

		foreach ( $chunked_user_ids as $user_ids_chunk ) {
			$user_query   = new WP_User_Query( array( 'include' => $user_ids_chunk ) );
			$user_objects = $user_query->get_results();

			foreach ( $user_objects as $user_object ) {
				$checksum_entry = array(
					$this->salt,
					$user_object->locale,
					// Serializing the next values to make sure we only use strings, instead of objects.
					wp_json_encode( $user_object->roles ),
					wp_json_encode( $user_object->caps ),
					wp_json_encode( get_allowed_mime_types( $user_object ) ),
				);

				// The `#` is used as a separate in the default checksum flow, so let's reuse it.
				$checksum_entries[ $user_object->ID ] = implode( '#', $checksum_entry );
			}
		}

		// Non-granular results need only to sum the different entries.
		if ( ! $granular_result ) {
			$checksum_sum = 0;
			foreach ( $checksum_entries as $entry ) {
				$checksum_sum += crc32( $entry );
			}

			if ( $simple_return_value ) {
				return $checksum_sum;
			}

			return array(
				'range'    => $range_from . '-' . $range_to,
				'checksum' => $checksum_sum,
			);

		}

		// Granular results.
		$response = array();

		foreach ( $checksum_entries as $checksum_entry_id => $string_to_checksum ) {
			$response[ $checksum_entry_id ] = crc32( $string_to_checksum );
		}

		// Sort the return value for easier comparisons and code flows further down the line.
		ksort( $response );

		return $response;
	}
}
