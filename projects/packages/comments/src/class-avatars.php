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
	 * Comment meta Highlander and Verbum wrote a stored avatar URL to.
	 */
	const AVATAR_META = 'hc_avatar';

	/**
	 * Hosts whose avatars are served.
	 *
	 * @var string[]
	 */
	private static $avatar_hosts = array( 'graph.facebook.com', 'twimg.com' );

	/**
	 * Register the avatar filters.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'pre_get_avatar_data', array( __CLASS__, 'avatar_data' ), 10, 2 );
		// WordPress.com replaces get_avatar() with its own, which never reaches pre_get_avatar_data.
		add_filter( 'wpcom_get_avatar_url', array( __CLASS__, 'wpcom_avatar_url' ), 10, 6 );
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

		$url = self::stored_url( (int) $id_or_email->comment_ID, isset( $args['size'] ) ? (int) $args['size'] : 96 );

		if ( null === $url ) {
			return $args;
		}

		$args['url']          = $url;
		$args['found_avatar'] = true;

		return $args;
	}

	/**
	 * Serve a stored avatar on WordPress.com.
	 *
	 * @param array|false $url_class     Avatar URL and CSS class, or false.
	 * @param mixed       $id_or_email   What the avatar was requested for.
	 * @param int|string  $size          Avatar size.
	 * @param string      $default_value Default avatar. Unused.
	 * @param bool        $force_display Whether to show avatars when disabled. Unused.
	 * @param bool        $force_default Whether to force the default avatar.
	 * @return array|false
	 */
	public static function wpcom_avatar_url( $url_class, $id_or_email, $size = 96, $default_value = '', $force_display = false, $force_default = false ) {
		if ( $force_default || ! is_array( $url_class ) || ! is_object( $id_or_email ) || empty( $id_or_email->comment_ID ) ) {
			return $url_class;
		}

		$url = self::stored_url( (int) $id_or_email->comment_ID, (int) $size );

		if ( null !== $url ) {
			$url_class[0] = $url;
		}

		return $url_class;
	}

	/**
	 * The stored avatar for a comment, sized through the image CDN.
	 *
	 * @param int $comment_id The comment ID.
	 * @param int $size       Avatar size.
	 * @return string|null Null when the comment carries no servable avatar.
	 */
	private static function stored_url( $comment_id, $size ) {
		// WordPress.com asks twice per comment, through get_avatar_data() and again through wpcom_get_avatar_url.
		static $resolved = array();

		$key = "$comment_id:$size";

		if ( array_key_exists( $key, $resolved ) ) {
			return $resolved[ $key ];
		}

		// Written only from an authenticated exchange with WordPress.com, so any https URL is served.
		$stored = get_comment_meta( $comment_id, Checkpoint::META_AVATAR, true );

		if ( ! is_string( $stored ) || $stored === '' || 'https' !== wp_parse_url( $stored, PHP_URL_SCHEME ) ) {
			$stored = get_comment_meta( $comment_id, self::AVATAR_META, true );

			if ( ! is_string( $stored ) || $stored === '' || ! self::is_servable_avatar( $stored ) ) {
				$stored = null;
			}
		}

		$resolved[ $key ] = null === $stored ? null : Image_CDN_Core::cdn_url( $stored, array( 'resize' => "$size,$size" ) );

		return $resolved[ $key ];
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
