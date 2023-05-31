<?php
/**
 * Core Image CDN functionality.
 *
 * It should be available even if Image CDN is not active.
 *
 * @package automattic/jetpack-image-cdn
 */

namespace Automattic\Jetpack\Image_CDN;

use Automattic\Jetpack\Status;

/**
 * A static class that provides core Image CDN functionality.
 */
class Image_CDN_Core {

	/**
	 * Register hooks.
	 */
	public static function setup() {
		// Add photon compatibility.
		require_once __DIR__ . '/compatibility/photon.php';

		// Add ActivityPub compatibility.
		require_once __DIR__ . '/compatibility/activitypub.php';

		/**
		 * Add an easy way to photon-ize a URL that is safe to call even if Jetpack isn't active.
		 *
		 * See: https://jetpack.com/2013/07/11/photon-and-themes/
		 */
		add_filter( 'jetpack_photon_url', array( __CLASS__, 'cdn_url' ), 10, 3 );

		/**
		 * WordPress.com
		 *
		 * If a cropped WP.com-hosted image is the source image, have Photon replicate the crop.
		 */
		add_filter( 'jetpack_photon_pre_args', array( __CLASS__, 'parse_wpcom_query_args' ), 10, 2 );

		add_filter( 'jetpack_photon_skip_for_url', array( __CLASS__, 'banned_domains' ), 9, 2 );
	}

