<?php

class Jetpack_Sync_Utils {

	static function sync( $check_sum_id, $values ) {
		$current_check_sum = self::get_check_sum( $values );
		if ( Jetpack_Options::get_option( $check_sum_id ) !== $current_check_sum ) {
			Jetpack_Options::update_option( $check_sum_id, $current_check_sum );
			return $values;
		}
		return null;
	}

	static function sync_all( $check_sum_id, $check_sum, $values ) {
		Jetpack_Options::update_option( $check_sum_id, $check_sum );
		return $values;
	}

	static function get_check_sum( $values ) {
		return crc32( self::get_query_string( $values ) );
	}

	static function get_query_string( $values ) {
		return build_query( $values );
	}

}





