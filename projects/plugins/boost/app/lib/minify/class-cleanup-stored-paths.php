<?php

namespace Automattic\Jetpack_Boost\Lib\Minify;

/**
 * Takes care of cleaning up options created during concatenation.
 *
 * @since 4.1.2
 */
class Cleanup_Stored_Paths {

	/**
	 * The maximum number of options to process in a single batch.
	 *
	 * @var int
	 */
	private $max_options_to_process = 50;

	/**
	 * The key of the option that stores the ID of the last processed option.
	 *
	 * @var string
	 */
	private $last_processed_option_key = 'jetpack_boost_cleanup_concat_paths_last_processed_option_id';

	/**
	 * Whether to schedule a followup cleanup.
	 *
	 * @var bool
	 */
	private $should_schedule_followup = false;

	/**
	 * Schedules the start of the cleanup.
	 */
	public static function setup_schedule() {
		if ( false === wp_next_scheduled( 'jetpack_boost_minify_cron_cleanup_concat_paths' ) ) {
			wp_schedule_event( time(), 'daily', 'jetpack_boost_minify_cron_cleanup_concat_paths' );
		}
	}

	/**
	 * Hooks the callbacks for the cleanup.
	 */
	public static function add_cleanup_actions() {
		add_action( 'jetpack_boost_minify_cron_cleanup_concat_paths', array( __CLASS__, 'run_cleanup' ) );
		add_action( 'jetpack_boost_minify_cron_cleanup_concat_paths_followup', array( __CLASS__, 'run_cleanup' ) );
	}

	/**
	 * Clears the cleanup schedules.
	 */
	public static function clear_schedules() {
		wp_unschedule_hook( 'jetpack_boost_minify_cron_cleanup_concat_paths' );
		wp_unschedule_hook( 'jetpack_boost_minify_cron_cleanup_concat_paths_followup' );
	}

	/**
	 * Runs the cleanup for the first batch,
	 * and if there are more entries to process,
	 * schedules the cleanup for the next batch.
	 */
	public static function run_cleanup() {
		$cleanup      = new Cleanup_Stored_Paths();
		$can_continue = $cleanup->cleanup_stored_paths_batch();
		if ( ! $can_continue ) {
			return;
		}

		if ( ! $cleanup->should_schedule_followup ) {
			return;
		}

		// 'batch' arg is necessary, to tell WP that this is a unique event
		// and allow it to be run within 10 minutes of the last.
		// See https://developer.wordpress.org/reference/functions/wp_schedule_single_event/#description
		if ( ! wp_next_scheduled( 'jetpack_boost_minify_cron_cleanup_concat_paths_followup', array( 'batch' ) ) ) {
			wp_schedule_single_event( time(), 'jetpack_boost_minify_cron_cleanup_concat_paths_followup', array( 'batch' ) );
		}
	}

	/**
	 * Cleans up expired stored paths.
	 *
	 * @return bool True if there are more entries to process, false if not.
	 */
	public function cleanup_stored_paths_batch() {
		$stored_paths = $this->get_stored_paths();
		if ( ! $stored_paths ) {
			// Cleanup after the cleanup.
			delete_option( $this->last_processed_option_key );
			return false;
		}

		// Used to tell the cleanup to skip the entries that were checked in the previous run.
		// Avoids processing the same entries over and over again.
		$last_processed_option_id = false;

		foreach ( $stored_paths as $option ) {
			$value = maybe_unserialize( $option['option_value'] );
			if ( ! is_array( $value ) ) {
				continue;
			}

			if ( $value['expire'] <= time() ) {
				$this->delete_static_file_by_hash( str_replace( 'jb_transient_concat_paths_', '', $option['option_name'] ) );
				delete_option( $option['option_name'] );
			}

			$last_processed_option_id = $option['option_id'];
		}

		update_option( $this->last_processed_option_key, $last_processed_option_id, false );

		return true;
	}

	/**
	 * Deletes the static files by hash.
	 *
	 * @param string $hash The hash of the file.
	 * @return void
	 */
	private function delete_static_file_by_hash( $hash ) {
		// Since we don't have a way to know if this file is JS or CSS,
		// we delete both.

		$js_file_path = jetpack_boost_get_minify_file_path( $hash . '.min.js' );
		if ( file_exists( $js_file_path ) ) {
			wp_delete_file( $js_file_path );
		}

		$css_file_path = jetpack_boost_get_minify_file_path( $hash . '.min.css' );
		if ( file_exists( $css_file_path ) ) {
			wp_delete_file( $css_file_path );
		}
	}

	/**
	 * Gets the stored paths to process, and skips the ones that were checked in the previous run.
	 * Also sets a flag that determines if there should be a followup cleanup or not.
	 *
	 * @return array The stored paths.
	 */
	private function get_stored_paths() {
		$last_processed_option_id = get_option( $this->last_processed_option_key );

		global $wpdb;
		$query = "SELECT * FROM {$wpdb->options} WHERE option_name LIKE 'jb_transient_concat_paths_%'";
		if ( $last_processed_option_id ) {
			$query .= $wpdb->prepare( ' AND option_id > %d', $last_processed_option_id );
		}

		// Add 1 to use it as a flag to know if there are more entries to process.
		$max_options_to_process_offset = $this->max_options_to_process + 1;
		$query                        .= $wpdb->prepare( ' ORDER BY option_id ASC LIMIT %d', $max_options_to_process_offset );

		$stored_paths = $wpdb->get_results( $query, ARRAY_A ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared

		// If the number of stored paths is equal to the offset of max options to process,
		// it means that there are more entries to process, so a followup cleanup is needed.
		if ( count( $stored_paths ) === $max_options_to_process_offset ) {
			$this->should_schedule_followup = true;

			// Since 1 was added to the limit, it needs to be removed from the list.
			array_pop( $stored_paths );
		}

		return $stored_paths;
	}
}