	/**
	 * Generates a Photon URL.
	 *
	 * @see https://developer.wordpress.com/docs/photon/
	 *
	 * @param string       $image_url URL to the publicly accessible image you want to manipulate.
	 * @param array|string $args An array of arguments, e.g. array( 'w' => '300', 'resize' => array( 123, 456 ) ), or in string form (w=123&h=456).
	 * @param string|null  $scheme URL protocol.
	 * @return string The raw final URL. You should run this through esc_url() before displaying it.
	 */
	public static function cdn_url( $image_url, $args = array(), $scheme = null ) {
		$image_url = trim( $image_url );

		if ( ! defined( 'IS_WPCOM' ) || ! \IS_WPCOM ) {
			/**
			 * Disables Photon URL processing for local development
			 *
			 * @module photon
			 *
			 * @since 4.1.0
			 *
			 * @param bool false Result of Automattic\Jetpack\Status->is_offline_mode().
			 */
			if ( true === apply_filters( 'jetpack_photon_development_mode', ( new Status() )->is_offline_mode() ) ) {
				return $image_url;
			}
		}

		/**
		 * Allow specific image URls to avoid going through Photon.
		 *
		 * @module photon
		 *
		 * @since 3.2.0
		 *
		 * @param bool false Should the image be returned as is, without going through Photon. Default to false.
		 * @param string $image_url Image URL.
		 * @param array|string $args Array of Photon arguments.
		 * @param string|null $scheme Image scheme. Default to null.
		 */
		if ( false !== apply_filters( 'jetpack_photon_skip_for_url', false, $image_url, $args, $scheme ) ) {
			return $image_url;
		}

		/**
		 * Filter the original image URL before it goes through Photon.
		 *
		 * @module photon
		 *
		 * @since 1.9.0
		 *
		 * @param string $image_url Image URL.
		 * @param array|string $args Array of Photon arguments.
		 * @param string|null $scheme Image scheme. Default to null.
		 */
		$image_url = apply_filters( 'jetpack_photon_pre_image_url', $image_url, $args, $scheme );
		/**
		 * Filter the original Photon image parameters before Photon is applied to an image.
		 *
		 * @module photon
		 *
		 * @since 1.9.0
		 *
		 * @param array|string $args Array of Photon arguments.
		 * @param string $image_url Image URL.
		 * @param string|null $scheme Image scheme. Default to null.
		 */
		$args = apply_filters( 'jetpack_photon_pre_args', $args, $image_url, $scheme );

		if ( empty( $image_url ) ) {
			return $image_url;
		}

		$image_url_parts = wp_parse_url( $image_url );

		// Unable to parse.
		if ( ! is_array( $image_url_parts ) || empty( $image_url_parts['host'] ) || empty( $image_url_parts['path'] ) ) {
			return $image_url;
		}

		if ( is_array( $args ) ) {
			// Convert values that are arrays into strings.
			foreach ( $args as $arg => $value ) {
				if ( is_array( $value ) ) {
					$args[ $arg ] = implode( ',', $value );
				}
			}

			// Encode values.
			// See https://core.trac.wordpress.org/ticket/17923 .
			$args = rawurlencode_deep( $args );
		}

		// Don't photon-ize WPCOM hosted images -- we can serve them up from wpcom directly.
		$is_wpcom_image = false;
		if ( self::ends_with( strtolower( $image_url_parts['host'] ), '.files.wordpress.com' ) ) {
			$is_wpcom_image = true;
			if ( isset( $args['ssl'] ) ) {
				// Do not send the ssl argument to prevent caching issues.
				unset( $args['ssl'] );
			}
		}

		/** This filter is documented below. */
		$custom_photon_url = apply_filters( 'jetpack_photon_domain', '', $image_url );
		$custom_photon_url = esc_url( $custom_photon_url );

		// You can't run a Photon URL through Photon again because query strings are stripped.
		// So if the image is already a Photon URL, append the new arguments to the existing URL.
		// Alternately, if it's a *.files.wordpress.com url, then keep the domain as is.
		if (
			in_array( $image_url_parts['host'], array( 'i0.wp.com', 'i1.wp.com', 'i2.wp.com' ), true )
			|| wp_parse_url( $custom_photon_url, PHP_URL_HOST ) === $image_url_parts['host']
			|| $is_wpcom_image
		) {
			$photon_url = add_query_arg( $args, $image_url );
			return self::cdn_url_scheme( $photon_url, $scheme );
		}

		/**
		 * Allow Photon to use query strings as well.
		 * By default, Photon doesn't support query strings so we ignore them and look only at the path.
		 * This setting is Photon Server dependent.
		 *
		 * @module photon
		 *
		 * @since 1.9.0
		 *
		 * @param bool false Should images using query strings go through Photon. Default is false.
		 * @param string $image_url_parts['host'] Image URL's host.
		 */
		if ( ! apply_filters( 'jetpack_photon_any_extension_for_domain', false, $image_url_parts['host'] ) ) {
			// Photon doesn't support query strings so we ignore them and look only at the path.
			// However some source images are served via PHP so check the no-query-string extension.
			// For future proofing, this is an excluded list of common issues rather than an allow list.
			$extension = pathinfo( $image_url_parts['path'], PATHINFO_EXTENSION );
			if ( empty( $extension ) || in_array( $extension, array( 'php', 'ashx' ), true ) ) {
				return $image_url;
			}
		}

		$image_host_path = $image_url_parts['host'] . $image_url_parts['path'];

		/**
		 * Filters the domain used by the Photon module.
		 *
		 * @module photon
		 *
		 * @since 3.4.2
		 *
		 * @param string https://i0.wp.com Domain used by Photon.
		 * @param string $image_url URL of the image to be photonized.
		 */
		$photon_domain = apply_filters( 'jetpack_photon_domain', 'https://i0.wp.com', $image_url );
		$photon_domain = trailingslashit( esc_url( $photon_domain ) );
		$photon_url    = $photon_domain . $image_host_path;

		/**
		 * Add query strings to Photon URL.
		 * By default, Photon doesn't support query strings so we ignore them.
		 * This setting is Photon Server dependent.
		 *
		 * @module photon
		 *
		 * @since 1.9.0
		 *
		 * @param bool false Should query strings be added to the image URL. Default is false.
		 * @param string $image_url_parts['host'] Image URL's host.
		 */
		if ( isset( $image_url_parts['query'] ) && apply_filters( 'jetpack_photon_add_query_string_to_domain', false, $image_url_parts['host'] ) ) {
			$photon_url .= '?q=' . rawurlencode( $image_url_parts['query'] );
		}

		if ( $args ) {
			if ( is_array( $args ) ) {
				$photon_url = add_query_arg( $args, $photon_url );
			} elseif ( strpos( $photon_url, '?' ) !== false ) {
				$photon_url .= '&' . $args;
			} else {
				$photon_url .= '?' . $args;
			}
		}

		if ( isset( $image_url_parts['scheme'] ) && 'https' === $image_url_parts['scheme'] ) {
			$photon_url = add_query_arg( array( 'ssl' => 1 ), $photon_url );
		}

		return self::cdn_url_scheme( $photon_url, $scheme );
	}

