<?php // phpcs:ignore

namespace Automattic\Jetpack\AbilitiesRegistry\Helpers;

/**
 * Helper class for retrieving site metrics and health data
 */
class SiteMetricsHelper {

	/**
	 * Get comprehensive metrics for a site
	 *
	 * @param int $blog_id The blog ID.
	 * @return array Site metrics.
	 */
	public static function get_site_metrics( int $blog_id ): array {
		switch_to_blog( $blog_id );

		// Get content counts
		$post_count       = wp_count_posts( 'post' );
		$page_count       = wp_count_posts( 'page' );
		$comment_count    = wp_count_comments();
		$attachment_count = wp_count_attachments();

		// Calculate totals
		$total_posts    = ( $post_count->publish ?? 0 ) + ( $post_count->private ?? 0 );
		$total_pages    = ( $page_count->publish ?? 0 ) + ( $page_count->private ?? 0 );
		$total_comments = $comment_count->approved ?? 0;
		$total_media    = 0;
		foreach ( $attachment_count as $type => $count ) {
			if ( 'trash' !== $type ) {
				$total_media += $count;
			}
		}

		// Get storage information
		$storage_used_bytes  = 0;
		$storage_limit_bytes = 0;
		if ( function_exists( 'get_space_used_bytes' ) ) {
			$storage_used_bytes = get_space_used_bytes( $blog_id );
		}
		if ( function_exists( 'get_space_allowed' ) ) {
			$storage_limit_mb    = get_space_allowed();
			$storage_limit_bytes = $storage_limit_mb * 1024 * 1024;
		}

		// Get theme and plugin info
		$current_theme  = wp_get_theme();
		$active_plugins = get_option( 'active_plugins', array() );

		restore_current_blog();

		return array(
			'content' => array(
				'total_posts'    => (int) $total_posts,
				'total_pages'    => (int) $total_pages,
				'total_comments' => (int) $total_comments,
				'total_media'    => (int) $total_media,
				'draft_posts'    => (int) ( $post_count->draft ?? 0 ),
				'pending_posts'  => (int) ( $post_count->pending ?? 0 ),
			),
			'storage' => array(
				'used_bytes'    => (int) $storage_used_bytes,
				'used_mb'       => round( $storage_used_bytes / ( 1024 * 1024 ), 2 ),
				'limit_bytes'   => (int) $storage_limit_bytes,
				'limit_mb'      => round( $storage_limit_bytes / ( 1024 * 1024 ), 2 ),
				'usage_percent' => $storage_limit_bytes > 0 ? round( ( $storage_used_bytes / $storage_limit_bytes ) * 100, 2 ) : 0,
			),
			'theme'   => array(
				'name'     => $current_theme->get( 'Name' ),
				'version'  => $current_theme->get( 'Version' ),
				'template' => $current_theme->get_template(),
			),
			'plugins' => array(
				'active_count' => count( $active_plugins ),
			),
		);
	}

	/**
	 * Get site health status
	 *
	 * @param int $blog_id The blog ID.
	 * @return array Site health information.
	 */
	public static function get_site_health( int $blog_id ): array {
		$blog_details  = get_blog_details( $blog_id );
		$health_status = 'healthy';
		$issues        = array();

		// Check if site is active
		if ( ! $blog_details ) {
			return array(
				'status' => 'error',
				'issues' => array( 'Site not found' ),
			);
		}

		// Check site status
		if ( '1' === $blog_details->spam ) {
			$health_status = 'critical';
			$issues[]      = 'Site marked as spam';
		} elseif ( '1' === $blog_details->archived ) {
			$health_status = 'critical';
			$issues[]      = 'Site is archived';
		} elseif ( '1' === $blog_details->deleted ) {
			$health_status = 'critical';
			$issues[]      = 'Site is deleted';
		}

		// Check storage usage
		$metrics = self::get_site_metrics( $blog_id );
		if ( $metrics['storage']['usage_percent'] > 90 ) {
			$health_status = 'warning';
			$issues[]      = 'Storage usage over 90%';
		} elseif ( $metrics['storage']['usage_percent'] > 80 ) {
			if ( 'critical' !== $health_status ) {
				$health_status = 'warning';
			}
			$issues[] = 'Storage usage over 80%';
		}

		// Check for recent activity
		switch_to_blog( $blog_id );
		$recent_posts = get_posts(
			array(
				'numberposts' => 1,
				'post_status' => 'publish',
				'orderby'     => 'date',
				'order'       => 'DESC',
			)
		);
		restore_current_blog();

		$last_post_date = null;
		if ( ! empty( $recent_posts ) ) {
			$last_post_date       = $recent_posts[0]->post_date;
			$days_since_last_post = ( time() - strtotime( $last_post_date ) ) / DAY_IN_SECONDS;

			if ( $days_since_last_post > 365 ) {
				if ( 'healthy' === $health_status ) {
					$health_status = 'warning';
				}
				$issues[] = 'No posts published in over a year';
			}
		}

		return array(
			'status'         => $health_status,
			'issues'         => $issues,
			'last_post_date' => $last_post_date,
			'last_checked'   => gmdate( 'c' ),
		);
	}

	/**
	 * Get visitor statistics if available
	 *
	 * @param int $blog_id The blog ID.
	 * @param int $days    Number of days to retrieve stats for.
	 * @return array Visitor statistics.
	 */
	public static function get_visitor_stats( int $blog_id, int $days = 30 ): array {
		$stats = array(
			'views'           => 0,
			'visitors'        => 0,
			'period_days'     => $days,
			'stats_available' => false,
		);

		// Try to get stats using WordPress.com stats functions
		if ( function_exists( 'stats_get_new_history' ) ) {
			$views = stats_get_new_history( false, $blog_id, 'views', false, gmdate( 'Y-m-d' ), $days, '', 0, false, false, true );
			if ( $views && ! is_wp_error( $views ) ) {
				$stats['views']           = (int) $views;
				$stats['stats_available'] = true;
			}
		}

		return $stats;
	}
}
