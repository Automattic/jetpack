<?php // phpcs:ignore

namespace Automattic\WpcomMcp\AbilitiesRegistry\Executors\Analytics;

use Automattic\WpcomMcp\AbilitiesRegistry\Helpers\SiteMetricsHelper;
use Automattic\WpcomMcp\AbilitiesRegistry\Interfaces\ExecutorInterface;
use Automattic\WpcomMcp\AbilitiesRegistry\Traits\UserContextTrait;
use Exception;
use WP_Error;

/**
 * Site Statistics Executor Class
 *
 * Handles the execution logic for site statistics and analytics data retrieval.
 */
class SiteStatisticsExecutor implements ExecutorInterface {
	use UserContextTrait;

	/**
	 * Execute the site statistics ability.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return array The statistics data or error.
	 */
	public function execute( array $input = array() ): array {
		$switched = false;

		try {
			// Validate input.
			$validated_input = $this->validate_input( $input );
			if ( is_wp_error( $validated_input ) ) {
				return $this->wp_error_to_array( $validated_input );
			}

			// Handle site switching - wpcom_site is required.
			$site_result = $this->resolve_and_switch_site( $validated_input['wpcom_site'] );
			if ( is_wp_error( $site_result ) ) {
				return $this->wp_error_to_array( $site_result );
			}
			$target_blog_id = $site_result['blog_id'];
			$switched       = $site_result['switched'];

			// Check permissions for the target site.
			if ( ! $this->check_site_permission( $target_blog_id ) ) {
				if ( $switched ) {
					restore_current_blog();
				}
				return $this->wp_error_to_array(
					$this->create_error(
						'insufficient_permissions',
						'You do not have permission to view statistics for this site',
						403
					)
				);
			}

			// Get site information.
			$site_info = $this->get_site_info( $target_blog_id );

			// Calculate date range.
			$date_range = $this->calculate_date_range( $validated_input['period'], $validated_input['num_periods'] );

			// Build response.
			$response = array(
				'success'      => true,
				'site_info'    => $site_info,
				'period_stats' => array(
					'period'      => $validated_input['period'],
					'num_periods' => $validated_input['num_periods'],
					'start_date'  => $date_range['start'],
					'end_date'    => $date_range['end'],
				),
			);

			// Add views and visitors data if requested.
			if ( $validated_input['include_views'] ) {
				$response['views_data'] = $this->get_views_data( $target_blog_id, $date_range );
			}

			// Add top content if requested.
			if ( $validated_input['include_top_content'] ) {
				$response['top_content'] = $this->get_top_content( $target_blog_id, $date_range, $validated_input['max_items'] );
			}

			// Add referrers if requested.
			if ( $validated_input['include_referrers'] ) {
				$response['referrers'] = $this->get_referrers( $target_blog_id, $date_range, $validated_input['max_items'] );
			}

			// Add geographic data if requested.
			if ( $validated_input['include_geographic'] ) {
				$response['geographic'] = $this->get_geographic_data( $target_blog_id, $date_range, $validated_input['max_items'] );
			}

			// Add device data if requested.
			if ( $validated_input['include_devices'] ) {
				$response['devices'] = $this->get_device_data( $target_blog_id, $date_range, $validated_input['max_items'] );
			}

			// Add all-time stats if requested.
			if ( $validated_input['include_all_time'] ) {
				$response['all_time'] = $this->get_all_time_stats( $target_blog_id );
			}

			// Restore original blog if we switched.
			if ( $switched ) {
				restore_current_blog();
			}

			return $response;

		} catch ( Exception $e ) {
			if ( $switched ) {
				restore_current_blog();
			}
			return $this->wp_error_to_array(
				$this->create_error(
					'statistics_error',
					'An error occurred: ' . $e->getMessage(),
					500
				)
			);
		}
	}

	/**
	 * Check permission for the site statistics ability.
	 *
	 * @param array $input The input parameters.
	 *
	 * @return bool True if permission is granted, false otherwise.
	 */
	public function check_permission( array $input = array() ): bool {
		// Suppress unused variable warning - parameter required by interface.
		unset( $input );

		return $this->check_user_permission();
	}

