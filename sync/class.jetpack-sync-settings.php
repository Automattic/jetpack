<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-defaults.php';

class Jetpack_Sync_Settings {
	const SETTINGS_OPTION_PREFIX = 'jetpack_sync_settings_';

	static $valid_settings = array(
		'dequeue_max_bytes'    => true,
		'upload_max_bytes'     => true,
		'upload_max_rows'      => true,
		'sync_wait_time'       => true,
		'sync_wait_threshold'  => true,
		'max_queue_size'       => true,
		'max_queue_lag'        => true,
		'queue_max_writes_sec' => true,
		'use_mysql_named_lock' => true, // 0 or 1
	);

	static $is_importing;

	static function get_settings() {
		$settings = array();
		foreach ( array_keys( self::$valid_settings ) as $setting ) {
			$settings[ $setting ] = self::get_setting( $setting );
		}

		return $settings;
	}

	// Fetches the setting. It saves it if the setting doesn't exist, so that it gets
	// autoloaded on page load rather than re-queried every time.
	static function get_setting( $setting ) {
		if ( ! isset( self::$valid_settings[ $setting ] ) ) {
			return false;
		}

		$value = get_option( self::SETTINGS_OPTION_PREFIX . $setting );

		if ( false === $value ) {
			$default_name = "default_$setting"; // e.g. default_dequeue_max_bytes
			$value        = Jetpack_Sync_Defaults::$$default_name;
			update_option( self::SETTINGS_OPTION_PREFIX . $setting, $value, true );
		}

		return (int) $value;
	}

	static function update_settings( $new_settings ) {
		$validated_settings = array_intersect_key( $new_settings, self::$valid_settings );
		foreach ( $validated_settings as $setting => $value ) {
			update_option( self::SETTINGS_OPTION_PREFIX . $setting, $value, true );
		}
	}

	static function reset_data() {
		$valid_settings  = self::$valid_settings;
		$settings_prefix = self::SETTINGS_OPTION_PREFIX;
		foreach ( $valid_settings as $option => $value ) {
			delete_option( $settings_prefix . $option );
		}
		self::set_importing( null );
	}

	static function set_importing( $is_importing ) {
		// set to NULL to revert to WP_IMPORTING, the standard behaviour
		self::$is_importing = $is_importing;
	}

	static function is_importing() {
		if ( ! is_null( self::$is_importing ) ) {
			return self::$is_importing;
		}

		return defined( 'WP_IMPORTING' ) && WP_IMPORTING;
	}
}
