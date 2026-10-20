<?php
/**
 * VideoPress Channel data: the site's videos, their views and the channel's numbers.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use Automattic\Jetpack\Connection\Client;
use WP_Post;

/**
 * Reads what the channel blocks show: the VideoPress videos in the media
 * library ( straight from the posts table, as WordPress.com Simple has no
 * wp/v2 routes on page renders ), their play counts from Jetpack Stats, and
 * the channel's totals. Nothing is written to the blog except short-lived
 * caches of the play and subscriber counts.
 */
class Channel_Data {

	/**
	 * Most videos read for one listing; browsing, sorting and counting work on these.
	 *
	 * @var int
	 */
	const MAX_VIDEOS = 1000;

	/**
	 * Object-cache group and lifetime of the full video list. Keys carry the blog
	 * ID and the posts' last-changed stamp, so an upload or edit makes a new key.
	 */
	const CACHE_GROUP = 'videopress_channel';
	const CACHE_TTL   = DAY_IN_SECONDS;

	/**
	 * Transient caching the play counts, and how long.
	 */
	const VIEWS_TRANSIENT       = 'videopress_channel_video_views';
	const VIEWS_TTL             = HOUR_IN_SECONDS;
	const VIEWS_ERROR_TTL       = 10 * MINUTE_IN_SECONDS;
	const SUBSCRIBERS_TRANSIENT = 'videopress_channel_subscribers';
	const SUBSCRIBERS_TTL       = HOUR_IN_SECONDS;
	const SUBSCRIBERS_ERROR_TTL = 10 * MINUTE_IN_SECONDS;
	const SHORT_MAX_MS          = 1200000; // Under 20 minutes.
	const LONG_MIN_MS           = 2700000; // Over 45 minutes.
	const BROWSE_SORTS          = array( 'newest', 'popular', 'oldest' );
	const BROWSE_LENGTHS        = array( 'any', 'short', 'mid', 'long' );
	const SEARCH_MAX_LENGTH     = 100;
	const QUERY_ARG_SEARCH      = 'videos-q';
	const QUERY_ARG_SORT        = 'videos-sort';
	const QUERY_ARG_LENGTH      = 'videos-length';
	const QUERY_ARG_PAGE        = 'videos-page';
	const DEFAULT_BROWSE_PAGE   = 1;
	const COMPACT_THOUSAND      = 1000;
	const COMPACT_TEN_THOUSAND  = 10000;
	const COMPACT_MILLION       = 1000000;
	const DEFAULT_HANDLE_PREFIX = '@';

	/**
	 * Per-request cache of the video lists, keyed by blog ID and then search term.
	 *
	 * @var array<int, array<string, array[]>>
	 */
	private static $videos = array();

	/**
	 * Per-request cache of the play counts, keyed by blog ID.
	 *
	 * @var array<int, array<int, int>>
	 */
	private static $views = array();

	/**
	 * Forget the per-request caches ( tests, and after uploads in long requests ).
	 *
	 * @return void
	 */
	public static function reset() {
		self::$videos = array();
		self::$views  = array();
	}

	/**
	 * The site's VideoPress videos, newest first.
	 *
	 * @param string $search Optional search term, matched against the attachments.
	 *
	 * @return array[] Records with id, guid, durationMs, height and publishedAt ( unix time ).
	 */
	public static function videos( $search = '' ) {
		$search  = is_string( $search ) ? trim( $search ) : '';
		$blog_id = get_current_blog_id();
		if ( isset( self::$videos[ $blog_id ][ $search ] ) ) {
			return self::$videos[ $blog_id ][ $search ];
		}

		/**
		 * Short-circuits the channel's video list.
		 *
		 * @since 0.58.0
		 *
		 * @param array[]|null $videos Records with id, guid, durationMs, height and publishedAt, newest first; null to query.
		 * @param string       $search The search term, if any.
		 */
		$videos = apply_filters( 'videopress_channel_videos', null, $search );
		if ( ! is_array( $videos ) ) {
			$key    = self::cache_key( 'videos', $search );
			$videos = wp_cache_get( $key, self::CACHE_GROUP );
			if ( ! is_array( $videos ) ) {
				$videos = self::query_videos( $search );
				wp_cache_set( $key, $videos, self::CACHE_GROUP, self::CACHE_TTL );
			}
		}

		self::$videos[ $blog_id ][ $search ] = $videos;
		return $videos;
	}