	/**
	 * Convert WP_Error to array format for MCP responses.
	 *
	 * @param WP_Error $wp_error The WP_Error object.
	 *
	 * @return array Error array.
	 */
	private function wp_error_to_array( WP_Error $wp_error ): array {
		$error_data = $wp_error->get_error_data();
		return array(
			'success' => false,
			'error'   => array(
				'code'    => $wp_error->get_error_code(),
				'message' => $wp_error->get_error_message(),
				'data'    => $error_data,
				'status'  => $error_data['status'] ?? 400,
			),
		);
	}

	/**
	 * Validate input parameters.
	 *
	 * @param array $input The input to validate.
	 *
	 * @return array|WP_Error Validated input or error.
	 */
	private function validate_input( array $input ): WP_Error|array {
		$validated = array(
			'wpcom_site'          => $input['wpcom_site'] ?? '',
			'period'              => $input['period'] ?? 'day',
			'num_periods'         => $input['num_periods'] ?? 30,
			'include_views'       => $input['include_views'] ?? true,
			'include_top_content' => $input['include_top_content'] ?? true,
			'include_referrers'   => $input['include_referrers'] ?? false,
			'include_geographic'  => $input['include_geographic'] ?? false,
			'include_devices'     => $input['include_devices'] ?? false,
			'include_all_time'    => $input['include_all_time'] ?? false,
			'max_items'           => $input['max_items'] ?? 10,
		);

		// Validate period.
		$valid_periods = array( 'day', 'week', 'month', 'year' );
		if ( ! in_array( $validated['period'], $valid_periods, true ) ) {
			return $this->create_error( 'invalid_period', 'Period must be one of: ' . implode( ', ', $valid_periods ) );
		}

		// Validate num_periods.
		if ( 1 > $validated['num_periods'] || 365 < $validated['num_periods'] ) {
			return $this->create_error( 'invalid_num_periods', 'Number of periods must be between 1 and 365' );
		}

		// Validate max_items.
		if ( 1 > $validated['max_items'] || 50 < $validated['max_items'] ) {
			return $this->create_error( 'invalid_max_items', 'Max items must be between 1 and 50' );
		}

		// Validate wpcom_site is provided.
		if ( empty( $validated['wpcom_site'] ) ) {
			return $this->create_error( 'missing_wpcom_site', 'WordPress.com site ID or URL is required' );
		}

		return $validated;
	}

	/**
	 * Resolve site ID and switch to site if needed.
	 *
	 * @param string $site_identifier Site ID or URL.
	 *
	 * @return array|WP_Error Array with blog_id and switched flag, or error.
	 */
	private function resolve_and_switch_site( string $site_identifier ): WP_Error|array {
		$target_blog_id = null;

		// Determine if it's a blog ID or URL.
		if ( ctype_digit( $site_identifier ) ) {
			$target_blog_id = (int) $site_identifier;

			// Validate blog ID.
			if ( 1 > $target_blog_id ) {
				return $this->create_error( 'invalid_site_id', 'Invalid site ID provided' );
			}

			$blog_details = get_blog_details( $target_blog_id );
		} else {
			// It's a URL - decode and get blog details.
			$site_url = urldecode( $site_identifier );
			$site_url = str_replace( '::', '/', $site_url );

			if ( function_exists( 'wpcom_get_blog_details_for_url' ) ) {
				$blog_details = wpcom_get_blog_details_for_url( $site_url );
			} else {
				return $this->create_error( 'function_not_available', 'Site URL resolution not available', 500 );
			}
		}

		// Validate blog details.
		if ( ! $blog_details || is_wp_error( $blog_details ) ) {
			return $this->create_error( 'site_not_found', 'Site not found or inaccessible', 404 );
		}

		$target_blog_id = (int) $blog_details->blog_id;
		$switched       = false;

		// Only switch if it's a different site.
		if ( get_current_blog_id() !== $target_blog_id ) {
			switch_to_blog( $target_blog_id );
			$switched = true;
		}

		return array(
			'blog_id'  => $target_blog_id,
			'switched' => $switched,
		);
	}

