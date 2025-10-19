<?php
/**
 * Jetpack Stats Ability for Jetpack AI POC.
 *
 * @package automattic/jetpack-ai-poc
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Jetpack_AI_POC_Ability_Stats
 *
 * Retrieves Jetpack Stats data.
 */
class Jetpack_AI_POC_Ability_Stats {

	/**
	 * Execute the stats ability.
	 *
	 * @param array $input Input parameters from the Abilities API.
	 * @return array|WP_Error Result or error.
	 */
	public static function execute( $input ) {
		$period = isset( $input['period'] ) ? $input['period'] : 'day';
		$days   = isset( $input['days'] ) ? intval( $input['days'] ) : 7;

		// Check if Stats module is active.
		if ( ! class_exists( 'Jetpack' ) || ! Jetpack::is_module_active( 'stats' ) ) {
			return new WP_Error(
				'stats_not_available',
				__( 'Jetpack Stats module is not active. Please enable it first.', 'jetpack-ai-poc' )
			);
		}

		try {
			// Get stats data.
			$stats = self::get_stats_data( $days );

			if ( is_wp_error( $stats ) ) {
				return $stats;
			}

			return array(
				'success' => true,
				'message' => self::format_stats_message( $stats, $days ),
				'data'    => $stats,
			);
		} catch ( Exception $e ) {
			return new WP_Error(
				'stats_error',
				sprintf(
					/* translators: %s: error message */
					__( 'Error retrieving stats: %s', 'jetpack-ai-poc' ),
					$e->getMessage()
				)
			);
		}
	}

	/**
	 * Get stats data from Jetpack.
	 *
	 * @param int $days Number of days to retrieve.
	 * @return array|WP_Error Stats data or error.
	 */
	private static function get_stats_data( $days ) {
		// Check if the WPCOM_Stats class is available.
		if ( ! class_exists( 'Automattic\Jetpack\Stats\WPCOM_Stats' ) ) {
			return new WP_Error(
				'stats_class_not_found',
				__( 'Stats functionality is not available.', 'jetpack-ai-poc' )
			);
		}

		// Initialize the WPCOM_Stats class.
		$wpcom_stats = new \Automattic\Jetpack\Stats\WPCOM_Stats();

		// Try to get stats summary.
		$stats_data = array();

		// Get stats summary (views, visitors, likes, comments).
		$summary = $wpcom_stats->get_stats_summary( array( 'days' => $days ) );
		if ( ! is_wp_error( $summary ) && ! empty( $summary ) ) {
			$stats_data['summary'] = $summary;
		}

		// Get top posts.
		$top_posts = $wpcom_stats->get_top_posts(
			array(
				'days' => $days,
				'max'  => 5,
			)
		);
		if ( ! is_wp_error( $top_posts ) && ! empty( $top_posts ) ) {
			$stats_data['top_posts'] = $top_posts;
		}

		// If we have no data, return a helpful message.
		if ( empty( $stats_data ) ) {
			// Return basic site information as fallback.
			$stats_data = array(
				'site_info' => array(
					'posts_count'    => wp_count_posts( 'post' )->publish,
					'pages_count'    => wp_count_posts( 'page' )->publish,
					'comments_count' => wp_count_comments()->approved,
				),
			);
		}

		return $stats_data;
	}

	/**
	 * Format stats data into a human-readable message.
	 *
	 * @param array $stats Stats data.
	 * @param int   $days Number of days.
	 * @return string Formatted message.
	 */
	private static function format_stats_message( $stats, $days ) {
		$message_parts = array();

		$message_parts[] = sprintf(
			/* translators: %d: number of days */
			__( 'Here are your Jetpack Stats for the last %d days:', 'jetpack-ai-poc' ),
			$days
		);

		// Format summary stats if available.
		if ( isset( $stats['summary'] ) ) {
			$summary = $stats['summary'];

			if ( isset( $summary->views ) ) {
				$message_parts[] = sprintf(
					/* translators: %s: number of views */
					__( 'Total Views: %s', 'jetpack-ai-poc' ),
					number_format_i18n( $summary->views )
				);
			}

			if ( isset( $summary->visitors ) ) {
				$message_parts[] = sprintf(
					/* translators: %s: number of visitors */
					__( 'Total Visitors: %s', 'jetpack-ai-poc' ),
					number_format_i18n( $summary->visitors )
				);
			}

			if ( isset( $summary->likes ) ) {
				$message_parts[] = sprintf(
					/* translators: %s: number of likes */
					__( 'Total Likes: %s', 'jetpack-ai-poc' ),
					number_format_i18n( $summary->likes )
				);
			}

			if ( isset( $summary->comments ) ) {
				$message_parts[] = sprintf(
					/* translators: %s: number of comments */
					__( 'Comments: %s', 'jetpack-ai-poc' ),
					number_format_i18n( $summary->comments )
				);
			}
		}

		// Format top posts if available.
		if ( isset( $stats['top_posts'] ) && ! empty( $stats['top_posts']->posts ) ) {
			$message_parts[] = '';
			$message_parts[] = __( 'Top Posts:', 'jetpack-ai-poc' );

			foreach ( $stats['top_posts']->posts as $index => $post ) {
				if ( $index >= 5 ) {
					break;
				}

				$message_parts[] = sprintf(
					/* translators: 1: post title, 2: number of views */
					__( '- %1$s (%2$s views)', 'jetpack-ai-poc' ),
					$post->post_title,
					number_format_i18n( $post->views )
				);
			}
		}

		// Format site info if that's all we have.
		if ( isset( $stats['site_info'] ) && count( $message_parts ) === 1 ) {
			$site_info = $stats['site_info'];

			$message_parts[] = __( 'Site Statistics:', 'jetpack-ai-poc' );
			$message_parts[] = sprintf(
				/* translators: %s: number of posts */
				__( 'Published Posts: %s', 'jetpack-ai-poc' ),
				number_format_i18n( $site_info['posts_count'] )
			);
			$message_parts[] = sprintf(
				/* translators: %s: number of pages */
				__( 'Published Pages: %s', 'jetpack-ai-poc' ),
				number_format_i18n( $site_info['pages_count'] )
			);
			$message_parts[] = sprintf(
				/* translators: %s: number of comments */
				__( 'Approved Comments: %s', 'jetpack-ai-poc' ),
				number_format_i18n( $site_info['comments_count'] )
			);
		}

		return implode( "\n", $message_parts );
	}
}