	/**
	 * Object-cache key for this blog's data, invalidated whenever a post changes.
	 *
	 * @param string $what   What is cached.
	 * @param string $search Search term, if any.
	 *
	 * @return string
	 */
	public static function cache_key( $what, $search = '' ) {
		return implode( ':', array( $what, get_current_blog_id(), wp_cache_get_last_changed( 'posts' ), md5( (string) $search ) ) );
	}

	/**
	 * Whether the full list for a search is already at hand ( this request or the
	 * object cache ), or is replaced by a filter, so reading it costs no query.
	 *
	 * @param string $search Search term.
	 *
	 * @return bool
	 */
	private static function has_full_list( $search ) {
		return isset( self::$videos[ get_current_blog_id() ][ $search ] )
			|| has_filter( 'videopress_channel_videos' )
			|| is_array( wp_cache_get( self::cache_key( 'videos', $search ), self::CACHE_GROUP ) );
	}

	/**
	 * The query arguments shared by the full list and the paged queries.
	 *
	 * @param string $search Search term.
	 * @param string $order  DESC ( newest first ) or ASC.
	 *
	 * @return array
	 */
	private static function query_args( $search, $order = 'DESC' ) {
		$is_wpcom = defined( 'IS_WPCOM' ) && IS_WPCOM;
		$args     = array(
			'post_type'        => 'attachment',
			'post_status'      => 'inherit',
			'post_mime_type'   => $is_wpcom ? 'video' : Channel::MIME_TYPE,
			// The ID breaks date ties, so ASC is exactly the reverse of DESC.
			'orderby'          => array(
				'date' => $order,
				'ID'   => $order,
			),
			'suppress_filters' => false,
		);
		if ( '' !== $search ) {
			$args['s'] = $search;
		}
		return $args;
	}

	/**
	 * One page of videos straight from SQL, for listings that need no full list.
	 *
	 * @param string $search   Search term.
	 * @param string $order    DESC or ASC.
	 * @param int    $per_page Page size.
	 * @param int    $page     1-based page.
	 *
	 * @return array{records: array[], total: int}|null Null when an attachment on the page is
	 *                                                   not a VideoPress video, so the SQL total cannot be trusted.
	 */
	private static function query_page( $search, $order, $per_page, $page ) {
		$query = new \WP_Query(
			array_merge(
				self::query_args( $search, $order ),
				array(
					'posts_per_page'      => $per_page,
					'paged'               => $page,
					'ignore_sticky_posts' => true,
				)
			)
		);

		$records = array();
		foreach ( $query->posts as $post ) {
			$record = self::record( $post );
			if ( ! $record ) {
				return null;
			}
			$records[] = $record;
		}
		return array(
			'records' => $records,
			'total'   => (int) $query->found_posts,
		);
	}

	/**
	 * How many videos the channel has, without reading the full list unless it is at hand.
	 *
	 * @return int
	 */
	public static function video_count() {
		if ( self::has_full_list( '' ) ) {
			return count( self::videos() );
		}
		$page = self::query_page( '', 'DESC', 1, 1 );
		return null === $page ? count( self::videos() ) : $page['total'];
	}

	/**
	 * Query the VideoPress attachments: by mime off WordPress.com Simple, and
	 * every video with a GUID in the platform's videos table on it.
	 *
	 * @param string $search Search term.
	 *
	 * @return array[]
	 */
	private static function query_videos( $search ) {
		$args                   = self::query_args( $search );
		$args['posts_per_page'] = self::MAX_VIDEOS;

		$videos = array();
		foreach ( get_posts( $args ) as $post ) {
			$record = self::record( $post );
			if ( $record ) {
				$videos[] = $record;
			}
		}
		return $videos;
	}