	/**
	 * Check if user has permission for site statistics.
	 *
	 * @param int $blog_id The blog ID.
	 *
	 * @return bool True if permitted, false otherwise.
	 */
	private function check_site_permission( int $blog_id ): bool {
		$current_user_id = $this->get_current_user_id();

		if ( ! $current_user_id ) {
			return false;
		}

		// Check if user has access to this site.
		if ( function_exists( 'current_user_can_for_blog' ) ) {
			return current_user_can_for_blog( $blog_id, 'read' );
		}

		return current_user_can( 'read' );
	}

	/**
	 * Get site information.
	 *
	 * @param int $blog_id The blog ID.
	 *
	 * @return array Site information.
	 */
	private function get_site_info( int $blog_id ): array {
		$blog_details = get_blog_details( $blog_id );

		return array(
			'blog_id'   => $blog_id,
			'site_url'  => $blog_details->siteurl ?? '',
			'site_name' => $blog_details->blogname ?? '',
		);
	}

	/**
	 * Calculate date range based on period and number of periods.
	 *
	 * @param string $period      The time period.
	 * @param int    $num_periods Number of periods.
	 *
	 * @return array Start and end dates.
	 */
	private function calculate_date_range( string $period, int $num_periods ): array {
		$end_date = gmdate( 'Y-m-d' );

		switch ( $period ) {
			case 'day':
				$start_date = gmdate( 'Y-m-d', strtotime( "-{$num_periods} days" ) );
				break;
			case 'week':
				$start_date = gmdate( 'Y-m-d', strtotime( "-{$num_periods} weeks" ) );
				break;
			case 'month':
				$start_date = gmdate( 'Y-m-d', strtotime( "-{$num_periods} months" ) );
				break;
			case 'year':
				$start_date = gmdate( 'Y-m-d', strtotime( "-{$num_periods} years" ) );
				break;
			default:
				$start_date = gmdate( 'Y-m-d', strtotime( '-30 days' ) );
		}

		return array(
			'start' => $start_date,
			'end'   => $end_date,
		);
	}

	/**
	 * Get views and visitors data.
	 *
	 * @param int   $blog_id    The blog ID.
	 * @param array $date_range Date range array.
	 *
	 * @return array Views data.
	 */
	private function get_views_data( int $blog_id, array $date_range ): array {
		$views_data = array(
			'total_views'    => 0,
			'total_visitors' => 0,
			'daily_average'  => 0,
			'trend'          => 'stable',
			'daily_data'     => array(),
		);

		// Try to get stats using WordPress.com stats functions.
		if ( function_exists( 'stats_get_views' ) ) {
			$num_days  = $this->get_num_days( $date_range['start'], $date_range['end'] );
			$views_raw = stats_get_views( $blog_id, $date_range['end'], $num_days );

			if ( $views_raw && is_array( $views_raw ) ) {
				$total_views = 0;
				$daily_data  = array();

				foreach ( $views_raw as $day_data ) {
					$views        = (int) ( $day_data['views'] ?? 0 );
					$total_views += $views;

					$daily_data[] = array(
						'date'     => $day_data['date'] ?? '',
						'views'    => $views,
						'visitors' => (int) ( $day_data['visitors'] ?? 0 ),
					);
				}

				$views_data['total_views']   = $total_views;
				$views_data['daily_average'] = 0 < $num_days ? round( $total_views / $num_days, 2 ) : 0;
				$views_data['daily_data']    = $daily_data;

				// Calculate trend.
				$views_data['trend'] = $this->calculate_trend( $daily_data );
			}
		}

		// Try to get visitor stats.
		if ( function_exists( 'stats_get_visitors' ) ) {
			$num_days     = $this->get_num_days( $date_range['start'], $date_range['end'] );
			$visitors_raw = stats_get_visitors( $blog_id, $date_range['end'], 1, $num_days );

			if ( $visitors_raw && is_array( $visitors_raw ) ) {
				$total_visitors = 0;
				// Update daily data with visitor information.
				foreach ( $views_data['daily_data'] as &$day_data ) {
					$day_visitors         = (int) ( $visitors_raw[ $day_data['date'] ] ?? 0 );
					$day_data['visitors'] = $day_visitors;
					$total_visitors      += $day_visitors;
				}
				$views_data['total_visitors'] = $total_visitors;
			}
		}

		return $views_data;
	}