	/**
	 * Parses WP.com-hosted image args to replicate the crop.
	 *
	 * @param mixed  $args Args set during Photon's processing.
	 * @param string $image_url URL of the image.
	 * @return array|string Args for Photon to use for the URL.
	 */
	public static function parse_wpcom_query_args( $args, $image_url ) {
		$parsed_url = wp_parse_url( $image_url );

		if ( ! $parsed_url ) {
			return $args;
		}

		$image_url_parts = wp_parse_args(
			$parsed_url,
			array(
				'host'  => '',
				'query' => '',
			)
		);

		if ( '.files.wordpress.com' !== substr( $image_url_parts['host'], -20 ) ) {
			return $args;
		}

		if ( empty( $image_url_parts['query'] ) ) {
			return $args;
		}

		$wpcom_args = wp_parse_args( $image_url_parts['query'] );

		if ( empty( $wpcom_args['w'] ) || empty( $wpcom_args['h'] ) ) {
			return $args;
		}

		// Keep the crop by using "resize".
		if ( ! empty( $wpcom_args['crop'] ) ) {
			if ( is_array( $args ) ) {
				$args = array_merge( array( 'resize' => array( $wpcom_args['w'], $wpcom_args['h'] ) ), $args );
			} else {
				$args = 'resize=' . rawurlencode( absint( $wpcom_args['w'] ) . ',' . absint( $wpcom_args['h'] ) ) . '&' . $args;
			}
		} elseif ( is_array( $args ) ) {
			$args = array_merge( array( 'fit' => array( $wpcom_args['w'], $wpcom_args['h'] ) ), $args );
		} else {
			$args = 'fit=' . rawurlencode( absint( $wpcom_args['w'] ) . ',' . absint( $wpcom_args['h'] ) ) . '&' . $args;
		}

		return $args;
	}

	/**
	 * Sets the scheme for a URL
	 *
	 * @param string $url URL to set scheme.
	 * @param string $scheme Scheme to use. Accepts http, https, network_path.
	 *
	 * @return string URL.
	 */
	public static function cdn_url_scheme( $url, $scheme ) {
		if ( ! in_array( $scheme, array( 'http', 'https', 'network_path' ), true ) ) {
			if ( preg_match( '#^(https?:)?//#', $url ) ) {
				return $url;
			}

			$scheme = 'http';
		}

		if ( 'network_path' === $scheme ) {
			$scheme_slashes = '//';
		} else {
			$scheme_slashes = "$scheme://";
		}

		return preg_replace( '#^([a-z:]+)?//#i', $scheme_slashes, $url );
	}

	/**
	 * Check to skip Photon for a known domain that shouldn't be Photonized.
	 *
	 * @param bool   $skip If the image should be skipped by Photon.
	 * @param string $image_url URL of the image.
	 *
	 * @return bool Should the image be skipped by Photon.
	 */
	public static function banned_domains( $skip, $image_url ) {
		$banned_host_patterns = array(
			'/^chart\.googleapis\.com$/',
			'/^chart\.apis\.google\.com$/',
			'/^graph\.facebook\.com$/',
			'/\.fbcdn\.net$/',
			'/\.paypalobjects\.com$/',
			'/\.dropbox\.com$/',
			'/\.cdninstagram\.com$/',
			'/^(commons|upload)\.wikimedia\.org$/',
			'/\.wikipedia\.org$/',
		);

		$host = wp_parse_url( $image_url, PHP_URL_HOST );

		foreach ( $banned_host_patterns as $banned_host_pattern ) {
			if ( 1 === preg_match( $banned_host_pattern, $host ) ) {
				return true;
			}
		}

		return $skip;
	}

	/**
	 * Check whether a string ends with a specific substring.
	 *
	 * @param string $haystack String we are filtering.
	 * @param string $needle The substring we are looking for.
	 * @return bool
	 */
	public static function ends_with( $haystack, $needle ) {
		if ( ! $haystack || ! $needle || ! is_scalar( $haystack ) || ! is_scalar( $needle ) ) {
			return false;
		}

		$haystack = (string) $haystack;
		$needle   = (string) $needle;

		if ( function_exists( 'str_ends_with' ) ) { // remove when PHP 8.0 is the minimum supported.
			return str_ends_with( $haystack, $needle ); // phpcs:ignore PHPCompatibility.FunctionUse.NewFunctions

		}
		return $needle === substr( $haystack, -strlen( $needle ) );
	}

	/**
	 * This is a copy of Jetpack::get_content_width()
	 * for backwards compatibility.
	 */
	public static function get_jetpack_content_width() {
		$content_width = ( isset( $GLOBALS['content_width'] ) && is_numeric( $GLOBALS['content_width'] ) )
			? $GLOBALS['content_width']
			: false;
		/**
		 * Filter the Content Width value.
		 *
		 * @since 2.2.3
		 *
		 * @param string $content_width Content Width value.
		 */
		return apply_filters( 'jetpack_content_width', $content_width );
	}
}
