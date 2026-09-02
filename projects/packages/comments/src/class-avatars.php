<?php
/**
 * Avatars for comments already written.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments;

use Automattic\Jetpack\Image_CDN\Image_CDN_Core;

/**
 * Avatars WordPress cannot derive from an email address.
 */
class Avatars {

	/**
	 * Comment meta holding a stored avatar URL. The checkpoint writes the first; the
	 * second is the Highlander key, read for comments written before it.
	 */
	const AVATAR_META     = 'jp_ci_avatar';
	const OLD_AVATAR_META = 'hc_avatar';

	/**
	 * Hosts whose avatars are served. gravatar.com and wp.com serve the
	 * WordPress.com identity's; twimg.com is not a provider here but
	 * Highlander-era comments (hc_avatar) stored it.
	 *
	 * @var string[]
	 */
	private static $avatar_hosts = array( 'gravatar.com', 'wp.com', 'graph.facebook.com', 'googleusercontent.com', 'twimg.com' );

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
	 * @param array $args        Avatar arguments.
	 * @param mixed $id_or_email What the avatar was requested for.
	 * @return array
	 */
	public static function avatar_data( $args, $id_or_email ) {
		if ( ! $id_or_email instanceof \WP_Comment || isset( $args['url'] ) ) {
			return $args;
		}

		$stored = get_comment_meta( (int) $id_or_email->comment_ID, self::AVATAR_META, true );

		if ( ! is_string( $stored ) || '' === $stored ) {
			$stored = get_comment_meta( (int) $id_or_email->comment_ID, self::OLD_AVATAR_META, true );
		}

		if ( ! is_string( $stored ) || '' === $stored || ! self::is_servable_avatar( $stored ) ) {
			return $args;
		}

		$size = isset( $args['size'] ) ? (int) $args['size'] : 96;

		$args['url'] = Image_CDN_Core::cdn_url( $stored, array( 'resize' => "$size,$size" ) );

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
