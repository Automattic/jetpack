<?php
/**
 * VideoPress Channel: the site-as-a-video-channel feature set.
 *
 * Registers the `playlist` taxonomy, caches each video's duration and view
 * count, extends the Query Loop with channel orderings and filters, exposes a
 * `videopress/channel` block-bindings source so core blocks can render channel
 * and video data, and resolves the post-sourced modes of the Video Playlist
 * block. A "video" is a post whose content contains a VideoPress video block.
 *
 * Enabled when the active theme declares `add_theme_support( 'videopress-channel' )`
 * or the `videopress_channel_enabled` filter returns true.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

use WP_Block;
use WP_Post;
use WP_Query;
use WP_Term;

/**
 * VideoPress Channel feature.
 */
class Channel {

	const TAXONOMY        = 'playlist';
	const META_DURATION   = 'videopress_duration';
	const META_VIEWS      = 'videopress_views';
	const TERM_FEATURED   = 'videopress_featured';
	const CRON_SYNC_VIEWS = 'videopress_channel_sync_views';
	const BINDINGS_SOURCE = 'videopress/channel';

	/**
	 * Whether the feature has been wired up in this request.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Hook the feature up. Registration itself waits for `init`, when the
	 * active theme is known.
	 *
	 * @return void
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( 'init', array( __CLASS__, 'register' ), 9 );
		add_action( 'after_switch_theme', array( __CLASS__, 'schedule_view_sync' ) );
		add_action( 'switch_theme', array( __CLASS__, 'unschedule_view_sync' ) );
		add_action( self::CRON_SYNC_VIEWS, array( __CLASS__, 'sync_views' ) );
	}

	/**
	 * Whether the channel feature is enabled for this site.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		$enabled = function_exists( 'current_theme_supports' ) && current_theme_supports( 'videopress-channel' );

		/**
		 * Filters whether the VideoPress Channel feature ( playlist taxonomy,
		 * channel block bindings, post-sourced playlists ) is enabled.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool $enabled True when the active theme supports `videopress-channel`.
		 */
		return (bool) apply_filters( 'videopress_channel_enabled', $enabled );
	}

	/**
	 * Register the taxonomy, meta, hooks and the block-bindings source.
	 *
	 * @return void
	 */
	public static function register() {
		if ( ! self::is_enabled() ) {
			return;
		}

		register_taxonomy(
			self::TAXONOMY,
			'post',
			array(
				'labels'            => array(
					'name'          => __( 'Playlists', 'jetpack-videopress-pkg' ),
					'singular_name' => __( 'Playlist', 'jetpack-videopress-pkg' ),
					'add_new_item'  => __( 'Add playlist', 'jetpack-videopress-pkg' ),
					'search_items'  => __( 'Search playlists', 'jetpack-videopress-pkg' ),
					'all_items'     => __( 'All playlists', 'jetpack-videopress-pkg' ),
					'edit_item'     => __( 'Edit playlist', 'jetpack-videopress-pkg' ),
					'not_found'     => __( 'No playlists found.', 'jetpack-videopress-pkg' ),
				),
				'public'            => true,
				'hierarchical'      => false,
				'show_in_rest'      => true,
				'show_admin_column' => true,
				'rewrite'           => array( 'slug' => self::TAXONOMY ),
			)
		);

		foreach ( array( self::META_DURATION, self::META_VIEWS ) as $key ) {
			register_post_meta(
				'post',
				$key,
				array(
					'type'          => 'integer',
					'single'        => true,
					'show_in_rest'  => true,
					'auth_callback' => function () {
						return current_user_can( 'edit_posts' );
					},
				)
			);
		}

		register_term_meta(
			self::TAXONOMY,
			self::TERM_FEATURED,
			array(
				'type'         => 'boolean',
				'single'       => true,
				'show_in_rest' => true,
			)
		);

		add_action( self::TAXONOMY . '_edit_form_fields', array( __CLASS__, 'featured_field' ) );
		add_action( 'edited_' . self::TAXONOMY, array( __CLASS__, 'save_featured_field' ) );
		add_action( 'save_post_post', array( __CLASS__, 'cache_duration' ), 10, 2 );
		add_filter( 'post_thumbnail_html', array( __CLASS__, 'poster_fallback' ), 10, 2 );
		add_filter( 'query_loop_block_query_vars', array( __CLASS__, 'query_loop_vars' ), 10, 2 );
		add_action( 'pre_get_posts', array( __CLASS__, 'playlist_archive_order' ) );

		if ( function_exists( 'register_block_bindings_source' ) ) {
			register_block_bindings_source(
				self::BINDINGS_SOURCE,
				array(
					'label'              => __( 'VideoPress Channel', 'jetpack-videopress-pkg' ),
					'get_value_callback' => array( __CLASS__, 'get_binding_value' ),
					'uses_context'       => array( 'postId' ),
				)
			);
		}
	}

	// ---- Data model ----

	/**
	 * "Featured on channel home" checkbox on the playlist edit screen.
	 *
	 * @param WP_Term $term The playlist being edited.
	 * @return void
	 */
	public static function featured_field( $term ) {
		$checked = get_term_meta( $term->term_id, self::TERM_FEATURED, true ) ? ' checked' : '';
		printf(
			'<tr class="form-field"><th scope="row">%1$s</th><td><label><input type="checkbox" name="%2$s" value="1"%3$s> %4$s</label>%5$s</td></tr>',
			esc_html__( 'Featured on channel home', 'jetpack-videopress-pkg' ),
			esc_attr( self::TERM_FEATURED ),
			$checked, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- literal.
			esc_html__( 'Show this playlist in the Featured playlist row', 'jetpack-videopress-pkg' ),
			wp_nonce_field( self::TERM_FEATURED, self::TERM_FEATURED . '_nonce', true, false ) // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- nonce markup.
		);
	}

	/**
	 * Save the featured checkbox.
	 *
	 * @param int $term_id The playlist.
	 * @return void
	 */
	public static function save_featured_field( $term_id ) {
		$nonce = self::TERM_FEATURED . '_nonce';
		if ( ! isset( $_POST[ $nonce ] ) || ! wp_verify_nonce( sanitize_key( $_POST[ $nonce ] ), self::TERM_FEATURED ) ) {
			return;
		}
		update_term_meta( (int) $term_id, self::TERM_FEATURED, ! empty( $_POST[ self::TERM_FEATURED ] ) );
	}

	/**
	 * The first VideoPress video block of a post, or null.
	 *
	 * @param WP_Post $post The post.
	 * @return array|null Parsed block.
	 */
	public static function first_video_block( $post ) {
		if ( ! $post instanceof WP_Post || '' === $post->post_content || false === strpos( $post->post_content, 'videopress/video' ) ) {
			return null;
		}
		foreach ( parse_blocks( $post->post_content ) as $block ) {
			if ( 'videopress/video' === $block['blockName'] ) {
				return $block;
			}
		}
		return null;
	}

	/**
	 * The GUID of a post's first VideoPress video, or an empty string.
	 *
	 * @param WP_Post $post The post.
	 * @return string
	 */
	public static function post_guid( $post ) {
		$block = self::first_video_block( $post );
		$guid  = $block && ! empty( $block['attrs']['guid'] ) ? (string) $block['attrs']['guid'] : '';
		return preg_match( '/^[a-zA-Z0-9]{8}$/', $guid ) ? $guid : '';
	}

	/**
	 * Cache the video duration ( seconds ) from the first VideoPress block when
	 * a post is saved. Filter `videopress_channel_video_duration` to override.
	 *
	 * @param int     $post_id The post.
	 * @param WP_Post $post    The post.
	 * @return void
	 */
	public static function cache_duration( $post_id, $post ) {
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}
		$block = self::first_video_block( $post );
		if ( ! $block ) {
			return;
		}
		$secs = 0;
		if ( ! empty( $block['attrs']['duration'] ) && is_numeric( $block['attrs']['duration'] ) ) {
			$secs = (int) round( (int) $block['attrs']['duration'] / 1000 );
		} elseif ( ! empty( $block['attrs']['id'] ) ) {
			$meta = wp_get_attachment_metadata( (int) $block['attrs']['id'] );
			if ( ! empty( $meta['length'] ) ) {
				$secs = (int) $meta['length'];
			} elseif ( ! empty( $meta['videopress']['duration'] ) ) {
				$secs = (int) round( $meta['videopress']['duration'] / 1000 );
			}
		}

		/**
		 * Filters the cached duration ( seconds ) of a channel video.
		 *
		 * @since $$next-version$$
		 *
		 * @param int   $secs    Duration in seconds, 0 when unknown.
		 * @param int   $post_id The post.
		 * @param array $block   The first VideoPress video block.
		 */
		$secs = (int) apply_filters( 'videopress_channel_video_duration', $secs, $post_id, $block );
		if ( $secs > 0 ) {
			update_post_meta( $post_id, self::META_DURATION, $secs );
		}
	}

	/**
	 * When a video post has no featured image, use the VideoPress poster of its
	 * first video block as the thumbnail so grids never show an empty card.
	 *
	 * @param string $html    The post thumbnail HTML.
	 * @param int    $post_id The post.
	 * @return string
	 */
	public static function poster_fallback( $html, $post_id ) {
		if ( '' !== $html ) {
			return $html;
		}
		$poster = self::post_poster( get_post( $post_id ) );
		if ( '' === $poster ) {
			return $html;
		}
		return '<img src="' . esc_url( $poster ) . '" alt="" loading="lazy" decoding="async" class="videopress-channel-poster" />';
	}

	/**
	 * The poster URL of a post's first VideoPress video, or an empty string.
	 *
	 * @param WP_Post|null $post The post.
	 * @return string
	 */
	public static function post_poster( $post ) {
		$block = self::first_video_block( $post );
		if ( ! $block ) {
			return '';
		}
		$poster = ! empty( $block['attrs']['poster'] ) ? (string) $block['attrs']['poster'] : '';
		if ( '' === $poster && ! empty( $block['attrs']['id'] ) ) {
			$meta = wp_get_attachment_metadata( (int) $block['attrs']['id'] );
			if ( ! empty( $meta['videopress']['poster'] ) ) {
				$poster = (string) $meta['videopress']['poster'];
			}
		}

		/**
		 * Filters the poster URL used for a channel video's thumbnail fallback.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $poster  Poster URL, possibly empty.
		 * @param int    $post_id The post.
		 * @param array  $block   The first VideoPress video block.
		 */
		return (string) apply_filters( 'videopress_channel_video_poster', $poster, $post->ID, $block );
	}

	/**
	 * Schedule the daily view sync.
	 *
	 * @return void
	 */
	public static function schedule_view_sync() {
		if ( self::is_enabled() && ! wp_next_scheduled( self::CRON_SYNC_VIEWS ) ) {
			wp_schedule_event( time(), 'daily', self::CRON_SYNC_VIEWS );
		}
	}

	/**
	 * Unschedule the daily view sync.
	 *
	 * @return void
	 */
	public static function unschedule_view_sync() {
		wp_clear_scheduled_hook( self::CRON_SYNC_VIEWS );
	}

	/**
	 * Sync view counts from Jetpack Stats ( WordPress.com Stats ) into post
	 * meta, used by the "popular" ordering. Filter `videopress_channel_post_views`
	 * to supply counts from elsewhere.
	 *
	 * @return void
	 */
	public static function sync_views() {
		if ( ! self::is_enabled() ) {
			return;
		}
		$ids = get_posts(
			array(
				'post_type'      => 'post',
				'posts_per_page' => 500, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- daily cron, ids only.
				'fields'         => 'ids',
			)
		);
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- optional automattic/jetpack-stats dependency, guarded by class_exists().
		$stats = class_exists( '\Automattic\Jetpack\Stats\WPCOM_Stats' ) ? new \Automattic\Jetpack\Stats\WPCOM_Stats() : null;
		foreach ( $ids as $id ) {
			$views = null;
			if ( $stats && method_exists( $stats, 'get_post_views' ) ) {
				// @phan-suppress-next-line PhanUndeclaredClassMethod -- see above.
				$result = $stats->get_post_views( (int) $id );
				if ( is_array( $result ) && isset( $result['views'] ) ) {
					$views = (int) $result['views'];
				} elseif ( is_object( $result ) && isset( $result->views ) ) {
					$views = (int) $result->views;
				}
			}

			/**
			 * Filters the view count synced into a channel video's meta.
			 *
			 * @since $$next-version$$
			 *
			 * @param int|null $views View count, null when unknown ( nothing is written ).
			 * @param int      $id    The post.
			 */
			$views = apply_filters( 'videopress_channel_post_views', $views, (int) $id );
			if ( null !== $views ) {
				update_post_meta( (int) $id, self::META_VIEWS, (int) $views );
			}
		}
	}

	// ---- Queries ----

	/**
	 * A sanitized query-string value.
	 *
	 * @param string $key           Query key.
	 * @param string $default_value Default.
	 * @return string
	 */
	public static function request_var( $key, $default_value = '' ) {
		return isset( $_GET[ $key ] ) ? sanitize_text_field( wp_unslash( $_GET[ $key ] ) ) : $default_value; // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only filters.
	}

	/**
	 * Query Loop extensions, set as custom keys on the block's "query" attribute:
	 *   "videopressOrder": "featured"           the sticky video, else the latest one
	 *   "videopressOrder": "popular"            most viewed first
	 *   "videopressOrder": "featured-playlist"  videos of the featured playlist, in order
	 *   "videopressOrder": "playlist"           videos of "videopressPlaylist" ( term id ), in order
	 *   "videopressFilters": true               read ?vp_s, vp_sort, vp_cat, vp_dur from the URL
	 *
	 * @param array    $query The WP_Query vars.
	 * @param WP_Block $block The Query Loop block.
	 * @return array
	 */
	public static function query_loop_vars( $query, $block ) {
		$context = isset( $block->context['query'] ) ? (array) $block->context['query'] : array();
		$mode    = isset( $context['videopressOrder'] ) ? (string) $context['videopressOrder'] : '';

		if ( 'featured' === $mode ) {
			$sticky = array_filter( array_map( 'intval', (array) get_option( 'sticky_posts' ) ) );
			if ( ! empty( $sticky ) ) {
				$query['post__in']            = $sticky;
				$query['ignore_sticky_posts'] = 1;
			}
			$query['orderby']        = 'date';
			$query['order']          = 'DESC';
			$query['posts_per_page'] = 1;
		}

		if ( 'popular' === $mode ) {
			$query['meta_key']            = self::META_VIEWS; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			$query['orderby']             = 'meta_value_num';
			$query['order']               = 'DESC';
			$query['ignore_sticky_posts'] = 1;
		}

		if ( 'featured-playlist' === $mode || 'playlist' === $mode ) {
			$term = 'playlist' === $mode && ! empty( $context['videopressPlaylist'] )
				? get_term( (int) $context['videopressPlaylist'], self::TAXONOMY )
				: self::featured_playlist();
			if ( $term instanceof WP_Term ) {
				$query['tax_query']           = array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
					array(
						'taxonomy' => self::TAXONOMY,
						'terms'    => $term->term_id,
					),
				);
				$query['orderby']             = 'date';
				$query['order']               = 'ASC';
				$query['ignore_sticky_posts'] = 1;
			} else {
				$query['post__in'] = array( 0 );
			}
		}

		if ( ! empty( $context['videopressFilters'] ) ) {
			$query['ignore_sticky_posts'] = 1;
			$sort                         = self::request_var( 'vp_sort', 'latest' );
			if ( 'popular' === $sort ) {
				$query['meta_key'] = self::META_VIEWS; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				$query['orderby']  = 'meta_value_num';
				$query['order']    = 'DESC';
			} else {
				$query['orderby'] = 'date';
				$query['order']   = 'oldest' === $sort ? 'ASC' : 'DESC';
			}
			$cat = self::request_var( 'vp_cat' );
			if ( '' !== $cat ) {
				$query['category_name'] = $cat;
			}
			$search = self::request_var( 'vp_s' );
			if ( '' !== $search ) {
				$query['s'] = $search;
			}
			$ranges = array(
				'short' => array( 0, 1199 ),
				'mid'   => array( 1200, 2700 ),
				'long'  => array( 2701, PHP_INT_MAX ),
			);
			$dur    = self::request_var( 'vp_dur' );
			if ( isset( $ranges[ $dur ] ) ) {
				$query['meta_query'] = array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_query
					array(
						'key'     => self::META_DURATION,
						'value'   => $ranges[ $dur ],
						'compare' => 'BETWEEN',
						'type'    => 'NUMERIC',
					),
				);
			}
		}

		return $query;
	}

	/**
	 * A playlist archive lists its videos in episode order ( oldest first ).
	 *
	 * @param WP_Query $query The main query.
	 * @return void
	 */
	public static function playlist_archive_order( $query ) {
		if ( ! is_admin() && $query->is_main_query() && $query->is_tax( self::TAXONOMY ) ) {
			$query->set( 'orderby', 'date' );
			$query->set( 'order', 'ASC' );
		}
	}

	// ---- Channel data helpers ----

	/**
	 * 12,480 → 12K, 1,234 → 1.2K, 2,100,000 → 2.1M.
	 *
	 * @param int $n Count.
	 * @return string
	 */
	public static function format_count( $n ) {
		$n = (int) $n;
		if ( $n >= 1000000 ) {
			return round( $n / 1000000, 1 ) . 'M';
		}
		if ( $n >= 10000 ) {
			return round( $n / 1000 ) . 'K';
		}
		if ( $n >= 1000 ) {
			return round( $n / 1000, 1 ) . 'K';
		}
		return (string) $n;
	}

	/**
	 * Seconds → m:ss or h:mm:ss.
	 *
	 * @param int $seconds Duration.
	 * @return string Empty when unknown.
	 */
	public static function format_duration( $seconds ) {
		$seconds = (int) $seconds;
		if ( $seconds <= 0 ) {
			return '';
		}
		$h = intdiv( $seconds, 3600 );
		$m = intdiv( $seconds % 3600, 60 );
		$s = $seconds % 60;
		return $h > 0 ? sprintf( '%d:%02d:%02d', $h, $m, $s ) : sprintf( '%d:%02d', $m, $s );
	}

	/**
	 * "3 weeks ago".
	 *
	 * @param int $timestamp Unix time ( GMT ).
	 * @return string
	 */
	public static function ago( $timestamp ) {
		/* translators: %s: human-readable time difference, e.g. "3 weeks". */
		return sprintf( __( '%s ago', 'jetpack-videopress-pkg' ), human_time_diff( (int) $timestamp ) );
	}

	/**
	 * Number of published videos ( posts ).
	 *
	 * @return int
	 */
	public static function video_count() {
		$counts = wp_count_posts( 'post' );
		return isset( $counts->publish ) ? (int) $counts->publish : 0;
	}

	/**
	 * Number of non-empty playlists.
	 *
	 * @return int
	 */
	public static function playlist_count() {
		$count = wp_count_terms(
			array(
				'taxonomy'   => self::TAXONOMY,
				'hide_empty' => true,
			)
		);
		return is_wp_error( $count ) ? 0 : (int) $count;
	}

	/**
	 * Subscriber count of the site: WordPress.com's, else whatever the
	 * `videopress_channel_subscriber_count` filter supplies.
	 *
	 * @return int|null
	 */
	public static function subscriber_count() {
		$count = null;
		if ( function_exists( 'wpcom_subs_total_for_blog' ) ) {
			$total = wpcom_subs_total_for_blog();
			$count = false === $total ? null : (int) $total;
		}

		/**
		 * Filters the subscriber count shown by the channel bindings.
		 *
		 * @since $$next-version$$
		 *
		 * @param int|null $count Subscriber count, null when unknown.
		 */
		$count = apply_filters( 'videopress_channel_subscriber_count', $count );
		return null === $count ? null : (int) $count;
	}

	/**
	 * The channel handle: "@mychannel" for mychannel.wordpress.com. Filter
	 * `videopress_channel_handle` to override.
	 *
	 * @return string
	 */
	public static function handle() {
		$host   = (string) wp_parse_url( home_url( '/' ), PHP_URL_HOST );
		$label  = strtok( $host, '.' );
		$handle = $label ? '@' . $label : '';

		/**
		 * Filters the channel handle shown by the channel bindings.
		 *
		 * @since $$next-version$$
		 *
		 * @param string $handle The handle, "@" + the site's first host label.
		 */
		return (string) apply_filters( 'videopress_channel_handle', $handle );
	}

	/**
	 * The playlist featured on the channel home: the one ticked as featured,
	 * else the largest one.
	 *
	 * @return WP_Term|null
	 */
	public static function featured_playlist() {
		$terms = get_terms(
			array(
				'taxonomy'   => self::TAXONOMY,
				'number'     => 1,
				'hide_empty' => true,
				'meta_key'   => self::TERM_FEATURED, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
				'meta_value' => '1', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			)
		);
		if ( empty( $terms ) || is_wp_error( $terms ) ) {
			$terms = get_terms(
				array(
					'taxonomy'   => self::TAXONOMY,
					'number'     => 1,
					'hide_empty' => true,
					'orderby'    => 'count',
					'order'      => 'DESC',
				)
			);
		}
		$first = is_array( $terms ) ? reset( $terms ) : null;
		return $first instanceof WP_Term ? $first : null;
	}

	/**
	 * The first playlist a video belongs to.
	 *
	 * @param int $post_id The video.
	 * @return WP_Term|null
	 */
	public static function post_playlist( $post_id ) {
		$terms = get_the_terms( (int) $post_id, self::TAXONOMY );
		$first = is_array( $terms ) ? reset( $terms ) : null;
		return $first instanceof WP_Term ? $first : null;
	}

	/**
	 * Every video of a playlist in episode order ( oldest first ).
	 *
	 * @param WP_Term $term The playlist.
	 * @return WP_Post[]
	 */
	public static function playlist_videos( $term ) {
		return get_posts(
			array(
				'post_type'      => 'post',
				'posts_per_page' => 200, // phpcs:ignore WordPress.WP.PostsPerPage.posts_per_page_posts_per_page -- one playlist's videos.
				'orderby'        => 'date',
				'order'          => 'ASC',
				'tax_query'      => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
					array(
						'taxonomy' => self::TAXONOMY,
						'terms'    => $term->term_id,
					),
				),
			)
		);
	}

	/**
	 * Latest video of a playlist ( for its thumbnail and "Updated" date ).
	 *
	 * @param WP_Term $term The playlist.
	 * @return WP_Post|null
	 */
	public static function playlist_latest( $term ) {
		$posts = get_posts(
			array(
				'post_type'      => 'post',
				'posts_per_page' => 1,
				'tax_query'      => array( // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_tax_query
					array(
						'taxonomy' => self::TAXONOMY,
						'terms'    => $term->term_id,
					),
				),
			)
		);
		$first = reset( $posts );
		return $first instanceof WP_Post ? $first : null;
	}

	/**
	 * Total runtime of a list of videos: "4 h 12 min" / "48 min", or empty.
	 *
	 * @param WP_Post[] $posts Videos.
	 * @return string
	 */
	public static function runtime( $posts ) {
		$secs = 0;
		foreach ( $posts as $post ) {
			$secs += (int) get_post_meta( $post->ID, self::META_DURATION, true );
		}
		if ( $secs <= 0 ) {
			return '';
		}
		$mins = max( 1, (int) round( $secs / 60 ) );
		if ( $mins >= 60 ) {
			/* translators: 1: hours, 2: minutes */
			return sprintf( __( '%1$d h %2$d min', 'jetpack-videopress-pkg' ), intdiv( $mins, 60 ), $mins % 60 );
		}
		/* translators: %d: minutes */
		return sprintf( __( '%d min', 'jetpack-videopress-pkg' ), $mins );
	}

	/**
	 * A video's episode number: its position in its playlist, else its
	 * position on the channel by publish date ( 1 = the first video ).
	 *
	 * @param int $post_id The video.
	 * @return int
	 */
	public static function episode_number( $post_id ) {
		$post_id  = (int) $post_id;
		$playlist = self::post_playlist( $post_id );
		if ( $playlist ) {
			foreach ( self::playlist_videos( $playlist ) as $index => $video ) {
				if ( (int) $video->ID === $post_id ) {
					return $index + 1;
				}
			}
		}
		$post = get_post( $post_id );
		if ( ! $post instanceof WP_Post ) {
			return 1;
		}
		$earlier = new WP_Query(
			array(
				'post_type'      => 'post',
				'post_status'    => 'publish',
				'posts_per_page' => 1,
				'fields'         => 'ids',
				'date_query'     => array(
					array(
						'before'    => $post->post_date,
						'inclusive' => false,
					),
				),
			)
		);
		return (int) $earlier->found_posts + 1;
	}

	/**
	 * "12K views · 3 weeks ago" ( or just the date when views are unknown ).
	 *
	 * @param WP_Post $post The video.
	 * @param bool    $long Full view count ( 12,480 ) instead of 12K.
	 * @return string
	 */
	public static function video_stats( $post, $long = false ) {
		$parts = array();
		$views = get_post_meta( $post->ID, self::META_VIEWS, true );
		if ( '' !== $views && null !== $views ) {
			$count = $long ? number_format_i18n( (int) $views ) : self::format_count( (int) $views );
			/* translators: %s: view count, e.g. "12K" or "12,480" */
			$parts[] = sprintf( __( '%s views', 'jetpack-videopress-pkg' ), $count );
		}
		$parts[] = self::ago( (int) get_post_time( 'U', true, $post ) );
		return implode( ' · ', $parts );
	}

	/**
	 * Category names of a video ( for eyebrows ), excluding the default one.
	 *
	 * @param WP_Post $post The video.
	 * @return string
	 */
	public static function category_names( $post ) {
		$default = (int) get_option( 'default_category' );
		$names   = array();
		foreach ( (array) get_the_category( $post->ID ) as $category ) {
			if ( (int) $category->term_id !== $default && '' !== $category->name ) {
				$names[] = $category->name;
			}
		}
		return implode( ', ', $names );
	}

	// ---- Block bindings ----

	/**
	 * The current post for a bound block, from context or the loop.
	 *
	 * @param WP_Block|null $block_instance The block.
	 * @return WP_Post|null
	 */
	private static function bound_post( $block_instance ) {
		$id   = $block_instance instanceof WP_Block && isset( $block_instance->context['postId'] ) ? (int) $block_instance->context['postId'] : (int) get_the_ID();
		$post = $id ? get_post( $id ) : null;
		return $post instanceof WP_Post ? $post : null;
	}

	/**
	 * The playlist a bound block refers to: the queried playlist on its
	 * archive, else the current post's playlist.
	 *
	 * @param WP_Block|null $block_instance The block.
	 * @return WP_Term|null
	 */
	private static function bound_playlist( $block_instance ) {
		$queried = get_queried_object();
		if ( $queried instanceof WP_Term && self::TAXONOMY === $queried->taxonomy ) {
			return $queried;
		}
		$post = self::bound_post( $block_instance );
		return $post ? self::post_playlist( $post->ID ) : null;
	}

	/**
	 * Value of a `videopress/channel` binding. Keys:
	 *   video.duration, video.stats, video.stats_long, video.views, video.eyebrow, video.poster, video.url
	 *   channel.name, channel.handle, channel.stats, channel.videos, channel.playlists, channel.video_count, channel.playlist_count,
	 *   channel.subscribers, channel.joined, channel.total_views, channel.url, channel.subscribe_url
	 *   featured_playlist.name, .description, .count, .runtime, .meta, .url, .poster, .play_url
	 *   playlist.name, .description, .count, .runtime, .meta, .url, .poster, .play_url
	 *
	 * @param array         $source_args    Binding arguments; `key` selects the value.
	 * @param WP_Block|null $block_instance The bound block.
	 * @param string        $attribute_name The bound attribute.
	 * @return string|null Null lets the block keep its own content.
	 */
	public static function get_binding_value( $source_args, $block_instance = null, $attribute_name = '' ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$key = isset( $source_args['key'] ) ? (string) $source_args['key'] : '';
		if ( '' === $key ) {
			return null;
		}
		list( $group, $field ) = array_pad( explode( '.', $key, 2 ), 2, '' );

		switch ( $group ) {
			case 'video':
				$post = self::bound_post( $block_instance );
				if ( ! $post ) {
					return null;
				}
				switch ( $field ) {
					case 'duration':
						return self::format_duration( (int) get_post_meta( $post->ID, self::META_DURATION, true ) );
					case 'stats':
						return self::video_stats( $post );
					case 'stats_long':
						return self::video_stats( $post, true );
					case 'views':
						$views = get_post_meta( $post->ID, self::META_VIEWS, true );
						/* translators: %s: view count, e.g. "12K" */
						return '' === $views || null === $views ? '' : sprintf( __( '%s views', 'jetpack-videopress-pkg' ), self::format_count( (int) $views ) );
					case 'eyebrow':
						/* translators: %d: the video's episode number */
						$parts = array( sprintf( __( 'Episode %d', 'jetpack-videopress-pkg' ), self::episode_number( $post->ID ) ) );
						$cats  = self::category_names( $post );
						if ( '' !== $cats ) {
							$parts[] = $cats;
						}
						return implode( ' · ', $parts );
					case 'poster':
						$poster = get_the_post_thumbnail_url( $post, 'large' );
						return $poster ? (string) $poster : self::post_poster( $post );
					case 'url':
						return (string) get_permalink( $post );
				}
				return null;

			case 'channel':
				switch ( $field ) {
					case 'name':
						return (string) get_bloginfo( 'name' );
					case 'handle':
						return self::handle();
					case 'videos':
						return (string) self::video_count();
					case 'playlists':
						return (string) self::playlist_count();
					case 'video_count':
						$count = self::video_count();
						/* translators: %d: number of videos */
						return sprintf( _n( '%d video', '%d videos', $count, 'jetpack-videopress-pkg' ), $count );
					case 'playlist_count':
						$count = self::playlist_count();
						/* translators: %d: number of playlists */
						return sprintf( _n( '%d playlist', '%d playlists', $count, 'jetpack-videopress-pkg' ), $count );
					case 'stats':
						return implode( ' · ', array_filter( array( self::handle(), self::get_binding_value( array( 'key' => 'channel.video_count' ) ), self::get_binding_value( array( 'key' => 'channel.playlist_count' ) ) ) ) );
					case 'subscribers':
						$subs = self::subscriber_count();
						if ( null === $subs ) {
							return self::get_binding_value( array( 'key' => 'channel.video_count' ) );
						}
						/* translators: %s: subscriber count, e.g. "48.2K" */
						return sprintf( __( '%s subscribers', 'jetpack-videopress-pkg' ), self::format_count( $subs ) );
					case 'joined':
						$first = get_posts(
							array(
								'post_type'      => 'post',
								'posts_per_page' => 1,
								'order'          => 'ASC',
								'orderby'        => 'date',
							)
						);
						return ! empty( $first ) ? (string) get_the_date( '', $first[0] ) : '';
					case 'total_views':
						global $wpdb;
						$views = (int) $wpdb->get_var( $wpdb->prepare( "SELECT SUM(meta_value) FROM {$wpdb->postmeta} WHERE meta_key = %s", self::META_VIEWS ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
						return $views ? self::format_count( $views ) : '';
					case 'url':
						return home_url( '/' );
					case 'subscribe_url':
						return home_url( '/#subscribe' );
				}
				return null;

			case 'featured_playlist':
			case 'playlist':
				$term = 'playlist' === $group ? self::bound_playlist( $block_instance ) : self::featured_playlist();
				if ( ! $term ) {
					return '';
				}
				switch ( $field ) {
					case 'name':
						return $term->name;
					case 'description':
						return $term->description;
					case 'count':
						/* translators: %d: number of videos in the playlist */
						return sprintf( _n( '%d video', '%d videos', (int) $term->count, 'jetpack-videopress-pkg' ), (int) $term->count );
					case 'runtime':
						return self::runtime( self::playlist_videos( $term ) );
					case 'meta':
						$videos = self::playlist_videos( $term );
						$meta   = array( self::get_binding_value( array( 'key' => $group . '.count' ), $block_instance ) );
						$rt     = self::runtime( $videos );
						if ( '' !== $rt ) {
							$meta[] = $rt;
						}
						$latest = ! empty( $videos ) ? end( $videos ) : null;
						if ( $latest ) {
							/* translators: %s: time ago, e.g. "3 weeks ago" */
							$meta[] = sprintf( __( 'Updated %s', 'jetpack-videopress-pkg' ), self::ago( (int) get_post_time( 'U', true, $latest ) ) );
						}
						return implode( ' · ', $meta );
					case 'url':
						$link = get_term_link( $term );
						return is_wp_error( $link ) ? '' : (string) $link;
					case 'poster':
						$latest = self::playlist_latest( $term );
						$poster = $latest ? get_the_post_thumbnail_url( $latest, 'large' ) : '';
						return $poster ? (string) $poster : ( $latest ? self::post_poster( $latest ) : '' );
					case 'play_url':
						$videos = self::playlist_videos( $term );
						return ! empty( $videos ) ? (string) get_permalink( $videos[0] ) : '';
				}
				return null;
		}

		return null;
	}

	// ---- Post-sourced playlists ( Video Playlist block `source` attribute ) ----

	/**
	 * Valid `source` values of the Video Playlist block.
	 *
	 * @return string[]
	 */
	public static function playlist_sources() {
		return array( 'manual', 'latest', 'popular', 'playlist', 'current-playlist', 'featured-playlist' );
	}

	/**
	 * The posts a post-sourced Video Playlist block lists.
	 *
	 * @param array    $attributes Block attributes ( source, playlistId, limit, excludeCurrent ).
	 * @param int|null $post_id    The post the block renders in, if any.
	 * @return WP_Post[]
	 */
	public static function playlist_source_posts( $attributes, $post_id = null ) {
		$source = isset( $attributes['source'] ) && in_array( $attributes['source'], self::playlist_sources(), true ) ? $attributes['source'] : 'manual';
		$limit  = isset( $attributes['limit'] ) ? (int) $attributes['limit'] : 0;
		$posts  = array();

		switch ( $source ) {
			case 'latest':
			case 'popular':
				$args = array(
					'post_type'           => 'post',
					'posts_per_page'      => $limit > 0 ? $limit + 1 : 50,
					'ignore_sticky_posts' => 1,
				);
				if ( 'popular' === $source ) {
					$args['meta_key'] = self::META_VIEWS; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
					$args['orderby']  = 'meta_value_num';
					$args['order']    = 'DESC';
				}
				$posts = get_posts( $args );
				break;
			case 'playlist':
			case 'current-playlist':
			case 'featured-playlist':
				$term = null;
				if ( 'playlist' === $source && ! empty( $attributes['playlistId'] ) ) {
					$term = get_term( (int) $attributes['playlistId'], self::TAXONOMY );
				} elseif ( 'featured-playlist' === $source ) {
					$term = self::featured_playlist();
				} else {
					$queried = get_queried_object();
					if ( $queried instanceof WP_Term && self::TAXONOMY === $queried->taxonomy ) {
						$term = $queried;
					} elseif ( $post_id ) {
						$term = self::post_playlist( (int) $post_id );
					}
				}
				$posts = $term instanceof WP_Term ? self::playlist_videos( $term ) : array();
				break;
		}

		/**
		 * Filters the posts a post-sourced Video Playlist block lists, before
		 * `excludeCurrent` and `limit` apply.
		 *
		 * @since $$next-version$$
		 *
		 * @param WP_Post[] $posts      The posts.
		 * @param array     $attributes Block attributes.
		 * @param int|null  $post_id    The post the block renders in.
		 */
		$posts = (array) apply_filters( 'videopress_channel_playlist_source_posts', $posts, $attributes, $post_id );

		if ( ! empty( $attributes['excludeCurrent'] ) && $post_id ) {
			$kept = array();
			foreach ( $posts as $post ) {
				if ( (int) $post->ID !== (int) $post_id ) {
					$kept[] = $post;
				}
			}
			$posts = $kept;
		}
		if ( $limit > 0 ) {
			$posts = array_slice( $posts, 0, $limit );
		}
		return $posts;
	}

	/**
	 * The player-layout entries ( guid, durationMs, height, title ) for a
	 * post-sourced Video Playlist block. Posts without a VideoPress video are skipped.
	 *
	 * @param WP_Post[] $posts The posts.
	 * @return array
	 */
	public static function playlist_entries_from_posts( $posts ) {
		$entries = array();
		foreach ( $posts as $post ) {
			$guid = self::post_guid( $post );
			if ( '' === $guid ) {
				continue;
			}
			$block     = self::first_video_block( $post );
			$secs      = (int) get_post_meta( $post->ID, self::META_DURATION, true );
			$entries[] = array(
				'guid'       => $guid,
				'durationMs' => $secs > 0 ? $secs * 1000 : ( ! empty( $block['attrs']['duration'] ) ? (int) $block['attrs']['duration'] : 0 ),
				'height'     => 0,
				'title'      => get_the_title( $post ),
			);
		}
		return $entries;
	}

	/**
	 * Render the `list` and `queue` layouts of a post-sourced Video Playlist
	 * block: compact rows linking to each video's page.
	 *
	 * @param WP_Post[] $posts      The posts.
	 * @param array     $attributes Block attributes.
	 * @param int|null  $post_id    The post the block renders in ( marks the current row ).
	 * @return string
	 */
	public static function render_playlist_rows( $posts, $attributes, $post_id = null ) {
		if ( empty( $posts ) ) {
			return '';
		}
		$layout    = isset( $attributes['layout'] ) && 'queue' === $attributes['layout'] ? 'queue' : 'list';
		$show_meta = ! isset( $attributes['showMeta'] ) || (bool) $attributes['showMeta'];
		$show_num  = ! empty( $attributes['showPositionNumber'] ) || 'queue' === $layout;
		$show_dur  = ! isset( $attributes['showDuration'] ) || (bool) $attributes['showDuration'];

		$items = '';
		foreach ( $posts as $index => $post ) {
			$current = $post_id && (int) $post->ID === (int) $post_id;
			$thumb   = get_the_post_thumbnail(
				$post,
				'medium_large',
				array(
					'loading' => 'lazy',
					'alt'     => '',
				)
			);
			$secs    = (int) get_post_meta( $post->ID, self::META_DURATION, true );
			$marker  = $show_num ? '<span class="videopress-playlist__entry-number">' . esc_html( $current ? '▶' : (string) ( $index + 1 ) ) . '</span>' : '';
			$time    = $show_dur && $secs > 0 ? '<span class="videopress-playlist__entry-time">' . esc_html( self::format_duration( $secs ) ) . '</span>' : '';
			$meta    = $show_meta ? '<span class="videopress-playlist__entry-meta">' . esc_html( self::video_stats( $post ) ) . '</span>' : '';
			$items  .= sprintf(
				'<li class="videopress-playlist__entry%1$s"><a class="videopress-playlist__link" href="%2$s"%3$s>%4$s<span class="videopress-playlist__entry-thumb">%5$s%6$s</span><span class="videopress-playlist__entry-body"><span class="videopress-playlist__entry-title">%7$s</span>%8$s</span></a></li>',
				$current ? ' is-current' : '',
				esc_url( (string) get_permalink( $post ) ),
				$current ? ' aria-current="page"' : '',
				$marker,
				'' !== $thumb ? $thumb : '<span class="videopress-playlist__entry-placeholder"></span>',
				$time,
				esc_html( get_the_title( $post ) ),
				$meta
			);
		}

		$header = '';
		if ( 'queue' === $layout ) {
			$term     = null;
			$position = 0;
			foreach ( $posts as $index => $post ) {
				if ( $post_id && (int) $post->ID === (int) $post_id ) {
					$position = $index + 1;
				}
			}
			$queried = get_queried_object();
			if ( $queried instanceof WP_Term && self::TAXONOMY === $queried->taxonomy ) {
				$term = $queried;
			} elseif ( $post_id ) {
				$term = self::post_playlist( (int) $post_id );
			}
			if ( ! empty( $attributes['playlistId'] ) ) {
				$maybe = get_term( (int) $attributes['playlistId'], self::TAXONOMY );
				$term  = $maybe instanceof WP_Term ? $maybe : $term;
			}
			$runtime = self::runtime( $posts );
			$state   = sprintf( '%d / %d', $position, count( $posts ) ) . ( '' !== $runtime ? ' · ' . $runtime : '' );
			$name    = '';
			if ( $term instanceof WP_Term ) {
				$link = get_term_link( $term );
				$name = is_wp_error( $link )
					? '<span class="videopress-playlist__queue-name">' . esc_html( $term->name ) . '</span>'
					: '<a class="videopress-playlist__queue-name" href="' . esc_url( $link ) . '">' . esc_html( $term->name ) . '</a>';
			}
			$header = '<div class="videopress-playlist__list-header"><span class="videopress-playlist__list-label">' . esc_html__( 'Playlist', 'jetpack-videopress-pkg' ) . '</span>' . $name . '<span class="videopress-playlist__list-progress">' . esc_html( $state ) . '</span></div>';
		}

		$wrapper = get_block_wrapper_attributes( array( 'class' => 'videopress-playlist is-layout-' . $layout . ' is-linked' ) );
		return '<figure ' . $wrapper . '><div class="videopress-playlist__list">' . $header . '<ol class="videopress-playlist__entries">' . $items . '</ol></div></figure>';
	}

	// ---- `videopress/playlists` block ----

	/**
	 * Register the Playlists block ( a grid of the site's playlists ).
	 *
	 * @param string|null $metadata_file Path to block.json; defaults to the package build output.
	 * @return void
	 */
	public static function register_playlists_block( $metadata_file = null ) {
		if ( null === $metadata_file ) {
			$metadata_file = __DIR__ . '/../build/block-editor/blocks/playlists/block.json';
		}
		if ( ! file_exists( $metadata_file ) || \WP_Block_Type_Registry::get_instance()->is_registered( 'videopress/playlists' ) ) {
			return;
		}
		register_block_type(
			$metadata_file,
			array(
				'render_callback' => array( __CLASS__, 'render_playlists_block' ),
			)
		);
	}

	/**
	 * Playlists block render callback: playlist cards, most recently updated first.
	 *
	 * @param array $attributes Block attributes ( limit, showDescription, excludeCurrent, compact ).
	 * @return string
	 */
	public static function render_playlists_block( $attributes ) {
		$args    = array(
			'taxonomy'   => self::TAXONOMY,
			'hide_empty' => true,
		);
		$queried = get_queried_object();
		if ( ! empty( $attributes['excludeCurrent'] ) && $queried instanceof WP_Term && self::TAXONOMY === $queried->taxonomy ) {
			$args['exclude'] = array( $queried->term_id );
		}
		$terms = get_terms( $args );
		if ( ! is_array( $terms ) || empty( $terms ) ) {
			return '<p ' . get_block_wrapper_attributes( array( 'class' => 'videopress-playlists is-empty' ) ) . '>' . esc_html__( 'No playlists yet. Add videos to a playlist from the post editor to see it here.', 'jetpack-videopress-pkg' ) . '</p>';
		}

		$dated = array();
		foreach ( $terms as $term ) {
			$latest  = self::playlist_latest( $term );
			$dated[] = array( $latest ? (int) get_post_time( 'U', true, $latest ) : 0, $term, $latest );
		}
		usort(
			$dated,
			function ( $a, $b ) {
				return $b[0] <=> $a[0];
			}
		);
		$limit = isset( $attributes['limit'] ) ? (int) $attributes['limit'] : 0;
		if ( $limit > 0 ) {
			$dated = array_slice( $dated, 0, $limit );
		}

		$compact   = ! empty( $attributes['compact'] );
		$show_desc = ! empty( $attributes['showDescription'] );
		$html      = '';
		foreach ( $dated as $entry ) {
			list( , $term, $latest ) = $entry;
			$link                    = get_term_link( $term );
			$thumb                   = $latest ? get_the_post_thumbnail(
				$latest,
				'large',
				array(
					'loading' => 'lazy',
					'alt'     => '',
				)
			) : '';
			/* translators: %d: number of videos in the playlist */
			$count = sprintf( _n( '%d video', '%d videos', (int) $term->count, 'jetpack-videopress-pkg' ), (int) $term->count );
			$html .= '<a class="videopress-playlists__card" href="' . esc_url( is_wp_error( $link ) ? '' : $link ) . '">';
			if ( ! $compact ) {
				$html .= '<span class="videopress-playlists__stack" aria-hidden="true"><span></span><span></span></span>';
			}
			$html .= '<span class="videopress-playlists__thumb">' . $thumb . '<span class="videopress-playlists__count">' . esc_html( $count ) . '</span></span>';
			$html .= '<span class="videopress-playlists__name">' . esc_html( $term->name ) . '</span>';
			if ( ! $compact ) {
				if ( $show_desc && '' !== $term->description ) {
					$html .= '<span class="videopress-playlists__description">' . esc_html( $term->description ) . '</span>';
				}
				if ( $latest ) {
					/* translators: %s: time ago, e.g. "3 weeks ago" */
					$html .= '<span class="videopress-playlists__updated">' . esc_html( sprintf( __( 'Updated %s', 'jetpack-videopress-pkg' ), self::ago( (int) get_post_time( 'U', true, $latest ) ) ) ) . '</span>';
				}
			}
			$html .= '</a>';
		}

		return '<div ' . get_block_wrapper_attributes( array( 'class' => 'videopress-playlists' . ( $compact ? ' is-compact' : '' ) ) ) . '>' . $html . '</div>';
	}
}
