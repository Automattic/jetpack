<?php
/**
 * Focal point crop helpers.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use Automattic\Jetpack\Image_CDN\Image_CDN;
use Automattic\Jetpack\Image_CDN\Image_CDN_Core;
use Automattic\Jetpack\Status;

/**
 * Shared focal point crop helpers for Jetpack Social images.
 */
class Focal_Point {

	/**
	 * Target Open Graph image width.
	 *
	 * @var int
	 */
	const OG_IMAGE_WIDTH = 1200;

	/**
	 * Target Open Graph image height.
	 *
	 * @var int
	 */
	const OG_IMAGE_HEIGHT = 630;

	/**
	 * Get the stored focal point for an image.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return array|null {
	 *     Focal point, or null when not set or invalid.
	 *
	 *     @type float $x X axis, 0-1.
	 *     @type float $y Y axis, 0-1.
	 * }
	 */
	public static function get_for_image( $attachment_id ) {
		$attachment_id = absint( $attachment_id );

		if ( ! $attachment_id ) {
			return null;
		}

		$focal_point = get_metadata_raw( 'post', $attachment_id, Publicize_Base::ATTACHMENT_IMAGE_FOCAL_POINT, true );

		if ( ! self::is_valid_focal_point( $focal_point ) ) {
			return null;
		}

		if ( self::is_default_focal_point( $focal_point ) && ! self::has_stored_focal_point_meta( $attachment_id ) ) {
			return null;
		}

		return array(
			'x' => (float) $focal_point['x'],
			'y' => (float) $focal_point['y'],
		);
	}

	/**
	 * Get a focal-point cropped image for an attachment.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @param int $target_width Target width.
	 * @param int $target_height Target height.
	 * @return array|null {
	 *     Image data, or null when a cropped image cannot be generated.
	 *
	 *     @type string $url Image source URL.
	 *     @type int    $width Image width in pixels.
	 *     @type int    $height Image height in pixels.
	 * }
	 */
	public static function get_cropped_image( $attachment_id, $target_width = self::OG_IMAGE_WIDTH, $target_height = self::OG_IMAGE_HEIGHT ) {
		$focal_point = self::get_for_image( $attachment_id );

		if ( ! $focal_point ) {
			return null;
		}

		$crop_data = self::get_crop_data( $attachment_id, $focal_point['x'], $focal_point['y'], $target_width, $target_height );

		if ( ! $crop_data ) {
			return null;
		}

		return array(
			'url'    => $crop_data['url'],
			'width'  => $crop_data['width'],
			'height' => $crop_data['height'],
		);
	}

	/**
	 * Get a focal-point cropped URL for an attachment.
	 *
	 * @param int   $attachment_id Attachment ID.
	 * @param float $focal_x Focal point x axis, 0-1.
	 * @param float $focal_y Focal point y axis, 0-1.
	 * @param int   $target_width Target width.
	 * @param int   $target_height Target height.
	 * @return string|null Cropped URL, or null when one cannot be generated.
	 */
	public static function get_cropped_url( $attachment_id, $focal_x, $focal_y, $target_width = self::OG_IMAGE_WIDTH, $target_height = self::OG_IMAGE_HEIGHT ) {
		$crop_data = self::get_crop_data( $attachment_id, $focal_x, $focal_y, $target_width, $target_height );

		return $crop_data ? $crop_data['url'] : null;
	}

	/**
	 * Calculate a source crop rectangle for a focal point and target aspect ratio.
	 *
	 * The crop model matches the Social previews: center the crop on the focal
	 * point, then clamp the crop rectangle to the source image edges.
	 *
	 * @param int   $source_width Source image width.
	 * @param int   $source_height Source image height.
	 * @param float $focal_x Focal point x axis, 0-1.
	 * @param float $focal_y Focal point y axis, 0-1.
	 * @param float $aspect Target aspect ratio.
	 * @return array|null {
	 *     Crop rectangle, or null when inputs are invalid.
	 *
	 *     @type int $x Source x coordinate.
	 *     @type int $y Source y coordinate.
	 *     @type int $width Crop width.
	 *     @type int $height Crop height.
	 * }
	 */
	public static function crop_rect( $source_width, $source_height, $focal_x, $focal_y, $aspect ) {
		$source_width  = absint( $source_width );
		$source_height = absint( $source_height );
		$aspect        = (float) $aspect;

		if ( ! $source_width || ! $source_height || $aspect <= 0 ) {
			return null;
		}

		$focal_x = self::clamp( (float) $focal_x, 0, 1 );
		$focal_y = self::clamp( (float) $focal_y, 0, 1 );

		$crop_width  = min( $source_width, $source_height * $aspect );
		$crop_height = $crop_width / $aspect;

		if ( $crop_height > $source_height ) {
			$crop_height = $source_height;
			$crop_width  = $crop_height * $aspect;
		}

		$crop_width  = max( 1, min( $source_width, (int) round( $crop_width ) ) );
		$crop_height = max( 1, min( $source_height, (int) round( $crop_height ) ) );
		$crop_x      = (int) self::clamp( round( $focal_x * $source_width - $crop_width / 2 ), 0, $source_width - $crop_width );
		$crop_y      = (int) self::clamp( round( $focal_y * $source_height - $crop_height / 2 ), 0, $source_height - $crop_height );

		return array(
			'x'      => $crop_x,
			'y'      => $crop_y,
			'width'  => $crop_width,
			'height' => $crop_height,
		);
	}