	/**
	 * The listing record of one attachment, or null when it is not a VideoPress video.
	 *
	 * @param WP_Post|null $post The attachment.
	 *
	 * @return array|null
	 */
	public static function record( $post ) {
		if ( ! $post instanceof WP_Post ) {
			return null;
		}
		$guid = Channel::guid( $post );
		if ( '' === $guid ) {
			return null;
		}

		$meta       = wp_get_attachment_metadata( $post->ID );
		$meta       = is_array( $meta ) ? $meta : array();
		$videopress = isset( $meta['videopress'] ) && is_array( $meta['videopress'] ) ? $meta['videopress'] : array();
		$duration   = $videopress['duration'] ?? ( isset( $meta['length'] ) && is_numeric( $meta['length'] ) ? (int) $meta['length'] * 1000 : 0 );
		$height     = $meta['height'] ?? $videopress['height'] ?? 0;
		$published  = strtotime( $post->post_date_gmt . ' UTC' );

		return array(
			'id'          => (int) $post->ID,
			'guid'        => $guid,
			'durationMs'  => is_numeric( $duration ) ? max( 0, (int) $duration ) : 0,
			'height'      => is_numeric( $height ) ? max( 0, (int) $height ) : 0,
			'publishedAt' => false === $published ? 0 : (int) $published,
		);
	}

	/**
	 * The newest video's attachment, or null.
	 *
	 * @return WP_Post|null
	 */
	public static function latest_video() {
		$page   = self::has_full_list( '' ) ? null : self::query_page( '', 'DESC', 1, 1 );
		$videos = null === $page ? self::videos() : $page['records'];
		$post   = $videos ? get_post( $videos[0]['id'] ) : null;
		return $post instanceof WP_Post ? $post : null;
	}

	/**
	 * Play counts per attachment ID.
	 *
	 * @return array<int, int>
	 */
	public static function video_views() {
		$blog_id = get_current_blog_id();
		if ( isset( self::$views[ $blog_id ] ) ) {
			return self::$views[ $blog_id ];
		}

		$views = get_transient( self::VIEWS_TRANSIENT );
		if ( ! is_array( $views ) ) {
			$fetched = self::fetch_video_views();
			$views   = is_array( $fetched ) ? $fetched : array();
			// A failed fetch is cached as no plays for a short while, so it is not retried on every render.
			set_transient( self::VIEWS_TRANSIENT, $views, null === $fetched ? self::VIEWS_ERROR_TTL : self::VIEWS_TTL );
		}

		/**
		 * Filters the play counts the channel shows and sorts by.
		 *
		 * @since 0.58.0
		 *
		 * @param array<int, int> $views Plays keyed by attachment ID.
		 */
		$views = apply_filters( 'videopress_channel_video_views', $views );

		$clean = array();
		foreach ( is_array( $views ) ? $views : array() as $id => $count ) {
			if ( is_numeric( $id ) && is_numeric( $count ) ) {
				$clean[ (int) $id ] = max( 0, (int) $count );
			}
		}

		self::$views[ $blog_id ] = $clean;
		return $clean;
	}

	/**
	 * Ask Jetpack Stats for the video plays, when the Stats package is present.
	 *
	 * @return array<int, int>|null Plays keyed by post ID; null on failure.
	 */
	private static function fetch_video_views() {
		$stats_class = '\Automattic\Jetpack\Stats\WPCOM_Stats';
		if ( ! class_exists( $stats_class ) ) {
			return array();
		}

		/**
		 * Filters the query the channel sends to the video plays stats endpoint.
		 *
		 * @since 0.58.0
		 *
		 * @param array $args Endpoint query arguments.
		 */
		$args = apply_filters(
			'videopress_channel_video_plays_args',
			array(
				// With `summarize` the endpoint ignores `period` and reads `num` as days; it has no all-time option.
				'period'    => 'day',
				'num'       => 3650,
				'max'       => 0,
				'summarize' => 1,
			)
		);

		$response = ( new $stats_class() )->get_video_plays( $args );
		if ( is_wp_error( $response ) || ! is_array( $response ) ) {
			return null;
		}

		return self::parse_video_plays( $response );
	}

