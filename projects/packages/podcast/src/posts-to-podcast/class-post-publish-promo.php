<?php
/**
 * Post-publish "Create AI Podcast" promo for the block editor.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast\Posts_To_Podcast;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Status\Host;

/**
 * Renders a one-time modal in the post block editor after a post is published,
 * inviting eligible authors to turn their recent posts into a podcast episode.
 */
class Post_Publish_Promo {

	const SCRIPT_HANDLE    = 'jetpack-post-publish-podcast-promo';
	const DISMISSED_OPTION = 'jetpack_posts_to_podcast_post_publish_promo_dismissed';
	const MIN_POSTS        = 5;
	const MIN_VISITORS     = 50;

	/**
	 * Whether `init()` has wired its hooks.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Wire admin hooks. Idempotent.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;

		add_action( 'enqueue_block_editor_assets', array( __CLASS__, 'enqueue_assets' ) );
	}

	/**
	 * Enqueue the post-publish modal in the post block editor for eligible sites.
	 */
	public static function enqueue_assets() {
		if (
			! self::is_post_block_editor()
			|| self::is_current_post_published()
			|| ! self::is_site_eligible()
		) {
			return;
		}

		Assets::register_script(
			self::SCRIPT_HANDLE,
			'../../dist/blocks/post-publish-podcast-promo/editor.js',
			__FILE__,
			array(
				'enqueue'    => true,
				'in_footer'  => true,
				'textdomain' => 'jetpack-podcast',
			)
		);

		wp_add_inline_script(
			self::SCRIPT_HANDLE,
			'window.jetpackPostPublishPodcastPromo = ' . wp_json_encode(
				array(
					'createUrl'   => admin_url( 'upload.php?page=' . Admin_Page::PAGE_SLUG ),
					'dismissPath' => Endpoint::get_post_publish_promo_dismiss_rest_path(),
				),
				JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
			) . ';',
			'before'
		);
	}

	/**
	 * Whether the site is relevant for the post-publish promo.
	 */
	public static function is_site_eligible(): bool {
		$host = new Host();
		if ( $host->is_p2_site() ) {
			return false;
		}

		if ( get_user_option( self::DISMISSED_OPTION, get_current_user_id() ) ) {
			return false;
		}

		return self::has_enough_recent_posts() && self::has_enough_visitors();
	}

	/**
	 * Whether the current editor post has already been published.
	 */
	private static function is_current_post_published(): bool {
		$post = get_post();

		return $post instanceof \WP_Post
			&& 'post' === $post->post_type
			&& 'publish' === $post->post_status;
	}

	/**
	 * Whether the current screen is the post block editor.
	 */
	private static function is_post_block_editor(): bool {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return false;
		}

		$screen = get_current_screen();
		return ! empty( $screen )
			&& 'post' === $screen->base
			&& 'post' === $screen->post_type
			&& $screen->is_block_editor();
	}

	/**
	 * Whether the site has enough published posts to generate a better episode.
	 */
	private static function has_enough_recent_posts(): bool {
		/**
		 * Filters the minimum posts published in the last month needed for the Posts to Podcast post-publish promo.
		 *
		 * @since 1.0.0
		 *
		 * @param int $minimum Minimum number of published posts.
		 */
		$minimum = (int) apply_filters(
			'jetpack_posts_to_podcast_post_publish_promo_min_published_posts',
			self::MIN_POSTS
		);
		$minimum = max( 1, $minimum );

		$published_posts = get_posts(
			array(
				'fields'           => 'ids',
				'no_found_rows'    => true,
				'post_status'      => 'publish',
				'post_type'        => 'post',
				'posts_per_page'   => $minimum,
				'suppress_filters' => false,
				'date_query'       => array(
					array(
						'after'     => '1 month ago',
						'inclusive' => true,
					),
				),
			)
		);
		$total           = count( $published_posts );

		$post = get_post();
		if ( $post && 'post' === $post->post_type && 'publish' !== $post->post_status ) {
			++$total;
		}

		return $total >= $minimum;
	}

	/**
	 * Whether the site has visitors who could benefit from a podcast episode.
	 */
	private static function has_enough_visitors(): bool {
		$visitors = self::get_visitor_count();

		/**
		 * Filters the minimum visitors in the last week needed for the Posts to Podcast post-publish promo.
		 *
		 * @since 1.0.0
		 *
		 * @param int $minimum Minimum number of visitors.
		 */
		$minimum = (int) apply_filters(
			'jetpack_posts_to_podcast_post_publish_promo_min_visitors',
			self::MIN_VISITORS
		);

		return $visitors >= max( 1, $minimum );
	}

	/**
	 * Fetch the last week's visitor count from Jetpack Stats when available.
	 */
	private static function get_visitor_count(): int {
		$host = new Host();
		if ( $host->is_wpcom_simple() ) {
			return self::get_wpcom_simple_visitor_count();
		}

		if ( class_exists( '\Automattic\Jetpack\Stats\WPCOM_Stats' ) ) {
			$wpcom_stats = new \Automattic\Jetpack\Stats\WPCOM_Stats();
			$stats       = $wpcom_stats->get_visits(
				array(
					'unit'        => 'day',
					'quantity'    => 7,
					'stat_fields' => 'visitors',
				)
			);

			if ( ! is_wp_error( $stats ) && is_array( $stats ) ) {
				return self::sum_visits_field( $stats, 'visitors' );
			}
		}

		return 0;
	}

	/**
	 * Fetch the last week's visitor count directly on WordPress.com Simple.
	 */
	private static function get_wpcom_simple_visitor_count(): int {
		if ( ! function_exists( 'stats_get_visitors' ) ) {
			return 0;
		}

		$visitors = stats_get_visitors( get_current_blog_id(), gmdate( 'Y-m-d' ), 7, 1 );

		return is_array( $visitors ) ? (int) array_sum( $visitors ) : 0;
	}

	/**
	 * Sum a metric from the Stats visits response.
	 *
	 * @param array  $stats Stats visits response.
	 * @param string $field Field to sum.
	 * @return int
	 */
	private static function sum_visits_field( array $stats, string $field ): int {
		if ( ! isset( $stats['data'] ) || ! is_array( $stats['data'] ) ) {
			return 0;
		}

		$fields = isset( $stats['fields'] ) && is_array( $stats['fields'] ) ? $stats['fields'] : array();
		$index  = array_search( $field, $fields, true );
		if ( false === $index ) {
			return 0;
		}

		$total = 0;
		foreach ( $stats['data'] as $row ) {
			if ( is_array( $row ) && isset( $row[ $index ] ) ) {
				$total += (int) $row[ $index ];
			}
		}

		return $total;
	}
}