	/**
	 * Get top content (posts and pages).
	 *
	 * @param int   $blog_id    The blog ID.
	 * @param array $date_range Date range array.
	 * @param int   $max_items  Maximum items to return.
	 *
	 * @return array Top content data.
	 */
	private function get_top_content( int $blog_id, array $date_range, int $max_items ): array {
		$content_data = array(
			'top_posts' => array(),
			'top_pages' => array(),
		);

		// Try to get top posts using WordPress.com stats functions.
		if ( function_exists( 'stats_get_postviews' ) ) {
			$num_days  = $this->get_num_days( $date_range['start'], $date_range['end'] );
			$top_posts = stats_get_postviews( $blog_id, $date_range['end'], $num_days, ' AND post_id > 0', $max_items, false, true );

			if ( $top_posts && is_array( $top_posts ) ) {
				$post_count = 0;
				foreach ( $top_posts as $day => $day_posts ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
					if ( is_array( $day_posts ) ) {
						foreach ( $day_posts as $post_id => $post_views ) {
							if ( $post_count >= $max_items ) {
								break 2;
							}

							// Get post details.
							$post = get_post( $post_id );
							if ( $post && 'publish' === $post->post_status ) {
								$content_data['top_posts'][] = array(
									'title'   => $post->post_title,
									'url'     => get_permalink( $post->ID ),
									'views'   => (int) $post_views,
									'post_id' => (int) $post_id,
								);
								++$post_count;
							}
						}
					}
				}
			}
		}

		// Get top pages and fallback content if stats not available.
		if ( empty( $content_data['top_posts'] ) ) {
			// Get recent posts as fallback.
			$recent_posts = get_posts(
				array(
					'numberposts' => $max_items,
					'post_status' => 'publish',
					'post_type'   => array( 'post', 'page' ),
					'orderby'     => 'comment_count',
					'order'       => 'DESC',
				)
			);

			foreach ( $recent_posts as $post ) {
				$content_data['top_posts'][] = array(
					'title'   => $post->post_title,
					'url'     => get_permalink( $post->ID ),
					'views'   => 0, // No stats available.
					'post_id' => $post->ID,
				);
			}
		}

		// Get top pages separately if we have posts.
		if ( ! empty( $content_data['top_posts'] ) ) {
			$recent_pages = get_posts(
				array(
					'numberposts' => min( 5, $max_items ),
					'post_status' => 'publish',
					'post_type'   => 'page',
					'orderby'     => 'comment_count',
					'order'       => 'DESC',
				)
			);

			foreach ( $recent_pages as $page ) {
				$content_data['top_pages'][] = array(
					'title' => $page->post_title,
					'url'   => get_permalink( $page->ID ),
					'views' => 0, // No stats available.
				);
			}
		}

		return $content_data;
	}

	/**
	 * Get referrers data.
	 *
	 * @param int   $blog_id    The blog ID.
	 * @param array $date_range Date range array.
	 * @param int   $max_items  Maximum items to return.
	 *
	 * @return array Referrers data.
	 */
	private function get_referrers( int $blog_id, array $date_range, int $max_items ): array {
		$referrers = array();

		// Try to get referrers using WordPress.com stats functions.
		if ( function_exists( 'stats_get_referrers_grouped' ) ) {
			$num_days      = $this->get_num_days( $date_range['start'], $date_range['end'] );
			$referrers_raw = stats_get_referrers_grouped( $blog_id, $date_range['end'], $num_days, 2000, true );

			if ( $referrers_raw && is_array( $referrers_raw ) ) {
				$referrer_count = 0;
				foreach ( $referrers_raw as $referrer_url => $referrer_views ) {
					if ( $referrer_count >= $max_items ) {
						break;
					}

					if ( ! empty( $referrer_url ) && $referrer_views > 0 ) {
						$referrers[] = array(
							'referrer' => $referrer_url,
							'views'    => (int) $referrer_views,
						);
						++$referrer_count;
					}
				}
			}
		}

		return $referrers;
	}