	/**
	 * Get all crop data needed for a Photon URL and dimensions.
	 *
	 * @param int   $attachment_id Attachment ID.
	 * @param float $focal_x Focal point x axis, 0-1.
	 * @param float $focal_y Focal point y axis, 0-1.
	 * @param int   $target_width Target width.
	 * @param int   $target_height Target height.
	 * @return array|null Crop data, or null.
	 */
	private static function get_crop_data( $attachment_id, $focal_x, $focal_y, $target_width, $target_height ) {
		$attachment_id = absint( $attachment_id );
		$target_width  = absint( $target_width );
		$target_height = absint( $target_height );

		if ( ! $attachment_id || ! $target_width || ! $target_height || ! wp_attachment_is_image( $attachment_id ) ) {
			return null;
		}

		if (
			! class_exists( Image_CDN_Core::class )
			|| ! method_exists( Image_CDN_Core::class, 'cdn_url' )
			|| ! method_exists( Image_CDN_Core::class, 'is_cdn_url' )
		) {
			return null;
		}

		if ( ( new Status() )->is_private_site() ) {
			return null;
		}

		$source_url = wp_get_attachment_url( $attachment_id );

		if ( ! $source_url || ! self::is_supported_image_url( $source_url ) ) {
			return null;
		}

		$dimensions = self::get_dimensions( $attachment_id );

		if ( ! $dimensions ) {
			return null;
		}

		$aspect    = $target_width / $target_height;
		$crop_rect = self::crop_rect( $dimensions['width'], $dimensions['height'], $focal_x, $focal_y, $aspect );

		if ( ! $crop_rect ) {
			return null;
		}

		$args          = array();
		$needs_crop    = self::needs_crop( $crop_rect, $dimensions );
		$resize_width  = $crop_rect['width'];
		$resize_height = $crop_rect['height'];

		if ( $needs_crop ) {
			$args['crop'] = sprintf(
				'%dpx,%dpx,%dpx,%dpx',
				$crop_rect['x'],
				$crop_rect['y'],
				$crop_rect['width'],
				$crop_rect['height']
			);
		}

		if ( $crop_rect['width'] > $target_width || $crop_rect['height'] > $target_height ) {
			$scale          = min( $target_width / $crop_rect['width'], $target_height / $crop_rect['height'] );
			$resize_width   = max( 1, (int) round( $crop_rect['width'] * $scale ) );
			$resize_height  = max( 1, (int) round( $crop_rect['height'] * $scale ) );
			$args['resize'] = $resize_width . ',' . $resize_height;
		}

		if ( ! $args ) {
			return array(
				'url'    => $source_url,
				'width'  => $dimensions['width'],
				'height' => $dimensions['height'],
			);
		}

		if ( ! self::can_preserve_source_query_string( $source_url ) ) {
			return null;
		}

		$cropped_url = Image_CDN_Core::cdn_url(
			$source_url,
			$args
		);

		if ( ! $cropped_url || $cropped_url === $source_url ) {
			return null;
		}

		return array(
			'url'    => $cropped_url,
			'width'  => $resize_width,
			'height' => $resize_height,
		);
	}

	/**
	 * Check whether the crop rectangle changes the source image.
	 *
	 * @param array $crop_rect Crop rectangle.
	 * @param array $dimensions Source dimensions.
	 * @return bool Whether the source image needs a crop operation.
	 */
	private static function needs_crop( $crop_rect, $dimensions ) {
		return 0 !== $crop_rect['x']
			|| 0 !== $crop_rect['y']
			|| $crop_rect['width'] !== $dimensions['width']
			|| $crop_rect['height'] !== $dimensions['height'];
	}

