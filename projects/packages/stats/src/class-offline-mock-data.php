<?php
/**
 * Sample Stats data shown in Offline Mode, so the real Jetpack Stats dashboard
 * renders with representative numbers instead of erroring out with no connection.
 *
 * @package automattic/jetpack-stats
 */

namespace Automattic\Jetpack\Stats;

/**
 * Builds canned responses matching the shape of the real WordPress.com Stats
 * REST API (https://developer.wordpress.com/docs/api/1.1/get/sites/%24site/stats/*),
 * keyed by the same `$resource` names used by WPCOM_Stats.
 */
class Offline_Mock_Data {

	/**
	 * Sample daily views used to derive most of the mock series below, so the
	 * numbers stay internally consistent (e.g. top-posts/referrers totals roughly
	 * match the visits chart).
	 *
	 * @var int[]
	 */
	const DAILY_VIEWS = array( 22, 18, 27, 25, 9, 31, 19 );

	/**
	 * Get mock data for a given Stats API resource.
	 *
	 * @param string $resource The resource name, matching WPCOM_Stats's internal `$this->resource`.
	 * @param array  $args     The request's query args (used for things like `unit`/`quantity`/`num`).
	 * @return array
	 */
	public static function get( $resource, $args = array() ) {
		switch ( $resource ) {
			case '':
				return self::stats_summary();
			case 'summary':
				return self::stats_summary_period();
			case 'visits':
				return self::visits( $args );
			case 'top-posts':
				return self::top_posts();
			case 'referrers':
				return self::referrers();
			case 'country-views':
				return self::country_views();
			case 'insights':
				return self::insights();
			case 'highlights':
				return self::highlights();
			case 'streak':
				return self::streak();
			case 'clicks':
				return self::empty_days_series( 'clicks' );
			case 'search-terms':
				return self::search_terms();
			case 'tags':
				return self::empty_days_series( 'tags' );
			case 'top-authors':
				return self::empty_days_series( 'authors' );
			case 'video-plays':
				return self::empty_days_series( 'plays' );
			case 'file-downloads':
				return self::empty_days_series( 'files' );
			case 'archives':
				return self::empty_days_series( 'archives' );
			case 'followers':
				return self::followers();
			case 'comment-followers':
				return array(
					'page'    => 1,
					'pages'   => 1,
					'total'   => 0,
					'follows' => array(),
				);
			case 'publicize':
				return array( 'services' => array() );
			case 'comments':
				return array(
					'date'    => self::today(),
					'authors' => array(),
					'posts'   => array(),
				);
			default:
				if ( 0 === strpos( $resource, 'post/' ) || 0 === strpos( $resource, 'video/' ) ) {
					return array( 'views' => 0 );
				}
				if ( 0 === strpos( $resource, 'location-views/' ) ) {
					return self::country_views();
				}
				// Unknown/uncommon resource: return an empty-but-valid series rather than an
				// error. `days` must encode as a JSON object (`{}`), not an array (`[]`), to
				// match the shape every other resource uses -- an empty PHP array would
				// otherwise serialize as `[]` and break code that indexes it by date string.
				return array(
					'date' => self::today(),
					'days' => new \stdClass(),
				);
		}
	}

	/**
	 * Today's date, in the site's local timezone, `Y-m-d` formatted -- matches the
	 * `date` field every real Stats endpoint returns.
	 *
	 * @return string
	 */
	private static function today() {
		return current_time( 'Y-m-d' );
	}

	/**
	 * The last N calendar days (oldest first), `Y-m-d` formatted.
	 *
	 * @param int $count How many days back to go, including today.
	 * @return string[]
	 */
	private static function last_days( $count ) {
		$days = array();
		for ( $i = $count - 1; $i >= 0; $i-- ) {
			$days[] = gmdate( 'Y-m-d', strtotime( self::today() . " -{$i} days" ) );
		}
		return $days;
	}

	/**
	 * Mock for `GET /sites/$site/stats` (empty resource): the overview counters
	 * shown at the top of the dashboard.
	 *
	 * @return array
	 */
	private static function stats_summary() {
		$views = array_sum( self::DAILY_VIEWS );
		return array(
			'date'  => self::today(),
			'stats' => array(
				'visitors_today'       => 12,
				'visitors_yesterday'   => 9,
				'views_today'          => 22,
				'views_yesterday'      => 9,
				'views_best_day'       => self::last_days( 7 )[2],
				'views_best_day_total' => max( self::DAILY_VIEWS ),
				'visits'               => (int) round( $views * 0.7 ),
				'views'                => $views,
				'comments'             => 6,
				'followers_blog'       => 4,
				'followers_comments'   => 1,
				'comment_likes'        => 2,
				'categories'           => 5,
				'tags'                 => 8,
				'shares'               => 3,
				'posts'                => 11,
			),
		);
	}

