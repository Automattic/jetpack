<?php
/*
 * This file may be called before WordPress is fully initialized. See the README file for info.
 */

namespace Automattic\Jetpack_Boost\Modules\Optimizations\Page_Cache\Pre_WordPress;

use WP_Post;

class Boost_Cache_Utils {

	/**
	 * Performs a deep string replace operation to ensure the values in $search are no longer present.
	 * Copied from wp-includes/formatting.php
	 *
	 * Repeats the replacement operation until it no longer replaces anything to remove "nested" values
	 * e.g. $subject = '%0%0%0DDD', $search ='%0D', $result ='' rather than the '%0%0DD' that
	 * str_replace would return
	 *
	 * @param string|array $search  The value being searched for, otherwise known as the needle.
	 *                              An array may be used to designate multiple needles.
	 * @param string       $subject The string being searched and replaced on, otherwise known as the haystack.
	 * @return string The string with the replaced values.
	 */
	public static function deep_replace( $search, $subject ) {
		$subject = (string) $subject;

		$count = 1;
		while ( $count ) {
				$subject = str_replace( $search, '', $subject, $count );
		}

		return $subject;
	}

	public static function trailingslashit( $string ) {
		return rtrim( $string, '/' ) . '/';
	}

	/**
	 * Returns a sanitized directory path.
	 *
	 * @param string $path - The path to sanitize.
	 * @return string
	 */
	public static function sanitize_file_path( $path ) {
		$path = self::trailingslashit( $path );
		$path = self::deep_replace(
			array( '..', '\\' ),
			preg_replace(
				'/[ <>\'\"\r\n\t\(\)]/',
				'',
				preg_replace(
					'/(\?.*)?(#.*)?$/',
					'',
					$path
				)
			)
		);

		return $path;
	}

	/**
	 * Normalize the request uri so it can be used for caching purposes.
	 * It removes the query string and the trailing slash, and characters
	 * that might cause problems with the filesystem.
	 *
	 * **THIS DOES NOT SANITIZE THE VARIABLE IN ANY WAY.**
	 * Only use it for comparison purposes or to generate an MD5 hash.
	 *
	 * @param string $request_uri - The request uri to normalize.
	 * @return string - The normalized request uri.
	 */
	public static function normalize_request_uri( $request_uri ) {
		// get path from request uri
		$request_uri = parse_url( $request_uri, PHP_URL_PATH ); // phpcs:ignore WordPress.WP.AlternativeFunctions.parse_url_parse_url
		if ( empty( $request_uri ) ) {
			$request_uri = '/';
		} elseif ( substr( $request_uri, -1 ) !== '/' && ! is_file( ABSPATH . $request_uri ) ) {
			$request_uri .= '/';
		}

		return $request_uri;
	}

	/**
	 * Checks if the post type is public.
	 *
	 * @param WP_Post $post - The post to check.
	 * @return bool - True if the post type is public.
	 */
	public static function is_visible_post_type( $post ) {
		$post_type = is_a( $post, 'WP_Post' ) ? get_post_type_object( $post->post_type ) : null;
		if ( empty( $post_type ) || ! $post_type->public ) {
			return false;
		}
		return true;
	}
}
