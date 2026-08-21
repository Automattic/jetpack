<?php
/**
 * Avatars for comments already written.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Automattic\Jetpack\Image_CDN\Image_CDN_Core;

/**
 * Serves the avatar of a commenter whose picture WordPress cannot derive from
 * an email address.
 */
class Avatars {

	/**
	 * Comment meta holding an avatar hosted somewhere WordPress cannot derive it
	 * from an email address. Written by the comment experience this package
	 * succeeds, and still read here so those comments keep their picture.
	 */
	const AVATAR_META = 'hc_avatar';

	/**
	 * Hosts whose avatars are served. Anything else in the meta is ignored, so a
	 * value that reached the database some other way cannot be rendered.
	 *
	 * @var string[]
	 */
	private static $avatar_hosts = array( 'graph.facebook.com', 'twimg.com' );

	/**
	 * Register the avatar filter.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'pre_get_avatar_data', array( __CLASS__, 'avatar_data' ), 10, 2 );
	}

	/**
	 * Serve a stored avatar for comments that carry one.
	 *
	 * Hooked ahead of core's own resolution rather than onto the finished markup,
	 * so the URL also reaches get_avatar_url() and everything built on it, the
	 * REST API's author_avatar_urls included.
	 *
	 * @param array $args        Avatar arguments.
	 * @param mixed $id_or_email What the avatar was requested for.
	 * @return array
	 */
	public static function avatar_data( $args, $id_or_email ) {
		if ( ! $id_or_email instanceof \WP_Comment || isset( $args['url'] ) ) {
			return $args;
		}

		$stored = get_comment_meta( (int) $id_or_email->comment_ID, self::AVATAR_META, true );

		if ( ! is_string( $stored ) || $stored === '' || ! self::is_servable_avatar( $stored ) ) {
			return $args;
		}

		$size = isset( $args['size'] ) ? (int) $args['size'] : 96;

		// Resized and served over https when the CDN recognises the URL as an image.
		// Anything else, Facebook's extensionless /picture included, comes back as-is.
		$args['url'] = Image_CDN_Core::cdn_url( $stored, array( 'resize' => "$size,$size" ) );

		// Core sets this false before the filter runs, and short-circuits before it
		// would have flipped it. Left alone, get_avatar() marks the image default.
		$args['found_avatar'] = true;

		return $args;
	}

	/**
	 * Whether a stored avatar URL is one we are willing to serve.
	 *
	 * @param string $url The stored avatar URL.
	 * @return bool
	 */
	private static function is_servable_avatar( $url ) {
		$host = wp_parse_url( $url, PHP_URL_HOST );

		if ( ! is_string( $host ) ) {
			return false;
		}

		foreach ( self::$avatar_hosts as $allowed ) {
			if ( $host === $allowed || str_ends_with( $host, ".$allowed" ) ) {
				return true;
			}
		}

		return false;
	}
}