	/**
	 * Collect attachment ID → plays from a `stats/video-plays` response. With `summarize`
	 * the rows sit in `days.summary.plays` ( `data` rows counting `views` with `complete_stats` );
	 * without it each day has its own `plays` rows, which are added up.
	 *
	 * @param mixed $response Decoded response.
	 *
	 * @return array<int, int>
	 */
	public static function parse_video_plays( $response ) {
		$response = json_decode( (string) wp_json_encode( $response, JSON_UNESCAPED_SLASHES ), true );
		if ( ! is_array( $response ) ) {
			return array();
		}
		$days = isset( $response['days'] ) && is_array( $response['days'] ) ? $response['days'] : array();
		if ( isset( $response['summary'] ) && is_array( $response['summary'] ) ) {
			$periods = array( $response['summary'] );
		} elseif ( isset( $days['summary'] ) && is_array( $days['summary'] ) ) {
			$periods = array( $days['summary'] );
		} else {
			$periods = $days;
		}

		$plays = array();
		foreach ( $periods as $period ) {
			if ( ! is_array( $period ) ) {
				continue;
			}
			$rows = $period['plays'] ?? $period['data'] ?? array();
			foreach ( is_array( $rows ) ? $rows : array() as $row ) {
				$count = is_array( $row ) ? ( $row['plays'] ?? $row['views'] ?? null ) : null;
				if ( ! isset( $row['post_id'] ) || ! is_numeric( $row['post_id'] ) || ! is_numeric( $count ) ) {
					continue;
				}
				$id           = (int) $row['post_id'];
				$plays[ $id ] = ( $plays[ $id ] ?? 0 ) + max( 0, (int) $count );
			}
		}

		return $plays;
	}

	/**
	 * Add the play count to listing records.
	 *
	 * @param array[] $records Records with an id.
	 *
	 * @return array[]
	 */
	public static function with_views( array $records ) {
		$views = self::video_views();
		foreach ( $records as &$record ) {
			$record['views'] = $views[ (int) ( $record['id'] ?? 0 ) ] ?? 0;
		}
		unset( $record );
		return $records;
	}

	/**
	 * The browsing state a request asks for.
	 *
	 * @param bool   $read_filters Whether search, sort and length come from the request ( browse controls shown ).
	 * @param bool   $read_page    Whether the page comes from the request ( numbered pagination ).
	 * @param string $default_sort The block's own order.
	 *
	 * @return array{search: string, sort: string, length: string, page: int}
	 */
	public static function browse_request( $read_filters, $read_page, $default_sort = 'newest' ) {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- Read-only listing arguments, like core's paged and s.
		$get   = function ( $key ) {
			return isset( $_GET[ $key ] ) && is_string( $_GET[ $key ] ) ? sanitize_text_field( wp_unslash( $_GET[ $key ] ) ) : '';
		};
		$state = array(
			'search' => '',
			'sort'   => in_array( $default_sort, self::BROWSE_SORTS, true ) ? $default_sort : 'newest',
			'length' => 'any',
			'page'   => self::DEFAULT_BROWSE_PAGE,
		);

		if ( $read_filters ) {
			$state['search'] = function_exists( 'mb_substr' ) ? mb_substr( $get( self::QUERY_ARG_SEARCH ), 0, self::SEARCH_MAX_LENGTH ) : substr( $get( self::QUERY_ARG_SEARCH ), 0, self::SEARCH_MAX_LENGTH );
			$sort            = $get( self::QUERY_ARG_SORT );
			$sort            = 'latest' === $sort ? 'newest' : $sort;
			if ( in_array( $sort, self::BROWSE_SORTS, true ) ) {
				$state['sort'] = $sort;
			}
			$length = $get( self::QUERY_ARG_LENGTH );
			if ( in_array( $length, self::BROWSE_LENGTHS, true ) ) {
				$state['length'] = $length;
			}
		}
		if ( $read_page ) {
			$state['page'] = max( 1, absint( $get( self::QUERY_ARG_PAGE ) ) );
		}
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		return $state;
	}

