<?php
/**
 * Recent Jetpack.com blog posts for the My Jetpack Overview.
 *
 * @package automattic/my-jetpack
 */

namespace Automattic\Jetpack\My_Jetpack;

use WP_REST_Response;

/**
 * Registers the REST route that lists recent Jetpack.com blog posts.
 */
class REST_Blog_Posts {
	/**
	 * The feed the Overview lists posts from.
	 *
	 * @var string
	 */
	const FEED_URL = 'https://jetpack.com/feed/';

	/**
	 * How many posts the Overview lists.
	 *
	 * @var int
	 */
	const POST_COUNT = 3;

	/**
	 * Site transient set while the feed is failing, so an outage costs one fetch an hour.
	 *
	 * @var string
	 */
	const FAILED_TRANSIENT = 'jetpack_my_jetpack_blog_posts_failed';

	/**
	 * Register the route.
	 *
	 * @return void
	 */
	public static function register_rest_endpoints() {
		register_rest_route(
			'my-jetpack/v1',
			'blog-posts',
			array(
				'methods'             => \WP_REST_Server::READABLE,
				'callback'            => __CLASS__ . '::get_blog_posts',
				'permission_callback' => __CLASS__ . '::permissions_callback',
			)
		);
	}

	/**
	 * Check user capability to access the endpoint.
	 *
	 * @return bool
	 */
	public static function permissions_callback() {
		return current_user_can( 'edit_posts' );
	}

	/**
	 * Recent posts from the feed, or none when it fails to load.
	 *
	 * @return WP_REST_Response
	 */
	public static function get_blog_posts() {
		// Site transients, like core's feed cache, so a multisite network retries once, not per site.
		if ( get_site_transient( self::FAILED_TRANSIENT ) ) {
			return rest_ensure_response( array() );
		}

		// fetch_feed() caches a parsed feed for 12 hours, but never a failure.
		$feed = fetch_feed( self::FEED_URL );

		if ( is_wp_error( $feed ) ) {
			set_site_transient( self::FAILED_TRANSIENT, 1, HOUR_IN_SECONDS );
			return rest_ensure_response( array() );
		}

		$posts = array();
		foreach ( $feed->get_items( 0, self::POST_COUNT ) as $item ) {
			$link = esc_url_raw( (string) $item->get_permalink() );
			if ( '' === $link ) {
				continue;
			}

			$enclosure = $item->get_enclosure();
			$thumbnail = $enclosure ? esc_url_raw( (string) $enclosure->get_thumbnail() ) : '';

			$posts[] = array(
				// The feed parser returns entity-encoded text; the client renders plain text.
				'title'     => html_entity_decode( (string) $item->get_title(), ENT_QUOTES, 'UTF-8' ),
				'link'      => $link,
				'date'      => $item->get_date( 'c' ),
				'excerpt'   => wp_trim_words( html_entity_decode( (string) $item->get_description(), ENT_QUOTES, 'UTF-8' ), 20, '…' ),
				// Jetpack.com crops on request: 2x the 56px thumbnail in overview-blog-posts/style.module.scss.
				'thumbnail' => '' === $thumbnail ? null : add_query_arg( 'resize', '112,112', $thumbnail ),
			);
		}

		return rest_ensure_response( $posts );
	}
}
