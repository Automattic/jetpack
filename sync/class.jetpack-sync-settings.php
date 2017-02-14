<?php

require_once dirname( __FILE__ ) . '/class.jetpack-sync-defaults.php';

class Jetpack_Sync_Settings {
	const SETTINGS_OPTION_PREFIX = 'jetpack_sync_settings_';

	static $valid_settings = array(
		'dequeue_max_bytes'       => true,
		'upload_max_bytes'        => true,
		'upload_max_rows'         => true,
		'sync_wait_time'          => true,
		'sync_wait_threshold'     => true,
		'enqueue_wait_time'       => true,
		'max_queue_size'          => true,
		'max_queue_lag'           => true,
		'queue_max_writes_sec'    => true,
		'post_types_blacklist'    => true,
		'disable'                 => true,
		'render_filtered_content' => true,
		'post_meta_whitelist'     => true,
		'comment_meta_whitelist'  => true,
		'max_enqueue_full_sync'   => true,
		'max_queue_size_full_sync'=> true,
		'sync_via_cron'           => true,
		'cron_sync_time_limit'    => true,
	);

	static $is_importing;
	static $is_doing_cron;
	static $is_syncing;
	static $is_sending;

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
		$default_array_value = null;
		switch( $setting ) {
			case 'post_types_blacklist':
				$default_array_value = Jetpack_Sync_Defaults::$blacklisted_post_types;
				break;
			case 'post_meta_whitelist':
				$default_array_value = Jetpack_Sync_Defaults::$post_meta_whitelist;
				break;
			case 'comment_meta_whitelist':
				$default_array_value = Jetpack_Sync_Defaults::$comment_meta_whitelist;
				break;
		}

		if ( $default_array_value ) {
			if ( is_array( $value ) ) {
				$value = array_unique( array_merge( $value, $default_array_value ) );
			} else {
				$value = $default_array_value;
			}
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

	static function get_whitelisted_post_meta_sql() {
		return 'meta_key IN (\'' . join( '\', \'', array_map( 'esc_sql', self::get_setting( 'post_meta_whitelist' ) ) ) . '\')';
	}

	static function get_whitelisted_comment_meta_sql() {
		return 'meta_key IN (\'' . join( '\', \'', array_map( 'esc_sql', self::get_setting( 'comment_meta_whitelist' ) ) ) . '\')';
	}

	static function get_comments_filter_sql() {
		return "comment_approved <> 'spam'";
	}

	static function reset_data() {
		$valid_settings       = self::$valid_settings;
		self::$settings_cache = array();
		foreach ( $valid_settings as $option => $value ) {
			delete_option( self::SETTINGS_OPTION_PREFIX . $option );
		}
		self::set_importing( null );
		self::set_doing_cron( null );
		self::set_is_syncing( null );
		self::set_is_sending( null );
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

	static function is_syncing() {
		return (bool) self::$is_syncing || ( defined( 'REST_API_REQUEST' ) && REST_API_REQUEST );
	}

	static function set_is_syncing( $is_syncing ) {
		self::$is_syncing = $is_syncing;
	}

	static function is_sending() {
		return (bool) self::$is_sending;
	}

	static function set_is_sending( $is_sending ) {
		self::$is_sending = $is_sending;
	}
}
