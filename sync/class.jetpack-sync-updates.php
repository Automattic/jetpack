<?php

class Jetpack_Sync_Updates {

	static $check_sum_id = 'function_check_sum';

	static function init() {
		/** Trigger a wp_version sync when updating WP versions
		 **/
		add_action( 'upgrader_process_complete', array( __CLASS__, 'update_get_wp_version' ), 10, 2 );

		add_action( 'init', array( __CLASS__, 'sync_update_data') );

	}

	static function get_to_sync() {
		$updates = array();
		if ( current_user_can( 'update_core' ) && current_user_can( 'update_plugins' ) && current_user_can( 'update_themes' ) ) {
			$updates['updates'] = self::get_updates();
			$updates['update_details'] = self::get_update_details();
			$data['wp_version'] = self::get_wp_version();
		}
		return $updates;
	}

	/**
	 * Triggers a sync of update counts and update details
	 */
	static function sync_update_data() {
		// Anytime WordPress saves update data, we'll want to sync update data
		add_action( 'set_site_transient_update_plugins', array( __CLASS__, 'refresh_update_data' ) );
		add_action( 'set_site_transient_update_themes', array( __CLASS__, 'refresh_update_data' ) );
		add_action( 'set_site_transient_update_core', array( __CLASS__, 'refresh_update_data' ) );
		// Anytime a connection to jetpack is made, sync the update data
		add_action( 'jetpack_site_registered', array( __CLASS__, 'refresh_update_data' ) );
		// Anytime the Jetpack Version changes, sync the the update data
		add_action( 'updating_jetpack_version', array( __CLASS__, 'refresh_update_data' ) );
	}

	static function refresh_update_data() {
		if ( current_user_can( 'update_core' ) && current_user_can( 'update_plugins' ) && current_user_can( 'update_themes' ) ) {
			/**
			 * Fires whenever the amount of updates needed for a site changes.
			 * Syncs an array that includes the number of theme, plugin, and core updates available, as well as the latest core version available.
			 *
			 * @since 3.7.0
			 *
			 * @param string jetpack_updates
			 * @param array Update counts calculated by Jetpack::get_updates
			 */
			do_action( 'add_option_jetpack_updates', 'jetpack_updates', Jetpack::get_updates() );
		}
		/**
		 * Fires whenever the amount of updates needed for a site changes.
		 * Syncs an array of core, theme, and plugin data, and which of each is out of date
		 *
		 * @since 3.7.0
		 *
		 * @param string jetpack_update_details
		 * @param array Update details calculated by Jetpack::get_update_details
		 */
		do_action( 'add_option_jetpack_update_details', 'jetpack_update_details', Jetpack::get_update_details() );
	}

	/**
	 * jetpack_updates is saved in the following schema:
	 *
	 * array (
	 *      'plugins'                       => (int) Number of plugin updates available.
	 *      'themes'                        => (int) Number of theme updates available.
	 *      'wordpress'                     => (int) Number of WordPress core updates available.
	 *      'translations'                  => (int) Number of translation updates available.
	 *      'total'                         => (int) Total of all available updates.
	 *      'wp_update_version'             => (string) The latest available version of WordPress, only present if a WordPress update is needed.
	 * )
	 * @return array
	 */
	static function get_updates() {
		$update_data = wp_get_update_data();

		// Stores the individual update counts as well as the total count.
		if ( isset( $update_data['counts'] ) ) {
			$updates = $update_data['counts'];
		}

		// If we need to update WordPress core, let's find the latest version number.
		if ( ! empty( $updates['wordpress'] ) ) {
			$cur = get_preferred_from_update_core();
			if ( isset( $cur->response ) && 'upgrade' === $cur->response ) {
				$updates['wp_update_version'] = $cur->current;
			}
		}
		return isset( $updates ) ? $updates : array();
	}

	static function get_update_details() {
		$update_details = array(
			'update_core' => get_site_transient( 'update_core' ),
			'update_plugins' => get_site_transient( 'update_plugins' ),
			'update_themes' => get_site_transient( 'update_themes' ),
		);
		return $update_details;
	}

	function jetpack_post_sync_post_type( $post_types ) {
		foreach ( $this->sync_conditions['posts'] as $module => $conditions ) {
			if ( is_array( $conditions['post_types'] ) ) {
				$post_types = array_merge( $post_types, $conditions['post_types'] );
			}
		}

		return array_unique( $post_types );
	}

	function jetpack_post_sync_post_status( $post_statuses ) {
		foreach ( $this->sync_conditions['posts'] as $module => $conditions ) {
			if ( is_array( $conditions['post_stati'] ) ) {
				$post_statuses = array_merge( $post_statuses, $conditions['post_stati'] );
			}
		}

		return array_unique( $post_statuses );
	}

	/**
	 * Keeps wp_version in sync with .com when WordPress core updates
	 **/
	public static function update_get_wp_version( $update, $meta_data ) {
		if ( 'update' === $meta_data['action'] && 'core' === $meta_data['type'] ) {
			/** This action is documented in wp-includes/option.php */
			/**
			 * This triggers the sync for the jetpack version
			 * See Jetpack_Sync options method for more info.
			 */
			do_action( 'add_option_jetpack_wp_version', 'jetpack_wp_version', (string) Jetpack::get_wp_version() );
		}
	}

	/*
* Sync back wp_version
*/
	public static function get_wp_version() {
		global $wp_version;
		return $wp_version;
	}
}