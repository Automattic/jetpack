<?php
/**
 * Shortcode ID extraction methods.
 *
 * Provides static methods to extract identifiers from shortcode attributes
 * for various media types (YouTube, Vimeo, TED, VideoPress, etc.).
 *
 * @package automattic/jetpack-post-media
 */

namespace Automattic\Jetpack;

/**
 * Extracts media identifiers from shortcode attributes.
 *
 * @since 0.1.0
 */
class Shortcodes {

	/**
	 * Get an ID from a shortcode attribute by key.
	 *
	 * Used for shortcodes that store their identifier in a single attribute,
	 * e.g. ted and hulu use a named 'id' attribute, while wpvideo and
	 * videopress use the first positional attribute.
	 *
	 * @since 0.1.0
	 *
	 * @param array      $atts Shortcode attributes.
	 * @param string|int $key  The attribute key to look up. Defaults to 0 (first positional attribute).
	 * @return string|int The attribute value, or 0 if not found.
	 */
	public static function get_attribute_id( $atts, $key = 0 ) {
		return ! empty( $atts[ $key ] ) ? $atts[ $key ] : 0;
	}

	/**
	 * Normalizes a YouTube URL to include a v= parameter and a query string free of encoded ampersands.
	 *
	 * Handles youtu.be short links, /v/ paths, /shorts/ paths, playlist URLs, and encoded ampersands.
	 *
	 * @since 0.1.0
	 *
	 * @param string|array $url YouTube URL, or an array with a 'url' key.
	 * @return string|false The normalized URL, or false if input is invalid.
	 */
	public static function sanitize_youtube_url( $url ) {
		if ( is_array( $url ) && isset( $url['url'] ) ) {
			$url = $url['url'];
		}
		if ( ! is_string( $url ) ) {
			return false;
		}

		$url = trim( $url, ' "' );
		$url = trim( $url );
		$url = str_replace(
			array( 'youtu.be/', '/v/', '/shorts/', '#!v=', '&amp;', '&#038;', 'playlist' ),
			array( 'youtu.be/?v=', '/?v=', '/watch?v=', '?v=', '&', '&', 'videoseries' ),
			$url
		);

		// Replace any extra question marks with ampersands - the result of a URL like
		// "https://www.youtube.com/v/dQw4w9WgXcQ?fs=1&hl=en_US" being passed in.
		$query_string_start = strpos( $url, '?' );

		if ( false !== $query_string_start ) {
			$url = substr( $url, 0, $query_string_start + 1 ) . str_replace( '?', '&', substr( $url, $query_string_start + 1 ) );
		}

		return $url;
	}

