<?php

/**
 * Basic methods implemented by Jetpack Sync extensions
 */

abstract class Jetpack_Sync_Module {
	abstract public function name();

	// override these to set up listeners and set/reset data/defaults
	public function init_listeners( $callable ) {}
	public function init_before_send() {}
	public function set_defaults() {}
	public function reset_data() {}

	protected function get_check_sum( $values ) {
		return crc32( json_encode( $values ) );
	}

	protected function still_valid_checksum( $sums_to_check, $name, $new_sum ) {
		if ( isset( $sums_to_check[ $name ] ) && $sums_to_check[ $name ] === $new_sum ) {
			return true;
		}
		return false;
	}
}
