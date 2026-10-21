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
		// fetch_feed() caches the parsed feed in a transient for 12 hours.
		$feed = fetch_feed( self::FEED_URL );

		if ( is_wp_error( $feed ) ) {
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
				'thumbnail' => '' === $thumbnail ? null : $thumbnail,
			);
		}

		return rest_ensure_response( $posts );
	}
}