	/**
	 * Get image dimensions from attachment metadata.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return array|null {
	 *     Dimensions, or null.
	 *
	 *     @type int $width Image width.
	 *     @type int $height Image height.
	 * }
	 */
	private static function get_dimensions( $attachment_id ) {
		$metadata = wp_get_attachment_metadata( $attachment_id );

		if (
			! is_array( $metadata )
			|| empty( $metadata['width'] )
			|| empty( $metadata['height'] )
			|| ! is_numeric( $metadata['width'] )
			|| ! is_numeric( $metadata['height'] )
			|| $metadata['width'] <= 0
			|| $metadata['height'] <= 0
		) {
			return null;
		}

		return array(
			'width'  => absint( $metadata['width'] ),
			'height' => absint( $metadata['height'] ),
		);
	}

	/**
	 * Check whether a URL has an Image CDN supported extension.
	 *
	 * @param string $url Image URL.
	 * @return bool Whether Image CDN supports the URL extension.
	 */
	private static function is_supported_image_url( $url ) {
		if ( ! class_exists( Image_CDN::class ) || ! method_exists( Image_CDN::class, 'get_supported_extensions' ) ) {
			return false;
		}

		$path = wp_parse_url( $url, PHP_URL_PATH );

		if ( ! $path ) {
			return false;
		}

		return in_array( strtolower( pathinfo( $path, PATHINFO_EXTENSION ) ), Image_CDN::get_supported_extensions(), true );
	}

	/**
	 * Check whether Photon will preserve the source URL query string.
	 *
	 * Photon ignores source query strings by default. Some attachment providers put
	 * required signatures in the query string, while transformed CDN URLs can already
	 * contain ordered image manipulation args. Skip focal crops unless the domain opts
	 * in to query string preservation.
	 *
	 * @param string $url Image URL.
	 * @return bool Whether the source query string can be preserved.
	 */
	private static function can_preserve_source_query_string( $url ) {
		$url_parts = wp_parse_url( $url );

		if ( ! is_array( $url_parts ) || empty( $url_parts['query'] ) ) {
			return true;
		}

		$host = strtolower( $url_parts['host'] ?? '' );

		if ( '' === $host ) {
			return false;
		}

		if ( Image_CDN_Core::is_cdn_url( $url ) ) {
			return false;
		}

		/**
		 * Allow Photon to add source query strings for opted-in domains.
		 *
		 * @module photon
		 *
		 * @param bool false Should query strings be added to the image URL. Default is false.
		 * @param string $host Image URL's host.
		 */
		return (bool) apply_filters( 'jetpack_photon_add_query_string_to_domain', false, $host );
	}

	/**
	 * Validate focal point shape.
	 *
	 * @param mixed $value Value to validate.
	 * @return bool Whether the value is a valid focal point.
	 */
	private static function is_valid_focal_point( $value ) {
		if ( ! is_array( $value ) || ! array_key_exists( 'x', $value ) || ! array_key_exists( 'y', $value ) ) {
			return false;
		}

		return is_numeric( $value['x'] )
			&& is_numeric( $value['y'] )
			&& $value['x'] >= 0
			&& $value['x'] <= 1
			&& $value['y'] >= 0
			&& $value['y'] <= 1;
	}

	/**
	 * Check whether the focal point is the registered default.
	 *
	 * @param array $value Focal point.
	 * @return bool Whether the value is the default center point.
	 */
	private static function is_default_focal_point( $value ) {
		return 0.5 === (float) $value['x'] && 0.5 === (float) $value['y'];
	}

	/**
	 * Check whether the focal point meta key is actually stored.
	 *
	 * Registered meta defaults can appear through the metadata API even when no
	 * row has been saved. Only use the default center point when the key exists.
	 *
	 * @param int $attachment_id Attachment ID.
	 * @return bool Whether the focal point key is stored on the attachment.
	 */
	private static function has_stored_focal_point_meta( $attachment_id ) {
		// metadata_exists() applies metadata filters, so registered defaults can look stored.
		$stored_meta_keys = get_post_custom_keys( $attachment_id );

		return is_array( $stored_meta_keys )
			&& in_array( Publicize_Base::ATTACHMENT_IMAGE_FOCAL_POINT, $stored_meta_keys, true );
	}

	/**
	 * Clamp a numeric value.
	 *
	 * @param float $value Value to clamp.
	 * @param float $min Minimum value.
	 * @param float $max Maximum value.
	 * @return float Clamped value.
	 */
	private static function clamp( $value, $min, $max ) {
		return min( max( $value, $min ), $max );
	}
}