	/**
	 * Mock for `summary` resource (period-summarized stats).
	 *
	 * @return array
	 */
	private static function stats_summary_period() {
		return array(
			'period'   => self::today(),
			'views'    => array_sum( self::DAILY_VIEWS ),
			'visitors' => (int) round( array_sum( self::DAILY_VIEWS ) * 0.7 ),
			'likes'    => 4,
			'reblogs'  => 0,
			'comments' => 6,
			'posts'    => 1,
		);
	}

	/**
	 * Mock for `GET /sites/$site/stats/visits`: the main traffic chart. Real shape
	 * is `{ date, unit, fields: [...], data: [ [period, views, visitors, ...], ... ] }`.
	 *
	 * @param array $args Request args (respects `unit` and `quantity` if present).
	 * @return array
	 */
	private static function visits( $args = array() ) {
		$unit  = $args['unit'] ?? 'day';
		$count = min( 30, max( 7, (int) ( $args['quantity'] ?? 7 ) ) );

		$fields = array( 'period', 'views', 'visitors', 'likes', 'reblogs', 'comments', 'posts' );
		$days   = self::last_days( $count );
		$data   = array();
		foreach ( $days as $i => $day ) {
			$views  = self::DAILY_VIEWS[ $i % count( self::DAILY_VIEWS ) ];
			$data[] = array(
				$day,
				$views,
				(int) round( $views * 0.7 ),
				(int) round( $views * 0.15 ),
				0,
				(int) round( $views * 0.2 ),
				0 === $i % 3 ? 1 : 0,
			);
		}

		return array(
			'date'   => self::today(),
			'unit'   => $unit,
			'fields' => $fields,
			'data'   => $data,
		);
	}

	/**
	 * Mock for `GET /sites/$site/stats/top-posts`.
	 *
	 * @return array
	 */
	private static function top_posts() {
		$posts = array(
			array(
				'id'    => 1,
				'href'  => home_url( '/' ),
				'title' => __( 'Home page / Archives', 'jetpack-stats' ),
				'type'  => 'homepage',
				'views' => 91,
			),
			array(
				'id'    => 2,
				'href'  => home_url( '/getting-started/' ),
				'title' => __( 'A guide to getting started', 'jetpack-stats' ),
				'type'  => 'post',
				'views' => 34,
			),
			array(
				'id'    => 3,
				'href'  => home_url( '/about/' ),
				'title' => __( 'About', 'jetpack-stats' ),
				'type'  => 'page',
				'views' => 12,
			),
		);

		// The real API returns both `summary` (the aggregate across the requested
		// date range) and `days` (the per-day breakdown); the frontend reads one or
		// the other depending on whether it asked for `summarize=1`, so both need
		// the same payload here.
		$day_payload = array(
			'postviews'   => $posts,
			'total_views' => array_sum( array_column( $posts, 'views' ) ),
		);

		return array(
			'date'    => self::today(),
			'days'    => array( self::today() => $day_payload ),
			'summary' => $day_payload,
		);
	}

	/**
	 * Mock for `GET /sites/$site/stats/referrers`.
	 *
	 * @return array
	 */
	private static function referrers() {
		$groups = array(
			array(
				'group'   => 'search-engines',
				'name'    => __( 'Search Engines', 'jetpack-stats' ),
				'icon'    => '',
				'total'   => 48,
				'results' => array(
					array(
						'name'  => 'Google',
						'url'   => 'https://www.google.com',
						'views' => 40,
					),
					array(
						'name'  => 'Bing',
						'url'   => 'https://www.bing.com',
						'views' => 8,
					),
				),
			),
			array(
				'group'   => 'google.com',
				'name'    => 'google.com',
				'icon'    => '',
				'total'   => 22,
				'results' => array(
					array(
						'name'  => 'google.com',
						'url'   => 'https://google.com',
						'views' => 22,
					),
				),
			),
			array(
				'group'   => 'direct',
				'name'    => __( 'Direct', 'jetpack-stats' ),
				'icon'    => '',
				'total'   => 15,
				'results' => array(),
			),
		);

		$day_payload = array(
			'groups'      => $groups,
			'otherViews'  => 0,
			'total'       => array_sum( array_column( $groups, 'total' ) ),
			'total_views' => array_sum( array_column( $groups, 'total' ) ),
		);

		return array(
			'date'    => self::today(),
			'days'    => array( self::today() => $day_payload ),
			'summary' => $day_payload,
		);
	}

