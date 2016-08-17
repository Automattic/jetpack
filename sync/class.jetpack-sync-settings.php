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
		'post_types_blacklist' => true,
		'meta_blacklist'       => true,
		'disable'              => true,
	);

	static $is_importing;
	static $is_doing_cron;

	static $settings_cache = array(); // some settings can be expensive to compute - let's cache them

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

		if ( isset( self::$settings_cache[ $setting ] ) ) {
			return self::$settings_cache[ $setting ];
		}

		$value = get_option( self::SETTINGS_OPTION_PREFIX . $setting );

		if ( false === $value ) {
			$default_name = "default_$setting"; // e.g. default_dequeue_max_bytes
			$value        = Jetpack_Sync_Defaults::$$default_name;
			update_option( self::SETTINGS_OPTION_PREFIX . $setting, $value, true );
		}

		if ( is_numeric( $value ) ) {
			$value = intval( $value );
		}

		// specifically for the post_types blacklist, we want to include the hardcoded settings
		if ( $setting === 'post_types_blacklist' ) {
			$value = array_unique( array_merge( $value, Jetpack_Sync_Defaults::$blacklisted_post_types ) );
		}

		// ditto for meta blacklist
		if ( $setting === 'meta_blacklist' ) {
			$value = array_unique( array_merge( $value, Jetpack_Sync_Defaults::$default_blacklist_meta_keys ) );
		}

		self::$settings_cache[ $setting ] = $value;

		return $value;
	}

	static function update_settings( $new_settings ) {
		$validated_settings = array_intersect_key( $new_settings, self::$valid_settings );
		foreach ( $validated_settings as $setting => $value ) {
			update_option( self::SETTINGS_OPTION_PREFIX . $setting, $value, true );
			unset( self::$settings_cache[ $setting ] );

			// if we set the disabled option to true, clear the queues
			if ( 'disable' === $setting && !! $value ) {
				require_once dirname( __FILE__ ) . '/class.jetpack-sync-listener.php';
				$listener = Jetpack_Sync_Listener::get_instance();
				$listener->get_sync_queue()->reset();
				$listener->get_full_sync_queue()->reset();
			}
		}
	}

	// returns escapted SQL that can be injected into a WHERE clause
	static function get_blacklisted_post_types_sql() {
		return 'post_type NOT IN (\'' . join( '\', \'', array_map( 'esc_sql', self::get_setting( 'post_types_blacklist' ) ) ) . '\')';
	}

	static function reset_data() {
		$valid_settings       = self::$valid_settings;
		self::$settings_cache = array();
		foreach ( $valid_settings as $option => $value ) {
			delete_option( self::SETTINGS_OPTION_PREFIX . $option );
		}
		self::set_importing( null );
		self::set_doing_cron( null );
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

	static function set_doing_cron( $is_doing_cron ) {
		// set to NULL to revert to WP_IMPORTING, the standard behaviour
		self::$is_doing_cron = $is_doing_cron;
	}

	static function is_doing_cron() {
		if ( ! is_null( self::$is_doing_cron ) ) {
			return self::$is_doing_cron;
		}

		return defined( 'DOING_CRON' ) && DOING_CRON;
	}
}
