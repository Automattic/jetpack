<?php
/**
 * Announcements read from a feed.
 *
 * @package automattic/jetpack-announcements
 */

namespace Automattic\Jetpack\Announcements;

/**
 * Turns the items of a feed into announcements a registrant can register.
 */
class Feed_Announcements {

	/**
	 * How long a feed that failed is left alone, in seconds. `fetch_feed()` caches no failure.
	 */
	const FAILURE_PAUSE = HOUR_IN_SECONDS;

	/**
	 * Words the excerpt of an announcement keeps.
	 */
	const EXCERPT_WORDS = 30;

	/**
	 * Reads a feed and returns its items as announcements.
	 *
	 * @param string $url    URL of the feed.
	 * @param string $vendor First half of the id of each announcement.
	 * @param array  $args   Settings of the read, as `get_announcements_from_feed()` documents them.
	 * @return array[] One entry per item, as `get_announcements_from_feed()` documents it.
	 */
	public static function get( $url, $vendor, $args = array() ) {
		if ( ! empty( $args['query'] ) && is_array( $args['query'] ) ) {
			// `add_query_arg()` encodes nothing.
			$url = add_query_arg( rawurlencode_deep( $args['query'] ), $url );
		}

		$failed = 'jetpack_announcements_feed_failed_' . md5( $url );

		// A site transient, as core's cache of the feed is.
		if ( get_site_transient( $failed ) ) {
			return array();
		}

		$feed = fetch_feed( $url );

		if ( is_wp_error( $feed ) ) {
			set_site_transient( $failed, 1, self::FAILURE_PAUSE );
			return array();
		}

		$oldest = isset( $args['max_age'] ) ? time() - (int) $args['max_age'] : null;

		$announcements = array();
		foreach ( (array) $feed->get_items() as $item ) {
			$announcement = self::feed_item_to_announcement( $item, $vendor );
			if ( $announcement && ( null === $oldest || strtotime( $announcement['args']['date'] ) >= $oldest ) ) {
				$announcements[] = $announcement;
			}
		}

		return $announcements;
	}

	/**
	 * Turns an item of a feed into the data of an announcement: plain text, URLs and a date.
	 *
	 * @param \SimplePie\Item $item   The item.
	 * @param string          $vendor First half of the id.
	 * @return array|null `id`, `args` and `categories`, or null for an item without a title, a date or a link.
	 */
	private static function feed_item_to_announcement( $item, $vendor ) {
		$title = self::to_text( $item->get_title() );
		$date  = (string) $item->get_gmdate( 'c' );
		$link  = esc_url_raw( (string) $item->get_permalink(), array( 'http', 'https' ) );

		if ( '' === $title || '' === $date || '' === $link ) {
			return null;
		}

		$categories = array();
		foreach ( (array) $item->get_categories() as $category ) {
			$categories[] = self::to_text( $category->get_label() );
		}

		return array(
			// Not `get_id( true )`, which hashes the title and the content: an edit would change the id.
			'id'         => $vendor . '/' . md5( (string) $item->get_id() ),
			'args'       => array(
				'date'    => $date,
				'title'   => $title,
				'excerpt' => wp_trim_words( self::to_text( $item->get_description() ), self::EXCERPT_WORDS, '…' ),
				'link'    => $link,
				'media'   => self::get_image( $item ),
			),
			'categories' => array_values( array_unique( array_filter( $categories, 'strlen' ) ) ),
		);
	}

	/**
	 * The image of an item, when the feed gives one over https.
	 *
	 * @param \SimplePie\Item $item The item.
	 * @return array|null The `media` of an announcement, or null.
	 */
	private static function get_image( $item ) {
		$thumbnail = $item->get_thumbnail();
		$enclosure = $item->get_enclosure();
		$urls      = array( is_array( $thumbnail ) ? ( $thumbnail['url'] ?? '' ) : '' );

		if ( $enclosure ) {
			$urls[] = $enclosure->get_thumbnail();

			if ( 'image' === $enclosure->get_medium() || 0 === strpos( (string) $enclosure->get_type(), 'image/' ) ) {
				$urls[] = $enclosure->get_link();
			}
		}

		foreach ( $urls as $url ) {
			$url = esc_url_raw( (string) $url, array( 'https' ) );
			if ( '' !== $url ) {
				return array(
					'type' => 'image',
					'url'  => $url,
					'alt'  => '',
				);
			}
		}

		return null;
	}

	/**
	 * The plain text of a value of a feed, which may carry markup and encoded entities.
	 *
	 * @param mixed $value The value.
	 * @return string The text.
	 */
	private static function to_text( $value ) {
		// Decoded first, so markup that came encoded is stripped as well.
		return trim( wp_strip_all_tags( html_entity_decode( (string) $value, ENT_QUOTES | ENT_HTML5, 'UTF-8' ), true ) );
	}
}