	/**
	 * Mock for `GET /sites/$site/stats/country-views`.
	 *
	 * @return array
	 */
	private static function country_views() {
		$countries = array(
			array(
				'country_code' => 'US',
				'views'        => 38,
			),
			array(
				'country_code' => 'GB',
				'views'        => 15,
			),
			array(
				'country_code' => 'DE',
				'views'        => 9,
			),
			array(
				'country_code' => 'CA',
				'views'        => 6,
			),
		);

		return array(
			'date'         => self::today(),
			'days'         => array(
				self::today() => array( 'views' => $countries ),
			),
			'summary'      => array( 'views' => $countries ),
			'country-info' => array(
				'US' => array(
					'flag_icon'      => '🇺🇸',
					'flat_flag_icon' => '',
					'country_full'   => 'United States',
				),
				'GB' => array(
					'flag_icon'      => '🇬🇧',
					'flat_flag_icon' => '',
					'country_full'   => 'United Kingdom',
				),
				'DE' => array(
					'flag_icon'      => '🇩🇪',
					'flat_flag_icon' => '',
					'country_full'   => 'Germany',
				),
				'CA' => array(
					'flag_icon'      => '🇨🇦',
					'flat_flag_icon' => '',
					'country_full'   => 'Canada',
				),
			),
		);
	}

	/**
	 * Mock for `GET /sites/$site/stats/insights`.
	 *
	 * @return array
	 */
	private static function insights() {
		return array(
			'highest_hour'         => 14,
			'highest_hour_percent' => 18,
			'highest_day_of_week'  => 2,
			'highest_day_percent'  => 22,
			'hourly_views'         => array_fill( 0, 24, 4 ),
			'days_of_week'         => array_fill( 0, 7, array_sum( self::DAILY_VIEWS ) / 7 ),
			'years'                => array(),
		);
	}

	/**
	 * Mock for `GET /sites/$site/stats/highlights`.
	 *
	 * @return array
	 */
	private static function highlights() {
		$views = array_sum( self::DAILY_VIEWS );
		return array(
			'period'           => self::today(),
			'visitors'         => (int) round( $views * 0.7 ),
			'views'            => $views,
			'likes'            => 4,
			'comments'         => 6,
			'visitors_delta'   => 0.12,
			'views_delta'      => 0.08,
			'likes_delta'      => 0,
			'comments_delta'   => 0.5,
			// Used by the "high traffic site" feedback prompt to decide whether to
			// suggest a commercial-use plan; a modest sample-data site should never
			// trip that threshold, so this deliberately mirrors `views` above.
			'past_thirty_days' => array(
				'views' => $views,
			),
		);
	}

	/**
	 * Mock for `GET /sites/$site/stats/streak`.
	 *
	 * @return array
	 */
	private static function streak() {
		$data = array();
		foreach ( self::last_days( 30 ) as $i => $day ) {
			$data[ strtotime( $day ) ] = self::DAILY_VIEWS[ $i % count( self::DAILY_VIEWS ) ];
		}

		return array(
			'streak' => array(
				'long'    => array(
					'start'  => self::last_days( 30 )[0],
					'end'    => self::today(),
					'length' => 30,
				),
				'current' => array(
					'start'  => self::last_days( 5 )[0],
					'end'    => self::today(),
					'length' => 5,
				),
				'best'    => array(
					'day'   => self::last_days( 7 )[2],
					'count' => max( self::DAILY_VIEWS ),
				),
			),
			'data'   => $data,
		);
	}

	/**
	 * Mock for `GET /sites/$site/stats/search-terms`.
	 *
	 * @return array
	 */
	private static function search_terms() {
		$day_payload = array(
			'search_terms'           => array(
				array(
					'term'  => 'jetpack stats',
					'views' => 5,
				),
				array(
					'term'  => 'wordpress local dev',
					'views' => 2,
				),
			),
			'encrypted_search_terms' => 12,
			'other_search_terms'     => 3,
			'total_search_terms'     => 22,
		);

		return array(
			'date'    => self::today(),
			'days'    => array( self::today() => $day_payload ),
			'summary' => $day_payload,
		);
	}

	/**
	 * Mock for `GET /sites/$site/stats/followers`.
	 *
	 * @return array
	 */
	private static function followers() {
		return array(
			'total_wpcom' => 3,
			'total_email' => 1,
			'subscribers' => array(),
			'page'        => 1,
			'pages'       => 1,
		);
	}

	/**
	 * Generic `{ date, days: { <today>: { <key>: [] } } }` shape used by several
	 * lower-traffic resources (clicks, tags, video-plays, file-downloads) that
	 * are rarely populated on a brand-new site anyway.
	 *
	 * @param string $key The per-day payload key.
	 * @return array
	 */
	private static function empty_days_series( $key ) {
		$day_payload = array( $key => array() );
		return array(
			'date'    => self::today(),
			'days'    => array( self::today() => $day_payload ),
			'summary' => $day_payload,
		);
	}
}
