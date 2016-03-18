<?php

class Jetpack_Sync_Updates {

	static $check_sum_id = 'function_check_sum';

	static $sync = array();

	static function init() {
		/** Trigger a wp_version sync when updating WP versions
		 **/
		add_action( 'upgrader_process_complete', array( __CLASS__, 'update_get_wp_version' ), 10, 2 );

		// Anytime WordPress saves update data, we'll want to sync update data
		add_action( 'set_site_transient_update_plugins', array( __CLASS__, 'refresh_update_data' ), 10, 3 );
		add_action( 'set_site_transient_update_themes', array( __CLASS__, 'refresh_update_data' ), 10, 3 );
		add_action( 'set_site_transient_update_core', array( __CLASS__, 'refresh_core_update_data' ), 10, 3 );

		// Anytime a connection to jetpack is made, sync the update data
		// add_action( 'jetpack_site_registered', array( __CLASS__, 'refresh_update_data' ) );
		// Anytime the Jetpack Version changes, sync the the update data
		// add_action( 'updating_jetpack_version', array( __CLASS__, 'refresh_update_data' ) );
	}

	/**
	 * Triggers a sync of update counts and update details
	 */
	static function refresh_core_update_data( $value ) {
		if ( empty( $value->updates ) && empty( $value->translations ) ) {
			return;
		}

		self::$sync['updates']        = self::get_count( 'update_core' );
		self::$sync['update_details'] = self::get_update_details( 'update_core' );
	}

	static function refresh_update_data( $value, $expiration, $key ) {
		if ( ! in_array( $key, array( 'update_themes', 'update_plugins' ) ) ) {
			return;
		}

		if ( empty( $value->response ) && empty( $value->translations ) ) {
			return;
		}

		self::$sync['updates']        = self::get_count( $key );
		self::$sync['update_details'] = self::get_update_details( $key );

	}

	static function get_to_sync() {
		$data                   = array();
		$data['updates']        = self::get_count();
		$data['update_details'] = self::get_update_details();

		return self::$sync;
	}

	static function get_all() {
		$data                   = array();
		$data['updates']        = self::get_count();
		$data['update_details'] = self::get_update_details();
		$data['wp_version']     = self::get_wp_version();

		return $data;
	}

	static function get_count( $key = null ) {
		$counts         = array( 'plugins' => 0, 'themes' => 0, 'wordpress' => 0, 'translations' => 0 );
		$update_details = self::get_update_details( $key );
		$translations   = array();

		foreach ( $update_details as $key => $update_detail ) {
			if ( ! $update_detail ) {
				continue;
			}
			if ( 'wordpress' === $key ) {
				if ( ! empty( $update_detail->updates ) ) {
					// Don't set the update to be true if the update is a core autoupdate.
					if ( ! in_array( $update_detail->updates[0]->response, array(
						'development',
						'latest'
					) )
					) {
						$counts['wordpress']         = 1;
						$counts['wp_update_version'] = $update_detail->updates[0]->current;
					}
				}

			} else {
				// Themes and Plugins
				if ( ! empty( $update_detail->response ) ) {
					$counts[ $key ] = count( $update_detail->response );
				}
			}

			if ( isset( $update_detail->translations ) ) {
				foreach ( $update_detail->translations as $translation ) {
					$translations[] = (object) $translation;
				}
			}

		}

		$counts['translations'] = count( $translations );
		// calculate total
		$counts['total'] = $counts['plugins'] + $counts['themes'] + $counts['wordpress'] + $counts['translations'];

		return $counts;

	}

	static function map_key( $key ) {
		$map = array(
			'update_core'    => 'wordpress',
			'update_plugins' => 'plugins',
			'update_themes'  => 'themes',
		);

		return $map[ $key ];
	}

	static function get_update_details( $key = null ) {
		if ( in_array( $key, array( 'update_core', 'update_plugins', 'update_themes' ) ) ) {
			return array( self::map_key( $key ) => get_site_transient( $key ) );
		}
		$update_details = array(
			'wordpress' => get_site_transient( 'update_core' ),
			'plugins'   => get_site_transient( 'update_plugins' ),
			'themes'    => get_site_transient( 'update_themes' ),
		);

		return $update_details;
	}


	/**
	 * Keeps wp_version in sync with .com when WordPress core updates
	 **/
	static function update_get_wp_version(
		$update, $meta_data
	) {
		if ( 'update' === $meta_data['action'] && 'core' === $meta_data['type'] ) {
			self::$sync['wp_version'] = self::get_wp_version();
		}
	}

	/*
	* Sync back wp_version
	*/
	static function get_wp_version() {
		global $wp_version;

		return $wp_version;
	}
}
