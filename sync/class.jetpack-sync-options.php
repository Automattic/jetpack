<?php

/**
 * Simple class to read/write to the options table, bypassing 
 * problematic caching with get_option/set_option
 **/

class Jetpack_Sync_Options {

	static function delete_option( $name ) {
		global $wpdb;
		$wpdb->query( $wpdb->prepare( "DELETE FROM $wpdb->options WHERE option_name = %s", $name ) );
	}

	static function update_option( $name, $value, $autoload = false ) {

		$autoload_value = $autoload ? 'yes' : 'no';

		// we write our own option updating code to bypass filters/caching/etc on set_option/get_option
		global $wpdb;
		$serialized_value = maybe_serialize( $value );
		// try updating, if no update then insert
		// TODO: try to deal with the fact that unchanged values can return updated_num = 0
		// below we used "insert ignore" to at least suppress the resulting error
		$updated_num = $wpdb->query(
			$wpdb->prepare(
				"UPDATE $wpdb->options SET option_value = %s WHERE option_name = %s", 
				$serialized_value,
				$name
			)
		);

		if ( ! $updated_num ) {
			$updated_num = $wpdb->query(
				$wpdb->prepare(
					"INSERT IGNORE INTO $wpdb->options ( option_name, option_value, autoload ) VALUES ( %s, %s, '$autoload_value' )", 
					$name,
					$serialized_value
				)
			);
		}
		return $updated_num;
	}

	static function get_option( $name, $default = null ) {
		global $wpdb;
		$value = $wpdb->get_var( 
			$wpdb->prepare(
				"SELECT option_value FROM $wpdb->options WHERE option_name = %s LIMIT 1", 
				$name
			)
		);
		$value = maybe_unserialize( $value );

		if ( $value === null && $default !== null ) {
			return $default;
		}

		return $value;
	}
	
}