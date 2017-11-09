<?php

class AMP_Image_Dimension_Extractor {
	static $callbacks_registered = false;

	static public function extract( $url ) {
		if ( ! self::$callbacks_registered ) {
			self::register_callbacks();
		}

		$url = self::normalize_url( $url );
		if ( false === $url ) {
			return false;
		}

		return apply_filters( 'amp_extract_image_dimensions', false, $url );
	}

	public static function normalize_url( $url ) {
		if ( empty( $url ) ) {
			return false;
		}

		if ( 0 === strpos( $url, 'data:' ) ) {
			return false;
		}

		if ( 0 === strpos( $url, '//' ) ) {
			return set_url_scheme( $url, 'http' );
		}

		$parsed = parse_url( $url );
		if ( ! isset( $parsed['host'] ) ) {
			$path = '';
			if ( isset( $parsed['path'] ) ) {
				$path .= $parsed['path'];
			}
			if ( isset( $parsed['query'] ) ) {
				$path .= '?' . $parsed['query'];
			}
			$url = site_url( $path );
		}

		return $url;
	}

	private static function register_callbacks() {
		self::$callbacks_registered = true;

		add_filter( 'amp_extract_image_dimensions', array( __CLASS__, 'extract_from_attachment_metadata' ), 10, 2 );
		add_filter( 'amp_extract_image_dimensions', array( __CLASS__, 'extract_by_downloading_image' ), 999, 2 ); // Run really late since this is our last resort

		do_action( 'amp_extract_image_dimensions_callbacks_registered' );
	}

	public static function extract_from_attachment_metadata( $dimensions, $url ) {
		if ( is_array( $dimensions ) ) {
			return $dimensions;
		}

		$url = strtok( $url, '?' );
		$attachment_id = attachment_url_to_postid( $url );
		if ( empty( $attachment_id ) ) {
			return false;
		}

		$metadata = wp_get_attachment_metadata( $attachment_id );
		if ( ! $metadata ) {
			return false;
		}

		return array( $metadata['width'], $metadata['height'] );
	}

	public static function extract_by_downloading_image( $dimensions, $url ) {
		if ( is_array( $dimensions ) ) {
			return $dimensions;
		}

		$url_hash = md5( $url );
		$transient_name = sprintf( 'amp_img_%s', $url_hash );
		$transient_expiry = 30 * DAY_IN_SECONDS;
		$transient_fail = 'fail';

		$dimensions = get_transient( $transient_name );

		if ( is_array( $dimensions ) ) {
			return $dimensions;
		} elseif ( $transient_fail === $dimensions ) {
			return false;
		}

		// Very simple lock to prevent stampedes
		$transient_lock_name = sprintf( 'amp_lock_%s', $url_hash );
		if ( false !== get_transient( $transient_lock_name ) ) {
			return false;
		}
		set_transient( $transient_lock_name, 1, MINUTE_IN_SECONDS );

		// Note to other developers: please don't use this class directly as it may not stick around forever...
		if ( ! class_exists( 'FastImage' ) ) {
			require_once( AMP__ROOT__ . '/includes/lib/class-fastimage.php' );
		}

		// TODO: look into using curl+stream (https://github.com/willwashburn/FasterImage)
		$image = new FastImage( $url );
		$dimensions = $image->getSize();

		if ( ! is_array( $dimensions ) ) {
			set_transient( $transient_name, $transient_fail, $transient_expiry );
			delete_transient( $transient_lock_name );
			return false;
		}

		set_transient( $transient_name, $dimensions, $transient_expiry );
		delete_transient( $transient_lock_name );
		return $dimensions;
	}
}