	/**
	 * One page of the channel's videos for a browsing state.
	 *
	 * @param array    $state       From browse_request().
	 * @param int      $per_page    Page size.
	 * @param string[] $exclude     GUIDs to leave out.
	 * @param bool     $with_views  Whether records need play counts.
	 *
	 * @return array{entries: array[], total: int, page: int, pages: int, start: int}
	 */
	public static function browse( array $state, $per_page, array $exclude = array(), $with_views = false ) {
		$per_page = max( 1, (int) $per_page );
		$fast     = self::browse_page( $state, $per_page, $exclude, $with_views );
		if ( null !== $fast ) {
			return $fast;
		}
		$videos = self::videos( $state['search'] ?? '' );

		if ( $exclude ) {
			$videos = array_values(
				array_filter(
					$videos,
					function ( $video ) use ( $exclude ) {
						return ! in_array( $video['guid'], $exclude, true );
					}
				)
			);
		}

		$length = $state['length'] ?? 'any';
		if ( 'any' !== $length ) {
			$videos = array_values(
				array_filter(
					$videos,
					function ( $video ) use ( $length ) {
						return self::matches_length( (int) $video['durationMs'], $length );
					}
				)
			);
		}

		$sort = $state['sort'] ?? 'newest';
		if ( $with_views || 'popular' === $sort ) {
			$videos = self::with_views( $videos );
		}
		if ( 'popular' === $sort ) {
			// Most viewed first; equal counts keep upload order ( newest first ).
			$position = array_flip( array_keys( $videos ) );
			uksort(
				$videos,
				function ( $a, $b ) use ( $videos, $position ) {
					$diff = $videos[ $b ]['views'] - $videos[ $a ]['views'];
					return 0 !== $diff ? $diff : $position[ $a ] - $position[ $b ];
				}
			);
			$videos = array_values( $videos );
		} elseif ( 'oldest' === $sort ) {
			$videos = array_reverse( $videos );
		}

		$total = count( $videos );
		$pages = max( 1, (int) ceil( $total / $per_page ) );
		$page  = min( $pages, max( 1, (int) ( $state['page'] ?? 1 ) ) );
		$start = ( $page - 1 ) * $per_page;

		return array(
			'entries' => array_slice( $videos, $start, $per_page ),
			'total'   => $total,
			'page'    => $page,
			'pages'   => $pages,
			'start'   => $start,
		);
	}

	/**
	 * A browse() page straight from SQL: newest or oldest first, any length, and at
	 * most a few excluded videos on the first page. Null when the full list is
	 * needed ( popular, a length filter, exclusions elsewhere ) or already at hand.
	 *
	 * @param array    $state      From browse_request().
	 * @param int      $per_page   Page size.
	 * @param string[] $exclude    GUIDs to leave out.
	 * @param bool     $with_views Whether records need play counts.
	 *
	 * @return array|null Same shape as browse().
	 */
	private static function browse_page( array $state, $per_page, array $exclude, $with_views ) {
		$search = trim( (string) ( $state['search'] ?? '' ) );
		$sort   = $state['sort'] ?? 'newest';
		$page   = max( 1, (int) ( $state['page'] ?? 1 ) );
		if ( ! in_array( $sort, array( 'newest', 'oldest' ), true )
			|| 'any' !== ( $state['length'] ?? 'any' )
			|| ( $exclude && 1 !== $page )
			|| self::has_full_list( $search )
		) {
			return null;
		}

		$result = self::query_page( $search, 'oldest' === $sort ? 'ASC' : 'DESC', $per_page + count( $exclude ), $page );
		if ( null === $result ) {
			return null;
		}

		$records = $result['records'];
		$total   = $result['total'];
		if ( $exclude ) {
			$kept = array_values(
				array_filter(
					$records,
					function ( $video ) use ( $exclude ) {
						return ! in_array( $video['guid'], $exclude, true );
					}
				)
			);
			// An excluded video beyond this window would make the total wrong.
			if ( count( $records ) - count( $kept ) !== count( array_unique( $exclude ) ) && count( $records ) < $total ) {
				return null;
			}
			$total  -= count( $records ) - count( $kept );
			$records = array_slice( $kept, 0, $per_page );
		}

		$pages = max( 1, (int) ceil( $total / $per_page ) );
		if ( $page > $pages ) {
			return null;
		}

		return array(
			'entries' => $with_views ? self::with_views( $records ) : $records,
			'total'   => $total,
			'page'    => $page,
			'pages'   => $pages,
			'start'   => ( $page - 1 ) * $per_page,
		);
	}

	/**
	 * Whether a duration falls in a length bucket. Unknown durations match only "any".
	 *
	 * @param int    $duration_ms Duration.
	 * @param string $length      One of BROWSE_LENGTHS.
	 *
	 * @return bool
	 */
	public static function matches_length( $duration_ms, $length ) {
		if ( 'any' === $length ) {
			return true;
		}
		if ( $duration_ms <= 0 ) {
			return false;
		}
		switch ( $length ) {
			case 'short':
				return $duration_ms < self::SHORT_MAX_MS;
			case 'mid':
				return $duration_ms >= self::SHORT_MAX_MS && $duration_ms <= self::LONG_MIN_MS;
			case 'long':
				return $duration_ms > self::LONG_MIN_MS;
		}
		return true;
	}

