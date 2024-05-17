<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync\Contracts;

/**
 * Data Sync Entry Interface:
 * ==========================
 * This interface defines what is a Data Sync Entry.
 */
interface Data_Sync_Entry {

	/**
	 * Checks if this Data Sync Entry implements a specific interface.
	 *
	 * @param string $interface_reference The name of the method to check (get, set, merge, delete).
	 * @return bool True if the method is supported, false otherwise.
	 */
	public function is( $interface_reference );

	/**
	 * Retrieves the current value of the data sync entry.
	 *
	 * @return mixed The current value of the data sync entry.
	 */
	public function get();

	/**
	 * Sets the value of the data sync entry.
	 *
	 * @param mixed $value The new value to set for the data sync entry.
	 * @return mixed The updated value of the data sync entry.
	 */
	public function set( $value );

	/**
	 * Merges a partial value with the current value of the data sync entry.
	 *
	 * @param mixed $partial_value The partial value to merge with the current value.
	 * @return mixed The updated value of the data sync entry after merging.
	 */
	public function merge( $partial_value );

	/**
	 * Deletes the data sync entry.
	 *
	 * @return mixed The value of the data sync entry after deletion.
	 */
	public function delete();

	/**
	 * @return mixed The schema of the data sync entry.
	 */
	public function get_parser();
}