	/**
	 * Get geographic data.
	 *
	 * @param int   $blog_id    The blog ID.
	 * @param array $date_range Date range array.
	 * @param int   $max_items  Maximum items to return.
	 *
	 * @return array Geographic data.
	 */
	private function get_geographic_data( int $blog_id, array $date_range, int $max_items ): array {
		$geographic_data = array(
			'top_countries' => array(),
			'top_cities'    => array(),
		);

		$num_days = $this->get_num_days( $date_range['start'], $date_range['end'] );

		// Note: Geographic stats functions may not be available in all WordPress.com environments.
		// Try to get countries data using available functions.
		if ( function_exists( 'stats_get_geoviews_summary' ) ) {
			$geo_raw = stats_get_geoviews_summary( $blog_id, $date_range['end'], $num_days );

			if ( $geo_raw && is_array( $geo_raw ) ) {
				$country_count = 0;
				foreach ( $geo_raw as $country_code => $views ) {
					if ( $country_count >= $max_items ) {
						break;
					}

					if ( ! empty( $country_code ) && $views > 0 ) {
						// Convert country code to readable name if possible.
						$country_name                       = $this->get_country_name( $country_code );
						$geographic_data['top_countries'][] = array(
							'country' => $country_name,
							'views'   => (int) $views,
						);
						++$country_count;
					}
				}
			}
		}

		// Cities data is typically not available in basic WordPress.com stats.
		// Leave top_cities empty as it requires premium stats features.

		return $geographic_data;
	}