	/**
	 * A video's display details from VideoPress, with the attachment as fallback.
	 *
	 * @param string           $guid       VideoPress GUID.
	 * @param int|WP_Post|null $attachment The attachment, when known.
	 *
	 * @return array{title: string, description: string, poster: string}
	 */
	public static function video_details( $guid, $attachment = null ) {
		$details = function_exists( 'videopress_get_video_details' ) && is_string( $guid ) && '' !== $guid ? videopress_get_video_details( $guid ) : null;
		$details = is_object( $details ) && ! is_wp_error( $details ) ? $details : null;
		$post    = null !== $attachment ? get_post( $attachment ) : ( $guid ? get_post( Channel::attachment_id( $guid ) ) : null );
		$post    = $post instanceof WP_Post ? $post : null;

		$title       = $details && ! empty( $details->title ) ? (string) $details->title : ( $post ? get_the_title( $post ) : '' );
		$description = $details && ! empty( $details->description ) ? (string) $details->description : ( $post ? (string) $post->post_content : '' );
		$poster      = $details && ! empty( $details->poster ) ? (string) $details->poster : '';

		return array(
			'title'       => $title,
			'description' => $description,
			'poster'      => $poster,
		);
	}

	/**
	 * The channel's handle, e.g. "@journeythroughforever".
	 *
	 * @return string
	 */
	public static function handle() {
		$host  = (string) wp_parse_url( home_url(), PHP_URL_HOST );
		$label = $host ? strtok( preg_replace( '/^www\./', '', $host ), '.' ) : '';

		/**
		 * Filters the channel handle shown in the channel details.
		 *
		 * @since 0.58.0
		 *
		 * @param string $handle "@" plus the first label of the site's host; empty for none.
		 */
		return (string) apply_filters( 'videopress_channel_handle', $label ? self::DEFAULT_HANDLE_PREFIX . $label : '' );
	}

	/**
	 * Subscriber count, or null when unknown.
	 *
	 * @return int|null
	 */
	public static function subscriber_count() {
		$count = function_exists( 'wpcom_subs_total_for_blog' ) ? wpcom_subs_total_for_blog() : self::fetch_subscriber_count();

		/**
		 * Filters the subscriber count shown in the channel details: WordPress.com's count, read
		 * directly on WordPress.com and through the site's connection elsewhere.
		 *
		 * @since 0.58.0
		 *
		 * @param int|null $count Subscribers, or null when unknown.
		 */
		$count = apply_filters( 'videopress_channel_subscriber_count', is_numeric( $count ) ? (int) $count : null );

		return is_numeric( $count ) ? max( 0, (int) $count ) : null;
	}

	/**
	 * Subscribers ( email subscribers plus social followers, like the Subscribe block counts them )
	 * from WordPress.com through the site's connection, cached for an hour.
	 *
	 * @return int|null Null when the site is not connected or the request failed.
	 */
	private static function fetch_subscriber_count() {
		$cached = get_transient( self::SUBSCRIBERS_TRANSIENT );
		if ( is_array( $cached ) && array_key_exists( 'count', $cached ) ) {
			return is_numeric( $cached['count'] ) ? (int) $cached['count'] : null;
		}

		$blog_id = (int) VideoPressToken::blog_id();
		$count   = $blog_id
			? self::parse_subscriber_counts(
				Client::wpcom_json_api_request_as_blog( sprintf( '/sites/%d/subscribers/counts', $blog_id ), '2', array( 'timeout' => 5 ), null, 'wpcom' )
			)
			: null;

		set_transient( self::SUBSCRIBERS_TRANSIENT, array( 'count' => $count ), null === $count ? self::SUBSCRIBERS_ERROR_TTL : self::SUBSCRIBERS_TTL );
		return $count;
	}

	/**
	 * The subscriber total in a `/sites/%d/subscribers/counts` response:
	 * `{ "counts": { "total_subscribers": 42, "social_followers": 9, … } }`.
	 *
	 * @param mixed $response HTTP response array or WP_Error.
	 *
	 * @return int|null
	 */
	public static function parse_subscriber_counts( $response ) {
		if ( is_wp_error( $response ) || ! is_array( $response ) || 200 !== (int) wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}
		$body   = json_decode( (string) wp_remote_retrieve_body( $response ), true );
		$counts = is_array( $body ) && isset( $body['counts'] ) && is_array( $body['counts'] ) ? $body['counts'] : null;
		if ( ! $counts || ! isset( $counts['total_subscribers'] ) || ! is_numeric( $counts['total_subscribers'] ) ) {
			return null;
		}
		$followers = isset( $counts['social_followers'] ) && is_numeric( $counts['social_followers'] ) ? (int) $counts['social_followers'] : 0;
		return max( 0, (int) $counts['total_subscribers'] + $followers );
	}

