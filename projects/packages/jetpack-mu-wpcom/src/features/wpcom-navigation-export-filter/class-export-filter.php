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
		add_filter( 'query', array( $this, 'filter_export_queries' ) );
	}

	/**
	 * Stops filtering export queries by removing the query filter.
	 *
	 * @return void
	 */
	public function stop_export_filtering(): void {
		$this->is_exporting = false;
		remove_filter( 'query', array( $this, 'filter_export_queries' ) );
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

		// Get current users for this site
		$users = get_users( array( 'fields' => 'ID' ) );

		// Handle the filtering condition based on whether we have current users
		if ( empty( $users ) ) {
			// No current users on the site - exclude all wp_navigation posts with post_author > 0
			$additional_where = " AND NOT (
					{$wpdb->posts}.post_type = 'wp_navigation'
					AND {$wpdb->posts}.post_author > 0
				)";
		} else {
			// We have current users - create a comma-separated list for the IN clause
			$current_users = implode( ',', array_map( 'intval', $users ) );

			// Add our filter condition to exclude wp_navigation posts that have users that are
			// not valid on the current site.
			$additional_where = " AND NOT (
					{$wpdb->posts}.post_type = 'wp_navigation'
					AND {$wpdb->posts}.post_author > 0
					AND {$wpdb->posts}.post_author NOT IN ({$current_users})
				)";
		}

		return $query . $additional_where;
	}
}
