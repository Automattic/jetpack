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
			$stats = self::get_stats_data( $period, $days );

			if ( is_wp_error( $stats ) ) {
				return $stats;
			}

			return array(
				'success' => true,
				'message' => self::format_stats_message( $stats, $period, $days ),
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
	 * @param string $period Period type (day, week, month).
	 * @param int    $days Number of days to retrieve.
	 * @return array|WP_Error Stats data or error.
	 */
	private static function get_stats_data( $period, $days ) {
		// Check if the Stats_Data class is available.
		if ( ! class_exists( 'Automattic\Jetpack\Stats\Main' ) && ! class_exists( 'Jetpack_Stats_Data' ) ) {
			return new WP_Error(
				'stats_class_not_found',
				__( 'Stats functionality is not available.', 'jetpack-ai-poc' )
			);
		}

		// Try to get stats summary.
		$stats_data = array();

		// Get general stats summary.
		if ( function_exists( 'stats_get_csv' ) ) {
			$summary = stats_get_csv( 'stats', array( 'days' => $days ) );
			if ( ! empty( $summary ) ) {
				$stats_data['summary'] = $summary;
			}
		}

		// Get site stats.
		if ( class_exists( 'Jetpack_Stats_Dashboard_Widget' ) ) {
			$widget_stats = Jetpack_Stats_Dashboard_Widget::get_stats( array( 'days' => $days ) );
			if ( ! is_wp_error( $widget_stats ) && ! empty( $widget_stats ) ) {
				$stats_data['widget'] = $widget_stats;
			}
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
	 * @param array  $stats Stats data.
	 * @param string $period Period type.
	 * @param int    $days Number of days.
	 * @return string Formatted message.
	 */
	private static function format_stats_message( $stats, $period, $days ) {
		$message_parts = array();

		$message_parts[] = sprintf(
			/* translators: %d: number of days */
			__( 'Here are your Jetpack Stats for the last %d days:', 'jetpack-ai-poc' ),
			$days
		);

		// Format widget stats if available.
		if ( isset( $stats['widget'] ) ) {
			$widget = $stats['widget'];

			if ( isset( $widget['general']->views ) ) {
				$message_parts[] = sprintf(
					/* translators: %s: number of views */
					__( 'Total Views: %s', 'jetpack-ai-poc' ),
					number_format_i18n( $widget['general']->views )
				);
			}

			if ( isset( $widget['general']->visitors ) ) {
				$message_parts[] = sprintf(
					/* translators: %s: number of visitors */
					__( 'Total Visitors: %s', 'jetpack-ai-poc' ),
					number_format_i18n( $widget['general']->visitors )
				);
			}

			if ( isset( $widget['general']->comments ) ) {
				$message_parts[] = sprintf(
					/* translators: %s: number of comments */
					__( 'Comments: %s', 'jetpack-ai-poc' ),
					number_format_i18n( $widget['general']->comments )
				);
			}
		}

		// Format site info if that's all we have.
		if ( isset( $stats['site_info'] ) && empty( $message_parts ) ) {
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
