<?php
/**
 * Fetches the posts currently featured on WordPress.com's Freshly Pressed.
 *
 * @package automattic/jetpack-newsletter
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Newsletter;

use Automattic\Jetpack\Status\Host;

/**
 * Read the WordPress.com Freshly Pressed feed: straight from the database on
 * Simple sites, and over the public API everywhere else.
 */
class Freshly_Pressed {
	/**
	 * Where the cached list of posts is stored.
	 *
	 * @var string
	 */
	const TRANSIENT_KEY = 'jetpack_newsletter_freshly_pressed';

	/**
	 * How long a successful response is cached for, in seconds.
	 *
	 * @var int
	 */
	const CACHE_TTL = HOUR_IN_SECONDS;

	/**
	 * How long a failed response is cached for, in seconds.
	 *
	 * Shorter than a success so an outage recovers quickly, but long enough that
	 * it doesn't become an outgoing request on every dashboard load.
	 *
	 * @var int
	 */
	const FAILURE_CACHE_TTL = 5 * MINUTE_IN_SECONDS;

	/**
	 * The WordPress.com endpoint listing the Freshly Pressed posts.
	 *
	 * @var string
	 */
	const API_URL = 'https://public-api.wordpress.com/rest/v1.1/freshly-pressed';

	/**
	 * How many posts to show.
	 *
	 * @var int
	 */
	const POST_COUNT = 10;

	/**
	 * Get the posts currently featured on Freshly Pressed.
	 *
	 * @since $$next-version$$
	 *
	 * @return array[] {
	 *     @type string $title     The post title, as returned by the API.
	 *     @type string $permalink A WordPress.com Reader link to the post.
	 *     @type int    $blog_id   The ID of the site the post belongs to.
	 *     @type int    $post_id   The ID of the post.
	 * }
	 */
	public static function get_posts(): array {
		$cached = get_transient( self::TRANSIENT_KEY );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$posts = ( new Host() )->is_wpcom_simple()
			? self::query_wpcom_posts()
			: self::fetch_posts_from_api();

		// A null means the source failed; an empty array means it had nothing to
		// show. Only the former is worth retrying soon.
		set_transient(
			self::TRANSIENT_KEY,
			$posts ?? array(),
			null === $posts ? self::FAILURE_CACHE_TTL : self::CACHE_TTL
		);

		return $posts ?? array();
	}

	/**
	 * Read the featured posts straight from the wpcom database.
	 *
	 * `FreshlyPressed::query()` only caches for logged-out visitors, so this is a
	 * real query every time and the caller's transient is what keeps it off the
	 * dashboard's critical path.
	 *
	 * @since $$next-version$$
	 *
	 * @return array[]|null The posts, or null if the wpcom plugin isn't available.
	 */
	private static function query_wpcom_posts(): ?array {
		if ( ! class_exists( 'FreshlyPressed' ) ) {
			$plugin = WP_CONTENT_DIR . '/plugins/freshly-pressed.php';
			if ( ! file_exists( $plugin ) ) {
				return null;
			}
			require_once $plugin;
		}

		// @phan-suppress-next-line PhanUndeclaredClassMethod -- wpcom-only class, guarded by the class_exists above. Remove once FreshlyPressed is added to wpcom's stub-defs.php and the regenerated stubs land.
		$result = \FreshlyPressed::get_available_posts( array( 'number' => self::POST_COUNT ) );

		if ( ! isset( $result['posts'] ) || ! is_array( $result['posts'] ) ) {
			return null;
		}

		$posts = array();
		foreach ( $result['posts'] as $featured ) {
			if ( empty( $featured['blog_id'] ) || empty( $featured['post_id'] ) ) {
				continue;
			}

			// A post can be unpublished or deleted after being featured.
			$post = get_blog_post( $featured['blog_id'], $featured['post_id'] );
			if ( empty( $post ) ) {
				continue;
			}

			// An untitled post would render as a link with nothing to click.
			$title = trim( (string) $post->post_title );
			if ( '' === $title ) {
				continue;
			}

			$posts[] = self::format_post(
				(int) $featured['blog_id'],
				(int) $featured['post_id'],
				$title
			);
		}

		return $posts;
	}

	/**
	 * Fetch the featured posts from the WordPress.com public API.
	 *
	 * @since $$next-version$$
	 *
	 * @return array[]|null The posts, or null if the request failed.
	 */
	private static function fetch_posts_from_api(): ?array {
		$response = wp_remote_get(
			add_query_arg(
				array(
					'number' => self::POST_COUNT,
					// Without this the API returns the full content of every post.
					'fields' => 'ID,site_ID,title',
				),
				self::API_URL
			),
			array( 'timeout' => 5 )
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return null;
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! isset( $body['posts'] ) || ! is_array( $body['posts'] ) ) {
			return null;
		}

		$posts = array();
		foreach ( $body['posts'] as $post ) {
			// An untitled post would render as a link with nothing to click.
			$title = trim( (string) ( $post['title'] ?? '' ) );
			if ( empty( $post['ID'] ) || empty( $post['site_ID'] ) || '' === $title ) {
				continue;
			}

			$posts[] = self::format_post( (int) $post['site_ID'], (int) $post['ID'], $title );
		}

		return $posts;
	}

	/**
	 * Shape one post the way the widget expects it.
	 *
	 * @since $$next-version$$
	 *
	 * @param int    $blog_id The ID of the site the post belongs to.
	 * @param int    $post_id The ID of the post.
	 * @param string $title   The post title.
	 * @return array The formatted post.
	 */
	private static function format_post( int $blog_id, int $post_id, string $title ): array {
		return array(
			'title'     => $title,
			'permalink' => add_query_arg(
				array(
					'algo' => 'freshly-pressed',
					'ref'  => 'dashboard_widget',
				),
				sprintf( 'https://wordpress.com/reader/blogs/%d/posts/%d', $blog_id, $post_id )
			),
			'blog_id'   => $blog_id,
			'post_id'   => $post_id,
		);
	}
}
