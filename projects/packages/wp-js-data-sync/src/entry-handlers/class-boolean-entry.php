<?php
/**
 * A helper class for storing boolean values in WordPress options.
 *
 * @package automattic/jetpack-wp-js-data-sync
 */

namespace Automattic\Jetpack\WP_JS_Data_Sync;

final class Boolean_Entry extends Data_Sync_Entry_Handler {

	/**
	 * On get,
	 * Transform the value after it's retrieved from storage.
	 *
	 * @param mixed $value Value to transform.
	 *
	 * @return boolean
	 */
	public function transform( $value ) {
		return (bool) $value;
	}

	/**
	 * On set - Step 1:
	 * Parse the value before it's validated.
	 *
	 * This can be used for things like `json_decode` or casting types.
	 *
	 * @param mixed $value Value to parse.
	 * @see add_error - Use this method to provide feedback if the value can't be parsed.
	 *
	 * @return boolean
	 */
	public function parse( $value ) {
		return (bool) $value;
	}

	public function sanitize( $value ) {
		return (bool) $value;
	}

}
