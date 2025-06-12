<?php
/**
 * WPCOM Navigation Export Filter
 *
 * Filters wp_navigation posts from WXR exports when the post_author
 * is not a valid user on the current site.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Wpcom_Navigation_Export_Filter;

/**
 * Export Filter class to handle wp_navigation post filtering during WordPress exports.
 */
class Export_Filter {
	/**
	 * Tracks whether an export is currently in progress.
	 *
	 * @var bool
	 */
	private $is_exporting = false;

	/**
	 * Cached list of valid user IDs for the current blog.
	 *
	 * @var array|null
	 */
	private $valid_user_ids = null;

	/**
	 * Constructor to set up the export filter.
	 */
	public function __construct() {
		add_action( 'export_wp', array( $this, 'start_export_filtering' ), 5 );
	}

	/**
	 * Starts filtering export queries by hooking into the query filter.
	 *
	 * @return void
	 */
	public function start_export_filtering(): void {
		$this->is_exporting = true;
		$this->load_valid_user_ids();
		add_filter( 'query', array( $this, 'filter_export_queries' ) );
	}

	/**
	 * Stops filtering export queries by removing the query filter.
	 *
	 * @return void
	 */
	public function stop_export_filtering(): void {
		$this->is_exporting   = false;
		$this->valid_user_ids = null; // Clear cached user IDs
		remove_filter( 'query', array( $this, 'filter_export_queries' ) );
	}

	/**
	 * Loads and caches valid user IDs for the current blog.
	 *
	 * @return void
	 */
	private function load_valid_user_ids(): void {
		// Get all user IDs for the current blog
		$users = get_users(
			array(
				'fields' => 'ID', // Only return user IDs for efficiency
			)
		);

		$this->valid_user_ids = array_map( 'intval', $users );
	}

	/**
	 * Filters database queries during export to exclude wp_navigation posts
	 * with invalid authors.
	 *
	 * @param string $query The database query.
	 * @return string The modified query.
	 */
	public function filter_export_queries( string $query ): string {
		global $wpdb;

		if ( ! $this->is_exporting ) {
			return $query;
		}

		// Target the specific query pattern from export_wp() that selects post IDs
		$pattern = '/^SELECT ID FROM ' . preg_quote( $wpdb->posts, '/' ) . '.*WHERE/i';
		if ( ! preg_match( $pattern, $query ) ) {
			return $query;
		}

		// Handle the filtering condition based on whether we have valid users
		if ( empty( $this->valid_user_ids ) ) {
			// No valid users on the site - exclude all wp_navigation posts with post_author > 0 otherwise
			// all will be included. This is good for privacy but bad for export integrity.
			$additional_where = " AND NOT (
					{$wpdb->posts}.post_type = 'wp_navigation'
					AND {$wpdb->posts}.post_author > 0
				)";
		} else {
			// We have valid users - create a comma-separated list for the IN clause
			$valid_user_ids_string = implode( ',', $this->valid_user_ids );

			// Add our filter condition to exclude wp_navigation posts that have users that are
			// not valid on the current site.
			$additional_where = " AND NOT (
					{$wpdb->posts}.post_type = 'wp_navigation'
					AND {$wpdb->posts}.post_author > 0
					AND {$wpdb->posts}.post_author NOT IN ({$valid_user_ids_string})
				)";
		}

		return $query . $additional_where;
	}
}