	/**
	 * Total plays of the channel's videos.
	 *
	 * @return int
	 */
	public static function total_views() {
		$ids   = array_flip( array_column( self::videos(), 'id' ) );
		$total = 0;
		foreach ( self::video_views() as $id => $count ) {
			if ( isset( $ids[ $id ] ) ) {
				$total += $count;
			}
		}
		return $total;
	}

	/**
	 * When the channel started: the site's registration date on a network,
	 * else its oldest published post. Unix time, 0 when unknown.
	 *
	 * @return int
	 */
	public static function joined() {
		$time = 0;
		if ( is_multisite() && function_exists( 'get_site' ) ) {
			$site = get_site();
			if ( $site && ! empty( $site->registered ) && '0000-00-00 00:00:00' !== $site->registered ) {
				$time = (int) strtotime( $site->registered . ' UTC' );
			}
		}
		if ( ! $time ) {
			$oldest = get_posts(
				array(
					'post_type'      => 'any',
					'post_status'    => 'publish',
					'orderby'        => 'date',
					'order'          => 'ASC',
					'posts_per_page' => 1,
				)
			);
			if ( $oldest && $oldest[0] instanceof WP_Post ) {
				$time = (int) strtotime( $oldest[0]->post_date_gmt . ' UTC' );
			}
		}

		/**
		 * Filters when the channel started, shown as "Joined".
		 *
		 * @since 0.58.0
		 *
		 * @param int $time Unix time, 0 when unknown.
		 */
		return max( 0, (int) apply_filters( 'videopress_channel_joined', $time ) );
	}

	/**
	 * A compact count: 950, 1.2K, 48K, 1.2M.
	 *
	 * @param int $count The number.
	 *
	 * @return string
	 */
	public static function compact_number( $count ) {
		$count = max( 0, (int) $count );
		if ( $count >= self::COMPACT_MILLION ) {
			/* translators: %s: a number of millions, e.g. 1.2 */
			return sprintf( __( '%sM', 'jetpack-videopress-pkg' ), number_format_i18n( $count / self::COMPACT_MILLION, 1 ) );
		}
		if ( $count >= self::COMPACT_TEN_THOUSAND ) {
			/* translators: %s: a number of thousands, e.g. 48 */
			return sprintf( __( '%sK', 'jetpack-videopress-pkg' ), number_format_i18n( floor( $count / self::COMPACT_THOUSAND ) ) );
		}
		if ( $count >= self::COMPACT_THOUSAND ) {
			/* translators: %s: a number of thousands, e.g. 1.2 */
			return sprintf( __( '%sK', 'jetpack-videopress-pkg' ), number_format_i18n( $count / self::COMPACT_THOUSAND, 1 ) );
		}
		return number_format_i18n( $count );
	}

	/**
	 * "3 days ago" for a unix time.
	 *
	 * @param int $time Unix time.
	 *
	 * @return string Empty when unknown.
	 */
	public static function ago( $time ) {
		$time = (int) $time;
		if ( $time <= 0 ) {
			return '';
		}
		/* translators: %s: a time span, e.g. "3 days". */
		return sprintf( __( '%s ago', 'jetpack-videopress-pkg' ), human_time_diff( $time, time() ) );
	}

	/**
	 * "12K views · 3 days ago", from a listing record.
	 *
	 * @param array $record     Record with views and publishedAt.
	 * @param bool  $full_count Whether to print the full view count ( 12,345 ) instead of the compact one.
	 *
	 * @return string
	 */
	public static function views_and_age( array $record, $full_count = false ) {
		$parts = array();
		if ( isset( $record['views'] ) ) {
			$views   = (int) $record['views'];
			$number  = $full_count ? number_format_i18n( $views ) : self::compact_number( $views );
			$parts[] = sprintf(
				/* translators: %s: number of views, e.g. "12K". */
				_n( '%s view', '%s views', $views, 'jetpack-videopress-pkg' ),
				$number
			);
		}
		$ago = self::ago( (int) ( $record['publishedAt'] ?? 0 ) );
		if ( '' !== $ago ) {
			$parts[] = $ago;
		}
		return implode( ' · ', $parts );
	}
}