	/**
	 * Extract a YouTube video or playlist ID from shortcode attributes.
	 *
	 * @since 0.1.0
	 *
	 * @param string|array $atts Shortcode attributes. Can be just the URL string or the full $atts array.
	 * @return string|false The YouTube video or playlist ID, or false on failure.
	 */
	public static function get_youtube_id( $atts ) {
		// Do we have an $atts array? Get first att.
		if ( is_array( $atts ) ) {
			$atts = reset( $atts );
		}

		$url = self::sanitize_youtube_url( $atts );

		if ( ! is_string( $url ) || '' === $url ) {
			return false;
		}

		$parsed = parse_url( $url ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url

		if ( ! is_array( $parsed ) || ! isset( $parsed['query'] ) ) {
			return false;
		}

		parse_str( $parsed['query'], $qargs );

		if ( ! isset( $qargs['v'] ) && ! isset( $qargs['list'] ) ) {
			return false;
		}

		$id = '';

		if ( isset( $qargs['list'] ) ) {
			$id = preg_replace( '|[^_a-z0-9-]|i', '', $qargs['list'] );
		}

		if ( empty( $id ) && isset( $qargs['v'] ) ) {
			$id = preg_replace( '|[^_a-z0-9-]|i', '', $qargs['v'] );
		}

		return empty( $id ) ? false : $id;
	}

	/**
	 * Extract a Vimeo video ID from shortcode attributes.
	 *
	 * Supports numeric IDs and various Vimeo URL formats including
	 * groups, albums, channels, and player URLs.
	 *
	 * @since 0.1.0
	 *
	 * @param array $atts Shortcode attributes.
	 * @return int The Vimeo video ID, or 0 if not found.
	 */
	public static function get_vimeo_id( $atts ) {
		if ( isset( $atts[0] ) ) {
			$atts[0] = trim( $atts[0], '=' );
			if ( is_numeric( $atts[0] ) ) {
				return (int) $atts[0];
			}

			/**
			 * Extract Vimeo ID from the URL. For examples:
			 * https://vimeo.com/12345
			 * https://vimeo.com/289091934/cd1f466bcc
			 * https://vimeo.com/album/2838732/video/6342264
			 * https://vimeo.com/groups/758728/videos/897094040
			 * https://vimeo.com/channels/staffpicks/videos/123456789
			 * https://vimeo.com/album/1234567/video/7654321
			 * https://player.vimeo.com/video/18427511
			 */
			$pattern = '/(?:https?:\/\/)?vimeo\.com\/(?:groups\/[^\/]+\/videos\/|album\/\d+\/video\/|video\/|channels\/[^\/]+\/videos\/|[^\/]+\/)?([0-9]+)(?:[^\'\"0-9<]|$)/i';
			$match   = array();
			if ( preg_match( $pattern, $atts[0], $match ) ) {
				return (int) $match[1];
			}
		}

		return 0;
	}

	/**
	 * Get the unique ID of a TED video from shortcode attributes.
	 *
	 * @since 0.1.0
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string|int The TED video ID, or 0 if not found.
	 */
	public static function get_ted_id( $atts ) {
		return self::get_attribute_id( $atts, 'id' );
	}

	/**
	 * Get a VideoPress ID from wpvideo shortcode attributes.
	 *
	 * @since 0.1.0
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string|int The VideoPress ID, or 0 if not found.
	 */
	public static function get_wpvideo_id( $atts ) {
		return self::get_attribute_id( $atts );
	}

	/**
	 * Get a VideoPress ID from videopress shortcode attributes.
	 *
	 * @since 0.1.0
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string|int The VideoPress ID, or 0 if not found.
	 */
	public static function get_videopress_id( $atts ) {
		return self::get_attribute_id( $atts );
	}

	/**
	 * Get a Hulu video ID from shortcode attributes.
	 *
	 * @since 0.1.0
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string|int The Hulu video ID, or 0 if not found.
	 */
	public static function get_hulu_id( $atts ) {
		return self::get_attribute_id( $atts, 'id' );
	}

	/**
	 * Get an Archive.org embed ID from shortcode attributes.
	 *
	 * Extracts the identifier from an Archive.org details or embed URL,
	 * or uses the raw attribute value if it is not a URL.
	 *
	 * @since 0.1.0
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string|int The Archive.org identifier, the raw attribute value
	 *                     (which may be empty), or 0 if the attribute is not set.
	 */
	public static function get_archiveorg_id( $atts ) {
		if ( isset( $atts[0] ) ) {
			$atts[0] = trim( $atts[0], '=' );
			if ( preg_match( '~archive\.org/(details|embed)/([^/?#]+)~i', $atts[0], $match ) ) {
				$id = $match[2];
			} else {
				$id = $atts[0];
			}
			return $id;
		}
		return 0;
	}

	/**
	 * Get an Archive.org book embed ID from shortcode attributes.
	 *
	 * Extracts the identifier from an Archive.org stream URL,
	 * or uses the raw attribute value if it is not a URL.
	 *
	 * @since 0.1.0
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string|int The Archive.org book identifier, the raw attribute value
	 *                     (which may be empty), or 0 if the attribute is not set.
	 */
	public static function get_archiveorg_book_id( $atts ) {
		if ( isset( $atts[0] ) ) {
			$atts[0] = trim( $atts[0], '=' );
			if ( preg_match( '~archive\.org/stream/([^/?#]+)~i', $atts[0], $match ) ) {
				$id = $match[1];
			} else {
				$id = $atts[0];
			}
			return $id;
		}
		return 0;
	}
}