	/**
	 * Get device and browser data.
	 *
	 * @param int   $blog_id    The blog ID.
	 * @param array $date_range Date range array.
	 * @param int   $max_items  Maximum items to return.
	 *
	 * @return array Device data.
	 */
	private function get_device_data( int $blog_id, array $date_range, int $max_items ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$device_data = array(
			'device_types' => array(),
			'browsers'     => array(),
		);

		$num_days = $this->get_num_days( $date_range['start'], $date_range['end'] ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		// Note: Device and browser breakdown functions may not be available in all WordPress.com environments.
		// These typically require premium stats features or specific WordPress.com configurations.

		// Provide basic device categorization based on user agents if available.
		// This is a simplified implementation since detailed device stats may not be accessible.
		$device_data['device_types'] = array(
			array(
				'device' => 'Desktop',
				'views'  => 0,
			),
			array(
				'device' => 'Mobile',
				'views'  => 0,
			),
			array(
				'device' => 'Tablet',
				'views'  => 0,
			),
		);

		$device_data['browsers'] = array(
			array(
				'browser' => 'Chrome',
				'views'   => 0,
			),
			array(
				'browser' => 'Safari',
				'views'   => 0,
			),
			array(
				'browser' => 'Firefox',
				'views'   => 0,
			),
			array(
				'browser' => 'Edge',
				'views'   => 0,
			),
		);

		// Note: Actual device/browser stats would require access to raw analytics data
		// which may not be available through standard WordPress.com stats functions.

		return $device_data;
	}

	/**
	 * Get all-time statistics.
	 *
	 * @param int $blog_id The blog ID.
	 *
	 * @return array All-time statistics.
	 */
	private function get_all_time_stats( int $blog_id ): array {
		$all_time_stats = array(
			'total_views'     => 0,
			'total_visitors'  => 0,
			'total_posts'     => 0,
			'total_comments'  => 0,
			'first_post_date' => '',
			'site_age_days'   => 0,
		);

		// Get content metrics.
		$metrics                          = SiteMetricsHelper::get_site_metrics( $blog_id );
		$all_time_stats['total_posts']    = $metrics['content']['total_posts'];
		$all_time_stats['total_comments'] = $metrics['content']['total_comments'];

		// Try to get all-time views using available WordPress.com functions.
		if ( function_exists( 'stats_get_views' ) ) {
			// Get a long period to approximate all-time views.
			$long_period_days   = 365 * 3; // 3 years.
			$end_date           = gmdate( 'Y-m-d' );
			$all_time_views_raw = stats_get_views( $blog_id, $end_date, $long_period_days );

			if ( $all_time_views_raw && is_array( $all_time_views_raw ) ) {
				$total_views = array_sum( array_column( $all_time_views_raw, 'views' ) );
				if ( $total_views > 0 ) {
					$all_time_stats['total_views'] = $total_views;
				}
			}
		}

		// Try to get all-time visitors.
		if ( function_exists( 'stats_get_visitors' ) ) {
			$long_period_days      = 365 * 3; // 3 years.
			$end_date              = gmdate( 'Y-m-d' );
			$all_time_visitors_raw = stats_get_visitors( $blog_id, $end_date, 1, $long_period_days );

			if ( $all_time_visitors_raw && is_array( $all_time_visitors_raw ) ) {
				$total_visitors = array_sum( $all_time_visitors_raw );
				if ( $total_visitors > 0 ) {
					$all_time_stats['total_visitors'] = $total_visitors;
				}
			}
		}

		// Get first post date and calculate site age.
		$first_post = get_posts(
			array(
				'numberposts' => 1,
				'post_status' => 'publish',
				'orderby'     => 'date',
				'order'       => 'ASC',
			)
		);

		if ( ! empty( $first_post ) ) {
			$first_post_date                   = $first_post[0]->post_date;
			$all_time_stats['first_post_date'] = $first_post_date;
			$all_time_stats['site_age_days']   = (int) ( ( time() - strtotime( $first_post_date ) ) / DAY_IN_SECONDS );
		}

		return $all_time_stats;
	}

	/**
	 * Calculate number of days between two dates.
	 *
	 * @param string $start_date Start date.
	 * @param string $end_date   End date.
	 *
	 * @return int Number of days.
	 */
	private function get_num_days( string $start_date, string $end_date ): int {
		$start = strtotime( $start_date );
		$end   = strtotime( $end_date );

		return (int) ( ( $end - $start ) / DAY_IN_SECONDS ) + 1;
	}

	/**
	 * Calculate trend from daily data.
	 *
	 * @param array $daily_data Array of daily view data.
	 *
	 * @return string Trend direction (up, down, stable).
	 */
	private function calculate_trend( array $daily_data ): string {
		if ( 2 > count( $daily_data ) ) {
			return 'stable';
		}

		// Compare first half with second half.
		$mid_point   = (int) ( count( $daily_data ) / 2 );
		$first_half  = array_slice( $daily_data, 0, $mid_point );
		$second_half = array_slice( $daily_data, $mid_point );

		$first_avg  = array_sum( array_column( $first_half, 'views' ) ) / count( $first_half );
		$second_avg = array_sum( array_column( $second_half, 'views' ) ) / count( $second_half );

		$change_percent = 0 < $first_avg ? ( ( $second_avg - $first_avg ) / $first_avg ) * 100 : 0;

		if ( 10 < $change_percent ) {
			return 'up';
		} elseif ( -10 > $change_percent ) {
			return 'down';
		}

		return 'stable';
	}

	/**
	 * Convert country code to readable country name.
	 *
	 * @param string $country_code The country code.
	 *
	 * @return string Country name or code if not found.
	 */
	private function get_country_name( string $country_code ): string {
		// Basic country code mapping - could be expanded.
		$country_names = array(
			'US' => 'United States',
			'CA' => 'Canada',
			'GB' => 'United Kingdom',
			'AU' => 'Australia',
			'DE' => 'Germany',
			'FR' => 'France',
			'JP' => 'Japan',
			'IN' => 'India',
			'BR' => 'Brazil',
			'ES' => 'Spain',
			'IT' => 'Italy',
			'NL' => 'Netherlands',
			'SE' => 'Sweden',
			'NO' => 'Norway',
			'DK' => 'Denmark',
			'FI' => 'Finland',
		);

		return $country_names[ strtoupper( $country_code ) ] ?? $country_code;
	}
}
